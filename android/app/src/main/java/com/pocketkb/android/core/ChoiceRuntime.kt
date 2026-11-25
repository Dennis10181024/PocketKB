package com.pocketkb.android.core

import java.util.UUID
import kotlin.math.floor
import kotlin.random.Random

internal data class ChoiceInput(
    val decisionId: String, val optionId: String, val inputId: String, val revision: Int,
    val responseTimeMs: Int? = null, val observationTimeMs: Int = 0, val backgroundTimeMs: Int = 0,
)

internal class ChoiceRuntime(
    val pack: ChoicePack, private val random: () -> Double = Random.Default::nextDouble,
) {
    private val rules = pack.data
    private val initial = rules.getValue("initial").obj()
    private val presentation = rules.getValue("presentation").obj()
    private val narration = presentation.getValue("narration").obj()
    private val decisions = rules.rows("decisions").associateBy { it.text("id") }
    private val endings = rules.rows("endings").associateBy { it.text("id") }
    private val sources = pack.meta.rows("sources").associateBy { it.text("id") }
    private val catalog = rules.getValue("catalog").obj()
    private val actions = listOf("principle", "hazard", "channel").associateWith { kind ->
        catalog.rows(kind + "s").associateBy { it.text("id") }
    }
    private val severity = mapOf("NONE" to 0, "MILD" to 1, "MODERATE" to 2, "SEVERE" to 3)
    private val grades = mapOf("NONE" to "無傷", "MILD" to "輕傷", "MODERATE" to "中度傷勢・需送醫", "SEVERE" to "重傷・需住院")
    private val labels = mapOf("SAFE_RESCUE" to "安全待救獲救", "DELAYED_RESCUE" to "延誤後獲救",
        "SELF_EVACUATION" to "安全撤離", "DELAYED_EVACUATION" to "延誤撤離", "CRITICAL_FAILURE" to "危急失敗")

    internal class Session internal constructor(val id: String, internal var data: MutablePackObject)
    private data class Turn(
        val cues: List<Any?> = emptyList(), val hazards: MutableList<String> = mutableListOf(),
        val principles: MutableList<String> = mutableListOf(), var channel: String? = null,
        var next: Int,
    )
    private data class Context(val state: PackObject, val turn: Turn = Turn(next = state.number("clock") + 1)) {
        fun read(ref: String): Any? {
            if (ref == "clock") return state["clock"]
            val parts = ref.split('.')
            val field = parts[1]
            return when (parts[0]) {
                "beat" -> {
                    if (field == "lastVisibleId") return state.rows("beats").lastOrNull { !it.flag("hidden") }?.get("id")
                    val beats = state.rows("beats").filter { it["id"] == field }
                    when (parts[2]) {
                        "count" -> beats.size
                        "firstTurn" -> beats.firstOrNull()?.get("at")
                        else -> beats.lastOrNull()?.get("at")
                    }
                }
                "turn" -> when (field) { "nextClock" -> turn.next; "channelId" -> turn.channel; else -> turn.hazards.size }
                "counter" -> state.getValue("counters").obj()[field] ?: 0
                "ending" -> state["ending"]?.obj()?.get(field)
                "impact" -> if (field == "anyInjury") state.rows("injuries").isNotEmpty() else 0
                "npc" -> state.getValue("npc").obj().getValue(field).obj()[parts[2]]
                else -> state.getValue(parts[0]).obj().getValue(field)
            }
        }

        fun has(set: String, id: String): Boolean = when (set) {
            "met" -> id in state.getValue("met").obj()
            "turnPrinciples" -> id in turn.principles
            "turnHazards" -> id in turn.hazards
            "turnCues" -> id in turn.cues
            "seenBeats" -> state.rows("beats").any { it["id"] == id }
            "seenVariants" -> state.rows("beats").any { it["variantId"] == id }
            else -> error("Unknown DSL set")
        }

        fun eval(value: Any?): Any? {
            if (value !is Map<*, *>) return value
            val node = value.obj()
            if ("ref" in node) return read(node.text("ref"))
            val args = node.getValue("args").list()
            if (node["op"] == "coalesce") return args.firstNotNullOfOrNull(::eval)
            val ints = args.map { eval(it) as Int }
            return when (node["op"]) {
                "min" -> ints.min()
                "max" -> ints.max()
                "sum", "add" -> Math.toIntExact(ints.sumOf(Int::toLong))
                "mod" -> Math.floorMod(ints[0], ints[1].also { require(it > 0) })
                else -> error("Unknown DSL operator")
            }
        }

        fun matches(condition: PackObject): Boolean {
            fun compare(a: Any?, op: String, b: Any?): Boolean = when (op) {
                "eq" -> a == b
                "ne" -> a != b
                "lt" -> a is Int && b is Int && a < b
                "lte" -> a is Int && b is Int && a <= b
                "gt" -> a is Int && b is Int && a > b
                "gte" -> a is Int && b is Int && a >= b
                else -> error("Unknown comparator")
            }
            return when {
                "always" in condition -> true
                "all" in condition -> condition.rows("all").all(::matches)
                "any" in condition -> condition.rows("any").any(::matches)
                "not" in condition -> !matches(condition.getValue("not").obj())
                "has" in condition -> condition.getValue("has").obj().let { has(it.text("set"), it.text("id")) }
                "compare" in condition -> condition.getValue("compare").obj().let { compare(eval(it["left"]), it.text("op"), eval(it["right"])) }
                "clock" in condition -> condition.getValue("clock").obj().entries.single().let { compare(read("clock"), it.key, it.value) }
                else -> condition.entries.single { it.key != "fact" }.let { compare(read("facts."+condition.text("fact")), it.key, it.value) }
            }
        }

        fun pick(rows: List<PackObject>) = rows.firstOrNull { matches(it.getValue("when").obj()) }
    }

    private fun initialState(): MutablePackObject = linkedMapOf(
        "clock" to 0, "decisionId" to initial["decisionId"], "facts" to initial["facts"].deepCopy(),
        "npc" to initial["npc"].deepCopy(), "exposure" to initial["exposure"].deepCopy(),
        "met" to linkedMapOf<String, Any?>(), "opportunities" to linkedMapOf<String, Any?>(),
        "counters" to linkedMapOf<String, Any?>(), "beats" to mutableListOf<Any?>(), "events" to mutableListOf<Any?>(),
        "injuries" to mutableListOf<Any?>(), "delays" to mutableListOf<Any?>(), "ending" to null,
        "narrationCounts" to linkedMapOf<String, Any?>(),
    )

    @Suppress("UNCHECKED_CAST")
    private fun PackObject.append(key: String, value: Any?) { (getValue(key) as MutableList<Any?>).add(value) }
    private fun PackObject.mutable(key: String) = getValue(key).mutableObj()
    private fun PackObject.condition() = getValue("when").obj()
    private fun PackObject.effect() = getValue("effect").obj()
    private fun PackObject.actionPath() = text("kind")+":"+text("id")

    private inner class Settlement(before: PackObject, val decision: PackObject, val option: PackObject) {
        val state = before.deepCopy().mutableObj()
        val turn = Turn(cues = option.getValue("cues").list(), next = state.number("clock") + 1)
        val ctx = Context(state, turn)
        val lines = mutableListOf<String>()
        val actionLines = mutableListOf<String>()
        val impacts = mutableListOf<PackObject>()

        fun say(id: String): String {
            val variants = narration.getValue(id).list()
            val counts = state.mutable("narrationCounts")
            val count = counts[id] as? Int ?: 0
            counts[id] = count + 1
            return (variants[count % variants.size] as String).also(lines::add)
        }

        fun credit(id: String) {
            if (id !in turn.principles) turn.principles.add(id)
            state.mutable("met").putIfAbsent(id, turn.next)
        }

        fun apply(effect: PackObject) {
            val writes = effect["set"]?.obj().orEmpty().mapValues { ctx.eval(it.value) }
            val exposure = effect["add"]?.obj().orEmpty().mapValues { ctx.eval(it.value) as Int }
            for ((path, value) in writes) {
                val parts = path.split('.')
                val npc = parts[0] == "npc"
                val owner = if (npc) state.mutable("npc").getValue(parts[1]).mutableObj() else state.mutable("facts")
                val key = if (npc) parts[2] else parts[1]
                val original = if (npc) initial.getValue("npc").obj().getValue(parts[1]).obj()[key] else initial.getValue("facts").obj()[key]
                require(if (original == null) value == null || value is Int && value >= 0 else value?.javaClass == original.javaClass)
                owner[key] = value
            }
            for ((path, value) in exposure) {
                val key = path.substringAfter('.')
                require(value >= 0)
                state.mutable("exposure")[key] = Math.addExact(state.getValue("exposure").obj().number(key), value)
            }
            (effect["emit"] as? List<*>)?.forEach { state.append("events", mapOf("id" to it, "at" to state["clock"])) }
            (effect["credit"] as? List<*>)?.forEach { credit(it as String) }
            val origin = mapOf("at" to turn.next, "decisionId" to decision["id"], "optionId" to option["id"])
            effect.rows("injuries").forEach { state.append("injuries", it + origin) }
            effect["delay"]?.let { state.append("delays", mapOf("reason" to it) + origin) }
        }

        fun impact(id: String, definition: PackObject, result: PackObject, fatal: Boolean = false, direct: Boolean = true) {
            val effect = result.effect()
            val review = definition.getValue("review").obj()
            val injuries = effect.rows("injuries")
            apply(effect)
            val at = if (fatal) state.number("clock") else turn.next
            impacts += mapOf("id" to id, "decisionId" to decision["id"], "optionId" to option["id"], "at" to at,
                "fatal" to fatal, "companion" to (review.flag("companion") || injuries.any { it["subject"] != "player" }),
                "direct" to direct, "severity" to (injuries.maxOfOrNull { severity.getValue(it.text("severity")) } ?: 0),
                "delay" to effect["delay"], "review" to review, "sourceIds" to definition["sourceIds"],
                "injuries" to injuries, "outcome" to say(result.text("narration")))
            state.append("events", mapOf("id" to id, "at" to at))
        }

        fun end(rule: PackObject, hazard: String? = null) {
            val thresholds = rules.getValue("injury").obj()
            val level = if (rule["injury"] != "fromThresholds") rule["injury"] else {
                val score = ctx.eval(thresholds["score"]) as Int
                require(score >= 0)
                when {
                    score <= thresholds.number("noneMax") -> "NONE"
                    score <= thresholds.number("mildMax") -> "MILD"
                    score <= thresholds.number("moderateMax") -> "MODERATE"
                    else -> "SEVERE"
                }
            }
            state["ending"] = mapOf("id" to rule["id"], "type" to rule["type"], "injury" to level, "hazardId" to hazard)
            say(rule.text("narration"))
        }

        private fun chosen(rule: PackObject) = ctx.pick(rule.rows("cases"))?.get("result")?.obj() ?: rule.getValue("normal").obj()
        private fun action(ref: PackObject) = actions.getValue(ref.text("kind")).getValue(ref.text("id"))
        private fun phase(name: String): Boolean {
            var skip = false
            for (rule in rules.rows("phaseRules")) {
                if (rule["phase"] != name || !ctx.matches(rule.condition())) continue
                val result = rule.getValue("result").obj()
                apply(result.effect())
                if (rule.flag("skipBeats")) { say(result.text("narration")); skip = true }
            }
            return skip
        }

        fun settle() {
            val steps = option.rows("steps")
            val hazards = steps.filter { it["kind"] == "hazard" }
            val available = hazards.filter { ctx.matches(action(it).condition()) }
            val fatal = available.firstOrNull { "fatalEndingId" in action(it) }
            if (fatal != null) {
                val rule = action(fatal)
                turn.next = state.number("clock")
                turn.hazards.add(fatal.text("id"))
                impact(fatal.text("id"), rule, chosen(rule), fatal = true)
                val ending = endings.getValue(rule.text("fatalEndingId"))
                require(ctx.matches(ending.condition()))
                end(ending, fatal.text("id"))
                return
            }
            val principles = decision.rows("options").flatMap { it.rows("steps") }.filter { it["kind"] == "principle" }.distinct()
            for (ref in principles) {
                val rule = action(ref)
                if (!rule.flag("bonus") && ctx.matches(rule.getValue("review").obj().getValue("eligibleWhen").obj()))
                    state.mutable("opportunities")[ref.text("id")] = true
            }
            val blocked = available.flatMap { action(it).rows("blocks") }.map { it.actionPath() }.toSet()
            turn.hazards.addAll(available.map { it.text("id") })
            for (ref in available) impact(ref.text("id"), action(ref), chosen(action(ref)))
            var applied = available.size == hazards.size
            for (ref in steps.filter { it["kind"] != "hazard" }) {
                val rule = action(ref)
                if (ref.actionPath() in blocked) { applied = false; continue }
                if (!ctx.matches(rule.condition())) {
                    applied = false
                    rule["blocked"]?.obj()?.let { say(it.text("narration")) }
                    continue
                }
                val id = ref.text("id")
                val result = chosen(rule)
                val channel = ref["kind"] == "channel"
                val fresh = channel || id !in state.mutable("met")
                if (channel) turn.channel = id
                apply(result.effect())
                if (!channel) credit(id)
                if (fresh && result["narration"] != option["narration"]) say(result.text("narration"))
            }
            if (applied) {
                val effect = option.effect()
                if (effect["delay"] != null) {
                    val correct = decision.rows("options").first { it["class"] == "correct" }
                    val tip = "當時可改選「"+correct.text("text")+"」"
                    impact(option.text("id"), mapOf("sourceIds" to option["sourceIds"], "review" to mapOf("tip" to tip)), option)
                } else {
                    apply(effect)
                    if (lines.isEmpty()) say(option.text("narration"))
                }
            }
            actionLines += lines.filter { line -> impacts.none { it["outcome"] == line } }
            phase("afterActions")
            state["clock"] = turn.next
            for (rule in rules.rows("consequences")) {
                if (rule["decisionId"] != null && rule["decisionId"] != decision["id"] || !ctx.matches(rule.condition())) continue
                val id = rule.text("id")
                val counts = state.mutable("counters")
                val count = (counts[id] as? Int ?: 0) + 1
                counts[id] = count
                val tier = rule.rows("tiers").last { it.number("fromCount") <= count }
                val result = ctx.pick(tier.rows("cases"))?.get("result")?.obj() ?: tier.getValue("result").obj()
                impact(id, rule, result, direct = rule["decisionId"] == decision["id"])
            }
            val skip = phase("beforeBeats")
            endings.values.firstOrNull { it["phase"] == "beforeBeats" && ctx.matches(it.condition()) }?.let { end(it); return }
            var pending: String? = null
            if (!skip) for (beat in rules.rows("beats")) {
                val id = beat.text("id")
                if ((beat["decisionId"] != null && pending != null) || state.number("clock") < beat.number("at") ||
                    (!beat.flag("repeat") && ctx.has("seenBeats", id)) || !ctx.matches(beat.condition())) continue
                val after = beat["after"]?.obj()
                if (after != null) {
                    val first = ctx.read("beat."+after.text("beat")+".firstTurn") as? Int ?: continue
                    if (state.number("clock") < first + after.number("turns")) continue
                }
                val prevented = beat["prevented"]?.obj()?.takeIf { ctx.matches(it.condition()) }
                val result = prevented?.get("result")?.obj() ?: ctx.pick(beat.rows("overrides"))?.get("result")?.obj() ?: beat.getValue("normal").obj()
                beat["baseEffect"]?.obj()?.let(::apply)
                apply(result.effect())
                state.append("beats", mapOf("id" to id, "variantId" to prevented?.get("id"), "at" to state["clock"], "hidden" to beat.flag("hidden")))
                if (!beat.flag("hidden")) say(result.text("narration"))
                pending = beat["decisionId"] as? String ?: pending
            }
            endings.values.firstOrNull { it["phase"] == "afterBeats" && ctx.matches(it.condition()) }?.let { end(it); return }
            check(state.number("clock") < rules.getValue("limits").obj().number("maxTurns"))
            val next = pending?.let(decisions::getValue) ?: ctx.pick(rules.rows("decisions")) ?: error("No decision")
            require(ctx.matches(next.condition()))
            state["decisionId"] = next["id"]
        }
    }

    private fun order(decision: PackObject): List<String> {
        val values = decision.rows("options").map { it.text("id") }.toMutableList()
        for (i in values.lastIndex downTo 1) {
            val j = floor(random() * (i + 1)).toInt()
            require(j in 0..i)
            val choice = values[i]
            values[i] = values[j]
            values[j] = choice
        }
        return values
    }

    private fun narration(id: String): String = narration.getValue(id).list().first() as String

    fun start(id: String = UUID.randomUUID().toString()): Session {
        val state = initialState()
        val decision = decisions.getValue(state.text("decisionId"))
        require(Context(state).matches(decision.condition()))
        return Session(id, linkedMapOf("state" to state, "lines" to listOf(narration(initial.text("openingNarration"))),
            "order" to order(decision), "attempt" to 1, "revision" to 0, "history" to mutableListOf<Any?>(),
            "log" to mutableListOf<Any?>(), "requests" to linkedMapOf<String, Any?>(), "retryFrom" to null))
    }

    fun save(session: Session) = mapOf("digest" to pack.digest, "id" to session.id, "data" to session.data).json().toString()
    fun restore(payload: String): Session {
        val saved = parsePackJson(payload)
        require(saved["digest"] == pack.digest)
        return Session(saved.text("id"), saved.getValue("data").deepCopy().mutableObj())
    }

    fun snapshot(session: Session): PackObject {
        val data = session.data
        val state = data.getValue("state").obj()
        val decision = decisions.getValue(state.text("decisionId")).takeIf { state["ending"] == null }
        return mapOf("sessionId" to session.id, "attempt" to data["attempt"], "revision" to data["revision"],
            "retryFrom" to data["retryFrom"], "state" to state, "lines" to data["lines"],
            "status" to presentation.rows("status").filter { Context(state).matches(it.condition()) }.map { it["text"] },
            "decision" to decision?.let { q ->
                mapOf("id" to q["id"], "prompt" to q["prompt"], "options" to data.getValue("order").list().map { id ->
                    mapOf("id" to id, "text" to q.rows("options").first { it["id"] == id }["text"])
                })
            }).deepCopy().obj()
    }

    private fun inspect(session: Session, kind: String): String {
        val state = session.data.getValue("state").obj()
        check(state["ending"] == null)
        val projection = Context(state).pick(presentation.rows(kind)) ?: error("Missing default")
        return narration(projection.text("narration"))
    }
    fun observe(session: Session) = inspect(session, "look")
    fun ask(session: Session) = inspect(session, "askCompanion")
    fun records(session: Session) = session.data.getValue("log").deepCopy().list().map { it.obj() }

    fun submitChoice(session: Session, input: ChoiceInput): PackObject {
        require(input.inputId.isNotBlank() && (input.responseTimeMs ?: 0) >= 0)
        val data = session.data
        val fingerprint = listOf(input.decisionId, input.optionId, input.revision, input.responseTimeMs, input.observationTimeMs, input.backgroundTimeMs)
        val requests = data.mutable("requests")
        requests[input.inputId]?.obj()?.let {
            require(it["fingerprint"] == fingerprint) { "Conflicting inputId" }
            return it.getValue("view").deepCopy().obj()
        }
        val before = data.getValue("state").obj()
        require(before["ending"] == null && data["revision"] == input.revision && before["decisionId"] == input.decisionId)
        require(input.optionId in data.getValue("order").list())
        val decision = decisions.getValue(input.decisionId)
        val option = decision.rows("options").first { it["id"] == input.optionId }
        val settled = Settlement(before, decision, option).apply { settle() }
        val state = settled.state
        val row = mapOf("sessionId" to session.id, "scenarioId" to pack.id, "packVersion" to pack.meta["version"],
            "inputSource" to "choice", "attempt" to data["attempt"], "decisionId" to input.decisionId,
            "occurrence" to (data.rows("history").count { it["decisionId"] == input.decisionId } + 1),
            "optionId" to input.optionId, "optionClass" to option["class"], "text" to option["text"],
            "displayOrderOptionIds" to data["order"], "responseTimeMs" to input.responseTimeMs,
            "sourceIds" to option["sourceIds"], "safety" to option["safety"], "fatal" to settled.impacts.any { it.flag("fatal") },
            "ending" to state["ending"], "clock" to state["clock"], "principles" to settled.turn.principles,
            "hazards" to settled.turn.hazards, "actionLines" to settled.actionLines, "impacts" to settled.impacts,
            "delays" to state.rows("delays").drop(before.rows("delays").size))
        data.append("history", row + ("before" to before))
        data.append("log", row + mapOf("packDigest" to pack.digest, "evaluatorVersion" to 1, "requestId" to input.inputId,
            "observationTimeMs" to input.observationTimeMs, "backgroundTimeMs" to input.backgroundTimeMs,
            "fallback" to null, "retryFrom" to data["retryFrom"], "events" to state.rows("events").drop(before.rows("events").size)))
        data["state"] = state
        data["lines"] = settled.lines.ifEmpty { listOf(narration(Context(state, settled.turn).pick(presentation.rows("idle"))!!.text("narration"))) }
        data["order"] = if (state["ending"] == null) order(decisions.getValue(state.text("decisionId"))) else emptyList<String>()
        data["revision"] = input.revision + 1
        return snapshot(session).also { requests[input.inputId] = mapOf("fingerprint" to fingerprint, "view" to it.deepCopy()) }
    }

    private fun point(history: List<PackObject>): PackObject? = history.lastOrNull { it.flag("fatal") } ?:
        history.firstOrNull { row -> row["safety"] == "unsafe" && row.rows("impacts").any { it.flag("direct") && (it.number("severity") > 0 || it["delay"] != null) } } ?:
        history.firstOrNull { row -> row["safety"] == "unsafe" && row.rows("impacts").any { it.flag("direct") } } ?:
        history.firstOrNull { it.getValue("actionLines").list().isNotEmpty() } ?: history.firstOrNull()

    private val impactOrder = compareByDescending<PackObject> { it.flag("fatal") }.thenByDescending { it.flag("companion") }
        .thenByDescending { it.number("severity") }.thenByDescending { it["delay"] != null }

    private fun directReview(row: PackObject, impact: PackObject): PackObject {
        val events = row.rows("impacts").filter { it.flag("direct") }
        val outcomes = events.map { event ->
            val text = event.text("outcome")
            val extra = event.rows("injuries").map { it.text("label") }.filterNot(text::contains)
            text.removeSuffix("。") + (if (extra.isNotEmpty()) "（本回合傷勢："+extra.joinToString("、")+"）" else "") + "。"
        }
        val review = impact.getValue("review").obj()
        return mapOf("at" to impact["at"], "decisionId" to row["decisionId"], "optionId" to row["optionId"],
            "eventId" to impact["id"], "optionText" to row["text"], "eventIds" to events.map { it["id"] },
            "outcome" to outcomes.distinct().joinToString(""), "tip" to review["tip"], "principleId" to review["principleId"],
            "sourceIds" to events.flatMap { it.getValue("sourceIds").list() }.distinct())
    }

    fun debrief(session: Session): PackObject {
        val data = session.data
        val state = data.getValue("state").obj()
        val ending = state.getValue("ending").obj()
        val rule = endings.getValue(ending.text("id"))
        val ctx = Context(state)
        val history = data.rows("history")
        val point = point(history)
        val pointImpact = point?.rows("impacts")?.filter { it.flag("direct") }?.sortedWith(impactOrder)?.firstOrNull()
        val steps = history.flatMap { it.rows("impacts") }
        val injuries = state.rows("injuries").map {
            val subject = if (it["subject"] == "player") "本人" else state.getValue("npc").obj().getValue(it.text("subject")).obj().text("name")
            it + ("subjectName" to subject)
        }
        val worst = injuries.maxByOrNull { severity.getValue(it.text("severity")) }
        val delays = history.filter { it["safety"] == "unsafe" }.flatMap { it.rows("delays") }.map { it.text("reason") }.distinct().take(2)
        val featured = history.filter { it["safety"] == "unsafe" }.flatMap { row ->
            row.rows("impacts").filter { it.flag("direct") }.map { row to it }
        }.sortedWith(compareByDescending<Pair<PackObject, PackObject>> { it.first === point }
            .thenComparator { a, b -> impactOrder.compare(a.second, b.second) })
        val seenOptions = mutableSetOf<Any?>()
        val tips = mutableSetOf<Any?>()
        val dangers = featured.asSequence().map { (row, impact) -> directReview(row, impact) }
            .filter { it["optionId"] !in seenOptions && it["tip"] !in tips }
            .onEach { seenOptions.add(it["optionId"]); tips.add(it["tip"]) }.take(3).sortedBy { it.number("at") }.toList()
        val riskIdeas = dangers.map { it["principleId"] }.toSet()
        val delayIdeas = steps.filter { it["delay"] != null }.map { it.getValue("review").obj()["principleId"] }.toSet()
        val principles = actions.getValue("principle")
        fun option(row: PackObject) = decisions.getValue(row.text("decisionId")).rows("options").first { it["id"] == row["optionId"] }
        val partials = history.filter { it["optionClass"] == "partial" }.associateBy { it["optionId"] }.values.mapNotNull { row ->
            val option = option(row)
            option["missingStep"]?.let { mapOf("id" to row["optionId"], "optionText" to row["text"], "text" to it, "sourceIds" to option["sourceIds"]) }
        }.take(2)
        val extra = principles.values.filter { p ->
            state.getValue("opportunities").obj().flag(p.text("id")) && p.text("id") !in state.getValue("met").obj() && p["id"] !in riskIdeas
        }.sortedWith(compareByDescending<PackObject> { it["id"] in delayIdeas }.thenByDescending { it.getValue("review").obj().number("priority") })
            .take(2 - partials.size).map { mapOf("id" to it["id"], "text" to it.getValue("review").obj()["tip"], "sourceIds" to it["sourceIds"]) }
        val improvements = partials + extra
        val good = history.filter { it["optionClass"] == "correct" }.mapNotNull { row ->
            val principle = row.getValue("principles").list().map { principles.getValue(it as String) }.firstOrNull { !it.flag("bonus") }
            principle?.let { mapOf("id" to it["id"], "optionText" to row["text"], "why" to it.getValue("review").obj()["why"], "sourceIds" to it["sourceIds"]) }
        }.distinctBy { it["id"] }.take(3)
        val better = point?.let { decisions.getValue(it.text("decisionId")).rows("options").first { option -> option["class"] == "correct" } }
        val direct = if (point != null && pointImpact != null) directReview(point, pointImpact)["outcome"] else point?.getValue("actionLines")?.list()?.firstOrNull()
        val turning = if (point != null && better != null && direct != null) {
            val earned = point.getValue("principles").list()
            val alternative = better.rows("steps").firstOrNull { it["kind"] == "principle" && it["id"] !in earned }
            fun why(id: Any?) = (id as? String)?.let { principles[it]?.getValue("review")?.obj()?.get("why") }
            val reason = pointImpact?.getValue("review")?.obj()?.get("tip") ?: option(point)["missingStep"] ?:
                why(alternative?.get("id")) ?: why(earned.firstOrNull())
            val prefix = if (better["id"] == point["optionId"]) "可以維持「" else "可改選「"
            mapOf("decisionId" to point["decisionId"], "optionId" to point["optionId"], "eventId" to pointImpact?.get("id"),
                "optionText" to point["text"], "outcome" to direct, "tip" to (prefix+better.text("text")+"」"+(reason?.let { " $it" } ?: "")))
        } else null
        val type = ctx.pick(rule.rows("labels"))?.get("text") as? String ?: labels.getValue(ending.text("type"))
        val grade = grades[ending.text("injury")]
        val injuryText = worst?.let { (if (it["subject"] == "player") "" else it.text("subjectName")+"的")+it.text("label") }
        val result = buildString {
            append(type).append("。")
            injuryText?.let { append("最嚴重的傷勢為").append(it).append("。") }
            grade?.let { append("本人傷勢分級為").append(it).append("。") }
            if (delays.isNotEmpty()) append("撤離或救援延誤：").append(delays.joinToString("、")).append("。")
        }
        val summary = ctx.pick(rule.rows("summaries"))?.get("text") as? String
        val parts = if (ending["type"] == "CRITICAL_FAILURE") listOf(summary ?: type) else listOfNotNull(
            delays.firstOrNull()?.let { "最早因"+it+"造成延誤" }, worst?.text("label")?.let { "過程中出現"+it })
        val sourceIds = (dangers+improvements+good).flatMap { it.getValue("sourceIds").list() } +
            ((pointImpact?.get("sourceIds") ?: point?.get("sourceIds")) as? List<*>).orEmpty()
        return mapOf("attempt" to data["attempt"], "type" to type, "injury" to grade, "injuries" to injuries, "delays" to delays,
            "result" to result, "summary" to if (parts.isNotEmpty()) parts.joinToString("，").removeSuffix("。")+"。" else summary ?: "本場未記錄傷勢或延誤。",
            "good" to good, "improvements" to improvements, "encountered" to history.map { it["decisionId"] }.distinct(), "dangers" to dangers,
            "turning" to turning, "sources" to sourceIds.distinct().map { sources.getValue(it as String) },
            "reflection" to (point?.text("decisionId")?.let { decisions[it]?.get("reflectionPrompt") }
                ?: rules.getValue("review").obj()["reflectionPrompt"]), "canRetry" to (point != null))
    }

    fun retry(session: Session): PackObject {
        val data = session.data
        require(data.getValue("state").obj()["ending"] != null)
        val history = data.rows("history")
        val point = point(history) ?: error("Missing turning point")
        val state = point.getValue("before").deepCopy().mutableObj()
        val from = mapOf("attempt" to data["attempt"], "decisionId" to point["decisionId"], "clock" to state["clock"])
        val attempt = data.number("attempt") + 1
        data["state"] = state
        data["history"] = history.takeWhile { it !== point }.toMutableList()
        data["retryFrom"] = from
        data.append("log", mapOf("sessionId" to session.id, "scenarioId" to pack.id, "packVersion" to pack.meta["version"],
            "packDigest" to pack.digest, "attempt" to attempt, "retryFrom" to from))
        data["attempt"] = attempt
        data["revision"] = data.number("revision") + 1
        data.mutable("requests").clear()
        data["order"] = order(decisions.getValue(state.text("decisionId")))
        data["lines"] = listOf("我回到剛才做決定之前。")
        return snapshot(session)
    }
}
