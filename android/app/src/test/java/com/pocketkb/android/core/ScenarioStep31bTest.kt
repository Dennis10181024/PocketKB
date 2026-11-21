package com.pocketkb.android.core

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ScenarioStep31bTest {
    private fun runtime(file: String): ScenarioRuntimeV3 {
        val json = javaClass.classLoader!!.getResourceAsStream("v3/$file.json")!!
            .bufferedReader(Charsets.UTF_8).use { it.readText().removePrefix("\uFEFF") }
        return ScenarioRuntimeV3(JSONObject(json), formal = true)
    }

    private fun actions(before: ScenarioStateV3, result: ScenarioResultV3) =
        result.state.events.drop(before.events.size).filter { it.kind == "action" }.mapNotNull { it.action }

    @Test fun fireEarlyIntentAndDissuasionDoNotRepeatGoals() {
        val engine = runtime("fire-dorm")
        val start = engine.create(firstAidEnabled = true)
        val open = engine.step(start, "我會去把門關起來 並跟小岑說不能開門並找濕毛巾把門縫塞住")
        assertEquals(listOf("close", "seal"), actions(start, open))
        assertEquals(true, open.state.npc?.handled)
        assertEquals("report", open.state.node)
        assertEquals("true", open.state.facts["goal_seal"])

        val retry = engine.step(open.state, "跟她說絕對不行開門")
        assertEquals(true, retry.state.npc?.handled)
        assertTrue(actions(open.state, retry).isEmpty())
        val report = engine.step(retry.state, "打電話給 119，並跟他說我們的地址跟現在遇到的情況")
        assertEquals(listOf("call", "address", "smoke_report"), actions(retry.state, report))
        assertTrue(report.message.contains("在幾樓、哪一間"))
    }

    @Test fun towelNeedsClosedDoorAndDangerStillOverrides() {
        val engine = runtime("fire-dorm")
        val start = engine.create(firstAidEnabled = true)
        assertEquals("blocked", engine.step(start, "我拿濕毛巾把門縫塞住").kind)
        val safe = engine.step(start, "把門關起來並找濕毛巾把門縫堵上")
        assertEquals(listOf("close", "seal"), actions(start, safe))
        assertEquals("risk", engine.step(start, "我離開房間去找濕毛巾").kind)
        assertEquals("failed", engine.step(start, "我現在就搭電梯下樓").kind)
        for (input in listOf("我不會搭電梯", "我看到同學搭電梯", "假設我搭電梯呢？", "我不關門")) {
            val result = engine.step(start, input)
            assertFalse(input, result.kind in setOf("failed", "risk"))
            assertTrue(input, actions(start, result).isEmpty())
        }
    }

    @Test fun teacherAcceptsReportFieldsTogether() {
        val engine = runtime("earthquake-school")
        val start = engine.create(firstAidEnabled = true).copy(node = "assembly")
        val first = engine.step(start, "我回報二年二班，大家在操場集合點")
        assertEquals(listOf("school_class", "school_location"), actions(start, first))
        assertTrue(first.message.contains("有幾人受傷"))
        assertEquals("return_choice", engine.step(first.state, "我回報一位同學腳踝受傷").state.node)
    }
}
