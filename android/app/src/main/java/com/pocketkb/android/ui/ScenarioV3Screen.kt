package com.pocketkb.android.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.AlertDialog
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.HourglassBottom
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.withFrameNanos
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.testTag
import com.pocketkb.android.PocketKbUiState
import com.pocketkb.android.BuildConfig
import com.pocketkb.android.PocketKbViewModel
import com.pocketkb.android.core.ChatRole
import com.pocketkb.android.core.ChatMessage
import com.pocketkb.android.core.ScenarioReviewV3
import com.pocketkb.android.core.ScenarioReviewTimelineItemV3
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.currentStateAsState
import kotlinx.coroutines.delay

internal data class ScenarioSourceUiModel(
    val agency: String,
    val title: String,
    val url: String,
)

internal data class ScenarioV3UiModel(
    val sessionId: String?,
    val scenarioTitle: String,
    val version: String,
    val physicalStatus: String,
    val active: Boolean,
    val isGenerating: Boolean = false,
    val onlineEnabled: Boolean = false,
    val onlineRevision: Int = 0,
    val onlineStatus: String = "",
    val onlineError: String = "",
    val progress: Float,
    val situation: String,
    val task: String,
    val resources: Map<String, Int>,
    val messages: List<ChatMessage>,
    val suggestedActions: List<String>,
    val notice: String,
    val sources: List<ScenarioSourceUiModel>,
    val review: ScenarioReviewV3?,
    val narration: String = "",
    val preview: String = "",
    val observation: String = "",
    val status: List<String> = emptyList(),
    val hintOptions: List<String> = emptyList(),
    val endingType: String? = null,
    val endingText: String = "",
    val injury: String? = null,
    val keyDecisions: List<String> = emptyList(),
    val causes: List<String> = emptyList(),
    val roundSources: List<String> = emptyList(),
    val roundStartedAt: Long = 0,
)

@Composable
fun ScenarioV3Screen(state: PocketKbUiState, actions: PocketKbViewModel, onLeave: () -> Unit) {
    val scenario = state.selectedScenario ?: return
    val session = state.scenarioStateV3 ?: return
    val runtime = actions.scenarioRuntimeV3(scenario.id) ?: return
    val uri = LocalUriHandler.current
    val changed = session.events.any { it.eventId?.startsWith("elapsed-") == true }
    val status = buildList {
        when (session.scenarioId) {
            "drill_fire_dorm" -> add(if (changed) "警示：走廊煙變濃" else "警示：走廊有濃煙")
            "earthquake_school" -> if (session.node == "shaking") add("警示：主要搖晃尚未停止")
            "flood_low_home" -> if (changed) add("警示：外部積水上升")
            "landslide_mountain_road" -> add("警示：前方道路封閉")
            "barrier_lake_downstream" -> add(if (session.node == "cutoff") "警示：原撤離路線中斷" else "撤離窗口仍開放")
            "earthquake_home_trapped" -> if (session.node == "contact") add("手機電量 ${session.resources["battery"]}%")
        }
        session.npc?.proposal?.let { add("${runtime.spec.getJSONObject("npc").getString("name")}：$it") }
    }
    val endingType = when (session.endingType) {
        "CRITICAL_FAILURE" -> "危急失敗"
        "SELF_EVACUATION" -> "自行撤離"
        "SAFE_RESCUE" -> "安全待救獲救"
        "DELAYED_RESCUE" -> "延誤後獲救"
        else -> null
    }
    val injury = when (session.injuryLevel) {
        "NOT_ASSESSED" -> "傷勢不評定"
        "NONE" -> "無傷"
        "MILD" -> "輕傷"
        "MODERATE" -> "中度傷勢（需送醫）"
        "SEVERE" -> "重傷（需住院治療）"
        "BASELINE" -> "傷勢未加重"
        else -> session.injuryLevel
    }
    val sourceModels = buildList {
        runtime.spec.optJSONArray("sources")?.let { sources ->
            for (index in 0 until sources.length()) {
                val source = sources.getJSONObject(index)
                add(
                    ScenarioSourceUiModel(
                        agency = source.getString("agency"),
                        title = source.getString("title"),
                        url = source.getString("url"),
                    ),
                )
            }
        }
    }
    ScenarioV3Content(
        model = ScenarioV3UiModel(
            sessionId = state.activeSessionId,
            scenarioTitle = scenario.title,
            version = session.version,
            physicalStatus = session.physicalStatus,
            active = session.sessionStatus == "ACTIVE",
            isGenerating = state.isGenerating,
            onlineEnabled = state.onlineEnabled,
            onlineRevision = state.onlineRevision,
            onlineStatus = state.onlineStatus,
            onlineError = state.onlineError,
            progress = (runtime.nodeIndex(session) + if (session.sessionStatus == "ACTIVE") 0f else 1f) /
                scenario.steps.size.coerceAtLeast(1),
            situation = runtime.currentSituation(session) + if (state.onlineRevision == 0 && state.onlineEnabled) " " +
                runtime.spec.optJSONObject("npc")?.optJSONObject("online")?.optString("proposal").orEmpty() else "",
            task = runtime.currentTask(session),
            resources = session.resources,
            messages = state.messages,
            suggestedActions = runtime.suggestedActions(session),
            notice = runtime.spec.getString("notice"),
            sources = sourceModels,
            review = state.scenarioReviewV3,
            narration = state.roundNarration,
            preview = state.onlinePreview,
            observation = runtime.practiceObservation(session),
            status = status,
            hintOptions = state.hintOptions,
            endingType = endingType,
            injury = injury,
            endingText = runtime.spec.optJSONObject("endingMessages")?.optJSONObject(session.endingType ?: "")
                ?.optString(session.injuryLevel ?: "").orEmpty().ifBlank { state.roundNarration },
            keyDecisions = (state.scenarioReviewV3?.hazardActions.orEmpty() +
                session.injuryCauses.map { runtime.practiceActionLabel(it.action) } + state.scenarioReviewV3?.completedActions.orEmpty().asReversed()).distinct(),
            causes = session.injuryCauses.map { "第 ${it.turn} 個決策 · ${runtime.practiceActionLabel(it.action)}" },
            roundSources = state.roundSources,
            roundStartedAt = state.roundStartedAt,
        ),
        onLeave = onLeave,
        onObserve = {},
        onSubmit = { text, intent -> actions.sendScenarioV3Interaction(text, intent) },
        onRestart = { actions.startScenario(scenario) },
        onOpenSource = uri::openUri,
        onHint = actions::requestPracticeHints,
        onPracticeSubmit = actions::submitPractice,
    )
}

