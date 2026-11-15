package com.pocketkb.android.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.pocketkb.android.MainActivity
import org.junit.Rule
import org.junit.Test

class OnlineCoachEntryTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test fun onlineModeHasVisibleEntryAndCanBeSelected() {
        rule.onNodeWithText("開始情境演練").performClick()
        rule.onNodeWithText("GPT 線上演練").assertIsDisplayed()
        rule.onNode(isToggleable()).performClick()
        rule.onNodeWithText("線上模式會將對話傳送至 OpenAI，請勿輸入個人資料。支援火災與五個新版因果劇本；其他舊版情境使用離線規則。").assertIsDisplayed()
    }
}
