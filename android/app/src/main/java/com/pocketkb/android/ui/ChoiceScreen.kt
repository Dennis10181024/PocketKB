package com.pocketkb.android.ui

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pocketkb.android.ChoiceViewModel
import com.pocketkb.android.core.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
internal fun ChoiceRoute(onLegacy: () -> Unit, modifier: Modifier = Modifier, model: ChoiceViewModel = viewModel()) {
    val state by model.state.collectAsStateWithLifecycle()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val scope = rememberCoroutineScope()
    var exit by remember { mutableStateOf(false) }
    var seeSettings by remember { mutableStateOf(false) }
    val view = state.view
    val progress = view?.get("state")?.obj()
    val decision = view?.get("decision")?.obj()
    val review = state.review
    val list = rememberLazyListState()
    LaunchedEffect(view?.get("revision"), view?.get("sessionId"), state.preview) { list.scrollToItem(0) }
    DisposableEffect(lifecycle, model) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) model.background(false)
            if (event == Lifecycle.Event.ON_STOP) model.background(true)
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer); model.background(true) }
    }
    BackHandler(view != null || state.preview != null) {
        if (!state.busy) {
            if (state.preview != null) model.preview(null)
            else if (review != null) model.exit()
            else exit = true
        }
    }
    val export = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/x-ndjson")) { uri ->
        val sessionId = view?.text("sessionId")
        if (uri != null && sessionId != null) scope.launch {
            val data = model.export(sessionId)
            withContext(Dispatchers.IO) { context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(data) } }
        }
    }
    if (exit) AlertDialog(onDismissRequest = { exit = false }, title = { Text("停止這次演練？") },
        confirmButton = { TextButton(onClick = { exit = false; model.exit() }) { Text("停止並回到清單") } },
        dismissButton = { TextButton(onClick = { exit = false }) { Text("繼續") } })
    LazyColumn(modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(18.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Text(review?.text("type") ?: state.preview?.text("title") ?: state.title.takeIf { view != null } ?: "情境演練",
                style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }.testTag("choice_heading"))
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
        when {
            review != null -> {
                item {
                    (review["injury"] as? String)?.let { Text("本人傷勢｜$it", modifier = Modifier.testTag("choice_grade")) }
                    view?.get("lines").list().forEach { Text(it.toString()) }
                    SectionTitle("傷勢清單")
                    val injuries = review.rows("injuries")
                    if (injuries.isEmpty()) Text("本場無紀錄的傷勢事件。")
                    for ((pair, group) in injuries.groupBy { it.text("subjectName") to it.text("label") }) {
                        Text(pair.first+"｜"+pair.second+if (group.size > 1) "（${group.size} 次）" else "")
                    }
                    SectionTitle("演練回顧")
                    Text(review.text("result"))
                    Text(review.text("summary"))
                }
                item {
                    val groups = listOf("做對的決定" to "good", "下次可以補上的" to "improvements", "這次的危險選擇與後果" to "dangers")
                    for ((label, key) in groups) {
                        val rows = review.rows(key)
                        if (rows.isEmpty()) continue
                        SectionTitle(label)
                        for (row in rows) {
                            (row["optionText"] as? String)?.let { Text("「$it」") }
                            for (field in listOf("why", "text", "outcome", "tip")) (row[field] as? String)?.let { Text(it) }
                        }
                    }
                    review["turning"]?.obj()?.let {
                        SectionTitle("關鍵轉折")
                        Text("「"+it.text("optionText")+"」")
                        Text(it.text("outcome"))
                        Text(it.text("tip"))
                    }
                    SectionTitle("官方依據")
                    review.rows("sources").forEach {
                        TextButton(onClick = { uriHandler.openUri(it.text("url")) }, modifier = Modifier.heightIn(min = 48.dp)) { Text(it.text("title")) }
                    }
                    SectionTitle("帶走一個思考題")
                    Text(review.text("reflection"))
                }
                item {
                    if (review.flag("canRetry")) Button(onClick = model::retry, enabled = !state.busy, modifier = Modifier.testTag("choice_retry").heightIn(min = 48.dp)) {
                        Text("從這個決定重來")
                    }
                    TextButton(onClick = { export.launch("pocketkb-choice.jsonl") }) { Text("匯出本場研究紀錄") }
                    TextButton(onClick = model::exit, enabled = !state.busy) { Text("回到情境清單") }
                }
            }
            decision != null && progress != null -> {
                item {
                    SectionTitle("現在發生什麼")
                    view.getValue("lines").list().forEach { Text(it.toString()) }
                    val status = view.getValue("status").list().take(2)
                    if (status.isNotEmpty()) Text("現場狀態｜"+status.joinToString("、"))
                    SectionTitle("我面臨什麼決定")
                    Text(decision.text("prompt"), modifier = Modifier.testTag("choice_prompt"))
                }
                items(decision.rows("options"), key = { it.text("id") }) { option ->
                    OutlinedButton(onClick = { model.choose(option.text("id"), view.number("revision")) }, enabled = !state.busy,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("choice_"+option.text("id")),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp)) {
                        Box(Modifier.fillMaxWidth()) { Text(option.text("text")) }
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { model.inspect(false) }, enabled = !state.busy, modifier = Modifier.heightIn(min = 48.dp)) { Text("先看看四周") }
                        TextButton(onClick = { model.inspect(true) }, enabled = !state.busy, modifier = Modifier.heightIn(min = 48.dp)) { Text("問同伴") }
                    }
                    state.observation?.let { Text(it, modifier = Modifier.testTag("choice_inspection")) }
                    TextButton(onClick = { exit = true }, enabled = !state.busy, modifier = Modifier.heightIn(min = 48.dp)) { Text("停止演練") }
                }
            }
            state.preview != null -> item {
                Text("演練中可能出現受傷的結果，你可以隨時停止。")
                Text("點一個做法就會送出。想先取得線索，可以看看四周或問同伴。")
                Button(onClick = model::start, enabled = !state.busy, modifier = Modifier.testTag("choice_start").heightIn(min = 48.dp)) { Text("開始演練") }
                TextButton(onClick = { model.preview(null) }, enabled = !state.busy) { Text("回到情境清單") }
            }
            else -> {
                items(state.packs.filter { it["status"] != "draft" }, key = { it.text("id") }) { pack ->
                    OutlinedButton(onClick = { model.preview(pack) }, enabled = !state.busy,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("choice_pack_"+pack.text("id"))) { Text(pack.text("title")) }
                }
                item {
                    TextButton(onClick = { seeSettings = !seeSettings }) { Text("演練設定") }
                    if (seeSettings) TextButton(onClick = onLegacy) { Text("顯示舊版對話劇本") }
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(label: String) {
    Text(label, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 10.dp).semantics { heading() })
}