@Composable
internal fun ScenarioV3Content(
    model: ScenarioV3UiModel,
    onLeave: () -> Unit,
    onObserve: () -> Unit,
    onSubmit: (String, String) -> Unit,
    onRestart: () -> Unit,
    onOpenSource: (String) -> Unit,
    modifier: Modifier = Modifier,
    onHint: (String) -> Unit = {},
    onPracticeSubmit: ((String, Int?, Boolean) -> Unit)? = null,
) {
    var input by rememberSaveable(model.sessionId) { mutableStateOf("") }
    var showObservation by rememberSaveable(model.sessionId, model.task) { mutableStateOf(false) }
    var showSources by rememberSaveable(model.sessionId) { mutableStateOf(false) }
    var hintIndex by rememberSaveable(model.sessionId, model.task) { mutableStateOf<Int?>(null) }
    var edited by rememberSaveable(model.sessionId, model.task) { mutableStateOf(false) }
    var confirmRestart by rememberSaveable(model.sessionId) { mutableStateOf(false) }
    val focus = LocalFocusManager.current
    val loggedFirst = remember(model.sessionId,model.roundStartedAt) { mutableStateOf(false) }
    LaunchedEffect(model.roundStartedAt,model.isGenerating,model.preview.isNotBlank()) {
        if (!BuildConfig.DEBUG || model.roundStartedAt==0L || model.isGenerating && model.preview.isBlank()) return@LaunchedEffect
        withFrameNanos { }
        val time = android.os.SystemClock.elapsedRealtime() - model.roundStartedAt
        if (!loggedFirst.value) {
            loggedFirst.value = true
            android.util.Log.i("Step23Display", "round=${model.roundStartedAt} first=$time")
        }
        if (!model.isGenerating) android.util.Log.i("Step23Display", "round=${model.roundStartedAt} complete=$time")
    }
    val life by LocalLifecycleOwner.current.lifecycle.currentStateAsState()
    val foreground = life.isAtLeast(Lifecycle.State.RESUMED)
    val remaining = rememberSaveable(model.sessionId, model.task, model.onlineRevision) { mutableLongStateOf(45_000L) }
    val requestHint by rememberUpdatedState(onHint)
    LaunchedEffect(model.sessionId, model.onlineRevision) {
        if (model.onlineRevision > 0) {
            input = ""
            hintIndex = null
            edited = false
            showObservation = false
        }
    }
    LaunchedEffect(remaining, foreground, model.active, model.isGenerating, model.hintOptions.isEmpty()) {
        if (!foreground || !model.active || model.isGenerating || model.hintOptions.isNotEmpty()) return@LaunchedEffect
        val started = android.os.SystemClock.elapsedRealtime()
        try {
            delay(remaining.longValue)
            requestHint("idle")
        } finally {
            remaining.longValue = (remaining.longValue - (android.os.SystemClock.elapsedRealtime() - started)).coerceAtLeast(0L)
        }
    }

    Column(
        modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(model.scenarioTitle, Modifier.weight(1f).semantics { heading() }, style = MaterialTheme.typography.titleLarge)
            TextButton(onClick = onLeave, modifier = Modifier.heightIn(min = 48.dp).testTag("scenario_stop")) {
                Text(if (model.active) "停止演練" else "返回")
            }
        }
        if (model.onlineStatus == "目前使用離線判讀") Text(model.onlineStatus, color = PocketColors.SafetyOrange)
        if (model.onlineError.isNotBlank()) Text(model.onlineError, color = PocketColors.EmergencyRed)

        if (model.active) {
            Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("現在發生什麼", Modifier.semantics { heading() }, color = PocketColors.SafetyOrange)
                    val narration = model.preview.ifBlank { model.narration.ifBlank { model.situation } }
                    Text(sceneWords(narration), Modifier.testTag("scenario_narration").semantics {
                        if (!model.isGenerating) liveRegion = LiveRegionMode.Polite
                    }, style = MaterialTheme.typography.bodyLarge)
                    model.status.take(2).forEach { label -> Text(label, color = PocketColors.Info, style = MaterialTheme.typography.bodyMedium) }
                    Text("我面臨什麼決定", Modifier.semantics { heading() }, fontWeight = FontWeight.Bold)
                    Text(model.task, style = MaterialTheme.typography.bodyLarge)
                }
            }
            OutlinedTextField(value = input, onValueChange = { value -> input = value; if (hintIndex != null) edited = true },
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("scenario_input"),
                maxLines = 3, enabled = !model.isGenerating, label = { Text("你的行動或問題") })
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { showObservation = !showObservation; onObserve() }, enabled = !model.isGenerating,
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("scenario_observe")) { Text("看看四周") }
                OutlinedButton(onClick = { requestHint("button") }, enabled = !model.isGenerating,
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("scenario_hints")) { Text("我想不到怎麼做") }
            }
            Button(
                onClick = {
                    focus.clearFocus()
                    if (onPracticeSubmit != null) onPracticeSubmit(input, hintIndex, edited)
                    else { onSubmit(input, "action"); if (!model.onlineEnabled) input = "" }
                },
                enabled = input.isNotBlank() && !model.isGenerating,
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("scenario_submit"),
            ) { Text(if (model.isGenerating) "正在處理這次決定" else "送出") }
            if (showObservation) Text(sceneWords(model.observation.ifBlank { model.situation }), style = MaterialTheme.typography.bodyLarge)
            if (model.hintOptions.isNotEmpty()) {
                Text("可以試著這樣說", Modifier.semantics { heading() })
                model.hintOptions.forEachIndexed { index, suggestion ->
                    OutlinedButton(onClick = { input = suggestion; hintIndex = index; edited = false }, enabled = !model.isGenerating,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("scenario_hint_$index")) { Text(suggestion) }
                }
            }
        } else {
            Card(Modifier.fillMaxWidth().testTag("scenario_review"), colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    val outcome = model.endingType ?: model.review?.outcomeTitle ?: "情境結束"
                    Text(outcome, Modifier.testTag("scenario_review_outcome").semantics { heading() }, style = MaterialTheme.typography.headlineSmall)
                    model.injury?.let { Text(it, color = PocketColors.SafetyOrange, fontWeight = FontWeight.Bold) }
                    val ending = model.endingText.ifBlank {
                        if (model.physicalStatus == "WAITING_RESCUE") "目前沒有安全逃生路線；已降低暴露並保存資源，但仍未獲救。"
                        else model.review?.outcomeExplanation.orEmpty()
                    }
                    Text(sceneWords(ending), style = MaterialTheme.typography.bodyLarge)
                    Text("簡單回顧", Modifier.semantics { heading() }, style = MaterialTheme.typography.titleMedium)
                    Text("結果：$outcome" + (model.injury?.let { " · $it" } ?: ""))
                    if (model.keyDecisions.isNotEmpty()) {
                        Text("關鍵決策", fontWeight = FontWeight.Bold)
                        model.keyDecisions.take(3).forEach { Text(it) }
                    }
                    if (model.causes.isNotEmpty()) {
                        Text("造成傷勢的步驟", fontWeight = FontWeight.Bold)
                        model.causes.forEach { Text(it) }
                    }
                }
            }
            Button(onClick = { confirmRestart = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("scenario_review_restart")) {
                Text("另開一次練習")
            }
        }
        if (model.roundSources.isNotEmpty()) Text("本回合來源：" + model.roundSources.joinToString("、"), color = PocketColors.Info)
        if (model.sources.isNotEmpty()) {
            TextButton(onClick = { showSources = !showSources }, modifier = Modifier.heightIn(min = 48.dp)) {
                Text(if (showSources) "收合參考來源" else "查看參考來源")
            }
            if (showSources) model.sources.forEach { source ->
                TextButton(onClick = { onOpenSource(source.url) }, modifier = Modifier.heightIn(min = 48.dp)) { Text(source.title) }
            }
        }
    }
    if (confirmRestart) AlertDialog(onDismissRequest = { confirmRestart = false },
        title = { Text("開始下一次練習") },
        text = { Text("演練中可能出現受傷的結果，你可以隨時停止。") },
        confirmButton = { TextButton(onClick = { confirmRestart = false; onRestart() }) { Text("開始") } },
        dismissButton = { TextButton(onClick = { confirmRestart = false }) { Text("取消") } })
}

