package com.pocketkb.android.ai

import android.app.ActivityManager
import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.pocketkb.android.core.KnowledgeBase
import com.pocketkb.android.core.KnowledgeSource
import com.pocketkb.android.core.RagEngine
import com.pocketkb.android.core.RetrievalResult
import com.pocketkb.android.core.json
import com.pocketkb.android.core.list
import com.pocketkb.android.core.parsePackJson
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import java.io.File

internal interface ChoiceModel : AutoCloseable {
    suspend fun complete(prompt: String): String
}

private class GemmaChoiceModel(path: File) : ChoiceModel {
    private val engine = Engine(EngineConfig(modelPath = path.absolutePath, backend = Backend.CPU()))

    init {
        try { engine.initialize() }
        catch (error: Throwable) {
            runCatching { engine.close() }
            throw error
        }
    }

    override suspend fun complete(prompt: String): String = engine.createConversation().use { conversation ->
        val output = StringBuilder()
        conversation.sendMessageAsync(prompt).collect { message ->
            val text = message.toString()
            require(output.length+text.length <= 2048)
            output.append(text)
        }
        output.toString()
    }

    override fun close() { engine.close() }
}

private class LlamaChoiceModel(private val engine: LlamaCppEngine) : ChoiceModel {
    override suspend fun complete(prompt: String): String {
        val output = StringBuilder()
        engine.generate(prompt, null, emptyList()) { output.append(it) }.getOrThrow()
        return output.toString()
    }
    override fun close() = engine.unload()
}

internal class ChoiceModelCoordinator(
    initial: ChoiceModelKind, private val open: suspend (ChoiceModelKind) -> ChoiceModel?,
) {
    private val lock = Mutex()
    @Volatile private var selected = initial
    private var active: ChoiceModel? = null
    private var loaded: ChoiceModelKind? = null

    suspend fun select(kind: ChoiceModelKind) = withContext(Dispatchers.IO) {
        lock.withLock {
            if (selected != kind) {
                release()
                selected = kind
            }
        }
    }

    private fun release() {
        val old = active
        active = null
        loaded = null
        runCatching { old?.close() }
    }

    suspend fun generate(prompt: String): String? = withContext(Dispatchers.IO) {
        lock.withLock {
            if (selected == ChoiceModelKind.OFF) return@withLock null
            try {
                if (loaded != selected) {
                    release()
                    active = open(selected)
                    if (active != null) loaded = selected
                }
                active?.complete(prompt)
            } catch (error: CancellationException) {
                release()
                throw error
            } catch (_: Exception) {
                release()
                null
            } catch (_: LinkageError) {
                release()
                null
            } catch (_: OutOfMemoryError) {
                release()
                null
            }
        }
    }
}

internal data class ChoiceRequestKey(
    val packDigest: String, val sessionId: String, val attempt: Int, val decisionId: String,
    val occurrence: Int, val requestId: String,
)

internal class ChoiceReplyGate {
    enum class Slot { NARRATION, KNOWLEDGE }
    private val pending = mutableMapOf<Slot, ChoiceRequestKey>()
    fun expect(slot: Slot, key: ChoiceRequestKey) { pending[slot] = key }
    fun accept(slot: Slot, key: ChoiceRequestKey): Boolean = pending.remove(slot, key)
    fun clear() = pending.clear()
}

internal data class NarrationDraft(val events: List<String>, val groups: List<List<String>>, val fixed: List<String>)
internal data class ChoiceKnowledgeAnswer(val text: String, val sources: List<KnowledgeSource>)

internal object ChoiceNarrationGuard {
    // Use characters which do not also have a common Traditional Chinese role.
    private val strictSimplified = Regex("[门风电伤烟见听声两楼吗这还说时进开关选应过发车线员间内点压险紧头护处为会画动请稳复体并让来与静从轻张烧离约据实变]")
    fun accept(text: String, draft: NarrationDraft): List<String>? {
        if (text.length > 450) return null
        val items = runCatching { parsePackJson(text).getValue("sentences").list().map { it as String } }.getOrNull() ?: return null
        if (items.size !in 1..3 || items.size != draft.groups.size || items.sumOf { it.length } > 120) return null
        for ((index, item) in items.withIndex()) {
            if (item.length !in 1..65 || strictSimplified.containsMatchIn(item) || item !in draft.groups[index]) return null
            if (item.count { it in "。！？" } > 1) return null
        }
        return items
    }
}

