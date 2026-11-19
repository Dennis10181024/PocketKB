package com.pocketkb.android.core

import org.json.JSONObject

data class ScenarioEventV3(
    val node: String,
    val action: String? = null,
    val kind: String,
    val message: String? = null,
)

data class ScenarioStateV3(
    val scenarioId: String,
    val version: String,
    val node: String,
    val sessionStatus: String = "ACTIVE",
    val physicalStatus: String,
    val completionKind: String? = null,
    val nodeTurn: Int = 0,
    val accepted: List<String> = emptyList(),
    val resources: Map<String, Int> = emptyMap(),
    val facts: Map<String, String> = emptyMap(),
    val events: List<ScenarioEventV3> = emptyList(),
    val elapsed: Int = 0,
    val consecutiveQuestions: Int = 0,
)

data class ScenarioResultV3(
    val state: ScenarioStateV3,
    val kind: String,
    val message: String,
)

data class ScenarioReviewTimelineItemV3(
    val title: String,
    val description: String,
)

data class ScenarioReviewV3(
    val version: String,
    val outcomeTitle: String,
    val outcomeExplanation: String,
    val learningObjectives: List<String>,
    val completedActions: List<String>,
    val hazardActions: List<String>,
    val missingActions: List<String>,
    val resources: Map<String, Int>,
    val commonMisconceptions: List<String>,
    val reflectionQuestions: List<String>,
    val timeline: List<ScenarioReviewTimelineItemV3>,
)

/**
 * Deterministic scenario runtime shared by every v3 disaster specification.
 * Language models may propose action IDs later, but only this runtime can mutate
 * scenario state or assign a terminal outcome.
 */
class ScenarioRuntimeV3(val spec: JSONObject) {
    private val actions = spec.objects("actions")
    private val nodes = spec.objects("nodes")

    fun create(): ScenarioStateV3 {
        val initial = spec.getJSONObject("initialState")
        return ScenarioStateV3(
            scenarioId = spec.getString("id"),
            version = spec.getString("version"),
            node = spec.getString("initialNode"),
            physicalStatus = initial.getString("physicalStatus"),
            resources = initial.optJSONObject("resources").toIntMap(),
            facts = initial.optJSONObject("facts").toStringMap(),
        )
    }

    fun scenario(): DrillScenario {
        val category = when (spec.getString("hazard")) {
            "earthquake" -> DisasterCategory.EARTHQUAKE
            "flood" -> DisasterCategory.FLOOD
            "landslide_debris_flow" -> DisasterCategory.LANDSLIDE
            "barrier_lake" -> DisasterCategory.BARRIER_LAKE
            "fire" -> DisasterCategory.FIRE
            else -> DisasterCategory.COMPOUND
        }
        val location = when (spec.getString("locationProfile")) {
            "school_classroom" -> "學校教室"
            "low_rise_home" -> "低樓層住宅"
            "low_lying_home" -> "低窪住宅"
            "mountain_road_vehicle" -> "山區道路／車內"
            "downstream_valley_settlement" -> "堰塞湖下游聚落"
            else -> spec.getString("locationProfile")
        }
        return DrillScenario(
            id = spec.getString("id"),
            title = spec.getString("title"),
            category = category,
            location = location,
            openingLine = spec.getString("opening"),
            decisionRules = ScenarioDecisionRules(emptyList(), emptyList(), emptyList(), emptyList(), "完成情境演練"),
            systemPrompt = "v3 可驗證情境；不得把完成待救誤寫成已撤離或已獲救。",
            steps = nodes.map { node ->
                ScenarioStep(
                    id = node.getString("id"),
                    title = node.getString("title"),
                    situation = node.getString("situation"),
                    successKeywords = emptyList(),
                    riskyKeywords = emptyList(),
                    fatalKeywords = emptyList(),
                    requiredConcepts = node.strings("required").map { required ->
                        actions.first { it.getString("id") == required }.getString("label")
                    },
                    successFeedback = node.optJSONObject("terminal")?.optString("message")
                        ?: node.optJSONObject("onComplete")?.optString("message").orEmpty(),
                    missingHint = node.getString("task"),
                    standardAction = "",
                )
            },
        )
    }

    private fun node(state: ScenarioStateV3): JSONObject =
        nodes.firstOrNull { it.getString("id") == state.node }
            ?: error("Unknown scenario node: ${state.node}")

