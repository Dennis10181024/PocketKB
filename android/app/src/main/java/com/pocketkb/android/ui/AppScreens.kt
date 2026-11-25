package com.pocketkb.android.ui

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pocketkb.android.PocketKbUiState
import com.pocketkb.android.PocketKbViewModel
import com.pocketkb.android.core.*
import com.pocketkb.android.data.DrillSessionEntity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val cardShape = RoundedCornerShape(24.dp)
private val professorDemoScenarioIds = listOf(
    "drill_fire_dorm",
    "earthquake_home_trapped",
    "barrier_lake_downstream",
)

@Composable
fun PocketKbRoot(state: PocketKbUiState, recentSessions: List<DrillSessionEntity>, actions: PocketKbViewModel) {
    var pendingTab by remember { mutableStateOf<AppTab?>(null) }
    var showLegacy by rememberSaveable { mutableStateOf(false) }
    val active = state.selectedScenario != null && state.drillStep.outcome == DrillOutcome.CONTINUE
    fun navigate(tab: AppTab) {
        if (active && tab != AppTab.DRILL) pendingTab = tab else actions.selectTab(tab)
    }
    BackHandler(state.selectedTab != AppTab.HOME || state.selectedScenario != null) {
        if (active) pendingTab = AppTab.DRILL
        else if (state.selectedScenario != null) actions.stopScenario()
        else actions.selectTab(AppTab.HOME)
    }
    if (pendingTab != null) AlertDialog(
        onDismissRequest = { pendingTab = null },
        title = { Text("結束這次演練？") },
        text = {
            Text(
                "對話會保存在此裝置。離開後，下次將重新開始情境。" +
                    if (state.fireState != null || state.scenarioStateV3 != null) "學習模式不限時。" else "舊版情境決策計時仍在進行。",
            )
        },
        confirmButton = { TextButton(onClick = {
            val target = pendingTab!!
            actions.stopScenario()
            actions.selectTab(target)
            pendingTab = null
        }) { Text("保存並離開") } },
        dismissButton = { TextButton(onClick = { pendingTab = null }) { Text("繼續演練") } },
    )
    Scaffold(
        containerColor = PocketColors.AppBg,
        bottomBar = {
            NavigationBar(containerColor = PocketColors.AppBg) {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = state.selectedTab == tab,
                        onClick = { navigate(tab) },
                        icon = { Icon(tabIcon(tab), null) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.TopCenter) {
            Box(Modifier.widthIn(max = 760.dp).fillMaxSize()) {
                when (state.selectedTab) {
                    AppTab.HOME -> HomeScreen(actions)
                    AppTab.DRILL -> when {
                        state.selectedScenario != null -> DrillChatScreen(state, actions) { if (active) pendingTab = AppTab.DRILL else actions.stopScenario() }
                        showLegacy -> ScenarioPickerScreen(state, actions) { showLegacy = false }
                        else -> ChoiceRoute(onLegacy = { showLegacy = true })
                    }
                    AppTab.EMERGENCY -> EmergencyScreen()
                    AppTab.RESOURCES -> ResourcesScreen()
                    AppTab.HISTORY -> HistoryScreen(recentSessions, actions)
                }
            }
        }
    }
}

@Composable
private fun PageHeading(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, fontSize = 28.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold)
        Text(subtitle, color = PocketColors.MidGray, fontSize = 16.sp, lineHeight = 25.sp)
    }
}

