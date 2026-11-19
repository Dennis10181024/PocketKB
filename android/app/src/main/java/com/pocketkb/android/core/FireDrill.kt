package com.pocketkb.android.core

import org.json.JSONObject

internal fun JSONObject.strings(key: String): List<String> = optJSONArray(key)?.let { a -> (0 until a.length()).map { a.getString(it) } } ?: emptyList()
internal fun JSONObject.objects(key: String): List<JSONObject> = optJSONArray(key)?.let { a -> (0 until a.length()).map { a.getJSONObject(it) } } ?: emptyList()

data class FireEvent(val node: String, val kind: String, val labels: List<String>)
data class FireHint(val node: String, val level: Int)
data class FireState(
    val version: String, val node: Int = 0, val completed: List<String> = emptyList(),
    val accepted: List<String> = emptyList(), val hints: List<FireHint> = emptyList(),
    val events: List<FireEvent> = emptyList(), val outcome: DrillOutcome = DrillOutcome.CONTINUE,
    val elapsed: Int = 0, val consecutiveQuestions: Int = 0,
)
data class FireResult(val state: FireState, val kind: String, val message: String, val effects: List<String> = emptyList(), val delta: Int = 0) {
    fun judge() = DrillJudgeResult(
        safety = if (state.outcome == DrillOutcome.FAILED) SafetyLevel.FAILED else if (kind == "risk") SafetyLevel.LOW else SafetyLevel.MEDIUM,
        progressDelta = delta, outcome = state.outcome, reason = message, shouldAskAgain = delta == 0,
    )
}

/** Finite interpreter, not a language model. Keep behavior aligned with fire-engine.js via shared fixtures. */
class FireDrill(val spec: JSONObject) {
    val nodes = spec.objects("nodes")
    private val actions = spec.objects("actions")
    private val hazards = spec.objects("hazards")
    fun create() = FireState(spec.getString("version"))
    fun label(id: String) = actions.first { it.getString("id") == id }.getString("label")
    fun scenario() = DrillScenario(
        id = spec.getString("id"), title = spec.getString("title"), category = DisasterCategory.FIRE,
        location = spec.getString("location"), openingLine = spec.getString("opening"),
        decisionRules = ScenarioDecisionRules(emptyList(), emptyList(), emptyList(), emptyList(), "完成教學模擬"),
        systemPrompt = "版本化教學情境；未接入LLM，不得推測未發生的救援。",
        steps = nodes.map { n -> ScenarioStep(n.getString("id"), n.getString("title"), n.getString("situation"),
            emptyList(), emptyList(), emptyList(), n.strings("required").map(::label), n.getString("completion"), n.getString("task"), "") },
    )
    fun sources(state: FireState): List<KnowledgeSource> = spec.objects("sources")
        .filter { it.getString("id") in nodes[state.node].strings("sources") || it.getString("id") == "safety" }
        .map { KnowledgeSource("消防機關", it.getString("title"), it.getString("url"), "核對 ${it.getString("checked")}") }

    private fun mentions(text: String, pattern: String): Set<String> {
        val signs = mutableSetOf<String>()
        text.replace(Regex("\\s"), "").split(Regex(spec.getString("splitPattern"))).forEach { clause ->
            Regex(pattern).findAll(clause).forEach { match ->
                signs += if (Regex(spec.getString("negationPattern")).containsMatchIn(clause.substring(0, match.range.first))) "negative" else "positive"
            }
        }
        return signs
    }
    fun step(before: FireState, input: String, intent: String = "action"): FireResult {
        val result = rawStep(before, input, intent)
        val state = result.state
        val clock = DrillLanguage.advance(spec, result.kind, input, state.elapsed, state.consecutiveQuestions) ?: return result
        val message = clock.event?.getString("message")
        val events = if (message == null) state.events else state.events + FireEvent(nodes[state.node].getString("id"), "environment_change", listOf(message))
        return result.copy(state = state.copy(elapsed = clock.elapsed, consecutiveQuestions = clock.questions, events = events),
            message = if (message == null) result.message else "${result.message} $message")
    }

