package com.aistudio.safetylink.itag

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewmodel.compose.viewModel
import androidx.compose.animation.*
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.aistudio.safetylink.itag.model.AlertDistance
import com.aistudio.safetylink.itag.model.ConnectionStatus
import com.aistudio.safetylink.itag.model.ITagDevice
import com.aistudio.safetylink.itag.model.ITagEvent
import com.aistudio.safetylink.itag.theme.*
import com.aistudio.safetylink.itag.viewmodel.ITagViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            Toast.makeText(this, "Permissions verified!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Bluetooth and Location permissions are required for tracking.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request BLE & Location permissions on startup
        checkAndRequestPermissions()

        setContent {
            SafetyLinkITagTheme {
                MainScreen()
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
            permissions.add(Manifest.permission.BLUETOOTH_ADVERTISE)
        }
        permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)

        val ungranted = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (ungranted.isNotEmpty()) {
            requestPermissionLauncher.launch(ungranted.toTypedArray())
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: ITagViewModel = viewModel()) {
    var selectedTab by remember { mutableStateOf(0) }
    val scannedDevices by viewModel.scannedDevices.collectAsState()
    val connectedDevices by viewModel.connectedDevices.collectAsState()
    val events by viewModel.events.collectAsState()
    val isScanning by viewModel.isScanning.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF3B82F6).copy(alpha = 0.2f))
                                .border(1.dp, Color(0xFF3B82F6).copy(alpha = 0.5f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = "SafetyLink Logo",
                                tint = Emerald400,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "SafetyLink iTAG",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "TM MEDIA SOLUTIONS",
                                color = Color.Gray,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate900
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Slate900,
                contentColor = Emerald400
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.BluetoothSearching, contentDescription = "Scan") },
                    label = { Text("Scan", fontSize = 10.sp, fontFamily = FontFamily.Monospace) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Emerald400,
                        selectedTextColor = Emerald400,
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray,
                        indicatorColor = Slate800
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Devices, contentDescription = "Trackers") },
                    label = { Text("Trackers", fontSize = 10.sp, fontFamily = FontFamily.Monospace) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Emerald400,
                        selectedTextColor = Emerald400,
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray,
                        indicatorColor = Slate800
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.History, contentDescription = "History") },
                    label = { Text("Logs & Settings", fontSize = 10.sp, fontFamily = FontFamily.Monospace) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Emerald400,
                        selectedTextColor = Emerald400,
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray,
                        indicatorColor = Slate800
                    )
                )
            }
        },
        containerColor = Slate950
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Slate950)
        ) {
            when (selectedTab) {
                0 -> ScanTabScreen(scannedDevices, isScanning, onStartScan = { viewModel.startScanning() }, onStopScan = { viewModel.stopScanning() }, onConnect = { viewModel.connectDevice(it) })
                1 -> TrackersTabScreen(connectedDevices.values.toList(), onRing = { address, ring -> viewModel.triggerRingDevice(address, ring) }, onDisconnect = { viewModel.disconnectDevice(it) }, onUpdateSettings = { address, dist, sound, name -> viewModel.updateSettings(address, dist, sound, name) })
                2 -> LogsTabScreen(events)
            }
        }
    }
}

