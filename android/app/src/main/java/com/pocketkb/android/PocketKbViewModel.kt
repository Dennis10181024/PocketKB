package com.pocketkb.android

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pocketkb.android.ai.DevelopmentLlmEngine
import com.pocketkb.android.ai.LlamaCppEngine
import com.pocketkb.android.ai.LocalLlmEngine
import com.pocketkb.android.ai.ModelRuntimePolicy
import com.pocketkb.android.core.AppTab
import com.pocketkb.android.core.ChatMessage
import com.pocketkb.android.core.ChatRole
import com.pocketkb.android.core.DisasterCategory
import com.pocketkb.android.core.DrillJudge
import com.pocketkb.android.core.DrillOutcome
import com.pocketkb.android.core.DrillScenario
import com.pocketkb.android.core.DrillStepState
import com.pocketkb.android.core.KnowledgeBase
import com.pocketkb.android.core.RagEngine
import com.pocketkb.android.core.RetrievalResult
import com.pocketkb.android.data.DrillHistoryRepository
import com.pocketkb.android.data.DrillSessionEntity
import com.pocketkb.android.data.PocketKbDatabase
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File
import java.util.UUID

private const val ENABLE_EXPERIMENTAL_LOCAL_LLM = false

data class PocketKbUiState(
    val selectedTab: AppTab = AppTab.HOME,
    val selectedScenario: DrillScenario? = null,
    val selectedCategory: DisasterCategory? = null,
    val messages: List<ChatMessage> = emptyList(),
    val drillStep: DrillStepState = DrillStepState(),
    val ragResults: List<RetrievalResult> = emptyList(),
    val isGenerating: Boolean = false,
    val activeSessionId: String? = null,
    val modelStatus: String = "正在初始化本地模型環境...",
    val lastReport: String = "",
)