@Composable
private fun HomeScreen(actions: PocketKbViewModel) {
    LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(Icons.Default.Shield, null, tint = PocketColors.SafetyOrange, modifier = Modifier.size(36.dp))
                Column {
                    Text("口袋知識庫", fontWeight = FontWeight.Bold, fontSize = 24.sp)
                    Text("POCKETKB / 防災隨行", fontSize = 12.sp, letterSpacing = 2.sp, color = PocketColors.MidGray)
                }
            }
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("把準備，\n變成你的直覺。", fontSize = 36.sp, lineHeight = 48.sp, fontWeight = FontWeight.Bold)
                Text("平時練習做決定，需要時找到下一步。", color = PocketColors.MidGray, lineHeight = 26.sp)
            }
        }
        item {
            ActionCard(
                title = "開始情境演練",
                subtitle = "選擇題練習 · 無須網路",
                icon = Icons.Default.PlayArrow,
                onClick = { actions.selectCategory(null); actions.selectTab(AppTab.DRILL) },
                prominent = true,
            )
        }
        item {
            ActionCard(
                title = "我現在需要指引",
                subtitle = "直接查看應變步驟 · 無須網路",
                icon = Icons.Default.Report,
                onClick = { actions.selectTab(AppTab.EMERGENCY) },
            )
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Metric("${KnowledgeBase.chunks.size}", "則內建知識", Modifier.weight(1f))
                Metric("5", "大災種演練", Modifier.weight(1f))
            }
        }
        item {
            TextButton(onClick = { actions.selectTab(AppTab.RESOURCES) }) {
                Icon(Icons.Default.Search, null); Spacer(Modifier.width(8.dp)); Text("描述問題，尋找相關知識")
            }
            Text("演練、指南與紀錄皆可離線使用。目前回饋由內建規則提供，本機 AI 對話尚未啟用。", color = PocketColors.MidGray, fontSize = 14.sp, lineHeight = 23.sp)
        }
    }
}

@Composable
private fun ActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    prominent: Boolean = false,
) {
    val ink = if (prominent) PocketColors.AppBg else Color.White
    Card(onClick = onClick, modifier = modifier.fillMaxWidth(), shape = cardShape,
        colors = CardDefaults.cardColors(containerColor = if (prominent) PocketColors.SafetyOrange else PocketColors.Surface)) {
        Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Icon(icon, null, tint = ink, modifier = Modifier.size(28.dp))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = ink)
            }
            Text(title, color = ink, fontSize = 23.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = if (prominent) ink else PocketColors.MidGray, lineHeight = 24.sp)
        }
    }
}

@Composable
private fun Metric(value: String, label: String, modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(value, fontSize = 30.sp, fontWeight = FontWeight.Bold, color = PocketColors.Info)
        Text(label, color = PocketColors.MidGray, fontSize = 14.sp)
    }
}

