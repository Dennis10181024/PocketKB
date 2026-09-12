package com.pocketkb.android.ui

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

object PocketColors {
    val SafetyOrange = Color(0xFFFFAB70)
    val EmergencyRed = Color(0xFFFF8994)
    val AppBg = Color(0xFF0B1423)
    val Surface = Color(0xFF172438)
    val MidGray = Color(0xFFB3C3D8)
    val AccentYellow = Color(0xFFFFD54F)
    val SuccessGreen = Color(0xFF7DDBB0)
    val Info = Color(0xFF9CCBFF)
    val MutedSurface = Color(0xFF21344C)
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
    surfaceVariant = PocketColors.MutedSurface,
    onSurfaceVariant = PocketColors.MidGray,
    outline = Color(0xFF60738D),
    secondaryContainer = PocketColors.MutedSurface,
    onSecondaryContainer = PocketColors.SafetyOrange,
)

@Composable
fun PocketKbTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = PocketColorScheme,
        content = content,
    )
}
