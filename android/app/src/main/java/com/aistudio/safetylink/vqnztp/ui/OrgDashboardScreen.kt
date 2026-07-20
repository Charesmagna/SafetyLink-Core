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
