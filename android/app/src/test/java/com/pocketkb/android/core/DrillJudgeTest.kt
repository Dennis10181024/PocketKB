package com.pocketkb.android.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DrillJudgeTest {
    private val judge = DrillJudge()

    private val fireScenario = KnowledgeBase.scenarios.first { it.id == "drill_fire_dorm" }
    private val underpassScenario = KnowledgeBase.scenarios.first { it.id == "drill_typhoon_underpass" }

    @Test
    fun fireStep1_correctDoorCheckAdvances() {
        val result = judge.evaluateUserAction(
            scenario = fireScenario,
            userText = "我先摸門把確認有沒有燙，並看門縫有沒有濃煙",
            stepState = DrillStepState(totalSteps = fireScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(1, result.progressDelta)
        assertTrue(result.safety == SafetyLevel.MEDIUM || result.safety == SafetyLevel.HIGH)
    }

    @Test
    fun fireStep1_riskyDirectDoorDoesNotAdvance() {
        val result = judge.evaluateUserAction(
            scenario = fireScenario,
            userText = "我直接開門看看，然後跑出去",
            stepState = DrillStepState(totalSteps = fireScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(0, result.progressDelta)
        assertEquals(SafetyLevel.LOW, result.safety)
        assertTrue(result.reason.contains("危險"))
    }

    @Test
    fun fireStep1_fatalElevatorFailsImmediately() {
        val result = judge.evaluateUserAction(
            scenario = fireScenario,
            userText = "我搭電梯下樓逃生",
            stepState = DrillStepState(totalSteps = fireScenario.steps.size),
        )

        assertEquals(DrillOutcome.FAILED, result.outcome)
        assertEquals(0, result.progressDelta)
        assertEquals(SafetyLevel.FAILED, result.safety)
    }

    @Test
    fun fireStep2_correctSmokeBlockAndCallAdvances() {
        val result = judge.evaluateUserAction(
            scenario = fireScenario,
            userText = "我關門並用衣物塞門縫阻煙，到窗邊打119說明位置",
            stepState = DrillStepState(currentStep = 2, totalSteps = fireScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(1, result.progressDelta)
        assertTrue(result.safety == SafetyLevel.MEDIUM || result.safety == SafetyLevel.HIGH)
    }

    @Test
    fun underpassStep1_correctStopAdvances() {
        val result = judge.evaluateUserAction(
            scenario = underpassScenario,
            userText = "我不進地下道，先停下並避開積水入口",
            stepState = DrillStepState(totalSteps = underpassScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(1, result.progressDelta)
        assertTrue(result.safety == SafetyLevel.MEDIUM || result.safety == SafetyLevel.HIGH)
    }

    @Test
    fun underpassStep1_riskyRunThroughDoesNotAdvance() {
        val result = judge.evaluateUserAction(
            scenario = underpassScenario,
            userText = "我快跑穿過地下道試試看",
            stepState = DrillStepState(totalSteps = underpassScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(0, result.progressDelta)
        assertEquals(SafetyLevel.LOW, result.safety)
    }

    @Test
    fun underpassStep1_fatalRideThroughFailsImmediately() {
        val result = judge.evaluateUserAction(
            scenario = underpassScenario,
            userText = "我騎車衝過去，應該一下就到了",
            stepState = DrillStepState(totalSteps = underpassScenario.steps.size),
        )

        assertEquals(DrillOutcome.FAILED, result.outcome)
        assertEquals(0, result.progressDelta)
        assertEquals(SafetyLevel.FAILED, result.safety)
    }

    @Test
    fun offTaskInputDoesNotAdvance() {
        val result = judge.evaluateUserAction(
            scenario = fireScenario,
            userText = "我今天想吃拉麵，晚上再說",
            stepState = DrillStepState(totalSteps = fireScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(0, result.progressDelta)
        assertEquals(SafetyLevel.LOW, result.safety)
        assertTrue(result.reason.contains("沒有明確關聯"))
    }

    @Test
    fun vagueInputDoesNotAdvance() {
        val result = judge.evaluateUserAction(
            scenario = fireScenario,
            userText = "看情況",
            stepState = DrillStepState(totalSteps = fireScenario.steps.size),
        )

        assertEquals(DrillOutcome.CONTINUE, result.outcome)
        assertEquals(0, result.progressDelta)
        assertEquals(SafetyLevel.LOW, result.safety)
    }

    @Test
    fun finalStepCorrectActionSucceeds() {
        val result = judge.evaluateUserAction(
            scenario = underpassScenario,
            userText = "我提醒旁人不要進入，並通報1999和學校這個危險地點",
            stepState = DrillStepState(currentStep = 3, totalSteps = underpassScenario.steps.size),
        )

        assertEquals(DrillOutcome.SUCCESS, result.outcome)
        assertEquals(1, result.progressDelta)
        assertTrue(result.safety == SafetyLevel.MEDIUM || result.safety == SafetyLevel.HIGH)
    }
}
