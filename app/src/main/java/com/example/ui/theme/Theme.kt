package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = Emerald500,
    secondary = Amber500,
    tertiary = Purple500,
    background = Slate950,
    surface = Slate900,
    onPrimary = Slate950,
    onSecondary = Slate950,
    onBackground = Slate100,
    onSurface = Slate100,
    error = Red500
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true, // Force Dark Slate-Tactical Theme by default
    dynamicColor: Boolean = false, // Disable dynamic colors to preserve tactical styling
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