    private fun rawStep(before: FireState, input: String, intent: String): FireResult {
        var state = before
        val node = nodes[state.node]
        val nodeId = node.getString("id")
        fun result(kind: String, message: String, effects: List<String> = emptyList()) =
            FireResult(state, kind, message, effects, state.completed.size - before.completed.size)
        if (state.outcome != DrillOutcome.CONTINUE) return result("locked", "本次已結束，請重新開始新的演練。")
        val text = input.trim()
        if (text.isEmpty() && intent == "action") return result("clarify", "請描述行動，或使用下方的引導選項。")
        if (intent == "observe") return result("observe", node.getString("observation"))
        if (intent == "hint") {
            val hints = node.strings("hints")
            val used = state.hints.count { it.node == nodeId }
            if (used < hints.size) state = state.copy(hints = state.hints + FireHint(nodeId, used + 1))
            return result("hint", hints[used.coerceAtMost(hints.lastIndex)])
        }
        DrillLanguage.nonAction(spec, text, intent, node)?.let { (kind, message) -> return result(kind, message) }
        if (Regex(spec.getString("uncertainPattern")).containsMatchIn(text))
            return result("clarify", "這句包含假設或不確定語意。請確認你現在實際決定做什麼；也可以選擇引導行動。")
        val actionSigns = actions.map { it to mentions(text, it.getString("pattern")) }
        val hazardSigns = hazards.map { it to mentions(text, it.getString("pattern")) }
        val positives = actionSigns.filter { "positive" in it.second }.map { it.first }
        val dangers = hazardSigns.filter { "positive" in it.second }.map { it.first }
        val contradictory = (actionSigns + hazardSigns).any { it.second.size > 1 } ||
            actionSigns.any { it.first.getString("id") in state.accepted && "negative" in it.second } ||
            (positives.any { it.getString("id") == "close" } && dangers.any { it.getString("id") == "open" })
        if (contradictory) return result("clarify", "這次說法包含相反行動，或與已完成行動矛盾。我先不改變情境；請重新說明你最後採取的行動。")
        if (dangers.isNotEmpty()) {
            val fatal = dangers.any { it.getBoolean("fatal") }
            val labels = dangers.map { it.getString("label") }
            state = state.copy(outcome = if (fatal) DrillOutcome.FAILED else state.outcome,
                events = state.events + FireEvent(nodeId, if (fatal) "failed" else "risk", labels))
            if (dangers.all { it.has("consequence") && it.has("teaching") })
                return result(if (fatal) "failed" else "risk", dangers.joinToString(" ") { it.getString("consequence") + " " + it.getString("teaching") })
            return result(if (fatal) "failed" else "risk", "${labels.joinToString("、")}不適合目前濃煙阻斷的設定。" +
                if (fatal) "本次模擬停止，可回顧後重新練習。" else "尚未執行此危險選擇；請重新決定，已完成的安全行動仍保留。")
        }
        val allowed = node.strings("required") + node.strings("optional")
        val fresh = positives.filter { it.getString("id") in allowed && it.getString("id") !in state.accepted }
        state = state.copy(accepted = state.accepted + fresh.map { it.getString("id") })
        if (fresh.isNotEmpty()) state = state.copy(events = state.events + FireEvent(nodeId, "action", fresh.map { it.getString("label") }))
        val missing = node.strings("required").filter { it !in state.accepted }
        if (missing.isEmpty()) {
            state = state.copy(completed = state.completed + nodeId)
            state = if (state.node == nodes.lastIndex) state.copy(outcome = DrillOutcome.SUCCESS)
                else state.copy(node = state.node + 1, accepted = emptyList())
            val deferred = positives.any { it.getString("id") !in allowed }
            return result(if (state.outcome == DrillOutcome.SUCCESS) "success" else "advance", node.getString("completion") +
                if (deferred) " 本回合只確認目前階段，其他行動請在下一階段確認。" else "", fresh.map { it.getString("effect") })
        }
        if (fresh.isEmpty()) return result("clarify", DrillLanguage.unclear(text, node.getString("task")))
        return result("partial", "已記住：${fresh.joinToString("、") { it.getString("label") }}。尚待完成：${missing.joinToString("、", transform = ::label)}。", fresh.map { it.getString("effect") })
    }
    fun review(state: FireState): String {
        val labels = state.events.filter { it.kind == "action" }.flatMap { it.labels }.distinct()
        val misses = nodes.filter { it.getString("id") !in state.completed }.flatMap { n ->
            n.strings("required").filter { n.getString("id") != nodes[state.node].getString("id") || it !in state.accepted }
        }.map(::label).distinct()
        val risks = state.events.filter { it.kind != "action" }.flatMap { it.labels }
        return "劇本 v${state.version} · 學習模式\n完成 ${state.completed.size}/${nodes.size} 階段\n已練習：${labels.joinToString("、").ifEmpty { "尚無" }}\n待補強：${misses.joinToString("、").ifEmpty { "本劇本必要決策皆已完成" }}\n需回顧的選擇：${risks.joinToString("、").ifEmpty { "無已辨識風險選擇" }}\n提示使用：${state.hints.size} 層\n${spec.getString("reflection") }"
    }
}
