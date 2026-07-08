package com.aistudio.safetylink.itag.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// SafetyLink High Contrast Slate Theme Base Palette
val Slate950 = Color(0xFF030712)
val Slate900 = Color(0xFF0F172A)
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)

val Emerald400 = Color(0xFF34D399)
val Emerald500 = Color(0xFF10B981)
val Red500 = Color(0xFFEF4444)
val Amber400 = Color(0xFFFBBF24)

private val DarkColorScheme = darkColorScheme(
    primary = Emerald400,
    secondary = Color(0xFF3B82F6),
    background = Slate950,
    surface = Slate900,
    onPrimary = Slate950,
    onSecondary = Color.White,
    onBackground = Color(0xFFF1F5F9),
    onSurface = Color(0xFFE2E8F0)
)

private val LightColorScheme = lightColorScheme(
    primary = Emerald500,
    secondary = Color(0xFF2563EB),
    background = Color(0xFFF8FAFC),
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Slate950,
    onSurface = Slate900
)

@Composable
fun SafetyLinkITagTheme(
    darkTheme: Boolean = true, // Force Dark Slate Theme consistent with SafetyLink persistently!
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
