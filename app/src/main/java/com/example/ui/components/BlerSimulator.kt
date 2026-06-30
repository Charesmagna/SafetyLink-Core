package com.example.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.BleDeviceEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.TelemetryLog

@Composable
fun BlerSimulator(
    devices: List<BleDeviceEntity>,
    isScanning: Boolean,
    pairingProgress: String?,
    telemetryLogs: List<TelemetryLog>,
    onStartScan: () -> Unit,
    onDisconnect: (String) -> Unit,
    onSimulateClick: (String) -> Unit,
    onClearTelemetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val activeDevice = devices.find { it.connectionState == "CONNECTED" }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp)
    ) {
        // Module Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = Icons.Default.Share, contentDescription = "BLE Hardware", tint = Emerald500)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "iTAG BLE WEARABLE MONITORS",
                style = MaterialTheme.typography.titleLarge,
                color = Slate100,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Device Connection Widget
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                if (activeDevice == null) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(imageVector = Icons.Default.Warning, contentDescription = "No Hardware", tint = Amber500, modifier = Modifier.size(36.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "NO PRIMARY EMERGENCY WEARABLE LINKED",
                            style = MaterialTheme.typography.bodyLarge,
                            color = Slate100,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Link an iTAG panic wearable for immediate emergency dispatch triggers.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )

                        if (pairingProgress != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            CircularProgressIndicator(color = Emerald500, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = pairingProgress,
                                style = MaterialTheme.typography.labelMedium.copy(fontFamily = JetBrainsMono),
                                color = Emerald500
                            )
                        } else {
                            Button(
                                onClick = onStartScan,
                                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Search, contentDescription = "Scan")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "RUN WEARABLE PAIRING WIZARD", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                } else {
                    // Paired Device Diagnostics Widget
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(Emerald500, RoundedCornerShape(50))
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = activeDevice.friendlyName,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = Slate100,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = "MAC: ${activeDevice.macAddress} • Model: ${activeDevice.deviceType}",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = JetBrainsMono),
                                color = Slate400
                            )
                        }
                        IconButton(onClick = { onDisconnect(activeDevice.macAddress) }) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Disconnect", tint = Red500)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Hardware stats: Battery and RSSI
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Battery Meter
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = "BATTERY LEVEL", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                Text(text = "${activeDevice.batteryLevel}%", style = MaterialTheme.typography.labelSmall, color = Emerald500)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { activeDevice.batteryLevel / 100f },
                                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                                color = Emerald500,
                                trackColor = Slate800,
                            )
                        }

                        // RSSI Signal Meter
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = "BLE RSSI METRIC", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                Text(text = "${activeDevice.rssi} dBm", style = MaterialTheme.typography.labelSmall, color = Amber500)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                val barCount = 5
                                val activeBars = when {
                                    activeDevice.rssi > -60 -> 5
                                    activeDevice.rssi > -70 -> 4
                                    activeDevice.rssi > -80 -> 3
                                    activeDevice.rssi > -90 -> 2
                                    else -> 1
                                }
                                for (i in 1..barCount) {
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(8.dp)
                                            .background(
                                                if (i <= activeBars) Amber500 else Slate800,
                                                RoundedCornerShape(2.dp)
                                            )
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Virtual iTAG Hardware Emulator Trigger Buttons
        Text(
            text = "HARDWARE SIMULATOR TRIGGER CONTROLS",
            style = MaterialTheme.typography.labelSmall,
            color = Slate400,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { onSimulateClick("SINGLE") },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                border = BorderStroke(1.dp, Slate800),
                shape = RoundedCornerShape(4.dp),
                enabled = activeDevice != null
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("1x CLICK", fontSize = 11.sp, fontFamily = JetBrainsMono, color = Slate100, fontWeight = FontWeight.Bold)
                    Text("Silent SOS", fontSize = 9.sp, color = Slate400)
                }
            }

            Button(
                onClick = { onSimulateClick("DOUBLE") },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                border = BorderStroke(1.dp, Slate800),
                shape = RoundedCornerShape(4.dp),
                enabled = activeDevice != null
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("2x CLICK", fontSize = 11.sp, fontFamily = JetBrainsMono, color = Slate100, fontWeight = FontWeight.Bold)
                    Text("Cancel SOS", fontSize = 9.sp, color = Slate400)
                }
            }

            Button(
                onClick = { onSimulateClick("TRIPLE") },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                border = BorderStroke(1.dp, Slate800),
                shape = RoundedCornerShape(4.dp),
                enabled = activeDevice != null
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("3x CLICK", fontSize = 11.sp, fontFamily = JetBrainsMono, color = Slate100, fontWeight = FontWeight.Bold)
                    Text("Distress", fontSize = 9.sp, color = Slate400)
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { onSimulateClick("LONG") },
                modifier = Modifier.weight(1.5f),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                border = BorderStroke(1.dp, Slate800),
                shape = RoundedCornerShape(4.dp),
                enabled = activeDevice != null
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Phone, contentDescription = "Voice Call", tint = Blue500, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Column {
                        Text("LONG PRESS", fontSize = 11.sp, fontFamily = JetBrainsMono, color = Slate100, fontWeight = FontWeight.Bold)
                        Text("Voice Callback Request", fontSize = 9.sp, color = Slate400)
                    }
                }
            }

            Button(
                onClick = { onSimulateClick("FALL_DETECTED") },
                modifier = Modifier.weight(1.5f),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                border = BorderStroke(1.dp, Slate800),
                shape = RoundedCornerShape(4.dp),
                enabled = activeDevice != null
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.LocationOn, contentDescription = "Impact", tint = Red500, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Column {
                        Text("IMPACT SENSOR", fontSize = 11.sp, fontFamily = JetBrainsMono, color = Slate100, fontWeight = FontWeight.Bold)
                        Text("Auto Fall distress SOS", fontSize = 9.sp, color = Slate400)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Live BLE telemetry diagnostic terminal
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "REAL-TIME DIAGNOSTIC TELEMETRY LOGS",
                style = MaterialTheme.typography.labelSmall,
                color = Slate400
            )
            IconButton(onClick = onClearTelemetry) {
                Icon(imageVector = Icons.Default.Refresh, contentDescription = "Clear logs", tint = Slate400, modifier = Modifier.size(16.dp))
            }
        }

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Slate900)
                .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                .padding(8.dp)
        ) {
            items(telemetryLogs) { log ->
                val levelColor = when (log.level) {
                    "ERROR" -> Red500
                    "WARN" -> Amber500
                    "DEBUG" -> Purple500
                    else -> Emerald500
                }
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp)) {
                    Text(
                        text = "[${log.tag}]",
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = JetBrainsMono),
                        color = levelColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = log.message,
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = JetBrainsMono),
                        color = Slate100,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
