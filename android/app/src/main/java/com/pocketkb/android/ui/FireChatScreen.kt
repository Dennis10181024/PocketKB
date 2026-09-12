package com.pocketkb.android.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pocketkb.android.PocketKbUiState
import com.pocketkb.android.PocketKbViewModel
import com.pocketkb.android.core.*

@Composable
fun FireChatScreen(state: PocketKbUiState, actions: PocketKbViewModel, onLeave: () -> Unit) {
    val session = state.fireState ?: return
    val engine = actions.fireDrill
    val node = engine.nodes[session.node]
    val active = session.outcome == DrillOutcome.CONTINUE
    var input by rememberSaveable(state.activeSessionId) { mutableStateOf("") }
    var intent by rememberSaveable(state.activeSessionId) { mutableStateOf("action") }
    var showChoices by rememberSaveable(state.activeSessionId, session.node) { mutableStateOf(false) }
    var showSources by rememberSaveable { mutableStateOf(false) }
    val scroll = rememberLazyListState()
    val uri = LocalUriHandler.current
    LaunchedEffect(state.messages.size) {
        // Keep latest feedback reachable without pinning a large situation panel above the keyboard.
        if (state.messages.size > 1) scroll.animateScrollToItem((state.messages.size + 1).coerceAtMost(scroll.layoutInfo.totalItemsCount - 1).coerceAtLeast(0))
    }
    Column(Modifier.fillMaxSize().imePadding()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            Text("宿舍濃煙・學習模式", Modifier.weight(1f).padding(top = 12.dp), fontWeight = FontWeight.Bold)
            TextButton(onClick = onLeave) { Text(if (active) "保存並離開" else "返回") }
        }
        LazyColumn(state = scroll, modifier = Modifier.weight(1f), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                Text("不限時 · v${session.version} · 已完成 ${session.completed.size}/${engine.nodes.size}", color = PocketColors.Info)
                LinearProgressIndicator(progress = { session.completed.size.toFloat() / engine.nodes.size }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = PocketColors.Surface)) {
                    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("現場發生什麼", color = PocketColors.SafetyOrange)
                        Text(node.getString("situation"), lineHeight = 26.sp)
                        Text("目前要決定什麼", fontWeight = FontWeight.Bold)
                        Text(if (active) node.getString("task") else "本次已結束，請查看回顧。", lineHeight = 26.sp)
                        if (active) Text("本階段已完成：${session.accepted.joinToString("、", transform = engine::label).ifEmpty { "尚無；可以分次回答" }}", color = PocketColors.Info)
                    }
                }
            }
            items(state.messages.filter { it.role != ChatRole.SYSTEM }, key = { it.id }) { message ->
                Card(colors = CardDefaults.cardColors(containerColor = if (message.role == ChatRole.USER) PocketColors.MutedSurface else PocketColors.Surface)) {
                    Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(if (message.role == ChatRole.USER) "你的輸入" else "演練引導", color = PocketColors.Info, fontSize = 14.sp)
                        Text(message.content, lineHeight = 26.sp)
                    }
                }
            }
            if (active) item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { actions.sendFireInteraction(intent = "observe") }) { Text("觀察環境") }
                        OutlinedButton(onClick = { actions.sendFireInteraction(intent = "hint") }) { Text("分層提示") }
                    }
                    TextButton(onClick = { showChoices = !showChoices }) { Text(if (showChoices) "收起引導選項" else "不知道怎麼表達？") }
                    if (showChoices) {
                        Text("選項不一定安全。點選只會填入，確認後才執行。", color = PocketColors.MidGray)
                        node.strings("choices").forEach { choice ->
                            OutlinedButton(onClick = { input = choice; intent = "action" }, modifier = Modifier.fillMaxWidth()) { Text(choice) }
                        }
                    }
                }
            }
            if (!active) item {
                Card { Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("這次練習的回顧", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    Text(state.lastReport, lineHeight = 26.sp)
                    Button(onClick = { actions.startScenario(state.selectedScenario!!) }) { Text("另開一次練習") }
                } }
            }
            item {
                TextButton(onClick = { showSources = !showSources }) { Text("適用範圍與參考依據") }
                if (showSources) {
                    Text(engine.spec.getString("notice"), lineHeight = 25.sp)
                    engine.sources(session).forEach { source ->
                        TextButton(onClick = { uri.openUri(source.url) }) { Text(source.title + " · " + source.note) }
                    }
                }
            }
        }
        if (active) Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = intent == "action", onClick = { intent = "action" }, label = { Text("採取行動") })
                FilterChip(selected = intent == "question", onClick = { intent = "question" }, label = { Text("詢問") })
            }
            OutlinedTextField(value = input, onValueChange = { input = it }, modifier = Modifier.fillMaxWidth(), maxLines = 3,
                label = { Text(if (intent == "action") "你的行動，可以分次回答" else "你的問題（提供階段說明）") })
            Button(onClick = { actions.sendFireInteraction(input, intent); input = "" }, enabled = input.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
                Text(if (intent == "action") "確認行動" else "送出問題")
            }
        }
    }
}
