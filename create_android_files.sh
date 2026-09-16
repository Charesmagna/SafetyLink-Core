#!/bin/bash
mkdir -p android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui
mkdir -p android/app/src/main/res/values

# Task 2
cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/MainActivity.kt
package com.aistudio.safetylink.vqnztp.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Column {
                        MainHeader()
                        // Based on state, show LoginScreen, IndividualDashboardScreen, etc.
                        LoginScreen()
                    }
                }
            }
        }
    }
}
KOTLIN

cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/MainHeader.kt
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
KOTLIN

cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/LoginScreen.kt
package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LoginScreen() {
    var selectedTabIndex by remember { mutableStateOf(0) }
    val tabs = listOf("Login", "Register Individual", "Register Org", "Family")

    Column(Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTabIndex) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = { Text(title) }
                )
            }
        }
        
        when (selectedTabIndex) {
            1 -> {
                // Register Individual
                Text("Register Individual")
                // Simulate Moya check
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Text(
                        text = "Download Moya App for Data-Free Access!",
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
            // Other tabs...
        }
    }
}
KOTLIN

cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/IndividualDashboardScreen.kt
package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun IndividualDashboardScreen() {
    Column(Modifier.fillMaxSize()) {
        MainHeader()
        
        Spacer(Modifier.height(32.dp))
        
        Button(
            onClick = {
                // PanicRouter.sendPanic(data)
            },
            modifier = Modifier.fillMaxWidth().height(120.dp).padding(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
        ) {
            Text("PANIC BUTTON", color = Color.White)
        }
        
        Text("Emergency Contacts (Max 3)", modifier = Modifier.padding(16.dp))
        // CRUD for 3 contacts
        
        // NTFY SSE Listener setup would go here in a LaunchedEffect
        LaunchedEffect(Unit) {
            // Listen to NTFY SSE
        }
    }
}
KOTLIN

cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/PanicRouter.kt
package com.aistudio.safetylink.vqnztp.ui

import android.content.Context
import android.content.Intent
import android.net.Uri

object PanicRouter {
    fun sendPanic(context: Context, data: String, hasInternet: Boolean, hasMoya: Boolean, smsEnabled: Boolean, batteryPct: Int) {
        val payload = if (batteryPct < 15) "LOW BATTERY $data" else data
        
        // 1. CameraX & Audio capture would trigger here
        // 2. Vibration + Siren
        
        if (hasInternet) {
            // api.postPanic(payload)
        } else if (hasMoya) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("moya://share?text=$payload"))
            context.startActivity(intent)
        } else {
            // sendSMS()
            if (smsEnabled) {
                // send WA via Twilio API equivalent
            }
            // Offline Queue: If no internet + no Moya, queue panic
        }
        
        // After success, schedule LizzyPopup in 2min
    }
}
KOTLIN

cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/LizzyPopup.kt
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
KOTLIN

cat << 'XML' > android/app/src/main/res/values/strings.xml
<resources>
    <string name="app_name">SafetyLink</string>
    <string name="login">Login</string>
    <!-- Translations for EN, ZU, AF, ST, XH would be here -->
</resources>
XML

# Task 3
cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/OrgDashboardScreen.kt
package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun OrgDashboardScreen() {
    Column(Modifier.fillMaxSize()) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.Yellow),
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Text("48hr Banner - Action Required", color = Color.Black, modifier = Modifier.padding(16.dp))
        }
        
        Button(onClick = { /* Add Guard */ }) {
            Text("Add Guard")
        }
        
        Button(onClick = { /* Evidence Locker ZIP */ }) {
            Text("Download Evidence Locker ZIP")
        }
        
        Button(onClick = { /* Download SAPS Report */ }) {
            Text("Download SAPS Report")
        }
        
        // NTFY SSE Listener
    }
}
KOTLIN

# Task 4
cat << 'KOTLIN' > android/app/src/main/java/com/aistudio/safetylink/vqnztp/ui/FamilyDashboardScreen.kt
package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun FamilyDashboardScreen() {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Button(onClick = { /* Add Member */ }) {
            Text("Add Member")
        }
        
        Spacer(Modifier.height(16.dp))
        
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.Red),
            modifier = Modifier.fillMaxWidth().height(100.dp)
        ) {
            Box(Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                Text("I'M ON MY WAY", color = Color.White, style = MaterialTheme.typography.headlineMedium)
            }
        }
        
        // NTFY SSE
    }
}
KOTLIN