private fun sceneWords(text: String): String = text.replace("模擬119", "119").replace("演練", "").replace("模擬", "")

@Preview(name = "情境進行中", widthDp = 375, heightDp = 812, showBackground = true)
@Composable
private fun ScenarioV3ActivePreview() {
    PocketKbTheme {
        ScenarioV3Content(
            model = previewScenarioModel(active = true),
            onLeave = {},
            onObserve = {},
            onSubmit = { _, _ -> },
            onRestart = {},
            onOpenSource = {},
        )
    }
}

@Preview(name = "穩定待救回顧", widthDp = 375, heightDp = 812, showBackground = true)
@Composable
private fun ScenarioV3WaitingReviewPreview() {
    PocketKbTheme {
        ScenarioV3Content(
            model = previewScenarioModel(active = false),
            onLeave = {},
            onObserve = {},
            onSubmit = { _, _ -> },
            onRestart = {},
            onOpenSource = {},
        )
    }
}

private fun previewScenarioModel(active: Boolean): ScenarioV3UiModel {
    val resources = mapOf("battery" to 28, "water" to 1, "energy" to 62)
    val review = if (active) null else ScenarioReviewV3(
        version = "3.0.0",
        outcomeTitle = "穩定待救・尚未獲救",
        outcomeExplanation = "你已降低暴露並保存資源，但仍在災區，需要繼續等待專業救援。",
        learningObjectives = listOf("沒有安全出口時，不強行移動倒塌物"),
        completedActions = listOf("傳送位置與受困資訊", "控制飲水與體力消耗"),
        hazardActions = emptyList(),
        missingActions = emptyList(),
        resources = resources,
        commonMisconceptions = listOf("完成待救步驟不代表救援已抵達"),
        reflectionQuestions = listOf("哪些資源應優先保留給後續求救？"),
        timeline = emptyList(),
    )
    return ScenarioV3UiModel(
        sessionId = "preview",
        scenarioTitle = "地震後受困住家",
        version = "3.0.0",
        physicalStatus = if (active) "SHELTERED" else "WAITING_RESCUE",
        active = active,
        progress = if (active) 0.66f else 1f,
        situation = "出口仍被大型家具與碎石堵住，沒有安全自行逃離的方法。",
        task = "保存體力與物資，維持可被救援人員發現的訊號。",
        resources = resources,
        messages = emptyList(),
        suggestedActions = listOf("製造容易被救援人員辨識的訊號", "控制飲水與體力消耗"),
        notice = "這是教學模擬，完成演練不代表已獲救。",
        sources = emptyList(),
        review = review,
    )
}
