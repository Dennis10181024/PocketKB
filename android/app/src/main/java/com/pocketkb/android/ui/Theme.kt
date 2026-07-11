package com.pocketkb.android.ui

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

object PocketColors {
    val SafetyOrange = Color(0xFFFF6A00)
    val EmergencyRed = Color(0xFFC62828)
    val AppBg = Color(0xFF0B0B0B)
    val Surface = Color(0xFF1F1F1F)
    val MidGray = Color(0xFF9E9E9E)
    val AccentYellow = Color(0xFFFFD54F)
    val SuccessGreen = Color(0xFF2E7D32)
}

private val PocketColorScheme: ColorScheme = darkColorScheme(
    primary = PocketColors.SafetyOrange,
    secondary = PocketColors.AccentYellow,
    background = PocketColors.AppBg,
    surface = PocketColors.Surface,
    error = PocketColors.EmergencyRed,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White,
)

@Composable
fun PocketKbTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = PocketColorScheme,
        content = content,
    )
}
