package com.pocketkb.android.core

import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.net.URI
import java.security.MessageDigest

internal typealias PackObject = Map<String, Any?>
internal typealias MutablePackObject = MutableMap<String, Any?>
@Suppress("UNCHECKED_CAST")
internal fun Any?.obj(): PackObject = this as? PackObject ?: error("Expected JSON object")
@Suppress("UNCHECKED_CAST")
internal fun Any?.mutableObj(): MutablePackObject = this as MutablePackObject
internal fun Any?.list(): List<Any?> = this as? List<Any?> ?: error("Expected JSON array")
internal fun PackObject.rows(key: String): List<PackObject> = (this[key] ?: emptyList<Any?>()).list().map { it.obj() }
internal fun PackObject.text(key: String): String = this[key] as String
internal fun PackObject.number(key: String): Int = this[key] as Int
internal fun PackObject.flag(key: String): Boolean = this[key] == true
internal fun Any?.deepCopy(): Any? = when (this) {
    is Map<*, *> -> entries.associateTo(linkedMapOf()) { it.key.toString() to it.value.deepCopy() }
    is List<*> -> mapTo(mutableListOf()) { it.deepCopy() }
    else -> this
}
internal fun Any?.json(): Any = when (this) {
    null -> JSONObject.NULL
    is Map<*, *> -> JSONObject().also { o -> for ((key, value) in this) o.put(key.toString(), value.json()) }
    is List<*> -> JSONArray().also { a -> forEach { a.put(it.json()) } }
    else -> this
}
internal fun parsePackJson(raw: String): PackObject {
    fun convert(value: Any?, depth: Int): Any? {
        require(depth <= 50) { "JSON depth" }
        return when (value) {
            null, JSONObject.NULL -> null
            is JSONObject -> value.keys().asSequence().associateWith { key ->
                require(key !in setOf("__proto__", "prototype", "constructor"))
                convert(value.get(key), depth + 1)
            }
            is JSONArray -> List(value.length()) { convert(value.get(it), depth + 1) }
            else -> value
        }
    }
    val parser = JSONTokener(raw)
    val value = convert(parser.nextValue(), 0).obj()
    require(parser.nextClean() == '\u0000') { "Trailing JSON" }
    return value
}

internal data class ChoicePack(val data: PackObject, val digest: String) {
    val meta get() = data.getValue("meta").obj()
    val id get() = meta.text("id")
    val title get() = meta.text("title")