internal class ChoiceLocalAssistant(
    private val generate: suspend (String) -> String?,
    private val timeoutMs: Long = 6_000,
    private val retrieve: (String) -> List<RetrievalResult>,
) {
    private suspend fun request(prompt: String): String? = try {
        withTimeoutOrNull(timeoutMs) { generate(prompt) }
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (_: Exception) {
        null
    }

    suspend fun narrate(draft: NarrationDraft): List<String> {
        if (draft.groups.size !in 1..3 || draft.groups.none { it.size > 1 }) return draft.fixed
        val input = mapOf("eventIds" to draft.events, "fixed" to draft.fixed, "allowedVariants" to draft.groups).json()
        val prompt = "只能從每組選一個完整繁體句，順序固定，不新增行動、事件或傷勢。只回 JSON 物件，欄位 sentences 為字串陣列。\n$input"
        return request(prompt)?.let { ChoiceNarrationGuard.accept(it, draft) } ?: draft.fixed
    }

    suspend fun answer(question: String): ChoiceKnowledgeAnswer {
        val matches = withContext(Dispatchers.Default) {
            retrieve(question).filter { it.score > 0 && it.matchedTerms.size >= 2 && it.chunk.source.url.startsWith("https://") }.take(3)
        }
        if (matches.isEmpty()) return ChoiceKnowledgeAnswer("目前知識庫沒有相關資料", emptyList())
        val passages = matches.map { it.chunk.content.take(420) }
        val input = mapOf("question" to question.take(160), "passages" to passages).json()
        val prompt = "只用列出的依據。選最相關段落的零起算索引，只回 JSON 物件，欄位 index 為整數。\n$input"
        val modelIndex = request(prompt)?.takeIf { it.length <= 80 }?.let { raw ->
            runCatching { parsePackJson(raw)["index"] as Int }.getOrNull()
        }
        val index = modelIndex?.takeIf { it in matches.indices } ?: 0
        return ChoiceKnowledgeAnswer(passages[index], listOf(matches[index].chunk.source))
    }
}

internal class ChoiceModelServices private constructor(private val context: Context) {
    private val preferences = context.getSharedPreferences("choice-model", Context.MODE_PRIVATE)
    val models = ChoiceModelStore.onDevice(context)
    val gguf = File(context.noBackupFilesDir, "choice-local.gguf")
    val selected get() = ChoiceModelKind.entries.find { it.name == preferences.getString("selected", null) } ?: ChoiceModelKind.E2B
    private val coordinator = ChoiceModelCoordinator(selected) { kind ->
        val am = context.getSystemService(ActivityManager::class.java)
        val info = ActivityManager.MemoryInfo().also(am::getMemoryInfo)
        if (info.lowMemory) return@ChoiceModelCoordinator null
        if (kind == ChoiceModelKind.LLAMA) {
            if (!gguf.isFile) return@ChoiceModelCoordinator null
            val llama = LlamaCppEngine(context)
            if (llama.loadModel(gguf.absolutePath).isFailure) {
                llama.unload()
                null
            } else LlamaChoiceModel(llama)
        } else {
            val artifact = gemmaDownloads[kind] ?: return@ChoiceModelCoordinator null
            if (info.availMem < artifact.bytes + 512L * 1024 * 1024) return@ChoiceModelCoordinator null
            val local = models.localPath(artifact) ?: return@ChoiceModelCoordinator null
            GemmaChoiceModel(local)
        }
    }
    private val rag by lazy { RagEngine().apply { rebuild(KnowledgeBase.chunks) } }
    val assistant = ChoiceLocalAssistant(coordinator::generate) { question -> rag.retrieve(question, topK = 3) }

    suspend fun select(kind: ChoiceModelKind) {
        coordinator.select(kind)
        preferences.edit().putString("selected", kind.name).apply()
    }

    companion object {
        @Volatile private var instance: ChoiceModelServices? = null
        fun get(context: Context) = instance ?: synchronized(this) {
            instance ?: ChoiceModelServices(context.applicationContext).also { instance = it }
        }
    }
}
