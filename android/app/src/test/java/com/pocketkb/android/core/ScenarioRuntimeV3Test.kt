package com.pocketkb.android.core

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class ScenarioRuntimeV3Test {
    private fun read(name: String) = javaClass.classLoader!!.getResourceAsStream(name)!!
        .bufferedReader(Charsets.UTF_8).use { it.readText() }

    private fun runtime(name: String) = ScenarioRuntimeV3(JSONObject(read("v3/$name.json")))

    @Test fun trappedPersonCompletesTrainingWithoutFalseEscapeOrRescue() {
        val engine = runtime("earthquake-home-trapped")
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
        assertEquals("SURVIVAL_STABILIZED", state.completionKind)
        assertNotEquals("EVACUATED", state.physicalStatus)
        assertNotEquals("RESCUED", state.physicalStatus)
    }

    @Test fun delayCanCloseEvacuationRouteAndChangeGoalToSurvival() {
        val engine = runtime("barrier-lake-downstream")
        var state = engine.create()
        val delayed = engine.step(state, "我先繼續收拾行李和財物")
        assertEquals("environment_change", delayed.kind)
        assertEquals("cutoff", delayed.state.node)
        state = delayed.state
        listOf(
            "我前往公告的就近垂直避難點",
            "我回報目前位置與受困人數",
            "我留在避難點等待並節省物資電量",
        ).forEach { state = engine.step(state, it).state }
        assertEquals("WAITING_RESCUE", state.physicalStatus)
    }

    @Test fun unsafeActionFailsAndLocksSession() {
        val engine = runtime("earthquake-school")
        val failed = engine.step(engine.create(), "我在搖晃時衝去搭電梯")
        assertEquals("FAILED", failed.state.sessionStatus)
        assertEquals("failed", failed.kind)
        assertEquals("locked", engine.step(failed.state, "我趴下").kind)
        val debrief = engine.review(failed.state)
        assert(debrief.contains("學習目標"))
        assert(debrief.contains("趴下、掩護、穩住"))
        assert(debrief.contains("危險決策"))
        assert(debrief.contains("搖晃時衝向電梯"))
        assert(debrief.contains("需要補強"))
        assert(debrief.contains("反思問題"))
    }

    @Test fun reviewDataSeparatesOutcomeActionsAndReflectionForTheUi() {
        val engine = runtime("earthquake-school")
        val failed = engine.step(engine.create(), "我在搖晃時衝去搭電梯")

        val review = engine.reviewData(failed.state)

        assertEquals("危急失敗", review.outcomeTitle)
        assertEquals(listOf("搖晃時衝向電梯"), review.hazardActions)
        assert(review.completedActions.isEmpty())
        assert(review.missingActions.contains("趴下、掩護、穩住"))
        assert(review.reflectionQuestions.isNotEmpty())
        assertEquals("危險決策", review.timeline.single().title)
    }

    @Test fun nonsenseAndConflictingDecisionsNeverAdvance() {
        val engine = runtime("barrier-lake-downstream")
        val initial = engine.create()
        val nonsense = engine.step(initial, "我今天晚餐想吃拉麵")
        assertEquals("clarify", nonsense.kind)
        assertEquals(initial.copy(elapsed = 1), nonsense.state)
        val conflict = engine.step(initial, "我立即沿東側指定路線撤離，但我先繼續收拾行李")
        assertEquals("clarify", conflict.kind)
        assertEquals(initial.copy(elapsed = 1), conflict.state)
    }

    @Test fun displayedGuidedLabelsAreExecutable() {
        val cases = listOf(
            Triple("earthquake-school", listOf("趴下、掩護、穩住", "等待主要搖晃停止", "依教師指示走安全樓梯疏散", "至集合點點名且不返回"), "EVACUATED"),
            Triple("earthquake-home-trapped", listOf("確認傷勢與周遭危險", "不強行搬動大型倒塌物", "傳送位置與受困資訊", "節省手機電量並定時查看訊息", "製造容易被救援人員辨識的訊號", "控制飲水與體力消耗"), "WAITING_RESCUE"),
            Triple("flood-low-home", listOf("不進入地下室或搶救車輛", "安全可及時關閉總電源", "移動到較高樓層垂直避難", "回報地址與受困位置", "節省飲水、電量與體力"), "WAITING_RESCUE"),
            Triple("landslide-mountain-road", listOf("確認官方警戒與封路資訊", "在安全點立即迴轉", "採用官方替代路線前往避難處所"), "EVACUATED"),
            Triple("barrier-lake-downstream", listOf("確認官方撤離命令與指定路線", "立即沿東側指定路線撤往高地"), "EVACUATED"),
        )
        cases.forEach { (name, labels, expected) ->
            val engine = runtime(name)
            var state = engine.create()
            labels.forEach { state = engine.step(state, it).state }
            assertEquals(name, expected, state.physicalStatus)
        }
    }
}
