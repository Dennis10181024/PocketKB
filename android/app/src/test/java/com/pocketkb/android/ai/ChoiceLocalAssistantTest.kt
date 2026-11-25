package com.pocketkb.android.ai

import com.pocketkb.android.core.*
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.awaitCancellation
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.ByteArrayInputStream
import java.io.File
import java.security.MessageDigest

class ChoiceLocalAssistantTest {
    @get:Rule val tmp = TemporaryFolder()
    private fun resource(file: String) = javaClass.getResourceAsStream("/choice/$file")!!.bufferedReader().use { parsePackJson(it.readText()) }
    private fun serialized(vararg texts: String) = mapOf("sentences" to texts.toList()).json().toString()

    @Test fun checksThirtyActualEventNarrationSamples() {
        val samples = listOf("fire-dorm.json", "earthquake-school.json").flatMap { name ->
            val pack = resource(name)
            val lines = pack.getValue("presentation").obj().getValue("narration").obj()
            pack.rows("beats").filterNot { it.flag("hidden") }.map { beat ->
                val id = beat.getValue("normal").obj().text("narration")
                val variants = lines.getValue(id).list().map { it as String }
                NarrationDraft(listOf(beat.text("id")), listOf(variants), listOf(variants[0]))
            }
        }
        assertTrue(samples.size >= 8)
        for (index in 0 until 30) {
            val draft = samples[index % samples.size]
            val original = draft.fixed.single()
            val (response, expectation) = when (index % 5) {
                0 -> serialized(original) to listOf(original)
                1 -> serialized(draft.groups.single()[1]) to listOf(draft.groups.single()[1])
                2 -> serialized(original + "我搭了電梯。") to null
                3 -> serialized("门外响起警报。") to null
                else -> serialized("這是過長的內容".repeat(80)) to null
            }
            assertEquals("sample $index", expectation, ChoiceNarrationGuard.accept(response, draft))
        }
        val simplified = "门外响起警报。"
        assertNull(ChoiceNarrationGuard.accept(serialized(simplified), NarrationDraft(listOf("test"), listOf(listOf(simplified)), listOf(simplified))))
        assertNull(ChoiceNarrationGuard.accept(serialized("很長".repeat(70)), NarrationDraft(emptyList(), listOf(listOf("很長".repeat(70))), emptyList())))
    }

    @Test fun usesFixedNarrationAndGroundedExtractsOnMissingOrFailingModel() = runBlocking {
        val fixed = listOf("我聽見警報。")
        val draft = NarrationDraft(listOf("alarm"), listOf(listOf(fixed[0], "警報聲傳了進來。")), fixed)
        val official = KnowledgeSource("消防署", "防災", "https://www.nfa.gov.tw/")
        val result = RetrievalResult(KnowledgeChunk("test", "火災", "走廊有濃煙時關門隔煙。", DisasterCategory.FIRE, emptyList(), official),
            4.0, listOf("濃煙", "關門"))
        for (out in listOf(null, "malformed", serialized("我開門走出去。"), "{\"index\":9}")) {
            val assist = ChoiceLocalAssistant({ out }) { listOf(result) }
            assertEquals(fixed, assist.narrate(draft))
            assertEquals(ChoiceKnowledgeAnswer(result.chunk.content, listOf(official)), assist.answer("濃煙關門？"))
        }
        val fail = ChoiceLocalAssistant({ error("fake GPU failure") }) { listOf(result) }
        assertEquals(fixed, fail.narrate(draft))
        assertEquals(listOf(official), fail.answer("濃煙關門？").sources)
        var invoked = false
        val empty = ChoiceLocalAssistant({ invoked = true; null }) { emptyList() }
        assertEquals("目前知識庫沒有相關資料", empty.answer("測試離題").text)
        assertFalse(invoked)
        val good = ChoiceLocalAssistant({ serialized("警報聲傳了進來。") }) { listOf(result) }
        assertEquals(listOf("警報聲傳了進來。"), good.narrate(draft))
        val slow = ChoiceLocalAssistant({ awaitCancellation() }, timeoutMs = 20) { listOf(result) }
        assertEquals(fixed, slow.narrate(draft))
        assertEquals(result.chunk.content, slow.answer("濃煙關門？").text)
    }

    @Test fun onlyOneModelIsLoadedAndMemoryFailureFallsBack() = runBlocking {
        var live = 0
        var releases = 0
        val models = ChoiceModelCoordinator(ChoiceModelKind.E2B) { kind ->
            assertEquals(0, live)
            if (kind == ChoiceModelKind.E4B) throw OutOfMemoryError()
            live++
            object : ChoiceModel {
                override suspend fun complete(prompt: String) = kind.name
                override fun close() { live--; releases++ }
            }
        }
        assertEquals("E2B", models.generate("request"))
        models.select(ChoiceModelKind.LLAMA)
        assertEquals("LLAMA", models.generate("request"))
        assertEquals(1, releases)
        models.select(ChoiceModelKind.E4B)
        assertNull(models.generate("request"))
        assertEquals(0, live)
        models.select(ChoiceModelKind.OFF)
        assertNull(models.generate("request"))
        assertEquals(2, releases)
    }

    @Test fun lateRepliesMustMatchAllRequestFieldsAndAreConsumedOnce() {
        val gate = ChoiceReplyGate()
        val slot = ChoiceReplyGate.Slot.NARRATION
        val key = ChoiceRequestKey("digest", "session", 1, "door", 1, "request")
        gate.expect(slot, key)
        val old = listOf(key.copy(packDigest = "other"), key.copy(sessionId = "other"), key.copy(attempt = 2),
            key.copy(decisionId = "other"), key.copy(occurrence = 2), key.copy(requestId = "other"))
        assertTrue(old.none { gate.accept(slot, it) })
        assertFalse(gate.accept(ChoiceReplyGate.Slot.KNOWLEDGE, key))
        assertTrue(gate.accept(slot, key))
        assertFalse(gate.accept(slot, key))
        gate.expect(slot, key)
        gate.clear()
        assertFalse(gate.accept(slot, key))
    }

    @Test fun requiresConsentWifiAndDigestThenResumesByByteRange() = runBlocking {
        val bytes = "test fake model data".toByteArray()
        val hash = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
        val artifact = GemmaDownload("fixture.litertlm", "https://example.test/fixture", bytes.size.toLong(), hash)
        val dir = tmp.root
        var connected = false
        var requested: Long? = null
        val store = ChoiceModelStore(dir, { connected }) { _, offset ->
            requested = offset
            ModelTransfer(206, "bytes $offset-${bytes.lastIndex}/${bytes.size}", ByteArrayInputStream(bytes.drop(offset.toInt()).toByteArray()))
        }
        assertTrue(runCatching { store.download(artifact, false) {} }.isFailure)
        assertTrue(runCatching { store.download(artifact, true) {} }.isFailure)
        assertNull(requested)
        connected = true
        File(dir, artifact.file+".part").writeBytes(bytes.take(4).toByteArray())
        assertArrayEquals(bytes, store.download(artifact, true) {}.readBytes())
        assertEquals(4L, requested)
        assertNotNull(store.localPath(artifact))
        val bad = artifact.copy(file = "invalid.litertlm", sha256 = "0".repeat(64))
        assertTrue(runCatching { store.download(bad, true) {} }.isFailure)
        assertNull(store.localPath(bad))
    }
}
