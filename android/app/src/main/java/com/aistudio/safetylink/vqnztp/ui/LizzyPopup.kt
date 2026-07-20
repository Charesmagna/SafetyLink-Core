package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.material3.*
import androidx.compose.runtime.*

@Composable
fun LizzyPopup(onDismiss: () -> Unit, onRestart: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Lizzy Check-in") },
        text = { Text("Are you okay? Checking in 2 minutes after panic.") },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("I'm Okay")
            }
        },
        dismissButton = {
            TextButton(onClick = onRestart) {
                Text("Restart Panic")
            }
        }
    )
}
