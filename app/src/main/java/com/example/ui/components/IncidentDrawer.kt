package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.IncidentEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.UserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentDrawer(
    incident: IncidentEntity?,
    currentRole: UserRole,
    onAssignResponder: (String, String) -> Unit,
    onResolve: (String) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (incident == null) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(Slate900)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "No Incident",
                    tint = Slate400,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "NO INCIDENT HIGHLIGHTED",
                    style = MaterialTheme.typography.titleMedium,
                    color = Slate400,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Tap on an blinking sonar node or map location to inspect active telemetry stream.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate400.copy(alpha = 0.7f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
        return
    }

    val severityColor = when (incident.severity) {
        "CRITICAL" -> Red500
        "HIGH" -> Amber500
        else -> Blue500
    }

    val statusColor = when (incident.status) {
        "TRIGGERED" -> Red500
        "ACTIVE" -> Red500
        "DISPATCHED" -> Amber500
        "RESPONDER_ARRIVED" -> Emerald500
        "RESOLVED" -> Blue500
        else -> Emerald500
    }

    var expandedMenu by remember { mutableStateOf(false) }
    val responderList = listOf("Alpha Tactical Team 1", "Campus Security Patrol B", "Umhlanga Rescue Alpha", "Gauteng AirMedic Unit 4")

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900)
            .border(1.dp, Slate800, RoundedCornerShape(0.dp))
            .padding(16.dp)
    ) {
        // Drawer Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = incident.id,
                    style = MaterialTheme.typography.titleLarge.copy(fontFamily = JetBrainsMono),
                    color = Slate100,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = incident.organization,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate400
                )
            }
            IconButton(onClick = onClose) {
                Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate100)
            }
        }

        Divider(color = Slate800, modifier = Modifier.padding(vertical = 12.dp))

        // Metadata badges
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BadgeContainer(label = incident.severity, color = severityColor)
            BadgeContainer(label = incident.status, color = statusColor)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Telemetry details
        Text(
            text = "GPS COORDINATES",
            style = MaterialTheme.typography.labelSmall,
            color = Slate400
        )
        Text(
            text = "${incident.lat}, ${incident.lng}",
            style = MaterialTheme.typography.bodyMedium.copy(fontFamily = JetBrainsMono),
            color = Emerald500,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Text(
            text = "DESCRIPTION",
            style = MaterialTheme.typography.labelSmall,
            color = Slate400
        )
        Text(
            text = incident.description,
            style = MaterialTheme.typography.bodyMedium,
            color = Slate100,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Medical Dossier
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate950),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Info, contentDescription = "Medical", tint = Red500, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "EMERGENCY MEDICAL DOSSIER",
                        style = MaterialTheme.typography.labelSmall,
                        color = Red500,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = incident.medicalProfile,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate100
                )
            }
        }

        // Timeline History
        Text(
            text = "TACTICAL TIMELINE",
            style = MaterialTheme.typography.labelSmall,
            color = Slate400
        )
        Spacer(modifier = Modifier.height(4.dp))
        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Slate950)
                .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                .padding(8.dp)
        ) {
            val logs = incident.timelineData.split(", ")
            for (log in logs) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Step Completed",
                        tint = Emerald500,
                        modifier = Modifier.size(12.dp).padding(top = 4.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = log,
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = JetBrainsMono),
                        color = Slate100,
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Role-Based actions
        if (incident.status != "RESOLVED") {
            if (currentRole == UserRole.DISPATCHER || currentRole == UserRole.ORG_ADMIN || currentRole == UserRole.SUPERVISOR) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Assign responder
                    Box {
                        Button(
                            onClick = { expandedMenu = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Send, contentDescription = "Dispatch")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "DISPATCH RESPONDER...")
                        }

                        DropdownMenu(
                            expanded = expandedMenu,
                            onDismissRequest = { expandedMenu = false },
                            modifier = Modifier.background(Slate900).border(1.dp, Slate800)
                        ) {
                            responderList.forEach { responder ->
                                DropdownMenuItem(
                                    text = { Text(responder, color = Slate100) },
                                    onClick = {
                                        onAssignResponder(incident.id, responder)
                                        expandedMenu = false
                                    }
                                )
                            }
                        }
                    }

                    // Resolve Incident
                    Button(
                        onClick = { onResolve(incident.id) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Check, contentDescription = "Resolve")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "MITIGATE & RESOLVE INCIDENT", fontWeight = FontWeight.Bold)
                    }
                }
            } else if (currentRole == UserRole.RESPONDER) {
                // First Responder Actions
                Button(
                    onClick = { onResolve(incident.id) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Icon(imageVector = Icons.Default.Check, contentDescription = "Mitigate")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "MARK AS FULLY MITIGATED", fontWeight = FontWeight.Bold)
                }
            } else {
                // Citizen
                Text(
                    text = "A dispatched responder (${incident.assignedResponder}) is traveling to your location. Keep your panic button with you and stay in a secure area.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Amber500,
                    fontWeight = FontWeight.SemiBold
                )
            }
        } else {
            // Already resolved
            Text(
                text = "This incident has been fully resolved and archived under safety protocols.",
                style = MaterialTheme.typography.bodyMedium,
                color = Blue500,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun BadgeContainer(label: String, color: Color) {
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
            .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontFamily = JetBrainsMono),
            color = color,
            fontWeight = FontWeight.Bold
        )
    }
}