    fun nodeIndex(state: ScenarioStateV3): Int = nodes.indexOfFirst { it.getString("id") == state.node }.coerceAtLeast(0)
    fun currentTitle(state: ScenarioStateV3): String = node(state).getString("title")
    fun currentSituation(state: ScenarioStateV3): String = node(state).getString("situation")
    fun currentTask(state: ScenarioStateV3): String = node(state).getString("task")
    fun suggestedActions(state: ScenarioStateV3): List<String> {
        val current = node(state)
        return current.strings("available").map { id -> actions.first { it.getString("id") == id }.getString("label") }
    }
    fun learningObjectives(): List<String> = spec.strings("learningObjectives")
    fun commonMisconceptions(): List<String> = spec.strings("commonMisconceptions")

    private fun matches(text: String): List<JSONObject> {
        val normalized = text.replace(Regex("\\s"), "")
        val clauses = normalized
            .split(Regex(spec.getString("splitPattern")))
        return actions.filter { action ->
            normalized == action.getString("label").replace(Regex("\\s"), "") || clauses.any { clause ->
                val match = Regex(action.getString("pattern")).find(clause) ?: return@any false
                val prefix = clause.substring(0, match.range.first)
                !Regex(spec.getString("negationPattern")).containsMatchIn(prefix)
            }
        }
    }

    private fun patch(before: ScenarioStateV3, effect: JSONObject?): ScenarioStateV3 {
        if (effect == null) return before
        val resources = before.resources.toMutableMap()
        effect.optJSONObject("adjust")?.let { adjustment ->
            adjustment.keys().forEach { key ->
                resources[key] = ((resources[key] ?: 0) + adjustment.getInt(key)).coerceAtLeast(0)
            }
        }
        val facts = before.facts.toMutableMap()
        effect.optJSONObject("setFacts")?.let { values ->
            values.keys().forEach { key -> facts[key] = values.get(key).toString() }
        }
        return before.copy(
            physicalStatus = effect.optString("physicalStatus", before.physicalStatus),
            resources = resources,
            facts = facts,
        )
    }

    private fun unmetRequirement(state: ScenarioStateV3, action: JSONObject): String? {
        val requirements = action.optJSONObject("requires") ?: return null
        requirements.optJSONObject("resources")?.let { resources ->
            resources.keys().forEach { key ->
                val rule = resources.getJSONObject(key)
                val minimum = rule.optInt("min", Int.MIN_VALUE)
                val value = state.resources[key] ?: 0
                if (value < minimum) return "${action.getString("label")}需要至少 $minimum 的 $key 資源，目前只剩 $value"
            }
        }
        requirements.optJSONObject("facts")?.let { facts ->
            facts.keys().forEach { key ->
                if (state.facts[key] != facts.get(key).toString()) {
                    return "${action.getString("label")}的現場條件目前不成立"
                }
            }
        }
        return null
    }

    private fun timedEvent(
        before: ScenarioStateV3,
        node: JSONObject,
        actionIds: List<String>,
    ): Pair<ScenarioStateV3, JSONObject>? {
        val event = node.objects("timedEvents").firstOrNull { candidate ->
            before.nodeTurn >= candidate.getInt("atTurn") &&
                (candidate.optJSONArray("triggerActions") == null ||
                    candidate.strings("triggerActions").any { it in actionIds }) &&
                candidate.strings("unlessAccepted").none { it in before.accepted }
        } ?: return null
        var state = patch(before, event).copy(
            events = before.events + ScenarioEventV3(node.getString("id"), kind = "environment_change", message = event.getString("message")),
        )
        if (event.has("to")) {
            state = state.copy(node = event.getString("to"), accepted = emptyList(), nodeTurn = 0)
        }
        return state to event
    }

    fun step(before: ScenarioStateV3, text: String, intent: String = "action"): ScenarioResultV3 {
        val result = rawStep(before, text, intent)
        val state = result.state
        val clock = DrillLanguage.advance(spec, result.kind, text, state.elapsed, state.consecutiveQuestions) ?: return result
        val event = clock.event
        val message = event?.getString("message")
        val next = (event?.let { patch(state,it) } ?: state).copy(elapsed = clock.elapsed, consecutiveQuestions = clock.questions,
            events = if (message == null) state.events else state.events + ScenarioEventV3(state.node, kind = "environment_change", message = message))
        return result.copy(state = next, message = if (message == null) result.message else "${result.message} $message")
    }