@Composable
private fun ScenarioPickerScreen(state: PocketKbUiState, actions: PocketKbViewModel, onChoice: () -> Unit) {
    val orderedScenarios = remember(actions.scenarios) {
        actions.scenarios.sortedWith(
            compareBy<DrillScenario> {
                professorDemoScenarioIds.indexOf(it.id).takeIf { index -> index >= 0 } ?: Int.MAX_VALUE
            }.thenBy { it.category.ordinal }.thenBy { it.title },
        )
    }
    val categories = remember(actions.scenarios) { actions.scenarios.map { it.category }.distinct() }
    val filtered = remember(orderedScenarios, state.selectedCategory) {
        orderedScenarios.filter { state.selectedCategory == null || it.category == state.selectedCategory }
    }
    var candidate by remember { mutableStateOf<DrillScenario?>(null) }
    candidate?.let { scenario ->
        val runtimeV3 = actions.scenarioRuntimeV3(scenario.id)
        AlertDialog(onDismissRequest = { candidate = null },
            title = { Text(scenario.title) },
            text = { Text("${scenario.openingLine}\n\n" + when {
                runtimeV3 != null -> "演練中可能出現受傷的結果，你可以隨時停止。\n\n用自己的話輸入行動或問題。卡住時可以看看四周或開啟建議。"
                scenario.id == "drill_fire_dorm" -> "學習模式不限時。這是教學模擬，不會真的撥打電話。"
                else -> "舊版情境：尚未套用新版核心，每個決策有30秒。"
            }) },
            confirmButton = { TextButton(onClick = { candidate = null; actions.startScenario(scenario) }) { Text("準備好了，開始") } },
            dismissButton = { TextButton(onClick = { candidate = null }) { Text("再看看") } })
    }
    LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { TextButton(onClick = onChoice) { Text("返回選擇題演練") } }
        item { PageHeading("練習面對未知", "選一個情境，試著說出你的下一步行動。") }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("GPT 線上演練", fontWeight = FontWeight.Bold)
                        Switch(checked = state.onlineEnabled, onCheckedChange = actions::setOnlineMode)
                    }
                    Text(state.onlineStatus, color = PocketColors.Info)
                    TextButton(onClick = { actions.setResearchText(!state.logResearchText) }, modifier = Modifier.heightIn(min = 48.dp)) {
                        Text(if (state.logResearchText) "研究紀錄文字保存：開啟" else "研究紀錄文字保存：關閉")
                    }
                    Text("線上模式會將對話傳送至 OpenAI，請勿輸入個人資料。支援火災與五個新版因果劇本；其他舊版情境使用離線規則。", color = PocketColors.MidGray, lineHeight = 23.sp)
                }
            }
        }
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = PocketColors.MutedSurface),
                border = BorderStroke(1.dp, PocketColors.Info),
                shape = cardShape,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(20.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = PocketColors.AccentYellow)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("教授示範路線", color = PocketColors.Info, fontWeight = FontWeight.Bold)
                        Text(
                            "宿舍火災待救、住家地震受困、堰塞湖撤離窗口。三條路線包含完成、待救與危急失敗。",
                            color = PocketColors.MidGray,
                            lineHeight = 23.sp,
                        )
                    }
                }
            }
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item { CategoryChip("全部", state.selectedCategory == null) { actions.selectCategory(null) } }
                items(categories, key = { it.name }) { category ->
                    CategoryChip(category.label, state.selectedCategory == category) { actions.selectCategory(category) }
                }
            }
        }
        items(filtered, key = { it.id }) { scenario ->
            val featured = scenario.id in professorDemoScenarioIds
            Card(onClick = { candidate = scenario }, shape = cardShape, modifier = Modifier.fillMaxWidth(),
                border = if (featured) BorderStroke(1.dp, PocketColors.AccentYellow) else null,
                colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(scenario.category.label, color = PocketColors.SafetyOrange, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        if (featured) ScenarioTag("示範路線", PocketColors.AccentYellow)
                    }
                    Text(scenario.title, fontSize = 22.sp, lineHeight = 30.sp, fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = PocketColors.MidGray, modifier = Modifier.size(18.dp))
                        Text(scenario.location, color = PocketColors.MidGray, modifier = Modifier.weight(1f))
                    }
                    Text(scenarioOutcomeSummary(scenario.id, actions), color = PocketColors.Info, lineHeight = 23.sp)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("進入情境", color = PocketColors.Info, modifier = Modifier.weight(1f))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = PocketColors.Info)
                    }
                }
            }
        }
    }
}

@Composable
private fun ScenarioTag(
    label: String,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = color.copy(alpha = 0.14f),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, color.copy(alpha = 0.55f)),
    ) {
        Text(
            label,
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
        )
    }
}

private fun scenarioOutcomeSummary(scenarioId: String, actions: PocketKbViewModel): String = when (scenarioId) {
    "drill_fire_dorm" -> "學習模式 · 完成待救決策／危急失敗"
    "earthquake_home_trapped" -> "因果情境 v3 · 穩定待救／危急失敗"
    "barrier_lake_downstream" -> "因果情境 v3 · 完成撤離／穩定待救／危急失敗"
    else -> when {
        actions.scenarioRuntimeV3(scenarioId) != null -> "因果情境 v3 · 結果取決於你的行動"
        else -> "舊版情境 · 待升級新版核心"
    }
}

