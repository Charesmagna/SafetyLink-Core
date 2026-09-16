package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.ui.viewmodel.SOSState

@Composable
fun EscalationEngineView(
    sosState: SOSState,
    gpsAccuracy: String,
    mockCurrentGps: String,
    escalationLogs: List<String>,
    onTriggerSos: () -> Unit,
    onCancelSos: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Module Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = Icons.Default.Warning, contentDescription = "Escalation Engine", tint = Red500)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "EMERGENCY ESCALATION ENGINE",
                style = MaterialTheme.typography.titleLarge,
                color = Slate100,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Giant Pulse SOS Button
        Box(
            modifier = Modifier
                .size(180.dp)
                .border(
                    width = 2.dp,
                    color = if (sosState != SOSState.IDLE) Red500 else Emerald500.copy(alpha = 0.4f),
                    shape = CircleShape
                )
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            val buttonColor = if (sosState != SOSState.IDLE) Red500 else Emerald500
            val labelText = if (sosState != SOSState.IDLE) "CANCEL\nSOS" else "TRIGGER\nPANIC SOS"

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(buttonColor)
                    .clickable {
                        if (sosState == SOSState.IDLE) {
                            onTriggerSos()
                        } else {
                            onCancelSos()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = labelText,
                    color = if (sosState != SOSState.IDLE) Slate100 else Slate950,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    lineHeight = 26.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // SOS Lifecycle Stage Indicators
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "ACTIVE PANIC LIFECYCLE MONITOR",
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate400,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    StageIndicator(label = "GPS Fix", active = sosState >= SOSState.ACQUIRING_GPS)
                    StageIndicator(label = "Evidence", active = sosState >= SOSState.CAPTURING_EVIDENCE)
                    StageIndicator(label = "Escalate", active = sosState >= SOSState.ESCALATING)
                    StageIndicator(label = "Sync Core", active = sosState >= SOSState.MOCK_SYNCING)
                    StageIndicator(label = "Dispatched", active = sosState >= SOSState.DISPATCHED)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Precision Telemetry details card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "GPS ACCURACY STATUS",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate400
                    )
                    Text(
                        text = gpsAccuracy,
                        style = MaterialTheme.typography.bodyMedium.copy(fontFamily = JetBrainsMono),
                        color = if (sosState != SOSState.IDLE) Emerald500 else Slate400,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "COORDINATES SECURED",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate400
                    )
                    Text(
                        text = mockCurrentGps,
                        style = MaterialTheme.typography.bodyMedium.copy(fontFamily = JetBrainsMono),
                        color = if (sosState != SOSState.IDLE) Emerald500 else Slate400,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Multi-channel Carrier Retries & Delivery Logs
        Text(
            text = "MULTI-CHANNEL CARRIER PIPELINE RETRIES & LOGS",
            style = MaterialTheme.typography.labelSmall,
            color = Slate400,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp)
        )

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Slate900)
                .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                .padding(8.dp)
        ) {
            if (escalationLogs.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Awaiting SOS trigger event pipeline data. Trigger panic manually or click a linked iTAG Wearable to start carrier handshakes.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                items(escalationLogs) { log ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Handshake",
                            tint = Emerald500,
                            modifier = Modifier.size(12.dp).padding(top = 4.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = log,
                            style = MaterialTheme.typography.labelMedium.copy(fontFamily = JetBrainsMono),
                            color = Slate100,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StageIndicator(label: String, active: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(16.dp)
                .background(
                    if (active) Emerald500 else Slate800,
                    CircleShape
                )
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontFamily = JetBrainsMono,
            color = if (active) Slate100 else Slate400,
            fontWeight = FontWeight.Bold
        )
    }
}
