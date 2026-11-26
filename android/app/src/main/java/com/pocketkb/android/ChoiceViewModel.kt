package com.pocketkb.android

import android.app.Application
import android.net.Uri
import android.os.SystemClock
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pocketkb.android.core.*
import com.pocketkb.android.ai.ChoiceKnowledgeAnswer
import com.pocketkb.android.ai.ChoiceModelKind
import com.pocketkb.android.ai.ChoiceModelServices
import com.pocketkb.android.ai.ChoiceRequestKey
import com.pocketkb.android.ai.ChoiceReplyGate
import com.pocketkb.android.ai.NarrationDraft
import com.pocketkb.android.ai.gemmaDownloads
import com.pocketkb.android.data.ChoiceResumeEntity
import com.pocketkb.android.data.DrillTurnEntity
import com.pocketkb.android.data.PocketKbDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.util.UUID

internal data class ChoiceScreenState(
    val packs: List<PackObject> = emptyList(), val busy: Boolean = true, val preview: PackObject? = null,
    val title: String = "", val view: PackObject? = null, val review: PackObject? = null,
    val observation: String? = null, val error: String? = null,
    val model: ChoiceModelKind = ChoiceModelKind.E2B, val modelStatus: String = "",
    val modelBusy: Boolean = false, val answer: ChoiceKnowledgeAnswer? = null, val answerBusy: Boolean = false,
    val narration: List<String>? = null,
    val readingSize: Int = 0, val highContrast: Boolean = false,
)

internal class ChoiceViewModel(app: Application) : AndroidViewModel(app) {
    private val assets = app.assets
    private val dao = PocketKbDatabase.get(app).drillHistoryDao()
    private val models = ChoiceModelServices.get(app)
    private val readingPreferences = app.getSharedPreferences("choice-reading", 0)
    private val mutableState = MutableStateFlow(ChoiceScreenState())
    val state = mutableState.asStateFlow()
    private var runtime: ChoiceRuntime? = null
    private var session: ChoiceRuntime.Session? = null
    private var decisionStarted = SystemClock.elapsedRealtime()
    private var pausedAt: Long? = null
    private var inspectionStarted: Long? = null
    private var pausedTotal = 0L
    private val replies = ChoiceReplyGate()
    private var narrationJob: Job? = null
    private var answerJob: Job? = null
    private val schema by lazy { assets.open("packs/schema-v1.json").bufferedReader().use { parsePackJson(it.readText()) } }

    init {
        execute(force = true) {
            mutableState.value = mutableState.value.copy(model = models.selected)
            val packs = withContext(Dispatchers.IO) {
                assets.open("packs/manifest.json").bufferedReader().use { parsePackJson(it.readText()).rows("packs") }
            }
            val (readingSize, highContrast) = withContext(Dispatchers.IO) {
                readingPreferences.getInt("size", 0).coerceIn(0, 2) to readingPreferences.getBoolean("contrast", false)
            }
            mutableState.value = mutableState.value.copy(packs = packs, readingSize = readingSize, highContrast = highContrast)
            val saved = dao.choiceResume() ?: return@execute
            val entry = packs.firstOrNull { it["id"] == saved.scenarioId }
            if (entry != null) {
                val loaded = load(entry)
                val restored = runCatching { loaded.restore(saved.payload) }.getOrNull()
                if (restored != null) {
                    display(loaded, restored)
                    return@execute
                }
            }
            dao.clearChoice()
        }
    }

