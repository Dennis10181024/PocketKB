package com.pocketkb.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pocketkb.android.PocketKbUiState
import com.pocketkb.android.PocketKbViewModel
import com.pocketkb.android.core.AppTab
import com.pocketkb.android.core.ChatMessage
import com.pocketkb.android.core.ChatRole
import com.pocketkb.android.core.DisasterCategory
import com.pocketkb.android.core.DrillOutcome
import com.pocketkb.android.core.DrillScenario
import com.pocketkb.android.core.KnowledgeBase
import com.pocketkb.android.core.SafetyLevel
import com.pocketkb.android.data.DrillSessionEntity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun PocketKbRoot(
    state: PocketKbUiState,
    recentSessions: List<DrillSessionEntity>,
    actions: PocketKbViewModel,
) {
    Scaffold(
        containerColor = PocketColors.AppBg,
        bottomBar = {
            NavigationBar(containerColor = PocketColors.AppBg) {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = state.selectedTab == tab,
                        onClick = { actions.selectTab(tab) },
                        icon = { Icon(iconForTab(tab), contentDescription = tab.label) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { inner ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .background(PocketColors.AppBg),
        ) {
            when (state.selectedTab) {
                AppTab.HOME -> HomeScreen(state, actions)
                AppTab.DRILL -> if (state.selectedScenario == null) {
                    ScenarioPickerScreen(state, actions)
                } else {
                    DrillChatScreen(state, actions)
                }
                AppTab.EMERGENCY -> EmergencyScreen()
                AppTab.RESOURCES -> ResourcesScreen()
                AppTab.HISTORY -> HistoryScreen(recentSessions)
            }
        }
    }
}

@Composable
private fun HomeScreen(state: PocketKbUiState, actions: PocketKbViewModel) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text("防災 Edge Intelligence", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Text("雙模式防災訓練：離線應急核心 + 線上 AI 教練", color = PocketColors.MidGray)
        }
        item {
            StatusCard(
                title = "目前模式：離線應急",
                body = state.modelStatus,
                accent = PocketColors.AccentYellow,
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                HomeActionCard(
                    modifier = Modifier.weight(1f),
                    title = "離線演練",
                    body = "規則裁判、官方依據、不卡手機",
                    color = PocketColors.SafetyOrange,
                ) { actions.selectTab(AppTab.DRILL) }
                HomeActionCard(
                    modifier = Modifier.weight(1f),
                    title = "應急查詢",
                    body = "斷網可用、步驟明確",
                    color = PocketColors.EmergencyRed,
                ) { actions.selectTab(AppTab.EMERGENCY) }
            }
        }
        item {
            StatusCard(
                title = "線上 AI 教練（規劃中）",
                body = "有網路時才提供劇情強化、長版回饋與反思報告；安全判定仍以規則裁判為準。",
                accent = Color.Cyan,
            )
        }
        item {
            StatusCard(
                title = "研究紀錄",
                body = "每次演練會保存對話、回合數、回應字數、完成率、逾時與致命錯誤次數。",
                accent = PocketColors.SuccessGreen,
            )
        }
    }
}

@Composable
private fun ScenarioPickerScreen(state: PocketKbUiState, actions: PocketKbViewModel) {
    val selected = state.selectedCategory
    val filtered = KnowledgeBase.scenarios.filter { selected == null || it.category == selected }
    Column(Modifier.fillMaxSize()) {
        Text(
            "選擇演練情境",
            color = Color.White,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(16.dp),
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 16.dp),
        ) {
            item { FilterChip("全部", selected == null) { actions.selectCategory(null) } }
            items(DisasterCategory.entries.filter { category ->
                category != DisasterCategory.FIRST_AID &&
                    KnowledgeBase.scenarios.any { it.category == category }
            }) { category ->
                FilterChip("${category.icon} ${category.label}", selected == category) {
                    actions.selectCategory(category)
                }
            }
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(filtered, key = { it.id }) { scenario ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = PocketColors.Surface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { actions.startScenario(scenario) },
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(14.dp),
                    ) {
                        CategoryMark(scenario.category)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(scenario.title, color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text("地點：${scenario.location}", color = PocketColors.MidGray, fontSize = 13.sp)
                        }
                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = PocketColors.SafetyOrange)
                    }
                }
            }
        }
    }
}

