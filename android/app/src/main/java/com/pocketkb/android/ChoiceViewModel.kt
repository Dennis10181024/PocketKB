package com.pocketkb.android

import android.app.Application
import android.os.SystemClock
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pocketkb.android.core.*
import com.pocketkb.android.data.ChoiceResumeEntity
import com.pocketkb.android.data.DrillTurnEntity
import com.pocketkb.android.data.PocketKbDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

internal data class ChoiceScreenState(
    val packs: List<PackObject> = emptyList(), val busy: Boolean = true, val preview: PackObject? = null,
    val title: String = "", val view: PackObject? = null, val review: PackObject? = null,
    val observation: String? = null, val error: String? = null,
)

internal class ChoiceViewModel(app: Application) : AndroidViewModel(app) {
    private val assets = app.assets
    private val dao = PocketKbDatabase.get(app).drillHistoryDao()
    private val mutableState = MutableStateFlow(ChoiceScreenState())
    val state = mutableState.asStateFlow()
    private var runtime: ChoiceRuntime? = null
    private var session: ChoiceRuntime.Session? = null
    private var decisionStarted = SystemClock.elapsedRealtime()
    private var pausedAt: Long? = null
    private var inspectionStarted: Long? = null
    private var pausedTotal = 0L
    private val schema by lazy { assets.open("packs/schema-v1.json").bufferedReader().use { parsePackJson(it.readText()) } }

    init {
        execute(force = true) {
            val packs = withContext(Dispatchers.IO) {
                assets.open("packs/manifest.json").bufferedReader().use { parsePackJson(it.readText()).rows("packs") }
            }
            mutableState.value = mutableState.value.copy(packs = packs)
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
        require(pack.id == entry["id"] && pack.title == entry["title"])
        ChoiceRuntime(pack)
    }

    fun preview(entry: PackObject?) { mutableState.value = state.value.copy(preview = entry, error = null) }
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
        mutableState.value = state.value.copy(view = null, review = null, observation = null)
    }

    suspend fun export(sessionId: String): String = dao.researchTurns(sessionId).joinToString("\n", postfix = "\n")
}