class PocketKbViewModel(
    application: Application,
) : AndroidViewModel(application) {
    private val llmEngine: LocalLlmEngine = if (ENABLE_EXPERIMENTAL_LOCAL_LLM) {
        LlamaCppEngine(application)
    } else {
        DevelopmentLlmEngine()
    }
    private val rag = RagEngine()
    private val judge = DrillJudge()
    private val historyRepository = DrillHistoryRepository(
        PocketKbDatabase.get(application).drillHistoryDao(),
    )

    val recentSessions: StateFlow<List<DrillSessionEntity>> =
        historyRepository.recentSessions()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _uiState = MutableStateFlow(PocketKbUiState(modelStatus = llmEngine.status))
    val uiState: StateFlow<PocketKbUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null

    init {
        prepareModelDirectory()
        configureModelStatus()
    }

    fun selectTab(tab: AppTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun selectCategory(category: DisasterCategory?) {
        _uiState.update { it.copy(selectedCategory = category) }
    }

    fun startScenario(scenario: DrillScenario) {
        countdownJob?.cancel()
        val sessionId = UUID.randomUUID().toString()
        val opening = ChatMessage(role = ChatRole.ASSISTANT, content = scenario.openingLine)
        val initialStep = DrillStepState(totalSteps = scenario.steps.size.takeIf { it > 0 } ?: DrillStepState().totalSteps)
        _uiState.value = PocketKbUiState(
            selectedTab = AppTab.DRILL,
            selectedScenario = scenario,
            selectedCategory = scenario.category,
            messages = listOf(opening),
            drillStep = initialStep,
            activeSessionId = sessionId,
            modelStatus = _uiState.value.modelStatus,
        )
        viewModelScope.launch {
            historyRepository.startSession(
                id = sessionId,
                scenarioId = scenario.id,
                scenarioTitle = scenario.title,
                category = scenario.category.label,
                totalSteps = _uiState.value.drillStep.totalSteps,
            )
            historyRepository.appendMessage(sessionId, opening)
        }
        startDecisionTimer()
    }

    fun stopScenario() {
        val state = _uiState.value
        countdownJob?.cancel()
        val sessionId = state.activeSessionId
        if (sessionId != null && state.selectedScenario != null) {
            viewModelScope.launch {
                historyRepository.finishSession(
                    sessionId = sessionId,
                    finalStep = state.drillStep.currentStep,
                    totalSteps = state.drillStep.totalSteps,
                    finalSafety = state.drillStep.safetyLevel,
                    outcome = state.drillStep.outcome,
                    messages = state.messages,
                )
            }
        }
        _uiState.update {
            it.copy(
                selectedScenario = null,
                messages = emptyList(),
                ragResults = emptyList(),
                drillStep = DrillStepState(),
                activeSessionId = null,
                lastReport = "",
                isGenerating = false,
            )
        }
    }

    fun sendUserAction(text: String) {
        val trimmed = text.trim()
        val scenario = _uiState.value.selectedScenario ?: return
        if (trimmed.isEmpty() || _uiState.value.isGenerating) return
        countdownJob?.cancel()

        val beforeState = _uiState.value
        val userMessage = ChatMessage(role = ChatRole.USER, content = trimmed)
        val retrieval = scenarioAwareRetrieval(scenario, trimmed)
        _uiState.update {
            it.copy(
                messages = it.messages + userMessage,
                ragResults = retrieval,
                isGenerating = true,
            )
        }
        persistMessages(userMessage)

        viewModelScope.launch {
            val localJudge = judge.evaluateUserAction(scenario, trimmed, beforeState.drillStep)
            val prompt = rag.buildPrompt(
                scenario = scenario,
                query = trimmed,
                history = beforeState.messages + userMessage,
                results = retrieval,
            )

            var finalJudge = localJudge
            var modelBody: String? = null
            if (ENABLE_EXPERIMENTAL_LOCAL_LLM && llmEngine.isReady && localJudge.outcome != DrillOutcome.FAILED) {
                val generated = StringBuilder()
                val generation = llmEngine.generate(prompt, scenario, retrieval) { token ->
                    generated.append(token)
                }
                generation.onSuccess {
                    val (modelJudge, cleaned) = judge.parseHiddenTag(generated.toString())
                    if (modelJudge != null) {
                        val guarded = judge.enforceLocalGuardrails(
                            scenario = scenario,
                            userText = trimmed,
                            stepState = beforeState.drillStep,
                            modelResult = modelJudge,
                        )
                        finalJudge = guarded
                        modelBody = cleaned.takeIf { guarded == modelJudge }
                    }
                }.onFailure { error ->
                    _uiState.update { it.copy(modelStatus = "本地模型回覆失敗，已改用內建裁判：${error.message}") }
                }
            }

            val assistantText = judge.composeAssistantReply(
                scenario = scenario,
                result = finalJudge,
                retrievalResults = retrieval,
                modelText = modelBody,
                stepState = beforeState.drillStep,
            )
            val assistantMessage = ChatMessage(
                role = ChatRole.ASSISTANT,
                content = assistantText,
                judgeMetadata = finalJudge,
            )

            val oldStep = beforeState.drillStep
            val newStep = oldStep.copy(
                currentStep = (oldStep.currentStep + finalJudge.progressDelta)
                    .coerceIn(1, oldStep.totalSteps),
                safetyLevel = finalJudge.safety,
                remainingSec = 30,
                elapsedSec = oldStep.elapsedSec,
                outcome = finalJudge.outcome,
            )
            val allMessages = _uiState.value.messages + assistantMessage
            val report = if (finalJudge.outcome == DrillOutcome.SUCCESS || finalJudge.outcome == DrillOutcome.FAILED) {
                buildEndReport(scenario, newStep, allMessages)
            } else {
                ""
            }

            _uiState.update {
                it.copy(
                    messages = allMessages,
                    drillStep = newStep,
                    lastReport = report,
                    isGenerating = false,
                )
            }

            persistMessages(assistantMessage)
            if (finalJudge.outcome == DrillOutcome.CONTINUE || finalJudge.outcome == DrillOutcome.TIMEOUT) {
                startDecisionTimer()
            } else {
                finishActiveSession()
            }
        }
    }

    fun loadModelFromPath(modelPath: String) {
        if (!ENABLE_EXPERIMENTAL_LOCAL_LLM) {
            _uiState.update {
                it.copy(
                    modelStatus = "離線應急模式啟用：本地 LLM 已停用，演練使用內建嚴格裁判與 BM25 RAG。",
                )
            }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(modelStatus = "正在載入模型：$modelPath") }
            llmEngine.loadModel(modelPath)
                .onSuccess { _uiState.update { it.copy(modelStatus = llmEngine.status) } }
                .onFailure { error -> _uiState.update { it.copy(modelStatus = error.message ?: llmEngine.status) } }
        }
    }

    fun handleDecisionTimeout() {
        val state = _uiState.value
        val scenario = state.selectedScenario ?: return
        if (state.drillStep.outcome != DrillOutcome.CONTINUE) return

        val result = judge.evaluateTimeout(scenario, state.drillStep)
        val message = ChatMessage(
            role = ChatRole.ASSISTANT,
            content = judge.composeAssistantReply(scenario, result, state.ragResults, stepState = state.drillStep),
            judgeMetadata = result,
        )
        val stepOutcome = if (result.outcome == DrillOutcome.TIMEOUT) DrillOutcome.CONTINUE else result.outcome
        val newStep = state.drillStep.copy(
            safetyLevel = result.safety,
            outcome = stepOutcome,
            remainingSec = 30,
        )
        val report = if (result.outcome == DrillOutcome.FAILED) {
            buildEndReport(scenario, newStep, state.messages + message)
        } else {
            ""
        }
        _uiState.update {
            it.copy(
                messages = it.messages + message,
                drillStep = newStep,
                lastReport = report,
            )
        }
        persistMessages(message)

        if (result.outcome == DrillOutcome.FAILED) {
            finishActiveSession()
        } else {
            startDecisionTimer()
        }
    }

    private fun startDecisionTimer() {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            while (_uiState.value.selectedScenario != null &&
                _uiState.value.drillStep.outcome == DrillOutcome.CONTINUE
            ) {
                delay(1_000)
                val current = _uiState.value.drillStep
                if (current.remainingSec <= 1) {
                    handleDecisionTimeout()
                    break
                } else {
                    _uiState.update {
                        it.copy(
                            drillStep = current.copy(
                                remainingSec = current.remainingSec - 1,
                                elapsedSec = current.elapsedSec + 1,
                            ),
                        )
                    }
                }
            }
        }
    }

    private fun persistMessages(vararg messages: ChatMessage) {
        val sessionId = _uiState.value.activeSessionId ?: return
        viewModelScope.launch {
            messages.forEach { message -> historyRepository.appendMessage(sessionId, message) }
        }
    }

    private fun scenarioAwareRetrieval(scenario: DrillScenario, query: String): List<RetrievalResult> {
        val ranked = rag.retrieve(query, topK = 8)
        val sameCategory = ranked
            .filter { it.chunk.category == scenario.category }
            .take(3)
        if (sameCategory.isNotEmpty()) return sameCategory

        return KnowledgeBase.chunks
            .filter { it.category == scenario.category }
            .take(3)
            .map { chunk ->
                RetrievalResult(
                    chunk = chunk,
                    score = 0.0,
                    matchedTerms = emptyList(),
                )
            }
    }

    private fun finishActiveSession() {
        val state = _uiState.value
        val sessionId = state.activeSessionId ?: return
        viewModelScope.launch {
            historyRepository.finishSession(
                sessionId = sessionId,
                finalStep = state.drillStep.currentStep,
                totalSteps = state.drillStep.totalSteps,
                finalSafety = state.drillStep.safetyLevel,
                outcome = state.drillStep.outcome,
                messages = state.messages,
            )
        }
        countdownJob?.cancel()
    }

    private fun buildEndReport(scenario: DrillScenario, step: DrillStepState, messages: List<ChatMessage>): String {
        val analytics = historyRepository.calculateAnalytics(
            messages = messages,
            finalStep = step.currentStep,
            totalSteps = step.totalSteps,
            finalSafety = step.safetyLevel,
            outcome = step.outcome,
        )
        val outcomeText = when (analytics.outcome) {
            DrillOutcome.SUCCESS -> "演練完成"
            DrillOutcome.FAILED -> "演練失敗"
            DrillOutcome.TIMEOUT -> "逾時中止"
            DrillOutcome.CONTINUE -> "未完成"
        }
        val finalTask = scenario.steps.getOrNull(step.currentStep - 1)?.title ?: "一般情境判斷"
        return """
            $outcomeText
            最後任務：$finalTask
            完成率：${(analytics.completionRate * 100).toInt()}%
            使用者回合：${analytics.turns}
            回應字數：${analytics.userWordCount}
            逾時次數：${analytics.timeoutCount}
            致命錯誤：${analytics.fatalErrorCount}
            最終安全等級：${analytics.finalSafety.label}
        """.trimIndent()
    }

    private fun prepareModelDirectory() {
        val app = getApplication<Application>()
        listOfNotNull(
            File(app.filesDir, "models"),
            app.getExternalFilesDir("models"),
        ).forEach { it.mkdirs() }
    }

    private fun configureModelStatus() {
        val app = getApplication<Application>()
        val path = app.getExternalFilesDir("models")?.absolutePath ?: File(app.filesDir, "models").absolutePath
        if (!ENABLE_EXPERIMENTAL_LOCAL_LLM) {
            _uiState.update {
                it.copy(
                    modelStatus = "離線應急模式啟用。\n目前使用官方知識庫、BM25 RAG 與規則式安全裁判；本地 LLM 已停用以避免手機卡頓。",
                )
            }
            return
        }

        viewModelScope.launch {
            val candidate = ModelRuntimePolicy.findCandidateModels(app).firstOrNull()
            if (candidate == null) {
                _uiState.update {
                    it.copy(modelStatus = "${llmEngine.status}\n請把 Qwen GGUF 放到：$path")
                }
            } else {
                loadModelFromPath(candidate.absolutePath)
            }
        }
    }
}