@Composable
private fun DrillChatScreen(state: PocketKbUiState, actions: PocketKbViewModel) {
    var input by remember { mutableStateOf("") }
    val scenario = state.selectedScenario ?: return
    Column(Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(scenario.title, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("離線規則裁判中，模糊或危險動作不會推進。", color = PocketColors.MidGray, fontSize = 12.sp)
            }
            TextButton(onClick = { actions.stopScenario() }) {
                Icon(Icons.Default.Close, contentDescription = null)
                Text("離開")
            }
        }
        DrillStatusPanel(state, scenario)
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(state.messages, key = { it.id }) { message -> MessageBubble(message) }
            if (state.ragResults.isNotEmpty()) item { RagStrip(state) }
            if (state.lastReport.isNotBlank()) item { EndReportCard(state.lastReport) }
        }
        QuickActionRow(
            scenario = scenario,
            enabled = state.drillStep.outcome == DrillOutcome.CONTINUE && !state.isGenerating,
        ) { actionText ->
            actions.sendUserAction(actionText)
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("輸入你的下一步行動") },
                maxLines = 3,
                enabled = state.drillStep.outcome == DrillOutcome.CONTINUE && !state.isGenerating,
            )
            Spacer(Modifier.width(8.dp))
            Button(
                onClick = {
                    actions.sendUserAction(input)
                    input = ""
                },
                enabled = input.isNotBlank() && state.drillStep.outcome == DrillOutcome.CONTINUE && !state.isGenerating,
                colors = ButtonDefaults.buttonColors(containerColor = PocketColors.SafetyOrange),
            ) {
                Icon(Icons.Default.Send, contentDescription = "送出")
            }
        }
    }
}

@Composable
private fun DrillStatusPanel(state: PocketKbUiState, scenario: DrillScenario) {
    val step = state.drillStep
    val activeScenarioStep = scenario.steps.getOrNull(step.currentStep - 1)
    val safetyColor = when (step.safetyLevel) {
        SafetyLevel.HIGH -> PocketColors.SuccessGreen
        SafetyLevel.MEDIUM -> PocketColors.AccentYellow
        SafetyLevel.LOW -> PocketColors.SafetyOrange
        SafetyLevel.FAILED -> PocketColors.EmergencyRed
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF181818))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Timer, contentDescription = null, tint = PocketColors.AccentYellow)
            Spacer(Modifier.width(8.dp))
            Text("倒數 ${step.remainingSec} 秒", color = Color.White, fontWeight = FontWeight.Bold)
            Spacer(Modifier.weight(1f))
            Text("Step ${step.currentStep}/${step.totalSteps}", color = PocketColors.MidGray)
        }
        LinearProgressIndicator(
            progress = { step.remainingSec / 30f },
            modifier = Modifier.fillMaxWidth(),
            color = if (step.remainingSec <= 8) PocketColors.EmergencyRed else PocketColors.SafetyOrange,
            trackColor = Color.DarkGray,
        )
        Row {
            Text("安全等級：", color = PocketColors.MidGray)
            Text(step.safetyLevel.label, color = safetyColor, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(16.dp))
            Text("狀態：${step.outcome}", color = PocketColors.MidGray)
        }
        activeScenarioStep?.let { current ->
            Text("目前任務：${current.title}", color = Color.White, fontWeight = FontWeight.SemiBold)
            Text(current.situation, color = PocketColors.MidGray, fontSize = 12.sp)
        }
    }
}

@Composable
private fun MessageBubble(message: ChatMessage) {
    val isUser = message.role == ChatRole.USER
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
    ) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = if (isUser) PocketColors.SafetyOrange else PocketColors.Surface,
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth(if (isUser) 0.78f else 0.9f),
        ) {
            Text(
                message.content,
                color = if (isUser) Color.Black else Color.White,
                modifier = Modifier.padding(12.dp),
            )
        }
    }
}

