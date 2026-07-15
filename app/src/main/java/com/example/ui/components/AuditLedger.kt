package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.example.data.db.AuditLogEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.UserRole
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AuditLedger(
    logs: List<AuditLogEntity>,
    currentRole: UserRole,
    onRoleChange: (UserRole) -> Unit,
    onClearLogs: () -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    val filteredLogs = logs.filter {
        it.message.contains(searchQuery, ignoreCase = true) ||
        it.category.contains(searchQuery, ignoreCase = true) ||
        it.details.contains(searchQuery, ignoreCase = true)
    }

    val dateFormatter = remember { SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp)
    ) {
        // Module Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = Icons.Default.Lock, contentDescription = "Security Audit", tint = Amber500)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "SECURITY, RBAC & AUDIT LEDGER",
                    style = MaterialTheme.typography.titleLarge,
                    color = Slate100,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Role Selector and Privilege Indicator
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = "DYNAMIC ROLE-BASED ACCESS CONTROL (RBAC) SWITCH",
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate400,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                // Row of operational roles
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    UserRole.values().forEach { role ->
                        val isSelected = currentRole == role
                        Button(
                            onClick = { onRoleChange(role) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) Emerald500 else Slate800,
                                contentColor = if (isSelected) Slate950 else Slate400
                            ),
                            shape = RoundedCornerShape(4.dp),
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = role.displayName,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Interactive Permissions Matrix Visualizer
                Text(
                    text = "ACTIVE PRIVILEGE ENFORCEMENT MATRIX",
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate400,
                    modifier = Modifier.padding(bottom = 6.dp)
                )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate950)
                        .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                        .padding(8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    PermissionRow(title = "Trigger Urgent Panic SOS", allowed = true)
                    PermissionRow(title = "View Tactical Coordinates & GPS Tracker", allowed = currentRole != UserRole.CITIZEN)
                    PermissionRow(title = "Manual Dispatch Responder Assignments", allowed = currentRole == UserRole.DISPATCHER || currentRole == UserRole.ORG_ADMIN || currentRole == UserRole.SUPERVISOR)
                    PermissionRow(title = "Access Security Audit Ledger Database", allowed = currentRole == UserRole.SUPERVISOR || currentRole == UserRole.DISPATCHER || currentRole == UserRole.ORG_ADMIN)
                    PermissionRow(title = "Purge Ledger History & Export Cryptographic Signatures", allowed = currentRole == UserRole.ORG_ADMIN)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Immutable Ledger Explorer Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "IMMUTABLE AUDIT TRAIL LEDGER",
                style = MaterialTheme.typography.labelSmall,
                color = Slate400
            )

            if (currentRole == UserRole.ORG_ADMIN) {
                TextButton(onClick = onClearLogs) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Purge Ledger", tint = Red500, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Purge History", color = Red500, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Search Ledger
        TextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .border(1.dp, Slate800, RoundedCornerShape(4.dp)),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Slate900,
                unfocusedContainerColor = Slate900,
                focusedTextColor = Slate100,
                unfocusedTextColor = Slate100,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            ),
            placeholder = { Text("Filter audit database...", color = Slate400, fontSize = 13.sp) },
            leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Search", tint = Slate400) },
            shape = RoundedCornerShape(4.dp)
        )

        // Ledger Logs
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Slate900)
                .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                .padding(6.dp)
        ) {
            items(filteredLogs) { log ->
                val severityColor = when (log.severity) {
                    "SEVERE" -> Red500
                    "WARNING" -> Amber500
                    else -> Blue500
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                        .background(Slate950)
                        .padding(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .background(severityColor.copy(alpha = 0.15f), RoundedCornerShape(2.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = log.category,
                                    color = severityColor,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = log.message,
                                style = MaterialTheme.typography.bodyMedium,
                                color = Slate100,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Text(
                            text = dateFormatter.format(Date(log.timestamp)),
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = JetBrainsMono),
                            color = Slate400,
                            fontSize = 11.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = log.details,
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = JetBrainsMono),
                        color = Slate400,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

@Composable
fun PermissionRow(title: String, allowed: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, color = Slate100, fontSize = 11.sp)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = if (allowed) Icons.Default.CheckCircle else Icons.Default.Close,
                contentDescription = if (allowed) "Allowed" else "Forbidden",
                tint = if (allowed) Emerald500 else Red500,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = if (allowed) "ENFORCED" else "RESTRICTED",
                color = if (allowed) Emerald500 else Red500,
                style = MaterialTheme.typography.labelSmall,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