@Composable
private fun DrillChatScreen(state: PocketKbUiState, actions: PocketKbViewModel, onLeave: () -> Unit) {
    val scenario = state.selectedScenario ?: return
    if (state.fireState != null) { FireChatScreen(state, actions, onLeave); return }
    if (state.scenarioStateV3 != null) { ScenarioV3Screen(state, actions, onLeave); return }
    var input by rememberSaveable(state.activeSessionId) { mutableStateOf("") }
    val scroll = rememberLazyListState()
    val ongoing = state.drillStep.outcome == DrillOutcome.CONTINUE
    LaunchedEffect(state.messages.size, state.lastReport) {
        if (state.messages.isNotEmpty()) scroll.animateScrollToItem(state.messages.lastIndex)
    }
    Column(Modifier.fillMaxSize().imePadding()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(scenario.title, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 18.sp)
            TextButton(onClick = onLeave) { Text(if (ongoing) "離開" else "返回") }
        }
        Column(Modifier.fillMaxWidth().background(PocketColors.Surface).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(if (ongoing) "決策倒數 ${state.drillStep.remainingSec} 秒" else outcomeLabel(state.drillStep.outcome.name),
                    color = if (ongoing && state.drillStep.remainingSec <= 8) PocketColors.EmergencyRed else PocketColors.SafetyOrange)
                Text("任務 ${state.drillStep.currentStep}/${state.drillStep.totalSteps}", color = PocketColors.MidGray)
            }
            if (ongoing) LinearProgressIndicator(progress = { state.drillStep.remainingSec / 30f }, modifier = Modifier.fillMaxWidth())
            scenario.steps.getOrNull(state.drillStep.currentStep - 1)?.let {
                Text(it.title, fontWeight = FontWeight.Bold)
            }
        }
        LazyColumn(state = scroll, modifier = Modifier.weight(1f).fillMaxWidth(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            items(state.messages, key = { it.id }) { message ->
                val user = message.role == ChatRole.USER
                Column(Modifier.fillMaxWidth(), horizontalAlignment = if (user) Alignment.End else Alignment.Start) {
                    Text(if (user) "你的行動" else "演練引導", color = PocketColors.MidGray, fontSize = 12.sp, modifier = Modifier.padding(bottom = 6.dp))
                    Surface(color = if (user) PocketColors.MutedSurface else PocketColors.Surface, shape = RoundedCornerShape(20.dp)) {
                        Text(message.content, modifier = Modifier.padding(18.dp), lineHeight = 26.sp)
                    }
                }
            }
            if (ongoing) item {
                ExpandablePanel("需要一點提示？", "參考動作會先填入輸入欄，你可以修改後再送出。") {
                    val suggestions = scenario.steps.getOrNull(state.drillStep.currentStep - 1)
                        ?.let { listOf(it.standardAction) }
                        ?: scenario.decisionRules.requiredConcepts.take(3)
                    suggestions.forEach { suggestion ->
                        TextButton(onClick = { input = suggestion }) { Text(suggestion) }
                    }
                }
            }
            if (state.ragResults.isNotEmpty()) item {
                ExpandablePanel("查看參考依據", "本回合的相關知識") {
                    state.ragResults.forEach {
                        Text(it.chunk.title, fontWeight = FontWeight.Bold)
                        Text(it.chunk.content, lineHeight = 25.sp)
                        SourceLink(it.chunk.source)
                    }
                }
            }
            if (state.lastReport.isNotBlank()) item {
                Surface(shape = cardShape, color = PocketColors.Surface) {
                    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(outcomeLabel(state.drillStep.outcome.name), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        Text(state.lastReport, lineHeight = 26.sp)
                        Button(onClick = { actions.startScenario(scenario) }) { Text("再練習一次") }
                    }
                }
            }
        }
        if (ongoing) Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(value = input, onValueChange = { input = it }, label = { Text("你接下來會怎麼做？") },
                modifier = Modifier.weight(1f), maxLines = 3, enabled = !state.isGenerating, shape = RoundedCornerShape(18.dp))
            IconButton(onClick = { actions.sendUserAction(input); input = "" }, enabled = input.isNotBlank() && !state.isGenerating) {
                Icon(Icons.AutoMirrored.Filled.Send, "送出行動", tint = PocketColors.SafetyOrange)
            }
        }
    }
}

