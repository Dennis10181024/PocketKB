package com.pocketkb.android.ui

import android.graphics.Bitmap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.platform.app.InstrumentationRegistry
import com.pocketkb.android.MainActivity
import java.io.File
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test

class Step23LivePracticeTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test fun fireScenarioAndGradedEndings() {
        assumeTrue(InstrumentationRegistry.getArguments().getString("step23Live") == "true")
        val timingsOnly = InstrumentationRegistry.getArguments().getString("step23Timings") == "true"
        rule.onNodeWithText("開始情境演練").performClick()
        rule.onNode(isToggleable()).performClick()
        val title = "深夜的宿舍"
        rule.onNodeWithText(title, substring = false).performScrollTo().performClick()
        if (!timingsOnly) screenshot("01-reminder")
        rule.onNodeWithText("準備好了，開始").performClick()
        rule.onNodeWithTag("scenario_narration").assertIsDisplayed()
        if (!timingsOnly) screenshot("02-round")
        rule.onNodeWithTag("scenario_hints").performScrollTo().performClick()
        waitFor("可以試著這樣說")
        rule.onNodeWithTag("scenario_hint_0").performScrollTo()
        if (!timingsOnly) screenshot("03-hints")
        send("小岑，先別開門。")
        send("我關門")
        waitFor("煙變濃")
        rule.onNodeWithTag("scenario_narration").performScrollTo()
        if (!timingsOnly) screenshot("04-escalation")
        send("我撥119")
        send("如果打開房門會有風險嗎？")
        waitFor("接線員說")
        rule.onNodeWithTag("scenario_narration").performScrollTo()
        screenshot("05-question")
        finishFire(called = true)
        waitFor("無傷")
        rule.onNodeWithTag("scenario_review_outcome").performScrollTo().assertIsDisplayed()
        screenshot("08-success-review")
        if (timingsOnly) return

        restart()
        send("我搭電梯", terminal = true)
        waitFor("傷勢不評定")
        rule.onNodeWithTag("scenario_review_outcome").performScrollTo()
        screenshot("06-critical")

        restart()
        send("我徒手抓住熱門把")
        send("我關門")
        finishFire(withAid = true)
        waitFor("輕傷")
        rule.onNodeWithTag("scenario_review_outcome").performScrollTo()
        screenshot("07-injury")
    }

    private fun finishFire(called: Boolean = false, withAid: Boolean = false) {
        if (!called) send("我撥119")
        send("安學路100號A棟宿舍五樓503室，兩人受困，走廊都是煙")
        if (withAid) send("小岑先不要開門")
        send("我聽見你擔心同學我陪你留在這裡")
        send("我到窗邊揮衣")
        send("我塞住門縫")
        send("我保持通話")
        send("我依消防員指示", terminal = !withAid)
        if (withAid) send("沖脫泡蓋送", terminal = true)
    }

    private fun restart() {
        rule.onNodeWithTag("scenario_review_restart").performScrollTo().performClick()
        rule.onNodeWithText("開始", substring = false).performClick()
    }

    private fun send(text: String, terminal: Boolean = false) {
        rule.onNodeWithTag("scenario_input").performScrollTo().performTextInput(text)
        rule.onNodeWithTag("scenario_submit").performScrollTo().performClick()
        rule.waitUntil(20_000) {
            val condition = if (terminal) hasTestTag("scenario_review_outcome") else hasTestTag("scenario_submit") and hasText("送出")
            rule.onAllNodes(condition).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun waitFor(text: String) = rule.waitUntil(15_000) {
        rule.onAllNodesWithText(text, substring = true).fetchSemanticsNodes().isNotEmpty()
    }

    private fun screenshot(name: String) {
        rule.waitForIdle()
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val image = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
        File(instrumentation.targetContext.cacheDir, "step23-$name.png").outputStream().use {
            check(image.compress(Bitmap.CompressFormat.PNG, 100, it))
        }
        image.recycle()
    }
}
