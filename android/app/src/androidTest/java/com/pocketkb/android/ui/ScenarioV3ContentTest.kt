package com.pocketkb.android.ui

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextClearance
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.pocketkb.android.core.ScenarioReviewV3
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ScenarioV3ContentTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun idleHintsUseNinetyThenSixtySecondsAndPauseWhileDraftExists() {
        var model by mutableStateOf(activeModel())
        var idleRequests = 0
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(model, onLeave = {}, onObserve = {}, onSubmit = { _, _ -> }, onRestart = {},
                    onOpenSource = {}, onHint = { if (it == "idle") idleRequests++ })
            }
        }
        composeRule.mainClock.autoAdvance = false
        try {
            composeRule.mainClock.advanceTimeBy(89_000)
            composeRule.runOnIdle { check(idleRequests == 0) }
            composeRule.mainClock.advanceTimeBy(1_100)
            composeRule.runOnIdle {
                check(idleRequests == 1)
                model = model.copy(firstDecision = false, task = "在下一個地點決定行動")
            }
            composeRule.mainClock.advanceTimeBy(50_000)
            val input = composeRule.onNodeWithTag("scenario_input")
            input.performTextInput("我還在輸入")
            composeRule.mainClock.advanceTimeBy(100_000)
            composeRule.runOnIdle { check(idleRequests == 1) }
            input.performTextClearance()
            composeRule.mainClock.advanceTimeBy(59_000)
            composeRule.runOnIdle { check(idleRequests == 1) }
            composeRule.mainClock.advanceTimeBy(1_100)
            composeRule.runOnIdle { check(idleRequests == 2) }
        } finally {
            composeRule.mainClock.autoAdvance = true
        }
    }

    @Test
    fun onlineDraftSurvivesFailedResponseAndClearsOnlyAfterSuccess() {
        var model by mutableStateOf(activeModel().copy(onlineEnabled = true))
        val sent = mutableListOf<String>()
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(model, onLeave = {}, onObserve = {},
                    onSubmit = { text, _ -> sent += text }, onRestart = {}, onOpenSource = {})
            }
        }
        composeRule.onNodeWithTag("scenario_input").performTextInput("我很害怕，不知道怎麼辦")
        composeRule.onNodeWithTag("scenario_submit").performClick()
        composeRule.runOnIdle { model = model.copy(onlineError = "請重試") }
        composeRule.onNodeWithTag("scenario_input").assertTextEquals("你的行動或問題", "我很害怕，不知道怎麼辦")
        composeRule.onNodeWithTag("scenario_submit").performClick()
        composeRule.runOnIdle {
            check(sent.size == 2 && sent[0] == sent[1])
            model = model.copy(onlineError = "", onlineRevision = 1)
        }
        composeRule.onNodeWithTag("scenario_input").assertTextEquals("你的行動或問題", "")
    }

    @Test
    fun failedScenarioLocksFurtherInputAndShowsFailureReview() {
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(
                    model = terminalModel(
                        physicalStatus = "CRITICAL",
                        outcomeTitle = "危急失敗",
                    ),
                    onLeave = {},
                    onObserve = {},
                    onSubmit = { _, _ -> },
                    onRestart = {},
                    onOpenSource = {},
                )
            }
        }

        composeRule.onNodeWithTag("scenario_review_outcome").assertIsDisplayed()
        composeRule.onAllNodesWithTag("scenario_input").assertCountEquals(0)
        composeRule.onAllNodesWithTag("scenario_submit").assertCountEquals(0)
    }

    @Test
    fun directorDebriefRoutesRetryToTheSameDecisionInsteadOfStartingANewSession() {
        var retries = 0
        var newSessions = 0
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(
                    model = terminalModel(physicalStatus = "CRITICAL", outcomeTitle = "搭乘電梯後受困")
                        .copy(directorMode = true, canRetry = true),
                    onLeave = {}, onObserve = {}, onSubmit = { _, _ -> },
                    onRestart = { newSessions++ }, onOpenSource = {}, onRetryDecision = { retries++ },
                )
            }
        }
        composeRule.onNodeWithTag("scenario_review_retry_decision").performScrollTo().performClick()
        composeRule.runOnIdle { check(retries == 1 && newSessions == 0) }
    }

    @Test
    fun waitingForRescueIsNeverPresentedAsEvacuatedOrRescued() {
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(
                    model = terminalModel(
                        physicalStatus = "WAITING_RESCUE",
                        outcomeTitle = "穩定待救・尚未獲救",
                    ),
                    onLeave = {},
                    onObserve = {},
                    onSubmit = { _, _ -> },
                    onRestart = {},
                    onOpenSource = {},
                )
            }
        }

        composeRule.onNodeWithTag("scenario_review_outcome").assertIsDisplayed()
        composeRule.onNodeWithText("目前沒有安全逃生路線；已降低暴露並保存資源，但仍未獲救。")
            .assertIsDisplayed()
        composeRule.onAllNodesWithText("已完成撤離").assertCountEquals(0)
        composeRule.onAllNodesWithText("已由救援人員接觸").assertCountEquals(0)
    }

    @Test
    fun restartButtonEmitsExactlyOneNewScenarioRequest() {
        var restartRequests = 0
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(
                    model = terminalModel("CRITICAL", "危急失敗"),
                    onLeave = {},
                    onObserve = {},
                    onSubmit = { _, _ -> },
                    onRestart = { restartRequests += 1 },
                    onOpenSource = {},
                )
            }
        }

        composeRule.onNodeWithTag("scenario_review_restart").performScrollTo().performClick()
        composeRule.onNodeWithText("開始", substring = false).performClick()

        composeRule.runOnIdle {
            check(restartRequests == 1) { "restartRequests=$restartRequests" }
        }
    }

    @Test
    fun freeTextAndObserveControlsSendTheUserIntent() {
        val submissions = mutableListOf<Pair<String, String>>()
        var observeRequests = 0
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(
                    model = activeModel(),
                    onLeave = {},
                    onObserve = { observeRequests += 1 },
                    onSubmit = { text, intent -> submissions += text to intent },
                    onRestart = {},
                    onOpenSource = {},
                )
            }
        }

        composeRule.onNodeWithTag("scenario_input").performTextInput("我先確認出口是否安全")
        composeRule.onNodeWithTag("scenario_submit").performClick()
        composeRule.onNodeWithTag("scenario_observe").performClick()

        composeRule.runOnIdle {
            check(submissions == listOf("我先確認出口是否安全" to "action"))
            check(observeRequests == 1)
        }
    }

    @Test
    fun suggestionsFillTheFieldWithoutSubmittingAndStopIsAvailable() {
        var model by mutableStateOf(activeModel())
        var stops = 0
        val sent = mutableListOf<String>()
        var picked: Int? = null
        composeRule.setContent {
            PocketKbTheme {
                ScenarioV3Content(model, onLeave = { stops++ }, onObserve = {}, onSubmit = { _, _ -> }, onRestart = {}, onOpenSource = {},
                    onHint = { trigger -> if (trigger == "button") model = model.copy(hintOptions = listOf("我核對公告", "我先查看周圍", "我走原來的路")) },
                    onPracticeSubmit = { text, index, _ -> sent += text; picked = index })
            }
        }
        composeRule.onAllNodesWithTag("scenario_hint_0").assertCountEquals(0)
        composeRule.onNodeWithTag("scenario_hints").performScrollTo().performClick()
        composeRule.onNodeWithTag("scenario_hint_0").performScrollTo().performClick()
        composeRule.runOnIdle { check(sent.isEmpty()) }
        composeRule.onNodeWithTag("scenario_input").assertTextEquals("你的行動或問題", "我核對公告")
        composeRule.onNodeWithTag("scenario_submit").performScrollTo().performClick()
        composeRule.onNodeWithTag("scenario_stop").performScrollTo().performClick()
        composeRule.runOnIdle { check(sent.single() == "我核對公告" && picked == 0 && stops == 1) }
    }

    private fun activeModel() = ScenarioV3UiModel(
        sessionId = "active-session",
        scenarioTitle = "堰塞湖警戒：下游聚落",
        version = "3.0.0",
        physicalStatus = "EXPOSED",
        active = true,
        progress = 0.25f,
        situation = "官方已發布撤離命令。",
        task = "確認命令並決定下一步。",
        resources = mapOf("battery" to 65, "water" to 2, "energy" to 90),
        messages = emptyList(),
        suggestedActions = listOf("確認官方撤離命令與指定路線"),
        notice = "教學模擬",
        sources = emptyList(),
        review = null,
    )

    private fun terminalModel(
        physicalStatus: String,
        outcomeTitle: String,
    ) = ScenarioV3UiModel(
        sessionId = "test-session",
        scenarioTitle = "測試情境",
        version = "3.0.0",
        physicalStatus = physicalStatus,
        active = false,
        progress = 1f,
        situation = "測試現場",
        task = "演練已結束",
        resources = mapOf("battery" to 20, "water" to 1, "energy" to 50),
        messages = emptyList(),
        suggestedActions = emptyList(),
        notice = "教學模擬",
        sources = emptyList(),
        review = ScenarioReviewV3(
            version = "3.0.0",
            outcomeTitle = outcomeTitle,
            outcomeExplanation = "本次演練已鎖定。",
            learningObjectives = listOf("辨識危險行動"),
            completedActions = emptyList(),
            hazardActions = listOf("危險行動"),
            missingActions = listOf("安全行動"),
            resources = mapOf("battery" to 20, "water" to 1, "energy" to 50),
            commonMisconceptions = listOf("冒險不一定能逃生"),
            reflectionQuestions = listOf("下一次會怎麼做？"),
            timeline = emptyList(),
        ),
    )
}
