package com.pocketkb.android.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.testTag
import com.pocketkb.android.PocketKbUiState
import com.pocketkb.android.PocketKbViewModel
import com.pocketkb.android.core.ChatRole
import com.pocketkb.android.core.ChatMessage
import com.pocketkb.android.core.ScenarioReviewV3
import com.pocketkb.android.core.ScenarioReviewTimelineItemV3

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
)

@Composable
fun ScenarioV3Screen(state: PocketKbUiState, actions: PocketKbViewModel, onLeave: () -> Unit) {
    val scenario = state.selectedScenario ?: return
    val session = state.scenarioStateV3 ?: return
    val runtime = actions.scenarioRuntimeV3(scenario.id) ?: return
    val uri = LocalUriHandler.current
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
            situation = runtime.currentSituation(session),
            task = runtime.currentTask(session),
            resources = session.resources,
            messages = state.messages,
            suggestedActions = runtime.suggestedActions(session),
            notice = runtime.spec.getString("notice"),
            sources = sourceModels,
            review = state.scenarioReviewV3,
        ),
        onLeave = onLeave,
        onObserve = { actions.sendScenarioV3Interaction(intent = "observe") },
        onSubmit = { text, intent -> actions.sendScenarioV3Interaction(text, intent) },
        onRestart = { actions.startScenario(scenario) },
        onOpenSource = uri::openUri,
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
) {
    var input by rememberSaveable(model.sessionId) { mutableStateOf("") }
    var intent by rememberSaveable(model.sessionId) { mutableStateOf("action") }
    var showChoices by rememberSaveable(model.sessionId, model.task) { mutableStateOf(false) }
    var showSources by rememberSaveable(model.sessionId) { mutableStateOf(false) }
    LaunchedEffect(model.sessionId, model.onlineRevision) {
        if (model.onlineEnabled && model.onlineRevision > 0) input = ""
    }
    val scroll = rememberLazyListState()
    LaunchedEffect(model.messages.size) {
        if (model.messages.size > 1) scroll.animateScrollToItem((model.messages.size + 1).coerceAtMost(scroll.layoutInfo.totalItemsCount - 1).coerceAtLeast(0))
    }

    Column(modifier.fillMaxSize().imePadding()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            Text(model.scenarioTitle, Modifier.weight(1f).padding(top = 12.dp), fontWeight = FontWeight.Bold)
            TextButton(onClick = onLeave) { Text(if (model.active) "保存並離開" else "返回") }
        }
        LazyColumn(
            state = scroll,
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Text("${if (model.onlineEnabled) "GPT 線上演練" else "離線規則演練"} · 不限時 · v${model.version}", color = PocketColors.Info)
                LinearProgressIndicator(
                    progress = { model.progress },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
            }
            item { ScenarioStatusBanner(model.physicalStatus) }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("現場發生什麼", color = PocketColors.SafetyOrange)
                        Text(model.situation, lineHeight = 26.sp)
                        Text("目前要決定什麼", fontWeight = FontWeight.Bold)
                        Text(if (model.active) model.task else "本次已結束，請查看回顧。", lineHeight = 26.sp)
                        if (model.active) Text("你可以先觀察、提出問題，或描述一個具體行動。看不懂時不會直接判錯。", color = PocketColors.Info, lineHeight = 23.sp)
                        Text(
                            "資源：手機 ${model.resources["battery"] ?: 0}% · 飲水 ${model.resources["water"] ?: 0} · 體力 ${model.resources["energy"] ?: 0}%",
                            color = PocketColors.MidGray,
                        )
                    }
                }
            }
            items(model.messages, key = { it.id }) { message ->
                if (message.role != ChatRole.SYSTEM) {
                    Card(colors = CardDefaults.cardColors(containerColor = if (message.role == ChatRole.USER) PocketColors.MutedSurface else PocketColors.Surface)) {
                        Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(if (message.role == ChatRole.USER) "你的輸入" else "情境回饋", color = PocketColors.Info, fontSize = 14.sp)
                            Text(message.content, lineHeight = 26.sp)
                        }
                    }
                }
            }
            if (model.active) item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onObserve,
                        enabled = !model.isGenerating,
                        modifier = Modifier.fillMaxWidth().testTag("scenario_observe"),
                    ) { Text("觀察環境") }
                    TextButton(onClick = { showChoices = !showChoices }) { Text(if (showChoices) "收起行動選項" else "查看目前可能行動") }
                    if (showChoices) {
                        Text("選項中可能包含危險行動；點選只會填入，不會直接執行。", color = PocketColors.MidGray)
                        model.suggestedActions.forEach { choice ->
                            OutlinedButton(onClick = { input = choice; intent = "action" }, modifier = Modifier.fillMaxWidth()) { Text(choice) }
                        }
                    }
                }
            }
            if (!model.active) item {
                val review = model.review ?: return@item
                Column(
                    modifier = Modifier.fillMaxWidth().testTag("scenario_review"),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Card(colors = CardDefaults.cardColors(containerColor = PocketColors.MutedSurface)) {
                        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("演練已結束", color = PocketColors.Info, style = MaterialTheme.typography.labelLarge)
                            Text(
                                review.outcomeTitle,
                                color = outcomeColor(model.physicalStatus),
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .testTag("scenario_review_outcome")
                                    .semantics { heading() },
                            )
                            Text(review.outcomeExplanation, style = MaterialTheme.typography.bodyLarge, lineHeight = 26.sp)
                            Text("完成演練不一定代表已逃生或已獲救。", color = PocketColors.MidGray)
                        }
                    }

                    ReviewSectionCard("這次的學習目標", review.learningObjectives)

                    if (review.timeline.isNotEmpty()) {
                        ReviewTimelineCard(review.timeline)
                    }

                    ReviewSectionCard(
                        title = "做對的決策",
                        items = review.completedActions,
                        emptyMessage = "這一輪尚未完成核心安全行動。",
                        titleColor = PocketColors.SuccessGreen,
                    )

                    if (review.hazardActions.isNotEmpty()) {
                        ReviewSectionCard(
                            title = "需要注意的危險決策",
                            items = review.hazardActions,
                            titleColor = PocketColors.EmergencyRed,
                        )
                    }

                    ReviewSectionCard(
                        title = "下一次需要補強",
                        items = review.missingActions,
                        emptyMessage = "必要行動皆已完成。",
                        titleColor = PocketColors.SafetyOrange,
                    )

                    ReviewSectionCard("常見錯誤觀念", review.commonMisconceptions)
                    ReviewSectionCard("想一想", review.reflectionQuestions, titleColor = PocketColors.Info)

                    Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "結束時的資源",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.semantics { heading() },
                            )
                            Text(
                                "手機 ${review.resources["battery"] ?: 0}% · 飲水 ${review.resources["water"] ?: 0} · 體力 ${review.resources["energy"] ?: 0}%",
                                color = PocketColors.MidGray,
                            )
                        }
                    }

                    Button(
                        onClick = onRestart,
                        modifier = Modifier.fillMaxWidth().testTag("scenario_review_restart"),
                    ) { Text("重新練習並建立新紀錄") }
                    OutlinedButton(onClick = onLeave, modifier = Modifier.fillMaxWidth()) { Text("返回情境列表") }
                    Text(
                        "重新練習會建立新的演練紀錄，不會覆蓋這次結果。",
                        color = PocketColors.MidGray,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
            item {
                TextButton(onClick = { showSources = !showSources }) { Text("適用範圍與參考依據") }
                if (showSources) {
                    Text(model.notice, lineHeight = 25.sp)
                    model.sources.forEach { source ->
                        TextButton(onClick = { onOpenSource(source.url) }) {
                            Text("${source.agency}：${source.title}")
                        }
                    }
                }
            }
        }
        if (model.active) Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (model.onlineEnabled) Text(model.onlineStatus, color = PocketColors.Info)
            if (model.onlineError.isNotBlank()) Text(model.onlineError, color = PocketColors.EmergencyRed)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = intent == "action", onClick = { intent = "action" }, label = { Text("採取行動") })
                FilterChip(selected = intent == "question", onClick = { intent = "question" }, label = { Text("詢問") })
            }
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                modifier = Modifier.fillMaxWidth().testTag("scenario_input"),
                maxLines = 3,
                enabled = !model.isGenerating,
                label = { Text(if (intent == "action") "你的行動，可以分次回答" else "你想確認什麼？") },
            )
            Button(
                onClick = { onSubmit(input, intent); if (!model.onlineEnabled) input = "" },
                enabled = input.isNotBlank() && !model.isGenerating,
                modifier = Modifier.fillMaxWidth().testTag("scenario_submit"),
            ) { Text(if (model.isGenerating) "教練正在理解…" else if (model.onlineError.isNotBlank()) "重試原內容" else if (intent == "action") "確認行動" else "送出問題") }
        }
    }
}

