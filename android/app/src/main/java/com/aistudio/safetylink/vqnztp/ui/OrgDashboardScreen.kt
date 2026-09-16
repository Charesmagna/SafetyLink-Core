package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.collectLatest

@Composable
fun OrgDashboardScreen() {
    var liveDispatchStatus by remember { mutableStateOf("Standby") }
    
    Column(Modifier.fillMaxSize()) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.Yellow),
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Text("48hr Banner - Action Required", color = Color.Black, modifier = Modifier.padding(16.dp))
        }
        
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
        ) {
            Text("Dispatch Status: $liveDispatchStatus", modifier = Modifier.padding(16.dp))
        }
        
        Button(onClick = { /* Add Guard */ }, modifier = Modifier.padding(8.dp)) {
            Text("Add Guard")
        }
        
        Button(onClick = { /* Evidence Locker ZIP */ }, modifier = Modifier.padding(horizontal = 8.dp)) {
            Text("Download Evidence Locker ZIP")
        }
        
        Button(onClick = { /* Download SAPS Report */ }, modifier = Modifier.padding(8.dp)) {
            Text("Download SAPS Report")
        }
        
        // NTFY SSE Listener
        LaunchedEffect(Unit) {
            NtfySseClient.subscribe("safetylink_dispatch_org").collectLatest { data ->
                if(data.isNotBlank()) liveDispatchStatus = data
            }
        }
    }
}