    companion object {
        fun load(bytes: ByteArray, expected: String, schema: PackObject): ChoicePack {
            require(bytes.size <= 512 * 1024)
            val digest = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
            require(digest == expected) { "情境包 SHA-256 不符" }
            val data = parsePackJson(Charsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes)).toString())
            require(valid(data, schema, schema)) { "情境包格式錯誤" }
            semantic(data)
            return ChoicePack(data, digest)
        }

        private fun valid(value: Any?, rule: PackObject, root: PackObject): Boolean {
            (rule["\$ref"] as? String)?.let { return valid(value, root.getValue("\$defs").obj().getValue(it.substringAfterLast('/')).obj(), root) }
            (rule["oneOf"] ?: rule["anyOf"])?.let { candidates ->
                val matches = candidates.list().count { valid(value, it.obj(), root) }
                return if ("oneOf" in rule) matches == 1 else matches > 0
            }
            if ("const" in rule && value != rule["const"]) return false
            if ("enum" in rule && value !in rule.getValue("enum").list()) return false
            fun min(key: String, default: Int = 0) = rule[key] as? Int ?: default
            fun max(key: String) = rule[key] as? Int ?: Int.MAX_VALUE
            return when (rule["type"]) {
                "object" -> {
                    if (value !is Map<*, *> || value.size > max("maxProperties")) return false
                    val properties = rule["properties"]?.obj().orEmpty()
                    if (rule["required"]?.list()?.all { it in value } == false) return false
                    value.all { (key, item) ->
                        val name = key.toString()
                        val names = rule["propertyNames"]?.obj()
                        if (names != null && !valid(name, names, root)) return@all false
                        when (val property = properties[name] ?: rule["additionalProperties"]) {
                            false -> false
                            is Map<*, *> -> valid(item, property.obj(), root)
                            else -> true
                        }
                    }
                }
                "array" -> value is List<*> && value.size in min("minItems")..max("maxItems") &&
                    (!rule.flag("uniqueItems") || value.toSet().size == value.size) &&
                    value.withIndex().all { (index, item) ->
                        val prefix = (rule["prefixItems"] as? List<*>)?.getOrNull(index)
                        when (val itemRule = prefix ?: rule["items"]) {
                            false -> false
                            is Map<*, *> -> valid(item, itemRule.obj(), root)
                            else -> true
                        }
                    }
                "integer" -> value is Int && value in min("minimum", Int.MIN_VALUE)..max("maximum")
                "string" -> value is String && value.codePointCount(0, value.length) in min("minLength")..max("maxLength") &&
                    ((rule["pattern"] as? String)?.let { Regex(it).containsMatchIn(value) } != false) &&
                    (rule["format"] != "uri" || runCatching { URI(value).let { it.scheme == "https" && it.host != null && it.userInfo == null } }.getOrDefault(false))
                "boolean" -> value is Boolean
                "null" -> value == null
                else -> true
            }
        }

        private fun semantic(pack: PackObject) {
            fun index(rows: List<PackObject>): Set<String> =
                rows.map { it.text("id") }.toSet().also { require(it.size == rows.size) { "Duplicate IDs" } }
            val initial = pack.getValue("initial").obj()
            val presentation = pack.getValue("presentation").obj()
            val narration = presentation.getValue("narration").obj().keys
            val sources = pack.getValue("meta").obj().rows("sources")
            val sourceIds = index(sources)
            for (source in sources) {
                val url = URI(source.text("url"))
                require(url.port == -1 && (url.host.endsWith(".gov.tw") || url.host.endsWith(".gov.taipei")))
            }
            val catalog = pack.getValue("catalog").obj()
            val steps = listOf("principle", "hazard", "channel").associateWith { index(catalog.rows(it + "s")) }
            val decisions = pack.rows("decisions")
            val decisionIds = index(decisions)
            val endings = pack.rows("endings")
            val endingIds = index(endings)
            val beats = pack.rows("beats")
            val beatIds = index(beats)
            val variants = index(beats.mapNotNull { it["prevented"]?.obj() })
            require((beatIds intersect variants).isEmpty())
            val cues = decisions.flatMap { it.rows("options") }.flatMap { it.getValue("cues").list() }.toSet()
            val sets = mapOf("met" to steps.getValue("principle"), "turnPrinciples" to steps.getValue("principle"),
                "turnHazards" to steps.getValue("hazard"), "turnCues" to cues, "seenBeats" to beatIds, "seenVariants" to variants)
            index(pack.rows("phaseRules"))
            index(pack.rows("assets"))
            val facts = initial.getValue("facts").obj().keys
            val exposure = initial.getValue("exposure").obj().keys
            val npc = initial.getValue("npc").obj()
            val counters = index(pack.rows("consequences"))
            val fields = facts.map { "facts.$it" } +
                exposure.map { "exposure.$it" } +
                npc.flatMap { (id, value) -> value.obj().keys.map { "npc.$id.$it" } }
            val readable = fields + listOf("clock", "turn.nextClock", "turn.channelId", "turn.hazardCount", "beat.lastVisibleId",
                "ending.type", "ending.injury", "ending.hazardId", "impact.injury", "impact.anyInjury") +
                counters.map { "counter.$it" } + beatIds.flatMap { id -> listOf("count", "firstTurn", "lastTurn").map { "beat.$id.$it" } }
            fun walk(value: Any?, depth: Int) {
                require(depth <= 50)
                when (value) {
                    is List<*> -> value.forEach { walk(it, depth + 1) }
                    is Map<*, *> -> {
                        val row = value.obj()
                        if (row["narration"] is String) require(row["narration"] in narration)
                        if (row["ref"] is String) require(row["ref"] in readable)
                        if (row["fact"] is String) require(row["fact"] in facts)
                        if (row["has"] is Map<*, *>) {
                            val member = row.getValue("has").obj()
                            require(member["id"] in sets.getValue(member.text("set")))
                        }
                        if (row["sourceIds"] is List<*>) require(row.getValue("sourceIds").list().all { it in sourceIds })
                        if (row["principleId"] is String) require(row["principleId"] in steps.getValue("principle"))
                        if ("decisionId" in row && row["decisionId"] != null) require(row["decisionId"] in decisionIds)
                        if ("fatalEndingId" in row) require(row["fatalEndingId"] in endingIds)
                        if ("set" in row && row["set"] is Map<*, *>) require(row.getValue("set").obj().keys.all { it in fields && !it.startsWith("exposure.") })
                        if ("add" in row) require(row.getValue("add").obj().keys.all { it in fields && it.startsWith("exposure.") })
                        if ("subject" in row) require(row["subject"] == "player" || row["subject"] in npc)
                        if (row["credit"] is List<*>) require(row.getValue("credit").list().all { it in steps.getValue("principle") })
                        if (row["blocks"] is List<*>) require(row.rows("blocks").all { it["id"] in steps.getValue(it.text("kind")) })
                        row.values.forEach { walk(it, depth + 1) }
                    }
                    is String -> require(!Regex("<\\s*/?\\s*[a-z!]|javascript\\s*:|sk-(?:proj-)?[A-Za-z0-9_-]{20,}", RegexOption.IGNORE_CASE).containsMatchIn(value))
                }
            }
            walk(pack, 0)
            require(initial["openingNarration"] in narration)
            for (decision in decisions) {
                val options = decision.rows("options")
                index(options)
                require(options.map { it.text("class") }.containsAll(listOf("correct", "misconception", "risk_or_delay")))
                for (option in options) {
                    val refs = option.rows("steps")
                    require(refs.all { it["id"] in steps.getValue(it.text("kind")) })
                    require(refs.distinct().size == refs.size && refs.any { it["kind"] != "channel" })
                    require("credit" !in option.getValue("effect").obj())
                    if (option["class"] == "correct") require(option["safety"] == "safe" && refs.none { it["kind"] == "hazard" })
                    if (refs.any { it["kind"] == "hazard" }) require(option["safety"] == "unsafe")
                }
            }
            val dependencies = beats.associate { it.text("id") to it["after"]?.obj()?.text("beat") }
            for (id in beatIds) {
                val seen = mutableSetOf<String>()
                var next: String? = id
                while (next != null) {
                    require(next in beatIds && seen.add(next)) { "Cyclic or unknown beat" }
                    next = dependencies[next]
                }
            }
            val limit = pack.getValue("limits").obj().number("maxTurns")
            require(endings.any { it["phase"] == "afterBeats" && it.getValue("when").obj()["clock"]?.obj()?.get("gte") == limit })
            require(endings.filter { it["phase"] == "fatal" }.all { it["type"] == "CRITICAL_FAILURE" && it["injury"] == "NOT_ASSESSED" })
            require(listOf("look", "askCompanion", "idle").all { presentation.rows(it).lastOrNull()?.get("when")?.obj()?.get("always") == true })
            require(pack.rows("assets").all { Regex("assets/(?:[a-z0-9_-]+/)*[a-z0-9_-]+\\.(?:webp|png|jpe?g)", RegexOption.IGNORE_CASE).matches(it.text("path")) })
            val injury = pack.getValue("injury").obj()
            require(injury.number("noneMax") <= injury.number("mildMax") && injury.number("mildMax") <= injury.number("moderateMax"))
        }
    }
}