@Composable
private fun QuickActionRow(
    scenario: DrillScenario,
    enabled: Boolean,
    onAction: (String) -> Unit,
) {
    val actions = quickActionsFor(scenario)
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 12.dp),
    ) {
        items(actions) { text ->
            AssistChip(
                onClick = { if (enabled) onAction(text) },
                label = { Text(text) },
                enabled = enabled,
            )
        }
    }
}

private fun quickActionsFor(scenario: DrillScenario): List<String> {
    return when (scenario.id) {
        "drill_eq_classroom" -> listOf(
            "趴下、掩護、穩住",
            "遠離窗戶並保護頭部",
            "等搖晃停止再撤離",
        )
        "drill_fire_dorm" -> listOf(
            "先摸門把確認熱度",
            "不穿越濃煙，必要時低姿勢避煙",
            "關門阻煙，安全後撥 119",
        )
        "drill_typhoon_underpass" -> listOf(
            "不進地下道，立刻改道",
            "移往高處並通知他人",
            "通報積水危險點",
        )
        "drill_kitchen_oil" -> listOf(
            "先關火",
            "蓋上鍋蓋隔絕氧氣",
            "火勢變大就離開並關門",
        )
        "drill_crowd_station" -> listOf(
            "手臂放胸前保留呼吸空間",
            "順人流斜向離開",
            "不逆行、不蹲下撿物品",
        )
        "drill_compound_gas" -> listOf(
            "阻止開燈和開關電器",
            "開窗並關閉瓦斯",
            "撤離後通知管理員或消防",
        )
        else -> when (scenario.category) {
            DisasterCategory.EARTHQUAKE -> listOf("趴下、掩護、穩住", "遠離窗戶", "停止後撤離")
            DisasterCategory.FIRE -> listOf("摸門把", "低姿勢避煙", "關門並撥 119")
            DisasterCategory.TYPHOON -> listOf("移往高處", "避開積水", "通報危險")
            DisasterCategory.MANMADE -> listOf("保持距離", "保護呼吸空間", "通知現場人員")
            DisasterCategory.COMPOUND -> listOf("先辨識最大威脅", "避免二次災害", "撤離通報")
            DisasterCategory.PREPAREDNESS -> listOf("查官方資訊", "檢查防災包", "建立互助聯絡")
            DisasterCategory.FIRST_AID -> listOf("確認環境安全", "打 119", "開始正確急救")
        }
    }
}