@Composable
private fun ScenarioStatusBanner(
    physicalStatus: String,
    modifier: Modifier = Modifier,
) {
    val (icon, color) = when (physicalStatus) {
        "EVACUATED", "RESCUED" -> Icons.Default.CheckCircle to PocketColors.SuccessGreen
        "CRITICAL" -> Icons.Default.Error to PocketColors.EmergencyRed
        "WAITING_RESCUE" -> Icons.Default.HourglassBottom to PocketColors.AccentYellow
        "SHELTERED" -> Icons.Default.Shield to PocketColors.Info
        else -> Icons.Default.Warning to PocketColors.SafetyOrange
    }
    val description = when (physicalStatus) {
        "EVACUATED" -> "已抵達劇本指定的相對安全地點，仍需留意官方資訊。"
        "RESCUED" -> "劇本已明示救援人員接觸，才會顯示此狀態。"
        "WAITING_RESCUE" -> "目前沒有安全逃生路線；已降低暴露並保存資源，但仍未獲救。"
        "SHELTERED" -> "已完成暫時掩蔽，仍需等待官方後續指示。"
        "CRITICAL" -> "危險決策已使本次演練失敗，輸入已鎖定。"
        else -> "仍暴露於災害風險，請依現場資訊決定下一步。"
    }
    Card(
        modifier = modifier.fillMaxWidth().testTag("scenario_status"),
        colors = CardDefaults.cardColors(containerColor = PocketColors.MutedSurface),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(icon, contentDescription = null, tint = color)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(physicalStatusLabel(physicalStatus), color = color, fontWeight = FontWeight.Bold)
                Text(description, color = PocketColors.MidGray, lineHeight = 22.sp)
            }
        }
    }
}

