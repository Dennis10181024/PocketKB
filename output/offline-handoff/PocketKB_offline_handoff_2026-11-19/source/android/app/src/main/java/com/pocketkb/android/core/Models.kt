package com.pocketkb.android.core

import java.util.UUID

enum class DisasterCategory(val label: String, val icon: String) {
    EARTHQUAKE("地震", "震"),
    TYPHOON("颱風豪雨", "風"),
    FLOOD("淹水洪水", "水"),
    LANDSLIDE("土石流崩塌", "崩"),
    BARRIER_LAKE("堰塞湖", "湖"),
    FIRE("火災", "火"),
    MANMADE("人為災害", "人"),
    COMPOUND("複合災害", "複"),
    PREPAREDNESS("防災士整備", "備"),
    FIRST_AID("急救", "急");
}

data class KnowledgeChunk(
    val id: String,
    val title: String,
    val content: String,
    val category: DisasterCategory,
    val tags: List<String>,
    val source: KnowledgeSource,
)

data class KnowledgeSource(
    val agency: String,
    val title: String,
    val url: String,
    val note: String = "",
)

data class RetrievalResult(
    val chunk: KnowledgeChunk,
    val score: Double,
    val matchedTerms: List<String>,
)

data class DrillScenario(
    val id: String,
    val title: String,
    val category: DisasterCategory,
    val location: String,
    val openingLine: String,
    val decisionRules: ScenarioDecisionRules,
    val systemPrompt: String,
    val steps: List<ScenarioStep> = emptyList(),
)

data class ScenarioDecisionRules(
    val successKeywords: List<String>,
    val riskyKeywords: List<String>,
    val fatalKeywords: List<String>,
    val requiredConcepts: List<String>,
    val successSummary: String,
)

data class ScenarioStep(
    val id: String,
    val title: String,
    val situation: String,
    val successKeywords: List<String>,
    val riskyKeywords: List<String>,
    val fatalKeywords: List<String>,
    val requiredConcepts: List<String>,
    val successFeedback: String,
    val missingHint: String,
    val standardAction: String,
)

data class EmergencyStep(
    val order: Int,
    val text: String,
)

data class EmergencyGuide(
    val category: DisasterCategory,
    val headline: String,
    val steps: List<EmergencyStep>,
    val callout: String,
    val source: KnowledgeSource,
)

enum class ChatRole { USER, ASSISTANT, SYSTEM }

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val role: ChatRole,
    val content: String,
    val timestampMs: Long = System.currentTimeMillis(),
    val judgeMetadata: DrillJudgeResult? = null,
)

enum class SafetyLevel(val label: String) {
    HIGH("High"),
    MEDIUM("Medium"),
    LOW("Low"),
    FAILED("Failed"),
}

enum class DrillOutcome {
    CONTINUE,
    SUCCESS,
    EVACUATED,
    WAITING_RESCUE,
    SHELTERED,
    RESCUED,
    FAILED,
    TIMEOUT,
}

data class DrillJudgeResult(
    val safety: SafetyLevel,
    val progressDelta: Int,
    val outcome: DrillOutcome,
    val reason: String,
    val shouldAskAgain: Boolean,
    val matchedRules: List<String> = emptyList(),
) {
    fun toHiddenTag(): String {
        val delta = if (progressDelta >= 0) "+$progressDelta" else progressDelta.toString()
        return "[安全評分:${safety.label}][進度:$delta][結果:$outcome]"
    }
}

data class DrillStepState(
    val currentStep: Int = 1,
    val totalSteps: Int = 6,
    val safetyLevel: SafetyLevel = SafetyLevel.MEDIUM,
    val remainingSec: Int = 30,
    val elapsedSec: Int = 0,
    val outcome: DrillOutcome = DrillOutcome.CONTINUE,
) {
    val completionRate: Double
        get() = currentStep.toDouble() / totalSteps.coerceAtLeast(1).toDouble()
}

enum class AppTab(val label: String) {
    HOME("首頁"),
    DRILL("演練"),
    EMERGENCY("應急"),
    RESOURCES("知識"),
    HISTORY("紀錄"),
}

data class DrillAnalytics(
    val turns: Int,
    val userWordCount: Int,
    val timeoutCount: Int,
    val fatalErrorCount: Int,
    val completionRate: Double,
    val finalSafety: SafetyLevel,
    val outcome: DrillOutcome,
)