@Composable
private fun EmergencyScreen() {
    LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { PageHeading("先找到下一步", "選擇目前情況，查看已儲存在手機的應變指引。") }
        items(KnowledgeBase.emergencyGuides, key = { it.category.name }) { guide ->
            ExpandablePanel(guide.headline, guide.callout) {
                guide.steps.forEach { step ->
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(step.order.toString().padStart(2, '0'), color = PocketColors.SafetyOrange, fontWeight = FontWeight.Bold)
                        Text(step.text, lineHeight = 26.sp, modifier = Modifier.weight(1f))
                    }
                }
                SourceLink(guide.source)
            }
        }
    }
}

@Composable
private fun ResourcesScreen() {
    var query by rememberSaveable { mutableStateOf("") }
    var selected by remember { mutableStateOf<DisasterCategory?>(null) }
    val rag = remember { RagEngine() }
    val results = remember(query, selected) {
        val matches = if (query.isBlank()) KnowledgeBase.chunks else rag.retrieve(query, KnowledgeBase.chunks.size).map { it.chunk }
        matches.filter { selected == null || it.category == selected }
    }
    LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { PageHeading("你的離線知識庫", "描述問題或輸入關鍵字，尋找有來源的防災資料。") }
        item {
            OutlinedTextField(value = query, onValueChange = { query = it }, label = { Text("想了解什麼？") },
                placeholder = { Text("例如：門外有濃煙怎麼辦") }, leadingIcon = { Icon(Icons.Default.Search, null) },
                trailingIcon = { if (query.isNotEmpty()) IconButton(onClick = { query = "" }) { Icon(Icons.Default.Close, "清除搜尋") } },
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), maxLines = 3)
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item { CategoryChip("全部", selected == null) { selected = null } }
                items(DisasterCategory.entries) { category -> CategoryChip(category.label, selected == category) { selected = category } }
            }
        }
        item { Text("找到 ${results.size} 則資料 · 本地資料檢索", color = PocketColors.MidGray, fontSize = 14.sp) }
        if (results.isEmpty()) item {
            Text("沒有找到相關資料。試試「地震」「濃煙」等關鍵字，或切換為全部分類。", lineHeight = 26.sp)
        }
        items(results, key = { it.id }) { chunk ->
            ExpandablePanel(chunk.title, chunk.category.label) {
                Text(chunk.content, lineHeight = 27.sp)
                SourceLink(chunk.source)
            }
        }
    }
}

@Composable
private fun ExpandablePanel(title: String, subtitle: String, content: @Composable ColumnScope.() -> Unit) {
    var expanded by rememberSaveable(title) { mutableStateOf(false) }
    Surface(shape = cardShape, color = PocketColors.Surface, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.animateContentSize()) {
            TextButton(onClick = { expanded = !expanded }, modifier = Modifier.fillMaxWidth(), shape = cardShape) {
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 28.sp)
                        Text(subtitle, color = PocketColors.MidGray, fontSize = 14.sp, lineHeight = 22.sp)
                        Text(if (expanded) "收合內容" else "查看完整內容", color = PocketColors.Info, fontSize = 14.sp)
                    }
                    Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null, tint = PocketColors.Info)
                }
            }
            if (expanded) Column(Modifier.padding(start = 24.dp, end = 24.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(16.dp), content = content)
        }
    }
}

@Composable
private fun SourceLink(source: KnowledgeSource) {
    val uri = LocalUriHandler.current
    var failed by remember { mutableStateOf(false) }
    Text("來源：${source.agency}《${source.title}》", color = PocketColors.MidGray, fontSize = 14.sp, lineHeight = 22.sp)
    if (source.note.isNotBlank()) Text(source.note, color = PocketColors.MidGray, fontSize = 14.sp)
    TextButton(onClick = { failed = runCatching { uri.openUri(source.url) }.isFailure }) {
        Text("查看原文（需要網路）"); Spacer(Modifier.width(8.dp)); Icon(Icons.AutoMirrored.Filled.OpenInNew, null, modifier = Modifier.size(18.dp))
    }
    if (failed) Text("無法開啟瀏覽器，請稍後再試。", color = PocketColors.EmergencyRed)
}

@Composable
private fun CategoryChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(selected = selected, onClick = onClick, label = { Text(label) }, modifier = Modifier.heightIn(min = 48.dp))
}