@Composable
private fun ReviewSectionCard(
    title: String,
    items: List<String>,
    modifier: Modifier = Modifier,
    emptyMessage: String = "目前沒有紀錄。",
    titleColor: androidx.compose.ui.graphics.Color = androidx.compose.ui.graphics.Color.White,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = PocketColors.Surface),
    ) {
        Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(
                title,
                color = titleColor,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.semantics { heading() },
            )
            if (items.isEmpty()) {
                Text(emptyMessage, color = PocketColors.MidGray, style = MaterialTheme.typography.bodyLarge)
            } else {
                items.forEach { item -> Text("• $item", style = MaterialTheme.typography.bodyLarge, lineHeight = 26.sp) }
            }
        }
    }
}

@Composable
private fun ReviewTimelineCard(
    items: List<ScenarioReviewTimelineItemV3>,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = PocketColors.Surface),
    ) {
        Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                "你的行動時間軸",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.semantics { heading() },
            )
            items.forEachIndexed { index, item ->
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        "${index + 1}. ${item.title}",
                        color = if (item.title == "危險決策") PocketColors.EmergencyRed else PocketColors.Info,
                        style = MaterialTheme.typography.labelLarge,
                    )
                    Text(item.description, style = MaterialTheme.typography.bodyLarge, lineHeight = 26.sp)
                }
            }
        }
    }
}

private fun outcomeColor(physicalStatus: String) = when (physicalStatus) {
    "EVACUATED", "RESCUED" -> PocketColors.SuccessGreen
    "CRITICAL" -> PocketColors.EmergencyRed
    "WAITING_RESCUE", "SHELTERED" -> PocketColors.AccentYellow
    else -> PocketColors.Info
}

private fun physicalStatusLabel(value: String): String = when (value) {
    "EVACUATED" -> "已完成撤離"
    "WAITING_RESCUE" -> "穩定待救・尚未獲救"
    "RESCUED" -> "已由救援人員接觸"
    "SHELTERED" -> "暫時掩蔽"
    "CRITICAL" -> "危急失敗"
    else -> "仍暴露於災害風險"
}

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
