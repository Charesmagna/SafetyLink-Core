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
