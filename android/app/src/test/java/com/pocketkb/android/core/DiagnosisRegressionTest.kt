package com.pocketkb.android.core

import com.pocketkb.android.ai.coachTurnOrFallback
import com.pocketkb.android.data.ResearchPrivacy
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

    @Test fun practiceRecognizesDissuasionAndAnswersFromState() {
        val examples = mapOf(
            "fire-dorm" to listOf("小岑不要把門打開，我們先留在這", "小岑別開房門啦", "小岑拜託不要再把門拉開"),
            "earthquake-school" to listOf("小維先不要往外跑", "小維不行，往外跑", "小維你拜託不要跑出去"),
            "flood-low-home" to listOf("阿敏先不要下樓拿車", "阿敏不行，下去拿車", "阿敏拜託不要去地下室"),
        )
        for ((file, phrases) in examples) {
            val runtime = ScenarioRuntimeV3(spec("v3/$file.json"))
            for (text in phrases) {
                val response = runtime.step(runtime.create(firstAidEnabled = true), text)
                assertTrue(text, response.state.npc?.handled == true)
                assertTrue(text, response.state.events.any { it.kind == "npc_emotion_prompt" })
                assertFalse(text, response.state.events.any { it.kind == "action" })
            }
        }
        val fire = ScenarioRuntimeV3(spec("v3/fire-dorm.json"))
        val start = fire.create(firstAidEnabled = true)
        assertEquals("false", fire.step(start, "我不關門").state.facts["doorClosed"])
        val question = "窗戶那邊有煙嗎，可以開窗嗎？"
        val open = fire.step(start, question)
        assertEquals(start, open.state)
        assertTrue(open.message.contains("房門還留著一道縫"))
        assertEquals(listOf("nfa", "window-guide"), open.sourceIds)
        val smoky = start.copy(facts = start.facts + ("windowOutsideClear" to "false"))
        assertTrue(fire.step(smoky, question).message.contains("窗外有煙"))
    }

    @Test fun transportTimeoutRunsLocalTurnOnceAndCancellationDoesNotReplay() = runBlocking {
        val engine = FireDrill(spec("fire-dorm.json"))
        var state = engine.create()
        var localCalls = 0
        val local: (String) -> Unit = { reason ->
            assertEquals("CLIENT_TRANSPORT", reason)
            localCalls++
            state = engine.step(state, "我把房門關好").state
        }
        coachTurnOrFallback(remote = { throw SocketTimeoutException() }, offline = local)
        assertEquals(1, state.node)
        assertEquals(1, localCalls)
        try {
            coachTurnOrFallback(remote = { throw CancellationException() }, offline = local)
            fail("Cancellation must propagate")
        } catch (_: CancellationException) {
            assertEquals(1, localCalls)
        }
        coachTurnOrFallback(remote = { error("state mismatch") }, offline = { assertEquals("CLIENT_SYNC", it) })
    }

    @Test fun practiceDoesNotGrantBestRescueWhenRoommateIsIgnored() {
        val runtime = ScenarioRuntimeV3(spec("v3/fire-dorm.json"))
        val actions = listOf("我關門", "我撥119", "安學路100號A棟", "五樓503室", "我等待救援", "我保持通訊")
        val start = runtime.create(firstAidEnabled = true)
        val ignored = actions.fold(start) { state, text -> runtime.step(state, text).state }
        assertEquals("DELAYED_RESCUE", ignored.endingType)
        assertTrue(ignored.events.any { it.eventId == "npc-unhandled-rescue" })
        val handled = runtime.step(start, "小岑不要把門打開").state
        assertTrue(handled.events.any { it.kind == "npc_emotion_prompt" })
        assertEquals("SAFE_RESCUE", actions.fold(handled) { state, text -> runtime.step(state, text).state }.endingType)
    }

    @Test fun formalPracticeAdvancesBothScenarioGraphs() {
        val fire = ScenarioRuntimeV3(spec("v3/fire-dorm.json"), formal = true)
        val school = ScenarioRuntimeV3(spec("v3/earthquake-school.json"), formal = true)
        val exercises = listOf(
            Triple(fire, "SAFE_RESCUE", listOf(
                "我關門", "我打119，安學路100號A棟宿舍五樓503室，兩人受困，走廊都是煙",
                "小岑不要把門打開", "我聽見你擔心同學我陪你留在這裡", "我到窗邊揮衣", "我塞住門縫",
                "手機快沒電，我先關掉不用的背景程式，不要掛電話", "我依消防員指示",
            )),
            Triple(school, "SELF_EVACUATION", listOf(
                "我趴低鑽到桌底下，抓著桌腳不放", "小維不要往外跑", "我知道你擔心家人等老師確認動線後我陪你聽指示",
                "我等待地震停止", "我重新趴下躲到桌下抓穩", "我告訴老師同學腳踝受傷", "我依照老師走樓梯",
                "我回報二年二班在操場有一位同學腳踝受傷", "我留在集合點等消息",
            )),
        )
        for ((runtime, ending, actions) in exercises) {
            val nodes = mutableListOf<String>()
            val final = actions.fold(runtime.create(firstAidEnabled = true)) { state, text ->
                nodes += state.node
                runtime.step(state, text).state
            }
            assertEquals("3.2.0", final.version)
            assertEquals(actions.size, nodes.distinct().size)
            assertEquals(ending, final.endingType)
            assertEquals("NONE", final.injuryLevel)
        }
    }

    @Test fun researchPrivacyRemovesCredentialsAndPreservesOnlyOptedInText() {
        val key = listOf("sk", "test", "research_dummy_00000000000").joinToString("-")
        val record = JSONObject().put("input_text", "原文 $key 192.0.2.1 [2001:db8::98]")
            .put("reply_text", "我看見了房門").put("npc_state", JSONObject().put("handled", false))
        val enabled = ResearchPrivacy.protect(JSONObject(record.toString()), true)
        assertTrue(enabled.getString("input_text").startsWith("原文"))
        assertFalse(enabled.toString().contains(key))
        assertFalse(enabled.toString().contains("192.0.2.1"))
        assertFalse(enabled.toString().contains("2001:db8::98"))
        val disabled = ResearchPrivacy.protect(record, false)
        assertFalse(disabled.has("input_text"))
        assertFalse(disabled.has("reply_text"))
        assertTrue(disabled.has("npc_state"))
    }
}
