package com.pocketkb.android.core

import kotlin.math.ln

class RagEngine(
    private var corpus: List<KnowledgeChunk> = KnowledgeBase.chunks,
) {
    private val k1 = 1.5
    private val b = 0.75
    private var termFrequencies: List<Map<String, Double>> = emptyList()
    private var idf: Map<String, Double> = emptyMap()
    private var avgDocLen = 1.0

    fun rebuild(chunks: List<KnowledgeChunk>) {
        corpus = chunks
        termFrequencies = chunks.map {
            termFrequency("${it.title} ${it.content} ${it.tags.joinToString(" ")} ${it.source.agency} ${it.source.title}")
        }
        val n = chunks.size.toDouble()
        if (n == 0.0) return
        avgDocLen = termFrequencies.map { it.values.sum() }.average().takeIf { !it.isNaN() } ?: 1.0
        val df = mutableMapOf<String, Int>()
        termFrequencies.forEach { tf ->
            tf.keys.forEach { term -> df[term] = (df[term] ?: 0) + 1 }
        }
        idf = df.mapValues { (_, count) ->
            ln((n - count.toDouble() + 0.5) / (count.toDouble() + 0.5) + 1.0)
        }
    }

    fun retrieve(query: String, topK: Int = 3): List<RetrievalResult> {
        val queryTerms = tokenize(query)
        if (queryTerms.isEmpty()) return emptyList()

        val scored = termFrequencies.mapIndexed { index, tf ->
            val docLen = tf.values.sum().coerceAtLeast(1.0)
            var score = 0.0
            for (term in queryTerms) {
                val tfTerm = tf[term] ?: continue
                val idfValue = idf[term] ?: 0.0
                val numerator = tfTerm * (k1 + 1.0)
                val denominator = tfTerm + k1 * (1.0 - b + b * docLen / avgDocLen.coerceAtLeast(1.0))
                score += idfValue * numerator / denominator
            }
            index to score
        }

        return scored
            .filter { it.second > 0.0 }
            .sortedByDescending { it.second }
            .take(topK)
            .map { (index, score) ->
                val matched = queryTerms.filter { term -> termFrequencies[index].containsKey(term) }.distinct()
                RetrievalResult(corpus[index], score, matched)
            }
    }

    fun buildPrompt(
        scenario: DrillScenario?,
        query: String,
        history: List<ChatMessage>,
        results: List<RetrievalResult>,
    ): String {
        val system = scenario?.systemPrompt ?: KnowledgeBase.strictJudgeSystemPrompt
        val context = results.joinToString("\n\n") { result ->
            "資料來源：${result.chunk.source.agency}《${result.chunk.source.title}》\n資料片段：${result.chunk.title}\n${result.chunk.content}"
        }
        val historyText = history.takeLast(8).joinToString("\n") { msg ->
            val role = when (msg.role) {
                ChatRole.USER -> "user"
                ChatRole.ASSISTANT -> "assistant"
                ChatRole.SYSTEM -> "system"
            }
            "<|$role|>\n${msg.content}\n<|end|>"
        }
        return """
            <|system|>
            $system

            請只依據下列防災資料和情境裁判規則回覆，不要放水。
            $context
            <|end|>
            $historyText
            <|user|>
            $query
            <|assistant|>
        """.trimIndent()
    }

    private fun termFrequency(text: String): Map<String, Double> {
        val map = mutableMapOf<String, Double>()
        tokenize(text).forEach { token -> map[token] = (map[token] ?: 0.0) + 1.0 }
        return map
    }

    private fun tokenize(text: String): List<String> {
        val lower = text.lowercase()
        val tokens = mutableListOf<String>()
        val latin = StringBuilder()
        for (char in lower) {
            if (char.isLetterOrDigit() && !isCjk(char)) {
                latin.append(char)
            } else if (latin.isNotEmpty()) {
                tokens.add(latin.toString())
                latin.clear()
            }
        }
        if (latin.isNotEmpty()) tokens.add(latin.toString())

        val cjk = lower.filter { isCjk(it) }
        cjk.forEach { tokens.add(it.toString()) }
        if (cjk.length >= 2) {
            for (i in 0 until cjk.length - 1) {
                tokens.add("${cjk[i]}${cjk[i + 1]}")
            }
        }
        return tokens.filterNot { it in stopwords }.distinct()
    }

    private fun isCjk(char: Char): Boolean = char.code in 0x4E00..0x9FFF

    private val stopwords = setOf(
        "的", "了", "我", "你", "他", "她", "它", "是", "在", "有", "和", "與",
        "就", "都", "也", "要", "會", "先", "再", "並", "或", "及", "可以",
    )

    // Indexing calls tokenize(), so every tokenizer property must exist first.
    init {
        rebuild(corpus)
    }
}
