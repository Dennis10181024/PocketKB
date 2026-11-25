package com.pocketkb.android.ui

import android.graphics.Bitmap
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import com.pocketkb.android.MainActivity
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import java.io.File

class ChoiceScreenTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun capture(name: String) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        if (InstrumentationRegistry.getArguments().getString("pocketkbScreens") != "true") return
        val target = requireNotNull(instrumentation.targetContext.getExternalFilesDir(null))
        val image = requireNotNull(instrumentation.uiAutomation.takeScreenshot())
        File(target, "$name.png").outputStream().use { image.compress(Bitmap.CompressFormat.PNG, 100, it) }
        image.recycle()
    }

    @Test fun choicePathObservationFatalRetryAndSafeRescue() {
        rule.onNodeWithText("開始情境演練").performClick()
        fun await(tag: String) = rule.waitUntil(10_000) { rule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty() }
        await("choice_pack_drill_fire_dorm")
        rule.onNodeWithTag("choice_pack_drill_fire_dorm").performClick()
        rule.onNodeWithText("演練中可能出現受傷的結果，你可以隨時停止。").assertIsDisplayed()
        capture("step52-notice")
        rule.onNodeWithTag("choice_start").performClick()
        await("choice_elevator")
        capture("step52-choice")
        rule.onNodeWithText("先看看四周").performScrollTo().performClick()
        rule.onNodeWithTag("choice_inspection").assertTextContains("門仍開著", substring = true)
        rule.onNodeWithTag("choice_elevator").performScrollTo().performClick()
        rule.waitUntil(10_000) { rule.onAllNodesWithText("受困電梯，等待救援").fetchSemanticsNodes().isNotEmpty() }
        rule.onAllNodesWithTag("choice_grade").assertCountEquals(0)
        capture("step52-fatal")
        val list = rule.onNode(hasScrollAction())
        list.performScrollToNode(hasTestTag("choice_retry"))
        rule.onNodeWithTag("choice_retry").performClick()
        val safe = listOf("close_warn", "help_roommate", "full_call", "seal_gap", "window_signal", "keep_line", "stay_ready", "answer_rescuer")
        for (id in safe) {
            rule.waitForIdle()
            list.performScrollToNode(hasTestTag("choice_$id"))
            rule.onNodeWithTag("choice_$id").performClick()
        }
        await("choice_grade")
        rule.onNodeWithTag("choice_grade").assertTextContains("無傷", substring = true)
        capture("step52-safe")
        list.performScrollToNode(hasText("回到情境清單"))
        rule.onNodeWithText("回到情境清單").performClick()
    }

    @Test fun resumesAfterForceStop() {
        val args = InstrumentationRegistry.getArguments()
        val phase = args.getString("choiceRestart")
        assumeTrue(phase == "prepare" || phase == "verify")
        rule.onNodeWithText("開始情境演練").performClick()
        fun await(tag: String) = rule.waitUntil(10_000) { rule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty() }
        if (phase == "prepare") {
            await("choice_pack_earthquake_school")
            rule.onNodeWithTag("choice_pack_earthquake_school").performClick()
            rule.onNodeWithTag("choice_start").performClick()
            await("choice_take_cover")
            rule.onNode(hasScrollAction()).performScrollToNode(hasTestTag("choice_take_cover"))
            rule.onNodeWithTag("choice_take_cover").performClick()
            rule.waitUntil(10_000) {
                rule.onAllNodesWithText("小維說：「我想拉開後門，叫隔壁班一起走。」我怎麼回他？").fetchSemanticsNodes().isNotEmpty()
            }
        } else {
            await("choice_prompt")
            rule.onNodeWithTag("choice_prompt").assertTextContains("小維說：「我想拉開後門", substring = true)
            rule.onNode(hasScrollAction()).performScrollToNode(hasText("停止演練"))
            rule.onNodeWithText("停止演練").performClick()
            rule.onNodeWithText("停止並回到清單").performClick()
            await("choice_pack_earthquake_school")
        }
    }
}
