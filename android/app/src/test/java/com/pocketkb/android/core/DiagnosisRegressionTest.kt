package com.pocketkb.android.core

import com.pocketkb.android.ai.coachTurnOrFallback
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.net.SocketTimeoutException

class DiagnosisRegressionTest {
    private fun spec(file: String) = JSONObject(
        checkNotNull(javaClass.classLoader?.getResourceAsStream(file)).bufferedReader(Charsets.UTF_8).use { it.readText() },
    )

    @Test fun imaginedHypotheticalNegatedAndQuestionInputsLeaveStateUnchanged() {
        val fire = FireDrill(spec("fire-dorm.json"))
        val school = ScenarioRuntimeV3(spec("v3/earthquake-school.json"))
        val fireState = fire.create()
        val schoolState = school.create()
        for (text in listOf("我只是想像衝去搭電梯", "如果我衝去搭電梯會怎樣？", "我不會衝去搭電梯", "可以衝去搭電梯嗎？")) {
            assertEquals(text, fireState, fire.step(fireState, text).state.copy(elapsed = 0, consecutiveQuestions = 0))
            assertEquals(text, schoolState, school.step(schoolState, text).state.copy(elapsed = 0, consecutiveQuestions = 0))
        }
    }

    @Test fun verifiesEveryDeclaredFactAndResourceCondition() {
        val files = listOf("fire-dorm", "earthquake-school", "earthquake-home-trapped", "flood-low-home", "landslide-mountain-road", "barrier-lake-downstream")
        var checks = 0
        for (file in files) {
            val json = spec("v3/$file.json")
            val runtime = ScenarioRuntimeV3(json)
            for (action in json.objects("actions")) {
                val requires = action.optJSONObject("requires") ?: continue
                val node = json.objects("nodes").first { action.getString("id") in it.strings("available") }
                val initial = runtime.create()
                val factRules = requires.optJSONObject("facts") ?: JSONObject()
                val resourceRules = requires.optJSONObject("resources") ?: JSONObject()
                val ready = initial.copy(node = node.getString("id"),
                    facts = initial.facts + factRules.keys().asSequence().associateWith { factRules.get(it).toString() },
                    resources = initial.resources + resourceRules.keys().asSequence().associateWith { resourceRules.getJSONObject(it).getInt("min") })
                val input = action.getString("label")
                assertFalse(input, runtime.step(ready, input).kind in listOf("blocked", "risk", "clarify"))
                for (key in factRules.keys()) {
                    val expected = if (action.optBoolean("unsafeWhenBlocked")) "risk" else "blocked"
                    val opposite = (!ready.facts.getValue(key).toBoolean()).toString()
                    for (facts in listOf(ready.facts - key, ready.facts + (key to opposite))) {
                        val result = runtime.step(ready.copy(facts = facts), input)
                        assertEquals(expected, result.kind)
                        assertEquals(ready.accepted, result.state.accepted)
                    }
                    checks++
                }
                for (key in resourceRules.keys()) {
                    assertEquals("blocked", runtime.step(ready.copy(resources = ready.resources + (key to ready.resources.getValue(key) - 1)), input).kind)
                    checks++
                }
            }
        }
        assertEquals(14, checks)
    }

    @Test fun blockedNoviceFireActionsExplainTheSceneWithoutChangingSafetyFacts() {
        val runtime = ScenarioRuntimeV3(spec("v3/fire-dorm.json"))
        val start = runtime.create(firstAidEnabled = true)
        val towel = runtime.step(start, "拿濕毛巾堵住門口")
        assertEquals("blocked", towel.kind)
        assertTrue(towel.message.contains("布料貼不住"))
        assertEquals(start.elapsed + 1, towel.state.elapsed)
        val openWindow = runtime.step(towel.state, "尋找對外窗打開並呼救")
        assertEquals("blocked", openWindow.kind)
        assertTrue(openWindow.message.contains("房門還開著"))
        assertEquals("false", openWindow.state.facts["doorClosed"])
        assertEquals(start.elapsed + 2, openWindow.state.elapsed)
    }

    @Test fun transportTimeoutRunsLocalTurnOnceAndCancellationDoesNotReplay() = runBlocking {
        val engine = FireDrill(spec("fire-dorm.json"))
        var state = engine.create()
        var localCalls = 0
        val local = { localCalls++; state = engine.step(state, "我把房門關好").state }
        coachTurnOrFallback(remote = { throw SocketTimeoutException() }, offline = local)
        assertEquals(1, state.node)
        assertEquals(1, localCalls)
        try {
            coachTurnOrFallback(remote = { throw CancellationException() }, offline = local)
            fail("Cancellation must propagate")
        } catch (_: CancellationException) {
            assertEquals(1, localCalls)
        }
    }
}