    private fun rawStep(before: ScenarioStateV3, text: String, intent: String): ScenarioResultV3 {
        var state = before.copy(
            accepted = before.accepted.toList(),
            resources = before.resources.toMap(),
            facts = before.facts.toMap(),
            events = before.events.toList(),
        )
        val node = node(state)
        fun result(kind: String, message: String) = ScenarioResultV3(state, kind, message)

        if (state.sessionStatus != "ACTIVE") return result("locked", "本次演練已結束，請另開新紀錄再練習。")
        if (intent == "observe") return result("observe", node.getString("situation"))
        val input = text.trim()
        if (input.isEmpty()) return result("clarify", "請描述你現在實際要採取的行動。")
        DrillLanguage.nonAction(spec, input, intent, node)?.let { (kind, message) -> return result(kind, message) }

        val availableIds = node.strings("available")
        val available = matches(input).filter { it.getString("id") in availableIds }
        if (available.isEmpty()) return result("clarify", DrillLanguage.unclear(input, node.getString("task")))
        val matchedIds = available.map { it.getString("id") }
        val clauses = input.replace(Regex("\\s"), "").split(Regex(spec.getString("splitPattern")))
        val negative = Regex(spec.getString("negationPattern"))
        if (available.any { action ->
                val pattern = Regex(action.getString("pattern"))
                clauses.any { clause -> pattern.findAll(clause).any { negative.containsMatchIn(clause.substring(0, it.range.first)) } }
            }) {
            return result("clarify", "這次回答包含否定或互相衝突的決定。請確認你最後真正要採取的行動。")
        }
        spec.optJSONArray("conflicts")?.let { conflicts ->
            for (index in 0 until conflicts.length()) {
                val group = conflicts.getJSONArray(index)
                val ids = (0 until group.length()).map { group.getString(it) }
                if (ids.all { it in matchedIds }) {
                    return result("clarify", "這次回答同時包含互相衝突的決定。我先不改變情境；請確認你最後真正要採取的行動。")
                }
            }
        }

        available.firstNotNullOfOrNull { action ->
            unmetRequirement(state, action)?.let { action to it }
        }?.let { (action, reason) ->
            val dangerous = action.optBoolean("unsafeWhenBlocked")
            state = state.copy(events = state.events + ScenarioEventV3(node.getString("id"), action.getString("id"), if (dangerous) "hazard" else "blocked"))
            return result(if (dangerous) "risk" else "blocked", action.optString("blockedMessage", "$reason，因此沒有執行。請改用目前仍可行的方法。"))
        }

        available.forEach { action ->
            node.optJSONObject("hazards")?.optJSONObject(action.getString("id"))?.let { hazard ->
                state = patch(state, hazard).copy(
                    events = state.events + ScenarioEventV3(node.getString("id"), action.getString("id"), "hazard"),
                )
                if (hazard.optBoolean("terminal")) {
                    state = state.copy(
                        sessionStatus = hazard.optString("sessionStatus", "FAILED"),
                        completionKind = hazard.optString("completionKind", "CRITICAL_FAILURE"),
                    )
                    return result("failed", listOf(hazard.getString("message"), action.optString("teaching")).filter(String::isNotBlank).joinToString(" "))
                }
                return result("risk", listOf(hazard.getString("message"), action.optString("teaching")).filter(String::isNotBlank).joinToString(" "))
            }
        }

        val fresh = available.filter { it.getString("id") !in state.accepted }
        if (fresh.isEmpty()) return result("clarify", "這項行動已經完成，請根據目前情境決定下一步。")
        fresh.forEach { action ->
            val id = action.getString("id")
            state = patch(state, node.optJSONObject("effects")?.optJSONObject(id)).copy(
                accepted = state.accepted + id,
                events = state.events + ScenarioEventV3(node.getString("id"), id, "action"),
            )
        }
        state = state.copy(nodeTurn = state.nodeTurn + 1)
        timedEvent(state, node, fresh.map { it.getString("id") })?.let { (changed, event) ->
            state = changed
            return result("environment_change", event.getString("message"))
        }
        fresh.firstNotNullOfOrNull { action ->
            node.optJSONObject("effects")?.optJSONObject(action.getString("id"))
                ?.takeIf { it.optString("kind") == "risk" }?.let { action to it }
        }?.let { (action, effect) ->
                return result("risk", listOf(effect.getString("message"), action.optString("teaching")).filter(String::isNotBlank).joinToString(" "))
            }

        val missing = node.strings("required").filterNot { it in state.accepted }
        if (missing.isNotEmpty()) {
            return result("partial", "已記住：${fresh.joinToString("、") { it.getString("label") }}。本階段仍有必要行動尚未完成。")
        }

        node.optJSONObject("terminal")?.let { terminal ->
            state = patch(state, terminal).copy(
                sessionStatus = terminal.getString("sessionStatus"),
                completionKind = terminal.getString("completionKind"),
            )
            return result("completed", terminal.getString("message"))
        }

        val completion = node.getJSONObject("onComplete")
        state = patch(state, completion).copy(
            node = completion.getString("to"),
            accepted = emptyList(),
            nodeTurn = 0,
        )
        return result("transition", completion.getString("message"))
    }

