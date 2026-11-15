package com.pocketkb.android.core

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class ProfessorDemoPathTest {
    private fun read(name: String) = javaClass.classLoader!!.getResourceAsStream(name)!!
        .bufferedReader(Charsets.UTF_8).use { it.readText() }

    @Test
    fun dormFireCompletesWaitingDecisionsButNeverClaimsRescue() {
        val engine = FireDrill(JSONObject(read("fire-dorm.json")))
        var state = engine.create()
        listOf(
            "我把房門關好",
            "我撥119求救",
            "我告知地址是安學路100號A棟宿舍",
            "我回報五樓503室有人受困",
            "我留在房內等待救援",
            "我保持通訊並依消防人員指示",
        ).forEach { state = engine.step(state, it).state }

        assertEquals(DrillOutcome.SUCCESS, state.outcome)
        assertEquals(3, state.completed.size)
        val review = engine.review(state)
        assertEquals(false, review.contains("已獲救"))

        val failed = engine.step(engine.create(), "我搭電梯離開")
        assertEquals(DrillOutcome.FAILED, failed.state.outcome)
        assertEquals("locked", engine.step(failed.state, "我改成關門").kind)
    }

    @Test
    fun trappedHomeEndsWaitingForRescueAndLocksUnsafeFailure() {
        val engine = ScenarioRuntimeV3(JSONObject(read("v3/earthquake-home-trapped.json")))
        var state = engine.create()
        listOf(
            "我先檢查自己的傷口和周遭環境",
            "我不強行搬動倒塌物",
            "我傳送目前地址和受困位置",
            "我關閉非必要程式來節省手機電量",
            "我敲擊管線發出求救訊號",
            "我控制飲水並減少活動保存體力",
        ).forEach { state = engine.step(state, it).state }

        assertEquals("COMPLETED", state.sessionStatus)
        assertEquals("WAITING_RESCUE", state.physicalStatus)
        assertNotEquals("EVACUATED", state.physicalStatus)
        assertNotEquals("RESCUED", state.physicalStatus)

        val failed = engine.step(engine.create(), "我強行搬開家具和碎石逃出去")
        assertEquals("FAILED", failed.state.sessionStatus)
        assertEquals("locked", engine.step(failed.state, "我改成檢查傷勢").kind)
    }

    @Test
    fun barrierLakeCanEvacuateWaitForRescueOrFailBasedOnDecisions() {
        val engine = ScenarioRuntimeV3(JSONObject(read("v3/barrier-lake-downstream.json")))

        var evacuated = engine.create()
        listOf(
            "我確認官方撤離命令與指定路線",
            "我立即沿東側指定路線撤往高地",
        ).forEach { evacuated = engine.step(evacuated, it).state }
        assertEquals("EVACUATED", evacuated.physicalStatus)

        var delayed = engine.step(engine.create(), "我先繼續收拾行李和財物").state
        assertEquals("cutoff", delayed.node)
        listOf(
            "我前往公告的就近垂直避難點",
            "我回報目前位置與受困人數",
            "我留在避難點等待並節省物資電量",
        ).forEach { delayed = engine.step(delayed, it).state }
        assertEquals("WAITING_RESCUE", delayed.physicalStatus)

        val failed = engine.step(engine.create(), "我到河邊觀看堰塞湖")
        assertEquals("FAILED", failed.state.sessionStatus)
        assertEquals("locked", engine.step(failed.state, "我改成撤離").kind)
    }
}
