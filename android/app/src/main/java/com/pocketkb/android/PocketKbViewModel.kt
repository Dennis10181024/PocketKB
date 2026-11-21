package com.pocketkb.android

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pocketkb.android.ai.DevelopmentLlmEngine
import com.pocketkb.android.ai.LlamaCppEngine
import com.pocketkb.android.ai.LocalLlmEngine
import com.pocketkb.android.ai.ModelRuntimePolicy
import com.pocketkb.android.ai.OnlineCoachClient
import com.pocketkb.android.ai.coachTurnOrFallback
import com.pocketkb.android.ai.OnlineCoachState
import com.pocketkb.android.core.FireResult
import com.pocketkb.android.core.ScenarioResultV3
import com.pocketkb.android.core.strings
import com.pocketkb.android.core.objects
import kotlinx.coroutines.CancellationException
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
import com.pocketkb.android.core.ScenarioRuntimeV3
import com.pocketkb.android.core.ScenarioReviewV3
import com.pocketkb.android.core.ScenarioStateV3
import com.pocketkb.android.data.DrillHistoryRepository
import com.pocketkb.android.data.DrillSessionEntity
import com.pocketkb.android.data.PocketKbDatabase
import kotlinx.coroutines.Job
import kotlinx.coroutines.Dispatchers
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
import com.pocketkb.android.core.FireDrill
import com.pocketkb.android.core.FireState
import org.json.JSONObject

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
    val fireState: FireState? = null,
    val scenarioStateV3: ScenarioStateV3? = null,
    val scenarioReviewV3: ScenarioReviewV3? = null,
    val onlineEnabled: Boolean = false,
    val onlineStatus: String = "離線規則模式",
    val onlineError: String = "",
    val onlineRevision: Int = 0,
    val onlineLocalOnly: Boolean = false,
    val onlineFallbackReason: String? = null,
    val roundNarration: String = "",
    val onlinePreview: String = "",
    val hintOptions: List<String> = emptyList(),
    val hintTrigger: String? = null,
    val hintShownTurn: Int? = null,
    val invalidStreak: Int = 0,
    val decisionLog: List<String> = emptyList(),
    val roundSources: List<String> = emptyList(),
    val roundStartedAt: Long = 0,
    val connectionNotice: String = "",
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
    val fireDrill = FireDrill(JSONObject(application.assets.open("fire-dorm.json").bufferedReader(Charsets.UTF_8).use { it.readText() }))
    private val scenarioV3Files = listOf(
        "fire-dorm.json",
        "earthquake-school.json",
        "earthquake-home-trapped.json",
        "flood-low-home.json",
        "landslide-mountain-road.json",
        "barrier-lake-downstream.json",
    )
    private val scenarioRuntimesV3 = scenarioV3Files.associate { file ->
        val runtime = ScenarioRuntimeV3(JSONObject(application.assets.open("v3/$file").bufferedReader(Charsets.UTF_8).use { it.readText() }))
        runtime.spec.getString("id") to runtime
    }
    val scenarios = scenarioRuntimesV3.values.map { it.scenario() } +
        KnowledgeBase.scenarios.filterNot { it.id in scenarioRuntimesV3 }
    private val historyRepository = DrillHistoryRepository(
        PocketKbDatabase.get(application).drillHistoryDao(),
    )

    val recentSessions: StateFlow<List<DrillSessionEntity>> =
        historyRepository.recentSessions()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _uiState = MutableStateFlow(PocketKbUiState(modelStatus = llmEngine.status))
    val uiState: StateFlow<PocketKbUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null
    private val onlineCoach = OnlineCoachClient()
    private var remoteSession: JSONObject? = null
    private var pendingOnline: JSONObject? = null
    private val offlineTurns = mutableListOf<JSONObject>()
    private var onlineJob: Job? = null

    fun setOnlineMode(enabled: Boolean) {
        if (_uiState.value.selectedScenario != null) return
        _uiState.update { it.copy(onlineEnabled = enabled, onlineError = "", onlineStatus = if (enabled) "正在確認線上教練…" else "離線規則模式") }
        if (enabled) viewModelScope.launch {
            try {
                val health = onlineCoach.health()
                if (_uiState.value.onlineEnabled) _uiState.update { it.copy(onlineStatus = if (health.getBoolean("ready")) "GPT 線上教練已就緒" else "電腦尚未設定 GPT 金鑰") }
            } catch (error: CancellationException) { throw error }
            catch (_: Exception) { if (_uiState.value.onlineEnabled) _uiState.update { it.copy(onlineStatus = "尚未連上電腦的線上教練") } }
        }
    }

    private fun sendOnlineInteraction(text: String, intent: String, trigger: String? = null, hintIndex: Int? = null, edited: Boolean = false) {
        val before = _uiState.value
        val localId = before.activeSessionId ?: return
        val scenario = before.selectedScenario ?: return
        if (before.isGenerating) return
        val pending = pendingOnline
        if (pending != null && (pending.getString("text") != text || pending.getString("intent") != intent)) {
            _uiState.update { it.copy(onlineError = "上一筆回答尚未確認，請先以相同內容重試，或另開一次演練。") }
            return
        }
        val sentAt = android.os.SystemClock.elapsedRealtime()
        val outgoing = JSONObject().put("requestId", UUID.randomUUID().toString()).put("text", text).put("intent", intent)
            .put("hintTrigger", trigger).put("hintSelectedIndex", hintIndex).put("hintEditedBeforeSubmit", if (hintIndex != null) edited else null)
        _uiState.update { it.copy(isGenerating = true, onlineError = "", onlinePreview = "", onlineStatus = "正在處理這次決定",
            roundStartedAt = if (intent == "action") sentAt else 0) }
        onlineJob = viewModelScope.launch {
            coachTurnOrFallback(remote = remote@{
                var remote = remoteSession ?: onlineCoach.create(scenario.id).also {
                    if (_uiState.value.activeSessionId == localId) remoteSession = it
                }
                if (_uiState.value.activeSessionId != localId) return@remote
                if (offlineTurns.isNotEmpty()) {
                    for (queued in offlineTurns) {
                        val replay = JSONObject(queued.toString()).put("revision", remote.getInt("revision")).put("rulesOnly", true)
                        remote = onlineCoach.turn(remote.getString("sessionId"), replay)
                    }
                    val recovered = OnlineCoachState.v3(remote).state
                    val confirmed = checkNotNull(before.scenarioStateV3)
                    check(recovered.node == confirmed.node && recovered.accepted.toSet() == confirmed.accepted.toSet() &&
                        recovered.facts == confirmed.facts && recovered.resources == confirmed.resources && recovered.exposure == confirmed.exposure &&
                        recovered.endingType == confirmed.endingType && recovered.injuryLevel == confirmed.injuryLevel)
                    remoteSession = remote
                    offlineTurns.clear()
                }
                val request = outgoing.put("revision", remote.getInt("revision")).also { pendingOnline = it }
                var firstAt: Long? = null
                val value = onlineCoach.turn(remote.getString("sessionId"), request) { part ->
                    if (intent != "hint") _uiState.update {
                        if (it.activeSessionId == localId) {
                            if (firstAt == null) firstAt = android.os.SystemClock.elapsedRealtime()
                            it.copy(onlinePreview = it.onlinePreview + part)
                        } else it
                    }
                }
                if (_uiState.value.activeSessionId != localId) return@remote
                check(value.getString("scenarioId") == scenario.id) { "線上劇本與目前場次不一致。" }
                check(value.getString("version") == (before.fireState?.version ?: before.scenarioStateV3?.version)) { "線上劇本版本不同，請更新電腦與 App。" }
                val fireResult = if (before.fireState != null) OnlineCoachState.fire(value) else null
                val v3Result = if (before.scenarioStateV3 != null) OnlineCoachState.v3(value) else null
                remoteSession = value; pendingOnline = null
                val hints = value.optJSONObject("hintContext")
                val decision = value.optJSONObject("researchRecord")?.let { record ->
                    record.put("backendSessionId", record.optString("sessionId"))
                        .put("sessionId", localId).put("turn", before.decisionLog.size + 1).toString()
                }
                if (decision != null) storeResearch(localId, before.decisionLog.size + 1, decision)
                val fallback = value.optString("fallbackReason")
                val recoveredOnline = value.optBoolean("onlineRecovered") ||
                    before.onlineLocalOnly && before.onlineFallbackReason in setOf("CLIENT_TRANSPORT", "CLIENT_API_ERROR") && !value.optBoolean("offline")
                val doneAt = android.os.SystemClock.elapsedRealtime()
                if (intent == "action" && BuildConfig.DEBUG) android.util.Log.i("Step23Timing", "first=${(firstAt ?: doneAt) - sentAt} complete=${doneAt - sentAt}")
                _uiState.update { it.copy(isGenerating = false,
                    onlinePreview = "", roundNarration = if (intent == "hint") it.roundNarration else value.optString("reply"),
                    hintOptions = value.strings("suggestions"), hintTrigger = hints?.optString("trigger"), hintShownTurn = hints?.optInt("turn"),
                    invalidStreak = value.optInt("invalidStreak"), decisionLog = it.decisionLog + listOfNotNull(decision),
                    roundSources = if (intent == "hint") it.roundSources else value.objects("citations").map { source -> source.optString("title") },
                    onlineRevision = if (intent in setOf("observe", "hint")) it.onlineRevision else it.onlineRevision + 1,
                    onlineLocalOnly = false, onlineFallbackReason = null, connectionNotice = if (intent == "hint") it.connectionNotice else connectionNotice(fallback, recoveredOnline),
                    onlineStatus = if (value.optBoolean("offline")) "目前使用離線判讀" else "GPT 線上教練", onlineError = "") }
                if (intent != "hint") {
                    if (fireResult != null) sendFireInteraction(text, intent, fireResult)
                    if (v3Result != null) sendScenarioV3Interaction(text, intent, v3Result)
                }
            }, offline = { reason ->
                if (_uiState.value.activeSessionId == localId) {
                    pendingOnline = null
                    offlineTurns.add(outgoing.put("clientFallbackReason", reason))
                    applyOfflineTurn(before, text, intent, trigger, hintIndex, edited, reason)
                }
            })
        }
    }

    private fun applyOfflineTurn(before: PocketKbUiState, text: String, intent: String, trigger: String?, hintIndex: Int?, edited: Boolean, reason: String) {
        val scenario = before.selectedScenario ?: return
        val fireResult = before.fireState?.let { fireDrill.step(it, text, intent) }
        val v3Result = before.scenarioStateV3?.let { scenarioRuntimesV3[scenario.id]?.step(it, text, intent) }
        _uiState.update { it.copy(isGenerating = false, onlineLocalOnly = true, onlineError = "", onlinePreview = "",
            onlineFallbackReason = reason, connectionNotice = connectionNotice(reason),
            onlineStatus = if (reason == "CLIENT_SYNC") "GPT 線上教練" else "目前使用離線判讀",
            onlineRevision = if (intent in setOf("observe", "hint")) it.onlineRevision else it.onlineRevision + 1) }
        if (fireResult != null) sendFireInteraction(text, intent, fireResult)
        if (v3Result != null && intent != "hint") {
            updateLocalRound(before, v3Result, text, null, hintIndex, edited)
            sendScenarioV3Interaction(text, intent, v3Result)
        }
        if (intent == "hint" && trigger != null) showLocalHints(trigger)
    }
    private var persistenceJob: Job? = null
    private val finishedSessions = mutableSetOf<String>()

    // Serialize Room writes: messages/finish must never overtake the session insert.
    private fun persist(block: suspend () -> Unit) {
        val previous = persistenceJob
        persistenceJob = viewModelScope.launch { previous?.join(); block() }
    }

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

    suspend fun savedMessages(id: String) = historyRepository.messagesForSession(id)
    fun exportResearch(id: String, to: android.net.Uri, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            val data = historyRepository.exportResearch(id)
            val success = kotlinx.coroutines.withContext(Dispatchers.IO) {
                runCatching { checkNotNull(getApplication<Application>().contentResolver.openOutputStream(to)).bufferedWriter().use { it.write(data) } }.isSuccess
            }
            onComplete(success)
        }
    }

    private fun storeResearch(sessionId: String, ordinal: Int, json: String) {
        persist { historyRepository.appendResearchTurn(sessionId, ordinal, json) }
    }

    private fun connectionNotice(reason: String, recovered: Boolean = false): String = when {
        reason == "TURN_TIMEOUT" || reason == "MODEL_TIMEOUT" -> "這回合連線逾時，暫時改用離線判讀。"
        reason == "CLIENT_TRANSPORT" -> "這回合連線中斷或逾時，暫時改用離線判讀。"
        reason in setOf("CLIENT_API_ERROR", "PROVIDER_ERROR", "MODEL_UNAVAILABLE", "MODEL_INCOMPLETE") -> "線上服務這回合未完成請求，暫時改用離線判讀。"
        recovered -> "已恢復線上判讀。"
        else -> ""
    }
    fun scenarioRuntimeV3(id: String): ScenarioRuntimeV3? = scenarioRuntimesV3[id]

    fun startScenario(requestedScenario: DrillScenario) {
        onlineJob?.cancel(); remoteSession = null; pendingOnline = null; offlineTurns.clear()
        val scenario = scenarioRuntimesV3[requestedScenario.id]?.scenario() ?: requestedScenario
        countdownJob?.cancel()
        val sessionId = UUID.randomUUID().toString()
        val fireState: FireState? = null
        val scenarioStateV3 = scenarioRuntimesV3[scenario.id]?.create(firstAidEnabled = true)
        val opening = ChatMessage(role = ChatRole.ASSISTANT, content = scenario.openingLine +
            when {
                fireState != null -> "\n劇本 v${fireState.version} · 學習模式 · 不限時"
                scenarioStateV3 != null -> "\n劇本 v${scenarioStateV3.version} · 因果情境模式 · 不限時\n完成演練不等於一定逃生或獲救。"
                else -> ""
            })
        val initialStep = DrillStepState(totalSteps = scenario.steps.size.takeIf { it > 0 } ?: DrillStepState().totalSteps)
        _uiState.value = PocketKbUiState(
            selectedTab = AppTab.DRILL,
            selectedScenario = scenario,
            selectedCategory = scenario.category,
            messages = listOf(opening),
            drillStep = initialStep,
            activeSessionId = sessionId,
            modelStatus = _uiState.value.modelStatus,
            onlineEnabled = _uiState.value.onlineEnabled && (fireState != null || scenarioStateV3 != null),
            onlineStatus = _uiState.value.onlineStatus,
            fireState = fireState,
            scenarioStateV3 = scenarioStateV3,
        )
        persist {
            historyRepository.startSession(
                id = sessionId,
                scenarioId = scenario.id,
                scenarioTitle = scenario.title,
                category = scenario.category.label,
                totalSteps = initialStep.totalSteps,
            )
            historyRepository.appendMessage(sessionId, opening)
        }
        startDecisionTimer()
    }

    fun stopScenario() {
        onlineJob?.cancel(); remoteSession = null; pendingOnline = null; offlineTurns.clear()
        val state = _uiState.value
        countdownJob?.cancel()
        val sessionId = state.activeSessionId
        if (sessionId != null && state.selectedScenario != null && finishedSessions.add(sessionId)) {
            persist {
                if (state.decisionLog.isNotEmpty()) historyRepository.appendMessage(sessionId, ChatMessage(role = ChatRole.SYSTEM, content = state.decisionLog.joinToString("\n")))
                state.fireState?.let { historyRepository.appendMessage(sessionId, ChatMessage(role = ChatRole.SYSTEM, content = fireDrill.review(it))) }
                state.scenarioStateV3?.let { scenarioRuntimesV3[state.selectedScenario.id]?.review(it) }
                    ?.let { historyRepository.appendMessage(sessionId, ChatMessage(role = ChatRole.SYSTEM, content = it)) }
                historyRepository.finishSession(
                    sessionId = sessionId,
                    finalStep = state.fireState?.completed?.size
                        ?: state.scenarioStateV3?.let { scenarioRuntimesV3[state.selectedScenario.id]?.nodeIndex(it)?.plus(1) }
                        ?: state.drillStep.currentStep,
                    totalSteps = state.drillStep.totalSteps,
                    finalSafety = state.drillStep.safetyLevel,
                    outcome = if (state.scenarioStateV3?.sessionStatus == "ACTIVE" || state.drillStep.outcome == DrillOutcome.CONTINUE) DrillOutcome.EXITED else state.drillStep.outcome,
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
                fireState = null,
                scenarioStateV3 = null,
                scenarioReviewV3 = null,
            )
        }
    }

    fun sendUserAction(text: String) {
        val trimmed = text.trim()
        val scenario = _uiState.value.selectedScenario ?: return
        if (trimmed.isEmpty() || _uiState.value.isGenerating || _uiState.value.drillStep.outcome != DrillOutcome.CONTINUE) return
        if (_uiState.value.fireState != null) { sendFireInteraction(trimmed); return }
        if (_uiState.value.scenarioStateV3 != null) { sendScenarioV3Interaction(trimmed); return }
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

    fun sendFireInteraction(text: String = "", intent: String = "action", onlineResult: FireResult? = null) {
        val before = _uiState.value
        val fire = before.fireState ?: return
        if (fire.outcome != DrillOutcome.CONTINUE || before.isGenerating) return
        if (before.onlineEnabled && onlineResult == null) { sendOnlineInteraction(text, intent); return }
        val result = onlineResult ?: fireDrill.step(fire, text, intent)
        val title = when (intent) { "observe" -> "觀察環境"; "hint" -> "查看提示"; "question" -> "詢問"; else -> "採取行動" }
        val user = ChatMessage(role = ChatRole.USER, content = "$title：${text.ifBlank { title }}")
        val next = if (result.delta > 0 && result.state.outcome == DrillOutcome.CONTINUE)
            "\n接下來：${fireDrill.nodes[result.state.node].getString("situation")}" else ""
        val reply = ChatMessage(role = ChatRole.ASSISTANT, content = (result.effects + result.message).joinToString("\n") + next, judgeMetadata = result.judge())
        val terminal = result.state.outcome != DrillOutcome.CONTINUE
        val report = if (terminal) fireDrill.review(result.state) else ""
        val extra = if (terminal) listOf(ChatMessage(role = ChatRole.SYSTEM, content = report)) else emptyList()
        _uiState.update { it.copy(fireState = result.state,
            drillStep = it.drillStep.copy(currentStep = result.state.node + 1, outcome = result.state.outcome, safetyLevel = result.judge().safety),
            messages = it.messages + user + reply + extra, lastReport = report) }
        persistMessages(user, reply, *extra.toTypedArray())
        if (terminal) finishActiveSession()
    }

    fun sendScenarioV3Interaction(text: String = "", intent: String = "action", onlineResult: ScenarioResultV3? = null) {
        val before = _uiState.value
        val scenario = before.selectedScenario ?: return
        val previous = before.scenarioStateV3 ?: return
        val runtime = scenarioRuntimesV3[scenario.id] ?: return
        if (previous.sessionStatus != "ACTIVE" || before.isGenerating) return
        if (before.onlineEnabled && onlineResult == null) { sendOnlineInteraction(text, intent); return }
        val result = onlineResult ?: runtime.step(previous, text, intent)
        val interactionLabel = when (intent) {
            "observe" -> "觀察環境"
            "question" -> "詢問"
            else -> "採取行動"
        }
        val user = ChatMessage(
            role = ChatRole.USER,
            content = "$interactionLabel：${text.ifBlank { interactionLabel }}",
        )
        val terminal = result.state.sessionStatus != "ACTIVE"
        val outcome = when {
            result.state.sessionStatus == "FAILED" -> DrillOutcome.FAILED
            result.state.physicalStatus == "EVACUATED" -> DrillOutcome.EVACUATED
            terminal && result.state.endingType in setOf("SAFE_RESCUE", "DELAYED_RESCUE") -> DrillOutcome.RESCUED
            result.state.physicalStatus == "WAITING_RESCUE" -> DrillOutcome.WAITING_RESCUE
            result.state.physicalStatus == "RESCUED" -> DrillOutcome.RESCUED
            result.state.physicalStatus == "SHELTERED" && terminal -> DrillOutcome.SHELTERED
            else -> DrillOutcome.CONTINUE
        }
        val safety = when {
            outcome == DrillOutcome.FAILED -> com.pocketkb.android.core.SafetyLevel.FAILED
            result.kind == "risk" || result.kind == "blocked" -> com.pocketkb.android.core.SafetyLevel.LOW
            terminal -> com.pocketkb.android.core.SafetyLevel.HIGH
            else -> com.pocketkb.android.core.SafetyLevel.MEDIUM
        }
        val metadata = com.pocketkb.android.core.DrillJudgeResult(
            safety = safety,
            progressDelta = runtime.nodeIndex(result.state) - runtime.nodeIndex(previous),
            outcome = outcome,
            reason = result.message,
            shouldAskAgain = result.kind in setOf("clarify", "question", "blocked"),
        )
        val environment = if (!terminal && result.state.node != previous.node) {
            "\n\n現場變化：${runtime.currentSituation(result.state)}\n現在要決定：${runtime.currentTask(result.state)}"
        } else ""
        val assistant = ChatMessage(
            role = ChatRole.ASSISTANT,
            content = result.message + environment,
            judgeMetadata = metadata,
        )
        val structuredReview = if (terminal) runtime.reviewData(result.state) else null
        val report = structuredReview?.let { runtime.review(result.state) }.orEmpty()
        val reviewMessage = if (terminal) listOf(ChatMessage(role = ChatRole.SYSTEM, content = report)) else emptyList()
        _uiState.update {
            it.copy(
                scenarioStateV3 = result.state,
                scenarioReviewV3 = structuredReview,
                messages = it.messages + user + assistant + reviewMessage,
                drillStep = it.drillStep.copy(
                    currentStep = runtime.nodeIndex(result.state) + 1,
                    totalSteps = scenario.steps.size,
                    outcome = outcome,
                    safetyLevel = safety,
                ),
                lastReport = report,
            )
        }
        persistMessages(user, assistant, *reviewMessage.toTypedArray())
        if (terminal) finishActiveSession()
    }

    fun submitPractice(text: String, hintIndex: Int?, edited: Boolean) {
        val before = _uiState.value
        if (text.isBlank() || before.isGenerating || before.scenarioStateV3?.sessionStatus != "ACTIVE") return
        if (before.onlineEnabled) {
            sendOnlineInteraction(text.trim(), "action", hintIndex = hintIndex, edited = edited)
            return
        }
        val result = scenarioRuntimesV3[before.scenarioStateV3.scenarioId]?.step(before.scenarioStateV3, text.trim()) ?: return
        _uiState.update { it.copy(onlineRevision = it.onlineRevision + 1) }
        updateLocalRound(before, result, text.trim(), null, hintIndex, edited)
        sendScenarioV3Interaction(text.trim(), onlineResult = result)
    }

    fun requestPracticeHints(trigger: String) {
        val state = _uiState.value
        if (state.isGenerating || state.hintOptions.isNotEmpty() || state.scenarioStateV3?.sessionStatus != "ACTIVE") return
        if (state.onlineEnabled && !state.onlineLocalOnly) sendOnlineInteraction("", "hint", trigger)
        else showLocalHints(trigger)
    }

    private fun showLocalHints(trigger: String) {
        val current = _uiState.value
        val session = current.scenarioStateV3 ?: return
        val options = scenarioRuntimesV3[session.scenarioId]?.practiceSuggestions(session).orEmpty().shuffled()
        val row = localResearch(current, ScenarioResultV3(session, "hint", ""), "hint", trigger, null, false)
        current.activeSessionId?.let { storeResearch(it, current.decisionLog.size + 1, row) }
        _uiState.update { it.copy(hintOptions = options, hintTrigger = trigger, hintShownTurn = it.onlineRevision + 1,
            decisionLog = it.decisionLog + row) }
    }

    private fun updateLocalRound(before: PocketKbUiState, result: ScenarioResultV3, text: String, trigger: String?, hintIndex: Int?, edited: Boolean) {
        val reset = before.scenarioStateV3?.node != result.state.node || result.state.sessionStatus != "ACTIVE"
        val streak = when {
            reset -> 0
            result.kind == "clarify" -> before.invalidStreak + 1
            result.kind == "question" -> before.invalidStreak
            else -> 0
        }
        val row = localResearch(before, result, "action", trigger, hintIndex, edited, text)
        before.activeSessionId?.let { storeResearch(it, before.decisionLog.size + 1, row) }
        val sources = scenarioRuntimesV3[result.state.scenarioId]?.spec?.objects("sources").orEmpty()
            .filter { it.optString("id") in result.sourceIds }.map { it.optString("title") }
        _uiState.update { it.copy(roundNarration = result.message, roundSources = sources, invalidStreak = streak,
            hintOptions = if (reset) emptyList() else before.hintOptions, hintTrigger = if (reset) null else before.hintTrigger,
            hintShownTurn = if (reset) null else before.hintShownTurn,
            decisionLog = it.decisionLog + row) }
        if (streak >= 2 && _uiState.value.hintOptions.isEmpty()) showLocalHints("invalid_streak")
    }

    private fun localResearch(before: PocketKbUiState, result: ScenarioResultV3, intent: String, trigger: String?, hintIndex: Int?, edited: Boolean, text: String = ""): String {
        val state = result.state
        val runtime = scenarioRuntimesV3[state.scenarioId]
        val events = state.events.drop(before.scenarioStateV3?.events?.size ?: 0)
        val ids = events.filter { it.kind in setOf("action", "blocked", "hazard") }.mapNotNull { it.action }.distinct()
        val sourceIds = (runtime?.spec?.objects("actions").orEmpty().filter { it.optString("id") in ids } +
            runtime?.spec?.objects("deterioration").orEmpty().filter { item -> events.any { it.eventId == item.optString("id") } })
            .flatMap { it.strings("sourceIds") }.plus(result.sourceIds).distinct()
        val json = JSONObject().put("schema", "2.2").put("sessionId", before.activeSessionId)
            .put("scenarioId", state.scenarioId).put("version", state.version).put("recordedAt", java.time.Instant.now().toString())
            .put("turn", before.decisionLog.size + 1).put("intent", intent).put("source", "rule").put("kind", result.kind)
            .put("inputLength", text.codePointCount(0, text.length)).put("elapsedMs", JSONObject.NULL)
            .put("validation", "RULE_ONLY").put("narration", "template").put("controlInput", "[redacted]")
            .put("actionIds", org.json.JSONArray(ids)).put("source_ids", org.json.JSONArray(sourceIds))
            .put("actionBatches", org.json.JSONArray(if (ids.isEmpty()) emptyList() else listOf(JSONObject().put("ids", org.json.JSONArray(ids)).put("source", "rule"))))
            .put("actionValidation", org.json.JSONArray()).put("narration_checks", org.json.JSONArray()).put("disagreement", JSONObject.NULL)
            .put("question_answer_id", result.answerId ?: JSONObject.NULL).put("emotion", state.npc?.emotion?.takeIf { it != before.scenarioStateV3?.npc?.emotion }
                ?.let { JSONObject().put("category", it).put("source", "rule").put("evidence", "[redacted]") } ?: JSONObject.NULL)
            .put("fallbackReason", _uiState.value.onlineFallbackReason ?: JSONObject.NULL).put("narrationFallbackReason", JSONObject.NULL)
            .put("hint_shown", before.hintOptions.isNotEmpty()).put("hint_seen_before_submit", before.hintOptions.isNotEmpty())
            .put("hint_shown_turn", before.hintShownTurn ?: JSONObject.NULL).put("hint_trigger", before.hintTrigger ?: trigger ?: JSONObject.NULL)
            .put("hint_selected_index", hintIndex ?: JSONObject.NULL).put("hint_edited_before_submit", edited)
            .put("hint_exposure", if (intent == "hint") JSONObject().put("trigger", trigger) else JSONObject.NULL)
            .put("exposure", JSONObject(state.exposure)).put("ending_type", state.endingType ?: JSONObject.NULL).put("injury_level", state.injuryLevel ?: JSONObject.NULL)
            .put("injury_causes", org.json.JSONArray(state.injuryCauses.map { JSONObject().put("node", it.node).put("action", it.action)
                .put("eventId", it.eventId).put("exposure", it.exposure).put("delta", it.delta).put("turn", it.turn) }))
        return json.toString()
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
        if (_uiState.value.fireState != null || _uiState.value.scenarioStateV3 != null) return // Learning mode has no deadline.
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
        persist {
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
        if (!finishedSessions.add(sessionId)) return
        persist {
            if (state.decisionLog.isNotEmpty()) historyRepository.appendMessage(sessionId, ChatMessage(role = ChatRole.SYSTEM, content = state.decisionLog.joinToString("\n")))
            historyRepository.finishSession(
                sessionId = sessionId,
                finalStep = state.fireState?.completed?.size
                    ?: state.scenarioStateV3?.let { v3State ->
                        state.selectedScenario?.id?.let { id -> scenarioRuntimesV3[id]?.nodeIndex(v3State)?.plus(1) }
                    }
                    ?: state.drillStep.currentStep,
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
            DrillOutcome.EVACUATED -> "已完成撤離"
            DrillOutcome.WAITING_RESCUE -> "穩定待救（尚未獲救）"
            DrillOutcome.SHELTERED -> "已完成就地掩蔽"
            DrillOutcome.RESCUED -> "已由救援人員接觸"
            DrillOutcome.FAILED -> "演練失敗"
            DrillOutcome.TIMEOUT -> "逾時中止"
            DrillOutcome.EXITED -> "已退出"
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






