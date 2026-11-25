package com.pocketkb.android.core

import org.junit.Assert.*
import org.junit.Test

class ChoiceParityTest {
    private fun resource(file: String) = javaClass.getResourceAsStream("/choice/$file")!!.use { it.readBytes() }
    private fun read(file: String) = parsePackJson(resource(file).decodeToString())
    private val manifest by lazy { read("manifest.json") }
    private val schema by lazy { read("schema-v1.json") }
    private val vectors by lazy { read("test-vectors.json") }

    private fun load(file: String, bytes: ByteArray = resource(file)): ChoicePack {
        val entry = manifest.rows("packs").first { it["file"] == file }
        return ChoicePack.load(bytes, entry.text("sha256"), schema)
    }

    @Test fun verifiesDigestBeforeParsing() {
        val file = "fire-dorm.json"
        assertThrows(IllegalArgumentException::class.java) { load(file, resource(file) + 0) }
    }

    @Test fun matchesReferenceAtEveryCheckpoint() {
        val golden = read("parity-v1.json")
        for (scenario in golden.rows("scenarios")) {
            val file = scenario.text("file")
            val pack = load(file)
            val vector = vectors.rows("scenarios").first { it["file"] == file }
            assertEquals(vector["packSha256"], pack.digest)
            assertEquals(vector.rows("cases").map { it["id"] }, scenario.rows("cases").map { it["id"] })
            for (test in scenario.rows("cases")) {
                val run = ChoiceRuntime(pack) { if (test["id"] == "shuffle") 0.99 else 0.41 }
                var session = run.start("fixture")
                var snapshot = run.snapshot(session)
                var request: ChoiceInput? = null
                for ((index, checkpoint) in test.rows("checkpoints").withIndex()) {
                    val context = "$file ${test["id"]} checkpoint $index"
                    when (checkpoint["op"]) {
                        "observe" -> assertEquals(context, checkpoint["text"], run.observe(session))
                        "ask" -> assertEquals(context, checkpoint["text"], run.ask(session))
                        "choice" -> {
                            val revision = snapshot.number("revision")
                            request = ChoiceInput(snapshot.getValue("decision").obj().text("id"), checkpoint.text("choice"), "turn-$revision", revision)
                            snapshot = run.submitChoice(session, request)
                        }
                        "dedupe" -> snapshot = run.submitChoice(session, request!!)
                        "retry" -> {
                            assertEquals(context, test["terminalReview"], run.debrief(session))
                            snapshot = run.retry(session)
                        }
                    }
                    val expected = checkpoint.getValue("view").obj()
                    assertEquals("$context state", expected["state"], snapshot["state"])
                    assertEquals(context, expected, snapshot - "sessionId")
                    session = run.restore(run.save(session))
                    assertEquals("$context process restore", snapshot, run.snapshot(session))
                }
                val review = if (snapshot["decision"] == null) run.debrief(session) else null
                assertEquals("$file ${test["id"]} recap", test["finalReview"], review)
            }
        }
    }
}
