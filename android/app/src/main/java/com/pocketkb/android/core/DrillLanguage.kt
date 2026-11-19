package com.pocketkb.android.core

import org.json.JSONObject

internal object DrillLanguage {
    private val hypothetical = Regex("如果|假如|假設|想像|幻想|萬一|要是|只是想想")
    private val uncommitted = Regex("不會|不打算|沒有要|沒打算|不是要|並未|我不想|我不要|開玩笑|只是想說")
    private val reference = Regex("我(?:看見|看到|聽到|聽說)|(?:提醒|叫|告訴|勸)(?:室友|同學|家人|別人|大家|他|她)|(?:有人|室友|同學|別人)(?:正在|想|在|說)|拒絕|絕不|不會|不打算|不想|不要|並未|(?:所以|因此)我(?:留|待|停|等)")
    private val actualDecision = Regex("(?:但|然而|可是|結果|接著|然後|之後|現在)我(?:要|仍要|還是要|已經|就|真的)")

    fun nonAction(spec: JSONObject, text: String, intent: String, node: JSONObject): Pair<String, String>? {
        val excerpt = text.take(120)
        if (hypothetical.containsMatchIn(text)) {
            val compact = text.replace(Regex("\\s"), "")
            val hazards = if (spec.has("hazards")) spec.objects("hazards")
                else spec.objects("actions").filter { node.optJSONObject("hazards")?.has(it.getString("id")) == true }
            val hazard = hazards.firstOrNull { Regex(it.getString("pattern")).containsMatchIn(compact) }
            val consequence = hazard?.let {
                val detail = node.optJSONObject("hazards")?.optJSONObject(it.getString("id"))
                    ?.optString("message")?.substringBefore("本次演練").orEmpty()
                "若真的「${it.getString("label")}」，${detail.ifEmpty { "可能增加走廊濃煙中的暴露與受困風險。" }}"
            }
                ?: "目前無法確認這個假設的後果。你想先確認哪個現場條件？"
            return "question" to "你提的是假設「$excerpt」。$consequence"
        }
        if (intent == "question" || Regex(spec.getString("questionPattern")).containsMatchIn(text)) {
            return "question" to "關於「$excerpt」，目前的已知線索是：${node.getString("situation")} 你想先確認哪一項現場條件？"
        }
        if ((reference.containsMatchIn(text) && !actualDecision.containsMatchIn(text)) || uncommitted.containsMatchIn(text))
            return "clarify" to "「$excerpt」尚未確認為行動。你現在決定做什麼？"
        return null
    }

    fun unclear(text: String, task: String) = "「${text.take(120)}」無法確認為本情境的行動。現在的任務是：$task"

    data class Clock(val elapsed: Int, val questions: Int, val event: JSONObject?)

    fun advance(spec: JSONObject, kind: String, text: String, elapsed: Int, questions: Int): Clock? {
        val events = spec.objects("deterioration")
        if (events.isEmpty() || text.isBlank()) return null
        if (kind !in setOf("clarify", "off_topic", "unclear", "question", "emotion"))
            return if (questions > 0 && kind != "locked") Clock(elapsed, 0, null) else null
        if (hypothetical.containsMatchIn(text) || Regex("不會|不打算").containsMatchIn(text)) return null
        val nextQuestions = if (kind == "question") questions + 1 else 0
        val nextElapsed = elapsed + if (kind == "question" && nextQuestions < 3) 0 else 1
        val event = events.firstOrNull { nextElapsed != elapsed && it.getInt("at") == nextElapsed }
        return Clock(nextElapsed, nextQuestions, event)
    }
}