    private fun execute(force: Boolean = false, work: suspend () -> Unit) {
        if (!force && state.value.busy) return
        mutableState.value = state.value.copy(busy = true, error = null)
        viewModelScope.launch {
            try { work() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (_: Exception) { mutableState.value = state.value.copy(error = "無法載入或儲存演練，請再試一次。") }
            finally { mutableState.value = state.value.copy(busy = false) }
        }
    }

    private suspend fun load(entry: PackObject) = withContext(Dispatchers.IO) {
        val file = entry.text("file")
        require(Regex("[a-z0-9-]+\\.json").matches(file))
        val pack = assets.open("packs/$file").use { ChoicePack.load(it.readBytes(), entry.text("sha256"), schema) }
        require(pack.id == entry["id"] && pack.title == entry["title"] &&
            pack.meta["status"] == entry["status"] && pack.meta["contentNotice"] == entry["contentNotice"])
        ChoiceRuntime(pack)
    }

    fun preview(entry: PackObject?) { mutableState.value = state.value.copy(preview = entry, error = null) }
    fun setReadingPreferences(size: Int, contrast: Boolean) {
        require(size in 0..2)
        readingPreferences.edit().putInt("size", size).putBoolean("contrast", contrast).apply()
        mutableState.update { it.copy(readingSize = size, highContrast = contrast) }
    }
    fun start() = execute {
        val entry = state.value.preview ?: return@execute
        val loaded = load(entry)
        val fresh = loaded.start()
        persist(loaded, fresh)
        display(loaded, fresh)
    }

    private fun display(engine: ChoiceRuntime, target: ChoiceRuntime.Session) {
        val view = engine.snapshot(target)
        val review = if (view["decision"] == null) engine.debrief(target) else null
        runtime = engine
        session = target
        mutableState.value = state.value.copy(title = engine.pack.title, view = view, review = review, preview = null, observation = null)
        decisionStarted = SystemClock.elapsedRealtime()
        pausedTotal = 0
        if (pausedAt != null) pausedAt = decisionStarted
        inspectionStarted = null
        invalidateModelReplies()
        if (review == null) narrate(engine, target, view)
    }

    private fun invalidateModelReplies() {
        replies.clear()
        narrationJob?.cancel()
        answerJob?.cancel()
        mutableState.value = state.value.copy(narration = null, answer = null, answerBusy = false)
    }

    private fun key(engine: ChoiceRuntime, target: ChoiceRuntime.Session, view: PackObject): ChoiceRequestKey {
        val data = view.getValue("state").obj()
        val decision = data.text("decisionId")
        val occurrence = target.data.rows("history").count { it["decisionId"] == decision } + 1
        return ChoiceRequestKey(engine.pack.digest, target.id, view.number("attempt"), decision, occurrence, UUID.randomUUID().toString())
    }

    private fun narrate(engine: ChoiceRuntime, target: ChoiceRuntime.Session, view: PackObject) {
        val fixed = view.getValue("lines").list().map { it as String }
        if (state.value.model == ChoiceModelKind.OFF || fixed.size !in 1..3) return
        val choices = engine.pack.data.getValue("presentation").obj().getValue("narration").obj().values
        val groups = fixed.map { line ->
            choices.map { it.list().map { text -> text as String } }.filter { line in it }.singleOrNull() ?: listOf(line)
        }
        val events = engine.records(target).lastOrNull()?.rows("events")?.map { it.text("id") }.orEmpty()
        val request = key(engine, target, view)
        replies.expect(ChoiceReplyGate.Slot.NARRATION, request)
        narrationJob = viewModelScope.launch {
            val outcome = models.assistant.narrate(NarrationDraft(events, groups, fixed))
            if (replies.accept(ChoiceReplyGate.Slot.NARRATION, request)) mutableState.value = state.value.copy(narration = outcome)
        }
    }

    fun askKnowledge(question: String) {
        val text = question.trim().take(160)
        if (text.isBlank() || state.value.review == null) return
        val engine = runtime ?: return
        val target = session ?: return
        val request = key(engine, target, engine.snapshot(target))
        answerJob?.cancel()
        replies.expect(ChoiceReplyGate.Slot.KNOWLEDGE, request)
        mutableState.value = state.value.copy(answer = null, answerBusy = true)
        answerJob = viewModelScope.launch {
            val outcome = models.assistant.answer(text)
            if (replies.accept(ChoiceReplyGate.Slot.KNOWLEDGE, request)) mutableState.value = state.value.copy(answer = outcome, answerBusy = false)
        }
    }

    fun selectModel(kind: ChoiceModelKind) = modelWork("正在切換模型") {
        invalidateModelReplies()
        models.select(kind)
        mutableState.value = state.value.copy(model = kind, modelStatus = when {
            kind == ChoiceModelKind.OFF -> "使用固定旁白與知識庫原文。"
            kind == ChoiceModelKind.LLAMA && !models.gguf.isFile -> "選擇本機 GGUF 檔案後才可使用。"
            else -> "將在下一次旁白或回顧問答檢查模型。"
        })
    }

    fun downloadModel(kind: ChoiceModelKind, agree: Boolean) = modelWork("準備下載") {
        val artifact = gemmaDownloads.getValue(kind)
        var lastPercent = -1L
        models.models.download(artifact, agree) { downloaded ->
            val percent = downloaded * 100 / artifact.bytes
            if (lastPercent != percent) {
                lastPercent = percent
                mutableState.update { it.copy(modelStatus = "已下載 $percent%") }
            }
        }
        mutableState.value = state.value.copy(modelStatus = "模型已通過 SHA-256 驗證。")
    }

    fun importModel(uri: Uri) = modelWork("匯入本地 GGUF") {
        invalidateModelReplies()
        models.select(ChoiceModelKind.OFF)
        mutableState.value = state.value.copy(model = ChoiceModelKind.OFF)
        withContext(Dispatchers.IO) {
            val resolver = getApplication<Application>().contentResolver
            val part = File(models.gguf.parentFile, models.gguf.name+".part")
            try {
                requireNotNull(resolver.openInputStream(uri)).use { input ->
                    val header = ByteArray(4)
                    require(input.read(header) == 4 && header.decodeToString() == "GGUF") { "請選擇有效的 GGUF 檔案" }
                    part.outputStream().use { output -> output.write(header); input.copyTo(output) }
                }
                Files.move(part.toPath(), models.gguf.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
            } finally {
                part.delete()
            }
        }
        models.select(ChoiceModelKind.LLAMA)
        mutableState.value = state.value.copy(model = ChoiceModelKind.LLAMA, modelStatus = "GGUF 已匯入。")
    }

    private fun modelWork(message: String, work: suspend () -> Unit) {
        if (state.value.modelBusy) return
        mutableState.value = state.value.copy(modelBusy = true, modelStatus = message)
        viewModelScope.launch {
            try { work() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) {
                val detail = error.message?.takeIf { it.length < 90 && it.any { ch -> ch in '\u4e00'..'\u9fff' } }
                mutableState.value = state.value.copy(modelStatus = detail ?: "無法完成模型準備，可繼續使用固定旁白。")
            }
            finally { mutableState.value = state.value.copy(modelBusy = false) }
        }
    }

    private suspend fun persist(engine: ChoiceRuntime, target: ChoiceRuntime.Session, record: Boolean = false) {
        val (payload, turn) = withContext(Dispatchers.Default) {
            val records = if (record) engine.records(target) else emptyList()
            engine.save(target) to records.lastOrNull()?.let { DrillTurnEntity(target.id, records.size, it.json().toString()) }
        }
        dao.persistChoice(ChoiceResumeEntity(scenarioId = engine.pack.id, payload = payload), turn)
    }

    fun inspect(ask: Boolean) {
        if (state.value.busy) return
        val engine = runtime ?: return
        val target = session ?: return
        val text = if (ask) engine.ask(target) else engine.observe(target)
        if (inspectionStarted == null) inspectionStarted = SystemClock.elapsedRealtime() - pausedTotal
        mutableState.value = state.value.copy(observation = text)
    }

    fun background(paused: Boolean) {
        val now = SystemClock.elapsedRealtime()
        if (paused && pausedAt == null) pausedAt = now
        if (!paused) pausedAt?.let { pausedTotal += now - it; pausedAt = null }
    }

    fun choose(optionId: String, revision: Int) = execute {
        val engine = runtime ?: return@execute
        val current = session ?: return@execute
        val target = engine.restore(engine.save(current))
        val view = engine.snapshot(target)
        if (view.number("revision") != revision) return@execute
        val decision = view.getValue("decision").obj()
        val now = SystemClock.elapsedRealtime()
        fun millis(value: Long) = value.coerceIn(0, Int.MAX_VALUE.toLong()).toInt()
        engine.submitChoice(target, ChoiceInput(decision.text("id"), optionId, "choice-$revision", revision,
            millis(now-decisionStarted-pausedTotal), inspectionStarted?.let { millis(now-pausedTotal-it) } ?: 0, millis(pausedTotal)))
        persist(engine, target, record = true)
        display(engine, target)
    }

    fun retry() = execute {
        val engine = runtime ?: return@execute
        val current = session ?: return@execute
        val target = engine.restore(engine.save(current))
        engine.retry(target)
        persist(engine, target, record = true)
        display(engine, target)
    }

    fun exit() = execute {
        val engine = runtime ?: return@execute
        val target = session ?: return@execute
        val view = engine.snapshot(target)
        if (view["decision"] == null) dao.clearChoice() else {
            val record = mapOf("sessionId" to target.id, "attempt" to view["attempt"], "revision" to view["revision"],
                "scenarioId" to engine.pack.id, "packVersion" to engine.pack.meta["version"], "packDigest" to engine.pack.digest,
                "evaluatorVersion" to 1, "inputSource" to "choice", "ending" to "EXITED")
            dao.exitChoice(DrillTurnEntity(target.id, engine.records(target).size + 1, record.json().toString()))
        }
        runtime = null
        session = null
        invalidateModelReplies()
        mutableState.value = state.value.copy(view = null, review = null, observation = null)
    }

    suspend fun export(sessionId: String): String = dao.researchTurns(sessionId).joinToString("\n", postfix = "\n")
}