@Composable
fun ScanTabScreen(
    scannedDevices: List<ITagDevice>,
    isScanning: Boolean,
    onStartScan: () -> Unit,
    onStopScan: () -> Unit,
    onConnect: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Upper status board
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Slate900)
                .border(1.dp, Slate800, RoundedCornerShape(24.dp))
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = if (isScanning) "SCANNING ACTIVE" else "SCANNER STANDBY",
                        color = if (isScanning) Emerald400 else Color.Gray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Discovered: ${scannedDevices.size} iTAG Beacons",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Button(
                    onClick = { if (isScanning) onStopScan() else onStartScan() },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isScanning) Red500 else Emerald500
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = if (isScanning) "STOP" else "SCAN",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (scannedDevices.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Bluetooth,
                        contentDescription = "Search",
                        tint = Slate700,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No iTAG trackers discovered yet.",
                        color = Color.Gray,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Turn on your Bluetooth keyfob tag by pressing and holding its button until it beeps.",
                        color = Slate700,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(scannedDevices) { device ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Slate900)
                            .border(1.dp, Slate800, RoundedCornerShape(16.dp))
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(Emerald400.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.BluetoothSearching,
                                    contentDescription = "Device",
                                    tint = Emerald400,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = device.name,
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = device.address,
                                    color = Color.Gray,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = "Signal: ${device.rssi} dBm",
                                    color = Emerald400,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }

                        Button(
                            onClick = { onConnect(device.address) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Emerald400.copy(alpha = 0.2f),
                                contentColor = Emerald400
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.border(1.dp, Emerald400.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                        ) {
                            Text(
                                text = "CONNECT",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TrackersTabScreen(
    connectedDevices: List<ITagDevice>,
    onRing: (String, Boolean) -> Unit,
    onDisconnect: (String) -> Unit,
    onUpdateSettings: (String, AlertDistance, Boolean, String) -> Unit
) {
    var deviceToConfigure by remember { mutableStateOf<ITagDevice?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "ACTIVE SAFETY NET",
            color = Color.Gray,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        Text(
            text = "Connected Beacons: ${connectedDevices.size}",
            color = Color.White,
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        if (connectedDevices.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.PortableWifiOff,
                        contentDescription = "None",
                        tint = Slate700,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No trackers currently connected.",
                        color = Color.Gray,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(connectedDevices) { device ->
                    var isRinging by remember { mutableStateOf(false) }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(Slate900)
                            .border(1.dp, Slate800, RoundedCornerShape(20.dp))
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when (device.status) {
                                                ConnectionStatus.CONNECTED -> Emerald400
                                                ConnectionStatus.CONNECTING -> Amber400
                                                else -> Color.Red
                                            }
                                        )
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = device.customName,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Text(
                                text = device.address,
                                color = Color.Gray,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(start = 16.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            
                            Row(
                                modifier = Modifier.padding(start = 16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.BatteryChargingFull, contentDescription = "Battery", tint = Emerald400, modifier = Modifier.size(12.dp))
                                Text(" ${device.batteryLevel}%", color = Color.Gray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                Spacer(modifier = Modifier.width(12.dp))
                                Icon(Icons.Default.SignalCellularAlt, contentDescription = "RSSI", tint = Color.Cyan, modifier = Modifier.size(12.dp))
                                Text(" ${device.rssi} dBm", color = Color.Gray, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            }

                            if (device.lastKnownLatitude != null) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "📍 GPS: ${String.format(Locale.US, "%.5f", device.lastKnownLatitude)}, ${String.format(Locale.US, "%.5f", device.lastKnownLongitude)}",
                                    color = Amber400,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(start = 16.dp)
                                )
                            }
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Button(
                                onClick = {
                                    isRinging = !isRinging
                                    onRing(device.address, isRinging)
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isRinging) Red500 else Emerald500
                                ),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.size(width = 86.dp, height = 34.dp)
                            ) {
                                Text(
                                    text = if (isRinging) "SILENCE" else "FIND ME",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(CircleShape)
                                        .background(Slate800)
                                        .clickable { deviceToConfigure = device },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Settings, contentDescription = "Edit", tint = Color.White, modifier = Modifier.size(14.dp))
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(CircleShape)
                                        .background(Red500.copy(alpha = 0.1f))
                                        .border(1.dp, Red500.copy(alpha = 0.3f), CircleShape)
                                        .clickable { onDisconnect(device.address) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Red500, modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Settings config dialog pop-up
    deviceToConfigure?.let { device ->
        var tempName by remember { mutableStateOf(device.customName) }
        var tempDist by remember { mutableStateOf(device.alertDistance) }
        var tempAlarm by remember { mutableStateOf(device.linkLostAlarmEnabled) }

        AlertDialog(
            onDismissRequest = { deviceToConfigure = null },
            title = {
                Text(
                    "Configure Tracker",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color.White
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = tempName,
                        onValueChange = { tempName = it },
                        label = { Text("Custom Tracker Name", fontSize = 11.sp, color = Color.LightGray) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Emerald400,
                            unfocusedBorderColor = Slate800
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "Link-lost alert trigger on phone:",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color.LightGray
                        )
                        Switch(
                            checked = tempAlarm,
                            onCheckedChange = { tempAlarm = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Emerald400,
                                checkedTrackColor = Emerald400.copy(alpha = 0.3f),
                                uncheckedThumbColor = Color.Gray,
                                uncheckedTrackColor = Slate800
                            )
                        )
                    }

                    Text(
                        "Alert Threshold Range:",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = Color.LightGray
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        AlertDistance.values().forEach { dist ->
                            val isSel = tempDist == dist
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSel) Emerald400.copy(alpha = 0.2f) else Slate800)
                                    .border(1.dp, if (isSel) Emerald400 else Color.Transparent, RoundedCornerShape(8.dp))
                                    .clickable { tempDist = dist }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = dist.name,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSel) Emerald400 else Color.LightGray,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateSettings(device.address, tempDist, tempAlarm, tempName)
                        deviceToConfigure = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                ) {
                    Text("SAVE", fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { deviceToConfigure = null }) {
                    Text("CANCEL", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = Color.Gray)
                }
            },
            containerColor = Slate900
        )
    }
}

@Composable
fun LogsTabScreen(events: List<ITagEvent>) {
    val sdf = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "EVENT LOGS & HEALTH",
            color = Color.Gray,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
        Text(
            text = "Diagnostics & Disconnection Audits",
            color = Color.White,
            fontSize = 15.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Passive scanning & proximity alert disclaimer
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF3B82F6).copy(alpha = 0.1f))
                .border(1.dp, Color(0xFF3B82F6).copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Info, contentDescription = "Info", tint = Color(0xFF3B82F6), modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "DISCLAIMER: iTAG is a Bluetooth Proximity tracking device, not a cellular GPS tracker. Its distance estimates are based on radio signal (RSSI) strengths.",
                    color = Color.LightGray,
                    fontSize = 8.5.sp,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (events.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No history records listed.",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(events.reversed()) { event ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Slate900)
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when (event.eventType) {
                                                "CONNECTED" -> Emerald400
                                                "TAG_BUTTON_PRESSED" -> Color.Cyan
                                                "RING_CLICKED" -> Amber400
                                                else -> Color.Red
                                            }
                                        )
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = event.eventType,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Text(
                                text = sdf.format(Date(event.timestamp)),
                                fontSize = 9.sp,
                                color = Color.Gray,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = event.deviceName,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Emerald400,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = event.details,
                            fontSize = 10.sp,
                            color = Color.LightGray,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}
