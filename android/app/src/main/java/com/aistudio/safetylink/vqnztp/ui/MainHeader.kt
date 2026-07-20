package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Row

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainHeader() {
    var isDarkTheme by remember { mutableStateOf(false) }
    var currentLanguage by remember { mutableStateOf("EN") }

    TopAppBar(
        title = { Text("SafetyLink") },
        actions = {
            Row {
                val languages = listOf("EN", "ZU", "AF", "ST", "XH")
                languages.forEach { lang ->
                    TextButton(onClick = { 
                        currentLanguage = lang
                        // TODO: Save to DataStore and reload strings.xml
                    }) {
                        Text(lang)
                    }
                }
                Switch(
                    checked = isDarkTheme,
                    onCheckedChange = { isDarkTheme = it }
                )
            }
        }
    )
}
