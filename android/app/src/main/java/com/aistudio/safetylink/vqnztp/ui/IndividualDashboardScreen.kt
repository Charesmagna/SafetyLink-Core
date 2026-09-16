package com.aistudio.safetylink.vqnztp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.collectLatest

@Composable
fun IndividualDashboardScreen() {
    var lastAlert by remember { mutableStateOf<String?>(null) }
    
    Column(Modifier.fillMaxSize()) {
        MainHeader()
        
        Spacer(Modifier.height(32.dp))
        
        lastAlert?.let { alert ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth().padding(16.dp)
            ) {
                Text(
                    text = "Live Alert: $alert",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
        
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
        
        // NTFY SSE Listener
        LaunchedEffect(Unit) {
            NtfySseClient.subscribe("safetylink_dispatch_user").collectLatest { data ->
                if(data.isNotBlank()) lastAlert = data
            }
        }
    }
}