@Composable
private fun HistoryScreen(sessions: List<DrillSessionEntity>, actions: PocketKbViewModel) {
    var exporting by rememberSaveable { mutableStateOf<String?>(null) }
    var exportNotice by rememberSaveable { mutableStateOf("") }
    val export = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/x-ndjson")) { uri ->
        val id = exporting
        if (uri != null && id != null) actions.exportResearch(id, uri) { success ->
            exportNotice = if (success) "已匯出研究紀錄。" else "無法寫入選取的檔案。"
        }
        exporting = null
    }
    LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { PageHeading("每次練習，都算數", "回顧最近 20 次演練，了解自己的決策過程。") }
        if (exportNotice.isNotBlank()) item { Text(exportNotice) }
        if (sessions.isEmpty()) item {
            Surface(color = PocketColors.Surface, shape = cardShape) {
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Icon(Icons.Default.History, null, tint = PocketColors.Info, modifier = Modifier.size(32.dp))
                    Text("從第一次練習開始", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text("完成或離開演練後，你的紀錄會出現在這裡。", color = PocketColors.MidGray, lineHeight = 26.sp)
                }
            }
        }
        items(sessions, key = { it.id }) { session ->
            ExpandablePanel(session.scenarioTitle, "${outcomeLabel(session.outcome)} · ${formatTime(session.startedAtMs)}") {
                Text("${if (session.scenarioTitle == actions.fireDrill.spec.getString("title")) "已完成階段" else "最後進行任務"} ${session.finalStep}/${session.totalSteps}", fontWeight = FontWeight.Bold)
                Text("回應 ${session.userTurns} 次 · ${session.userWordCount} 字")
                Text("逾時 ${session.timeoutCount} 次 · 高風險失敗 ${session.fatalErrorCount} 次")
                Text("安全評估：${safetyLabel(session.finalSafety)}", color = PocketColors.Info)
                var saved by remember(session.id, session.endedAtMs) { mutableStateOf<List<com.pocketkb.android.data.DrillMessageEntity>>(emptyList()) }
                var showChat by remember { mutableStateOf(false) }
                LaunchedEffect(session.id, session.endedAtMs) { saved = actions.savedMessages(session.id) }
                saved.lastOrNull { it.role == ChatRole.SYSTEM.name && !it.content.startsWith("{") }?.let { Text(it.content, lineHeight = 26.sp) }
                TextButton(onClick = { exporting = session.id; export.launch("PocketKB-${session.id}.jsonl") }) { Text("匯出研究紀錄（JSONL）") }
                TextButton(onClick = { showChat = !showChat }) { Text(if (showChat) "收起對話" else "查看完整對話") }
                if (showChat) saved.filter { it.role != ChatRole.SYSTEM.name }.forEach { Text(it.content, lineHeight = 26.sp) }
            }
        }
    }
}

private fun tabIcon(tab: AppTab): ImageVector = when (tab) {
    AppTab.HOME -> Icons.Default.Home
    AppTab.DRILL -> Icons.Default.PlayArrow
    AppTab.EMERGENCY -> Icons.Default.Report
    AppTab.RESOURCES -> Icons.Default.Search
    AppTab.HISTORY -> Icons.Default.History
}
private fun outcomeLabel(value: String): String = when (value) {
    "SUCCESS" -> "演練完成"
    "EVACUATED" -> "已完成撤離"
    "WAITING_RESCUE" -> "穩定待救・尚未獲救"
    "SHELTERED" -> "已完成就地掩蔽"
    "RESCUED" -> "已由救援人員接觸"
    "FAILED" -> "需要再練習"
    "TIMEOUT" -> "決策逾時"
    "EXITED" -> "已退出"
    else -> "尚未完成"
}
private fun safetyLabel(value: String): String = when (value) {
    "HIGH" -> "安全"
    "MEDIUM" -> "尚可"
    "LOW" -> "有風險"
    else -> "高風險"
}
private fun formatTime(value: Long) = SimpleDateFormat("MM/dd HH:mm", Locale.TAIWAN).format(Date(value))
