package com.pocketkb.android.ui

import android.graphics.Bitmap
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
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

    @Test fun draftIsHiddenUntilOptInAndCanBeSkipped() {
        rule.onNodeWithText("開始情境演練").performClick()
        rule.waitUntil(10_000) { rule.onAllNodesWithTag("choice_pack_drill_fire_dorm").fetchSemanticsNodes().isNotEmpty() }
        rule.onAllNodesWithTag("choice_pack_metro_attack_draft").assertCountEquals(0)
        rule.onNodeWithText("演練設定").performClick()
        rule.onNode(hasScrollAction()).performScrollToNode(hasText("顯示草稿情境"))
        rule.onNodeWithText("顯示草稿情境").performClick()
        rule.onNode(hasScrollAction()).performScrollToNode(hasTestTag("choice_pack_metro_attack_draft"))
        rule.onNodeWithTag("choice_pack_metro_attack_draft").performClick()
        rule.onNodeWithText("包含突發攻擊", substring = true).assertIsDisplayed()
        rule.onNodeWithText("跳過此情境").performClick()
        rule.onNodeWithTag("choice_pack_drill_fire_dorm").assertIsDisplayed()
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

    @Test fun readingSettingsEnlargeTextAndExposeSemantics() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val preferences = context.getSharedPreferences("choice-reading", 0)
        val previousSize = preferences.getInt("size", 0)
        val previousContrast = preferences.getBoolean("contrast", false)
        preferences.edit().putInt("size", 0).putBoolean("contrast", false).commit()
        try {
            rule.onNodeWithText("開始情境演練").performClick()
            rule.waitUntil(10_000) { rule.onAllNodesWithTag("choice_pack_drill_fire_dorm").fetchSemanticsNodes().isNotEmpty() }
            val heading = rule.onNodeWithTag("choice_heading")
            val baseline = heading.fetchSemanticsNode().boundsInRoot.height
            rule.onNodeWithText("閱讀設定").performClick()
            val larger = rule.onNodeWithTag("choice_read_size_2")
            larger.assertIsNotSelected().performClick().assertIsSelected()
            val contrast = rule.onNodeWithTag("choice_read_contrast")
            contrast.assertIsOff().performClick().assertIsOn()
            rule.onNodeWithText("完成").performClick()
            check(heading.fetchSemanticsNode().boundsInRoot.height > baseline)
            check(rule.onNodeWithTag("choice_read_canvas").captureToImage().toPixelMap()[0, 0] == Color.Black)
            check(preferences.getInt("size", 0) == 2 && preferences.getBoolean("contrast", false))
            rule.onNodeWithTag("choice_pack_drill_fire_dorm").performClick()
            rule.onNode(hasScrollAction()).performScrollToNode(hasTestTag("choice_start"))
            rule.onNodeWithTag("choice_start").performClick()
            rule.waitUntil(10_000) { rule.onAllNodesWithTag("choice_prompt").fetchSemanticsNodes().isNotEmpty() }
            rule.onNodeWithTag("choice_prompt")
                .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
            rule.onNode(hasScrollAction()).performScrollToNode(hasText("停止演練"))
            rule.onNodeWithText("停止演練").performClick()
            rule.onNodeWithText("停止並回到清單").performClick()
        } finally {
            preferences.edit().putInt("size", previousSize).putBoolean("contrast", previousContrast).commit()
        }
    }
}