@Composable
private fun RagStrip(state: PocketKbUiState) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0A1F2A), RoundedCornerShape(8.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text("離線 RAG 參考", color = Color.Cyan, fontWeight = FontWeight.Bold)
        state.ragResults.forEach { result ->
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    "${result.chunk.category.label}｜${result.chunk.title}  score=${"%.2f".format(result.score)}",
                    color = Color.White,
                    fontSize = 12.sp,
                )
                Text(
                    "來源：${result.chunk.source.agency}《${result.chunk.source.title}》",
                    color = PocketColors.AccentYellow,
                    fontSize = 11.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun EmergencyScreen() {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text("應急查詢", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text("離線可讀，不依賴模型生成，災時優先使用。", color = PocketColors.MidGray)
        }
        items(KnowledgeBase.emergencyGuides, key = { it.category.name }) { guide ->
            Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface), shape = RoundedCornerShape(8.dp)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("${guide.category.icon} ${guide.headline}", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text(guide.callout, color = PocketColors.SafetyOrange, fontWeight = FontWeight.SemiBold)
                    guide.steps.forEach { step -> Text("${step.order}. ${step.text}", color = Color.White) }
                    Text(
                        "來源：${guide.source.agency}《${guide.source.title}》",
                        color = PocketColors.MidGray,
                        fontSize = 12.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
private fun ResourcesScreen() {
    var selected by remember { mutableStateOf<DisasterCategory?>(null) }
    val chunks = KnowledgeBase.chunks.filter { selected == null || it.category == selected }
    Column(Modifier.fillMaxSize()) {
        Text(
            "知識庫",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(16.dp),
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 16.dp),
        ) {
            item { FilterChip("全部", selected == null) { selected = null } }
            items(DisasterCategory.entries) { category ->
                FilterChip("${category.icon} ${category.label}", selected == category) { selected = category }
            }
        }
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(chunks, key = { it.id }) { chunk ->
                Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface), shape = RoundedCornerShape(8.dp)) {
                    Column(Modifier.padding(14.dp)) {
                        Text("${chunk.category.icon} ${chunk.title}", color = Color.White, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text(chunk.content, color = Color.White.copy(alpha = 0.84f), maxLines = 5, overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "來源：${chunk.source.agency}《${chunk.source.title}》",
                            color = PocketColors.AccentYellow,
                            fontSize = 12.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            chunk.source.url,
                            color = PocketColors.MidGray,
                            fontSize = 10.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        if (chunk.source.note.isNotBlank()) {
                            Text(
                                chunk.source.note,
                                color = PocketColors.MidGray,
                                fontSize = 11.sp,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryScreen(sessions: List<DrillSessionEntity>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Text("演練紀錄", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text("離線演練資料，用於後續分析投入程度與完成率。", color = PocketColors.MidGray)
        }
        if (sessions.isEmpty()) {
            item { Text("目前還沒有演練紀錄。", color = PocketColors.MidGray) }
        }
        items(sessions, key = { it.id }) { session ->
            Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface), shape = RoundedCornerShape(8.dp)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(session.scenarioTitle, color = Color.White, fontWeight = FontWeight.Bold)
                    Text("${session.category} ｜ ${formatTime(session.startedAtMs)}", color = PocketColors.MidGray, fontSize = 12.sp)
                    Text(
                        "結果=${session.outcome}  完成=${session.finalStep * 100 / session.totalSteps.coerceAtLeast(1)}%  回合=${session.userTurns}  字數=${session.userWordCount}",
                        color = Color.White,
                        fontSize = 13.sp,
                    )
                    Text(
                        "逾時=${session.timeoutCount}  致命錯誤=${session.fatalErrorCount}  安全=${session.finalSafety}",
                        color = PocketColors.AccentYellow,
                        fontSize = 13.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun EndReportCard(report: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF102411), RoundedCornerShape(8.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = PocketColors.SuccessGreen)
        Text("演練報告", color = Color.White, fontWeight = FontWeight.Bold)
        Text(report, color = Color.White)
    }
}

@Composable
private fun HomeActionCard(
    modifier: Modifier,
    title: String,
    body: String,
    color: Color,
    onClick: () -> Unit,
) {
    Card(
        modifier = modifier
            .height(128.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = color),
        shape = RoundedCornerShape(8.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(Modifier.weight(1f))
            Text(body, color = Color.White.copy(alpha = 0.86f), fontSize = 13.sp)
        }
    }
}

@Composable
private fun StatusCard(title: String, body: String, accent: Color) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(PocketColors.Surface, RoundedCornerShape(8.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(title, color = accent, fontWeight = FontWeight.Bold)
        Text(body, color = Color.White)
    }
}

@Composable
private fun FilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    AssistChip(
        onClick = onClick,
        label = { Text(label) },
        colors = AssistChipDefaults.assistChipColors(
            containerColor = if (selected) PocketColors.SafetyOrange else PocketColors.Surface,
            labelColor = if (selected) Color.Black else Color.White,
        ),
    )
}

@Composable
private fun CategoryMark(category: DisasterCategory) {
    Box(
        modifier = Modifier
            .size(42.dp)
            .background(PocketColors.AppBg, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Text(category.icon, color = PocketColors.AccentYellow, fontWeight = FontWeight.Bold)
    }
}

private fun iconForTab(tab: AppTab): ImageVector {
    return when (tab) {
        AppTab.HOME -> Icons.Default.Home
        AppTab.DRILL -> Icons.Default.PlayArrow
        AppTab.EMERGENCY -> Icons.Default.Report
        AppTab.RESOURCES -> Icons.Default.Book
        AppTab.HISTORY -> Icons.Default.History
    }
}

private fun formatTime(timeMs: Long): String {
    return SimpleDateFormat("MM/dd HH:mm", Locale.TAIWAN).format(Date(timeMs))
}



