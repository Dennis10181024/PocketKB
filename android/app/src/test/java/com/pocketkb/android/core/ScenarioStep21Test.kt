package com.pocketkb.android.core

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class ScenarioStep21Test {
    private fun read(name: String) = javaClass.classLoader!!.getResourceAsStream(name)!!
        .bufferedReader(Charsets.UTF_8).use { it.readText().removePrefix("\uFEFF") }
    private fun rows(name: String): List<JSONObject> = JSONArray(read(name)).let { data ->
        (0 until data.length()).map { data.getJSONObject(it) }
    }
    private fun runtime(file: String) = ScenarioRuntimeV3(JSONObject(read("v3/$file.json")))
    private val cases get() = rows("step21-cases.json")
    private fun run(engine: ScenarioRuntimeV3, actions: List<String>) =
        actions.fold(engine.create()) { state, input -> engine.step(state, input).state }
    private fun exposure(row: JSONObject) = row.getJSONObject("exposure").let { values ->
        values.keys().asSequence().associateWith { values.getInt(it) }
    }
    private fun assertEnding(state: ScenarioStateV3, type: String, level: String, scores: Map<String, Int>) {
        assertEquals(type, state.endingType)
        assertEquals(level, state.injuryLevel)
        assertEquals(scores, state.exposure)
    }

    @Test fun fireLegacyBaselineAndMigrationMatchEveryTurn() {
        val legacy = FireDrill(JSONObject(read("fire-dorm.json")))
        val current = runtime("fire-dorm")
        var turns = 0
        for (scenario in rows("fire-cases.json")) {
            var prior = legacy.create()
            var converted = current.create()
            for (turn in scenario.objects("turns")) {
                val text = turn.getString("text")
                val intent = turn.optString("intent", "action")
                val a = legacy.step(prior, text, intent)
                val b = current.step(converted, text, intent)
                prior = a.state
                converted = b.state
                assertEquals(text, turn.getString("kind"), a.kind)
                assertEquals(text, turn.getInt("node"), prior.node)
                assertEquals(text, turn.optString("outcome", "CONTINUE"), prior.outcome.name)
                assertEquals(text, a.kind, mapOf("completed" to "success", "transition" to "advance")[b.kind] ?: b.kind)
                assertEquals(text, legacy.nodes[prior.node].getString("id"), converted.node)
                assertEquals(text, prior.elapsed, converted.elapsed)
                turns += 1
            }
        }
        assertEquals(38, turns)
    }

    @Test fun sixBestRoutesAndImmediateProtection() {
        for (row in cases) {
            val engine = runtime(row.getString("file"))
            val best = run(engine, row.strings("best"))
            assertEnding(best, row.getString("endingType"), row.getString("injuryLevel"), exposure(row))
            assertEquals(false, best.injuryWorsened)
            assertEquals("base", best.variantId)
            if (best.endingType == "SAFE_RESCUE") assertEquals(1, best.events.count { it.kind == "rescue_contact" })
            val critical = run(engine, listOf(row.getString("danger")))
            assertEnding(critical, "CRITICAL_FAILURE", "NOT_ASSESSED", exposure(row))
            assertTrue(critical.injuryCauses.isEmpty())
        }
    }

    @Test fun fireAndSchoolReachEverySpecifiedGrade() {
        for (row in cases) {
            val engine = runtime(row.getString("file"))
            for (grade in row.objects("graded")) {
                assertEnding(run(engine, grade.strings("actions")), grade.getString("endingType"),
                    grade.getString("injuryLevel"), exposure(grade))
            }
        }
    }

    @Test fun eighteenSequencesReplayFiveTimes() {
        for (row in cases) {
            val engine = runtime(row.getString("file"))
            val sequences = listOf(row.strings("best"), listOf(row.getString("danger")), listOf("哈哈哈") + row.strings("best"))
            for (inputs in sequences) {
                val reference = run(engine, inputs)
                repeat(5) { assertEquals(reference, run(engine, inputs)) }
            }
        }
    }

    @Test fun fortyEightEmotionCasesAndSharedSubjectAndConflictGuards() {
        for (row in cases) {
            val engine = runtime(row.getString("file"))
            val start = engine.create()
            val danger = row.getString("danger").removePrefix("我")
            assertEquals("clarify", engine.step(start, "室友$danger").kind)
            val npcName = engine.spec.getJSONObject("npc").getString("name")
            assertEquals("clarify", engine.step(start, "$npcName$danger").kind)
            val ready = engine.step(start, "我請${npcName}先停手").state
            assertEquals(true, ready.npc?.handled)
            assertEquals(start.node, ready.node)
            assertEquals("clarify", engine.step(start, "我$danger，但我不$danger").kind)
            for (sample in row.objects("emotion")) {
                val text = sample.getString("text")
                assertFalse(text, engine.step(start, text).kind in setOf("risk", "failed"))
                val result = engine.step(ready, text)
                assertFalse(text, result.kind in setOf("risk", "failed"))
                assertEquals(text, sample.getString("category"), result.state.npc?.emotion)
                assertEquals(start.exposure, result.state.exposure)
            }
        }
    }

    @Test fun actionIdsReplayIncludingGradedEndings() {
        for (row in cases) {
            val engine = runtime(row.getString("file"))
            val sequences = listOf(row.strings("best"), listOf(row.getString("danger"))) +
                row.objects("graded").map { it.strings("actions") }
            for (texts in sequences) {
                var state = engine.create()
                val ids = texts.map { text ->
                    val prior = state
                    state = engine.step(prior, text).state
                    state.events.drop(prior.events.size)
                        .filter { it.kind in setOf("action", "hazard", "blocked") }
                        .mapNotNull { it.action }.distinct().also { assertTrue(text, it.isNotEmpty()) }
                }
                repeat(5) {
                    val replayed = ids.fold(engine.create()) { prior, turn -> engine.replayActions(prior, turn).state }
                    assertEnding(replayed, state.endingType!!, state.injuryLevel!!, state.exposure)
                }
            }
        }
    }

    @Test fun previouslyVerifiedDangerAndSafeInputs() {
        for (row in cases) {
            val engine = runtime(row.getString("file"))
            for (input in row.objects("regressionDanger")) {
                val text = input.getString("text")
                assertEquals(text, input.getString("kind"), engine.step(engine.create(), text).kind)
            }
            for (text in row.strings("regressionSafe")) {
                assertFalse(text, engine.step(engine.create(), text).kind in setOf("risk", "failed"))
            }
        }
    }

    @Test fun f5GatesStopAtTwoAndImmediateActionsTakePriority() {
        val engine = runtime("fire-dorm")
        val start = engine.create()
        val packed = engine.step(start, "我要收拾行李")
        assertEquals("risk", packed.kind)
        assertEquals(start.node, packed.state.node)
        assertEquals(0, packed.state.elapsed)
        assertEquals(start.exposure, packed.state.exposure)
        for (guard in listOf("doorClosed", "playerInside", "hallSmoke")) {
            val wrong = start.copy(facts = start.facts + Pair(guard, (!start.facts.getValue(guard).toBoolean()).toString()))
            assertEquals(start.exposure, engine.step(wrong, "先等一下").state.exposure)
        }
        assertEquals(mapOf("heat" to 0, "smoke" to 5), run(engine, List(3) { "先等一下" }).exposure)
        assertEnding(run(engine,listOf("我徒手抓住熱門把，我搭電梯")), "CRITICAL_FAILURE", "NOT_ASSESSED", start.exposure)
    }
}