    fun reviewData(state: ScenarioStateV3): ScenarioReviewV3 {
        val (outcomeTitle, outcomeExplanation) = when (state.physicalStatus) {
            "EVACUATED" -> "已完成撤離" to "你已到達劇本指定的相對安全地點，仍應持續留意官方資訊。"
            "RESCUED" -> "已由救援人員接觸" to "只有劇本明示救援人員接觸時，才會顯示此結果。"
            "WAITING_RESCUE" -> "穩定待救・尚未獲救" to "你已降低暴露並保存資源，但仍在災區，需要繼續等待專業救援。"
            "SHELTERED" -> "暫時掩蔽" to "你已完成目前可行的就地掩蔽，仍需等待官方後續指示。"
            "CRITICAL" -> "危急失敗" to "本次行動造成不可接受的風險；請從回顧找出可改變的決策。"
            else -> "仍暴露於災害風險" to "本次尚未達到安全、掩蔽或穩定待救條件。"
        }
        val actionLabels = actions.associate { it.getString("id") to it.getString("label") }
        val completedIds = state.events.filter { it.kind == "action" }.mapNotNull { it.action }.distinct()
        val hazardIds = state.events.filter { it.kind == "hazard" }.mapNotNull { it.action }.distinct()
        val requiredIds = nodes.flatMap { it.strings("required") }.distinct()
        val missingIds = requiredIds.filterNot { it in completedIds }
        val timeline = state.events.mapNotNull { event ->
            val actionLabel = event.action?.let { actionLabels[it] ?: it }
            when (event.kind) {
                "action" -> ScenarioReviewTimelineItemV3("採取行動", actionLabel ?: return@mapNotNull null)
                "hazard" -> ScenarioReviewTimelineItemV3("危險決策", actionLabel ?: return@mapNotNull null)
                "blocked" -> ScenarioReviewTimelineItemV3("未能執行", actionLabel ?: return@mapNotNull null)
                "environment_change" -> ScenarioReviewTimelineItemV3("環境變化", event.message ?: return@mapNotNull null)
                else -> null
            }
        }
        return ScenarioReviewV3(
            version = state.version,
            outcomeTitle = outcomeTitle,
            outcomeExplanation = outcomeExplanation,
            learningObjectives = spec.strings("learningObjectives"),
            completedActions = completedIds.map { actionLabels[it] ?: it },
            hazardActions = hazardIds.map { actionLabels[it] ?: it },
            missingActions = missingIds.map { actionLabels[it] ?: it },
            resources = state.resources,
            commonMisconceptions = spec.strings("commonMisconceptions"),
            reflectionQuestions = spec.strings("reflectionQuestions").ifEmpty { listOf(spec.getString("reflection")) },
            timeline = timeline,
        )
    }

    fun review(state: ScenarioStateV3): String {
        val review = reviewData(state)
        fun list(values: List<String>) = if (values.isEmpty()) "- 無" else values.joinToString("\n") { "- $it" }
        return listOf(
            "劇本 v${review.version}",
            "結果：${review.outcomeTitle}",
            review.outcomeExplanation,
            "學習目標：\n${list(review.learningObjectives)}",
            "做對的決策：\n${list(review.completedActions)}",
            "危險決策：\n${list(review.hazardActions)}",
            "需要補強：\n${list(review.missingActions)}",
            "剩餘資源：手機 ${review.resources["battery"] ?: 0}%、飲水 ${review.resources["water"] ?: 0}、體力 ${review.resources["energy"] ?: 0}%",
            "常見錯誤觀念：\n${list(review.commonMisconceptions)}",
            "反思問題：\n${list(review.reflectionQuestions)}",
        ).joinToString("\n")
    }
}

private fun JSONObject?.toIntMap(): Map<String, Int> {
    if (this == null) return emptyMap()
    return keys().asSequence().associateWith { getInt(it) }
}

private fun JSONObject?.toStringMap(): Map<String, String> {
    if (this == null) return emptyMap()
    return keys().asSequence().associateWith { get(it).toString() }
}
