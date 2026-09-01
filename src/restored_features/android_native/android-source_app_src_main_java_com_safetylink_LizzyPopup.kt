package com.safetylink

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun LizzyPopup(onDismiss: () -> Unit, onRestart: () -> Unit, onChat: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Lizzy Safety Check") },
        text = { Text("Are you safe? Please respond.") },
        confirmButton = {
            Button(onClick = onDismiss) { Text("I'm Okay") }
        },
        dismissButton = {
            Button(onClick = onRestart) { Text("Restart Panic") }
            Button(onClick = onChat) { Text("Chat with Lizzy") }
        }
    )
}
