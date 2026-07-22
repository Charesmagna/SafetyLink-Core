package com.safetylink

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun IndividualDashboardScreen() {
    Column {
        MainHeader()
        Button(onClick = { PanicRouter.sendPanic(mapOf("test" to "data")) }) {
            Text("BIG RED PANIC BUTTON")
        }
        Text("Emergency Contacts CRUD")
        Text("NTFY SSE Listener Active")
    }
}
