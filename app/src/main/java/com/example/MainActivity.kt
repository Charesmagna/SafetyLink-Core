package com.example

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.db.IncidentEntity
import com.example.data.db.OrgRequestEntity
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.SOSState
import com.example.ui.viewmodel.SafetyViewModel
import com.example.ui.viewmodel.UserRole
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val viewModel = androidx.lifecycle.ViewModelProvider(this)[SafetyViewModel::class.java]
        if (intent?.action == "com.example.action.TRIGGER_SOS") {
            viewModel.triggerEmergencySOS("Instant SOS triggered from Homescreen Red Circle Quick-Shortcut.")
        }

        setContent {
            MyApplicationTheme {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    contentWindowInsets = WindowInsets.safeDrawing
                ) { innerPadding ->
                    MainScreenOrchestrator(
                        modifier = Modifier.padding(innerPadding),
                        viewModel = viewModel
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val viewModel = androidx.lifecycle.ViewModelProvider(this)[SafetyViewModel::class.java]
        if (intent.action == "com.example.action.TRIGGER_SOS") {
            viewModel.triggerEmergencySOS("Instant SOS triggered from Homescreen Red Circle Quick-Shortcut.")
        }
    }
}

@Composable
fun MainScreenOrchestrator(
    modifier: Modifier = Modifier,
    viewModel: SafetyViewModel = viewModel()
) {
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()
    val currentOrgId by viewModel.currentOrgId.collectAsState()
    val isBleDisconnectedAlertActive by viewModel.isBleDisconnectedAlertActive.collectAsState()

    var showIntro by remember { mutableStateOf(true) }

    Box(modifier = modifier.fillMaxSize()) {
        if (showIntro) {
            Welcome3DIntroScreen(onFinished = { showIntro = false })
        } else if (!isLoggedIn) {
            OnboardingFlowScreen(viewModel = viewModel)
        } else {
            // Logged in: check if organization is locked due to outstanding payments
            val lockedOrgs by viewModel.lockedOrgs.collectAsState()
            if (lockedOrgs.contains(currentOrgId)) {
                OrganizationSuspendedLockScreen(viewModel = viewModel)
            } else {
                if (currentOrgId == "SL-ADMIN-000") {
                    MainCommandDashboard(viewModel = viewModel)
                } else {
                    CitizenEmergencyHub(viewModel = viewModel)
                }
            }
        }

        // Flashing Disconnect Overlay Bubble: Constantly overlaying other screens
        if (isBleDisconnectedAlertActive) {
            BleDisconnectedOverlayBubble(
                onDismiss = { viewModel.dismissBleDisconnectAlert() },
                onScan = {
                    viewModel.dismissBleDisconnectAlert()
                    viewModel.startBleScan()
                }
            )
        }
    }
}

@Composable
fun OrganizationSuspendedLockScreen(
    viewModel: SafetyViewModel,
    modifier: Modifier = Modifier
) {
    val currentOrgId by viewModel.currentOrgId.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = BorderStroke(1.dp, Red500.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Alert Locked",
                    tint = Red500,
                    modifier = Modifier.size(56.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "APPLICATION SUSPENDED",
                    color = Red500,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = JetBrainsMono
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Outstanding Failed Payments / License Locked",
                    color = Slate400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Slate800, thickness = 1.dp)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Your organization's access link ($currentOrgId) has been locked by the SafetyLink Platform Administrator due to uncollected service fees.",
                    color = Slate100,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Please contact your representative / coordinator human supervisor immediately to settle outstanding billing.",
                    color = Slate400,
                    fontSize = 11.sp,
                    lineHeight = 15.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = { viewModel.logout() },
                    colors = ButtonDefaults.buttonColors(containerColor = Red500, contentColor = Slate950),
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(imageVector = Icons.Default.ExitToApp, contentDescription = "Exit")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("LOGOUT / SWITCH WORKSPACE", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun Welcome3DIntroScreen(onFinished: () -> Unit) {
    var progress by remember { mutableStateOf(0f) }
    val infiniteTransition = rememberInfiniteTransition(label = "3DLogo")

    val rotationX by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotationX"
    )

    val scale by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    LaunchedEffect(Unit) {
        val startTime = System.currentTimeMillis()
        while (System.currentTimeMillis() - startTime < 5000) {
            progress = (System.currentTimeMillis() - startTime) / 5000f
            delay(50)
        }
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950),
        contentAlignment = Alignment.Center
    ) {
        // High-tech matrix or radar background glow
        Box(
            modifier = Modifier
                .size(350.dp)
                .background(
                    brush = androidx.compose.ui.graphics.Brush.radialGradient(
                        colors = listOf(
                            Emerald500.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Rotating 3D Metallic Shield / Radar Logo
            Canvas(
                modifier = Modifier
                    .size(150.dp)
                    .graphicsLayer {
                        rotationZ = rotationX
                        rotationY = rotationX / 2
                        scaleX = scale
                        scaleY = scale
                    }
            ) {
                val radius = size.minDimension / 2f
                val center = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height / 2f)

                // Draw external metallic ring
                drawCircle(
                    color = Emerald500.copy(alpha = 0.8f),
                    radius = radius,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 4.dp.toPx())
                )

                // Inner pulsing radar rings
                drawCircle(
                    color = Emerald500.copy(alpha = 0.3f),
                    radius = radius * 0.7f,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
                )

                drawCircle(
                    color = Red500.copy(alpha = 0.4f),
                    radius = radius * 0.4f,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.dp.toPx())
                )

                // Crosshairs
                drawLine(
                    color = Emerald500.copy(alpha = 0.5f),
                    start = androidx.compose.ui.geometry.Offset(center.x - radius, center.y),
                    end = androidx.compose.ui.geometry.Offset(center.x + radius, center.y),
                    strokeWidth = 1.dp.toPx()
                )
                drawLine(
                    color = Emerald500.copy(alpha = 0.5f),
                    start = androidx.compose.ui.geometry.Offset(center.x, center.y - radius),
                    end = androidx.compose.ui.geometry.Offset(center.x, center.y + radius),
                    strokeWidth = 1.dp.toPx()
                )

                // Center core
                drawCircle(
                    color = Emerald500,
                    radius = 8.dp.toPx()
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "SAFETYLINK CORE",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = Slate100,
                letterSpacing = 4.sp
            )

            Text(
                text = "SECURE TACTICAL BEACON v5.0",
                style = MaterialTheme.typography.bodySmall,
                color = Emerald500,
                fontWeight = FontWeight.Bold,
                fontFamily = JetBrainsMono,
                letterSpacing = 2.sp
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Pulse progress bar
            Box(
                modifier = Modifier
                    .width(200.dp)
                    .height(4.dp)
                    .background(Slate800, RoundedCornerShape(2.dp))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progress.coerceIn(0f, 1f))
                        .background(Emerald500, RoundedCornerShape(2.dp))
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "ESTABLISHING ENCRYPTED LINK...",
                style = MaterialTheme.typography.labelSmall,
                color = Slate400,
                fontFamily = JetBrainsMono
            )
        }

        // Fast-skip button at bottom
        TextButton(
            onClick = onFinished,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
        ) {
            Text("SKIP INTRO", color = Slate400, fontWeight = FontWeight.Bold, fontSize = 11.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingFlowScreen(
    viewModel: SafetyViewModel,
    modifier: Modifier = Modifier
) {
    var tabSelected by remember { mutableStateOf(0) } // 0 = User Login, 1 = Register Org

    var loginUsername by remember { mutableStateOf("") }
    var loginOrgId by remember { mutableStateOf("") }
    var loginError by remember { mutableStateOf<String?>(null) }

    var repName by remember { mutableStateOf("") }
    var repPhone by remember { mutableStateOf("") }
    var billingEmail by remember { mutableStateOf("") }
    var orgName by remember { mutableStateOf("") }
    var registrationSuccessId by remember { mutableStateOf<String?>(null) }
    var showBusinessDetails by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = "Security",
                tint = Emerald500,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "SAFETYLINK SECURE ACCESS",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                color = Slate100,
                letterSpacing = 2.sp
            )
            Text(
                text = "South Africa's High-Fidelity Tactical Emergency Beacon",
                style = MaterialTheme.typography.bodySmall,
                color = Slate400,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Glassmorphic Segmented Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Slate900, RoundedCornerShape(8.dp))
                    .padding(4.dp)
            ) {
                Button(
                    onClick = { tabSelected = 0 },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (tabSelected == 0) Slate800 else Color.Transparent,
                        contentColor = if (tabSelected == 0) Emerald500 else Slate400
                    ),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("User Login / Org ID", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { tabSelected = 1 },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (tabSelected == 1) Slate800 else Color.Transparent,
                        contentColor = if (tabSelected == 1) Emerald500 else Slate400
                    ),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("Register Org", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tab 0: Citizen/User Login
            if (tabSelected == 0) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.7f)),
                    border = BorderStroke(1.dp, Slate800),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "SECURE SESSION SIGNUP",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = Emerald500,
                            fontFamily = JetBrainsMono
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Enter your coordinator details or pre-assigned organization ID.",
                            fontSize = 11.sp,
                            color = Slate400
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = loginUsername,
                            onValueChange = { loginUsername = it },
                            label = { Text("Your Coordinator Name / Surname") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate800,
                                focusedLabelColor = Emerald500,
                                unfocusedLabelColor = Slate400,
                                cursorColor = Emerald500
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = loginOrgId,
                            onValueChange = { loginOrgId = it },
                            label = { Text("Organization Access Code / ID") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate800,
                                focusedLabelColor = Emerald500,
                                unfocusedLabelColor = Slate400,
                                cursorColor = Emerald500
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (loginError != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = loginError!!,
                                color = Red500,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = JetBrainsMono
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = {
                                if (loginUsername.isBlank() && loginOrgId != "SL-ADMIN-000") {
                                    loginError = "Username is required for standard users."
                                } else if (loginOrgId.isBlank()) {
                                    loginError = "Organization Access ID is required."
                                } else {
                                    val success = viewModel.login(loginUsername, loginOrgId)
                                    if (!success) {
                                        loginError = "Authentication failed. Double check your inputs."
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Enter")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("AUTHENTICATE SESSION", fontWeight = FontWeight.Black)
                        }
                    }
                }
            } else {
                // Tab 1: Register Organization
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.7f)),
                    border = BorderStroke(1.dp, Slate800),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "CREATE NEW ORGANIZATION LINK",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = Emerald500,
                            fontFamily = JetBrainsMono
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Organizations must designate a human coordinator responsible for alerts and platform payments. Once registered, contact the SafetyLink dispatch center administrator to activate your channels.",
                            fontSize = 11.sp,
                            color = Slate400
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Coordinator details
                        OutlinedTextField(
                            value = repName,
                            onValueChange = { repName = it },
                            label = { Text("Human Representative Name") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate800,
                                focusedLabelColor = Emerald500,
                                unfocusedLabelColor = Slate400,
                                cursorColor = Emerald500
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = repPhone,
                            onValueChange = { repPhone = it },
                            label = { Text("Representative Contact Phone") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate800,
                                focusedLabelColor = Emerald500,
                                unfocusedLabelColor = Slate400,
                                cursorColor = Emerald500
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = billingEmail,
                            onValueChange = { billingEmail = it },
                            label = { Text("Billing / Coordinator Email") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate800,
                                focusedLabelColor = Emerald500,
                                unfocusedLabelColor = Slate400,
                                cursorColor = Emerald500
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Expandable Business Section
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showBusinessDetails = !showBusinessDetails }
                                .border(1.dp, Slate800, RoundedCornerShape(4.dp))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Business / Organization Profile Details",
                                color = Slate100,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Icon(
                                imageVector = if (showBusinessDetails) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                contentDescription = "Toggle",
                                tint = Emerald500
                            )
                        }

                        if (showBusinessDetails) {
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = orgName,
                                onValueChange = { orgName = it },
                                label = { Text("Legal Business / Org Name") },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Emerald500,
                                    unfocusedBorderColor = Slate800,
                                    focusedLabelColor = Emerald500,
                                    unfocusedLabelColor = Slate400,
                                    cursorColor = Emerald500
                                ),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        if (registrationSuccessId != null) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Emerald500.copy(alpha = 0.15f)),
                                border = BorderStroke(1.dp, Emerald500)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "REGISTRATION INITIATED!",
                                        color = Emerald500,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        fontFamily = JetBrainsMono
                                    )
                                    Text(
                                        text = "Your pending unique Organization ID is: $registrationSuccessId",
                                        color = Slate100,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = JetBrainsMono
                                    )
                                    Text(
                                        text = "Please contact system administrators to approve and provision your safety channels.",
                                        color = Slate100,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (repName.isNotBlank() && repPhone.isNotBlank() && billingEmail.isNotBlank() && orgName.isNotBlank()) {
                                    registrationSuccessId = viewModel.registerOrganization(
                                        repName = repName,
                                        repPhone = repPhone,
                                        billingEmail = billingEmail,
                                        orgName = orgName
                                    )
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = "Add")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("SUBMIT REGISTRATION", fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CitizenEmergencyHub(
    viewModel: SafetyViewModel,
    modifier: Modifier = Modifier
) {
    val sosState by viewModel.sosState.collectAsState()
    val bleDevices by viewModel.bleDevices.collectAsState()
    val emergencyContacts by viewModel.emergencyContacts.collectAsState()
    val gpsAccuracy by viewModel.gpsAccuracy.collectAsState()
    val mockCurrentGps by viewModel.mockCurrentGps.collectAsState()
    val isScanning by viewModel.isScanning.collectAsState()
    val pairingProgress by viewModel.pairingProgress.collectAsState()

    val currentUser by viewModel.currentUser.collectAsState()
    val currentOrgId by viewModel.currentOrgId.collectAsState()

    val isNetGuardActive by viewModel.isNetGuardActive.collectAsState()
    val isDnsOverHttpsActive by viewModel.isDnsOverHttpsActive.collectAsState()
    val blockedRequests by viewModel.blockedRequests.collectAsState()
    val dataSavedMb by viewModel.dataSavedMb.collectAsState()
    val currentThroughputKb by viewModel.currentThroughputKb.collectAsState()
    val networkPackets by viewModel.networkPackets.collectAsState()
    val isBackgroundServiceActive by viewModel.isBackgroundServiceActive.collectAsState()

    var activeTab by remember { mutableStateOf("PANIC") }

    var editingContactKey by remember { mutableStateOf<String?>(null) }
    var editLabel by remember { mutableStateOf("") }
    var editPhone by remember { mutableStateOf("") }
    var editTemplate by remember { mutableStateOf("") }

    var diagnosticsLog by remember { mutableStateOf<List<String>>(emptyList()) }

    fun logDiagnostic(msg: String) {
        val time = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        diagnosticsLog = (listOf("[$time] $msg") + diagnosticsLog).take(30)
    }

    LaunchedEffect(sosState) {
        if (sosState == SOSState.ACQUIRING_GPS) {
            logDiagnostic("Panic Button pressed. Long press countdown completed successfully.")
            logDiagnostic("[GPS] Attempting cell tower triangulation...")
        } else if (sosState == SOSState.CAPTURING_EVIDENCE) {
            logDiagnostic("[GPS] Position acquired at $mockCurrentGps. Accuracy: $gpsAccuracy.")
            logDiagnostic("[AUDIO] Initiating continuous ambient audio evidence cache...")
        } else if (sosState == SOSState.ESCALATING) {
            logDiagnostic("[ALERT] Arming Multi-channel Alert fallback chain...")
            emergencyContacts.forEach { contact ->
                delay(400)
                when (contact.channelType) {
                    "CALL" -> logDiagnostic("[CELLULAR] Direct voice call handshake enqueued with ${contact.label} (${contact.phone})")
                    "SMS" -> logDiagnostic("[SMS_GATEWAY] Mobile SMS sent to ${contact.phone}: '${contact.template.replace("{LAT}", "-26.1912").replace("{LNG}", "28.0264")}'")
                    "WHATSAPP" -> logDiagnostic("[WHATSAPP] Deep intent dispatched to WhatsApp user ${contact.phone}. Status: SHIPPED.")
                    "GROUP" -> logDiagnostic("[COMMUNITY_CHANNEL] Pushed broadcast packet to Local SafetyLink channel (${contact.phone})")
                    "POLICE" -> logDiagnostic("[SAPS] Transmitting emergency coordinates to SA Police dispatch center at ${contact.phone}")
                }
            }
        } else if (sosState == SOSState.DISPATCHED) {
            logDiagnostic("[FIREBASE] Synchronization complete. Emergency ticket INC-ACTIVE created on centralized board.")
        } else if (sosState == SOSState.IDLE) {
            logDiagnostic("System listening for hardware or in-app panic triggers.")
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
    ) {
        if (sosState != SOSState.IDLE) {
            val infiniteTransition = rememberInfiniteTransition(label = "blink")
            val alpha by infiniteTransition.animateFloat(
                initialValue = 0.4f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(500, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "alpha"
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Red500.copy(alpha = alpha))
                    .padding(vertical = 8.dp, horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(imageVector = Icons.Default.Warning, contentDescription = "Siren", tint = Slate100)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "CRITICAL DISTRESS BEACON ACTIVE: MULTI-CHANNEL SOS IN PROGRESS",
                    color = Slate100,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    fontFamily = JetBrainsMono
                )
            }
        }

        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Slate900)
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "SAFETYLINK CLIENT",
                    color = Emerald500,
                    fontWeight = FontWeight.Black,
                    fontSize = 14.sp
                )
                Text(
                    text = "User: $currentUser (Org: $currentOrgId)",
                    color = Slate400,
                    fontSize = 11.sp
                )
            }
            Button(
                onClick = { viewModel.logout() },
                colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                shape = RoundedCornerShape(4.dp),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Icon(imageVector = Icons.Default.ExitToApp, contentDescription = "Logout", modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("LOGOUT", fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }

        HorizontalDivider(color = Slate800, thickness = 1.dp)

        // Tab selection for standard user workspace
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Slate900)
        ) {
            val tabs = listOf(
                "PANIC" to Icons.Default.Warning,
                "CHANNELS" to Icons.Default.Share,
                "WEARABLE" to Icons.Default.Refresh,
                "NETGUARD" to Icons.Default.Lock
            )
            tabs.forEach { (tab, icon) ->
                val isActive = activeTab == tab
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { activeTab = tab }
                        .padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = tab,
                        tint = if (isActive) Emerald500 else Slate400,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = tab,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isActive) Emerald500 else Slate400
                    )
                }
            }
        }

        HorizontalDivider(color = Slate800, thickness = 1.dp)

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            when (activeTab) {
                "PANIC" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "CRITICAL TACTICAL DISPATCH BEACON",
                            color = Slate100,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = JetBrainsMono
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                        val scale by infiniteTransition.animateFloat(
                            initialValue = 0.95f,
                            targetValue = 1.05f,
                            animationSpec = infiniteRepeatable(
                                animation = tween(1200, easing = FastOutSlowInEasing),
                                repeatMode = RepeatMode.Reverse
                            ),
                            label = "scale"
                        )
                        val glowAlpha by infiniteTransition.animateFloat(
                            initialValue = 0.2f,
                            targetValue = 0.6f,
                            animationSpec = infiniteRepeatable(
                                animation = tween(1200, easing = FastOutSlowInEasing),
                                repeatMode = RepeatMode.Reverse
                            ),
                            label = "glow"
                        )

                        var isHolding by remember { mutableStateOf(false) }
                        var holdProgress by remember { mutableStateOf(0f) }

                        LaunchedEffect(isHolding) {
                            if (isHolding) {
                                var count = 0
                                while (isHolding && count < 25) {
                                    delay(100)
                                    count++
                                    holdProgress = count / 25f
                                }
                                if (isHolding) {
                                    viewModel.triggerEmergencySOS("DISTRESS: User initiated silent panic broadcast via mobile hub button hold.")
                                    logDiagnostic("Rapid emergency trigger sequence verified via physical touch.")
                                }
                                isHolding = false
                                holdProgress = 0f
                            } else {
                                holdProgress = 0f
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(200.dp)
                                .pointerInput(Unit) {
                                    detectTapGestures(
                                        onPress = {
                                            isHolding = true
                                            try {
                                                awaitPointerEventScope {
                                                    while (true) {
                                                        val event = awaitPointerEvent()
                                                        if (event.changes.any { !it.pressed }) {
                                                            break
                                                        }
                                                    }
                                                }
                                            } finally {
                                                isHolding = false
                                            }
                                        }
                                    )
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(180.dp)
                                    .graphicsLayer {
                                        scaleX = scale
                                        scaleY = scale
                                    }
                                    .background(
                                        brush = androidx.compose.ui.graphics.Brush.radialGradient(
                                            colors = listOf(
                                                Red500.copy(alpha = glowAlpha),
                                                Color.Transparent
                                            )
                                        )
                                    )
                            )

                            Box(
                                modifier = Modifier
                                    .size(140.dp)
                                    .background(if (sosState != SOSState.IDLE) Red500 else Color(0xFF991B1B), RoundedCornerShape(70.dp))
                                    .border(2.dp, if (sosState != SOSState.IDLE) Slate100 else Red500, RoundedCornerShape(70.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = Icons.Default.Warning,
                                        contentDescription = "Panic",
                                        tint = Slate100,
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = if (sosState != SOSState.IDLE) "SOS ACTIVE" else "TAP & HOLD",
                                        color = Slate100,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = JetBrainsMono
                                    )
                                    Text(
                                        text = if (isHolding) "${(holdProgress * 100).toInt()}%" else "TO TRIGGER",
                                        color = Slate100,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            if (isHolding) {
                                CircularProgressIndicator(
                                    progress = holdProgress,
                                    modifier = Modifier.size(146.dp),
                                    color = Emerald500,
                                    strokeWidth = 4.dp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // PERSISTENT BACKGROUND SERVICE TRACKING CONTROLLER
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, if (isBackgroundServiceActive) Emerald500.copy(alpha = 0.5f) else Slate800, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isBackgroundServiceActive) Slate900.copy(alpha = 0.8f) else Slate900.copy(alpha = 0.4f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Refresh,
                                            contentDescription = "Background service",
                                            tint = if (isBackgroundServiceActive) Emerald500 else Slate400,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(
                                                text = "PERSISTENT CORE TELEMETRY SERVICE",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Slate100,
                                                fontFamily = JetBrainsMono
                                            )
                                            Text(
                                                text = if (isBackgroundServiceActive) "ACTIVE (Location & BLE tracking online)" else "DISABLED (Off-grid)",
                                                fontSize = 11.sp,
                                                color = if (isBackgroundServiceActive) Emerald500 else Slate400,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                    Switch(
                                        checked = isBackgroundServiceActive,
                                        onCheckedChange = { viewModel.toggleBackgroundService() },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Emerald500,
                                            checkedTrackColor = Emerald500.copy(alpha = 0.3f),
                                            uncheckedThumbColor = Slate400,
                                            uncheckedTrackColor = Slate800
                                        )
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Tracks real-time GPS location and paired BLE panic-button heartbeats persistent in background, ensuring immediate trigger-readiness even when device is locked.",
                                    fontSize = 11.sp,
                                    color = Slate400,
                                    lineHeight = 14.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.6f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(Emerald500, RoundedCornerShape(4.dp))
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        "HOME SCREEN WIDGET PREVIEW (5s Safeguard)",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate100,
                                        fontFamily = JetBrainsMono
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "A simulated 1x1 rapid-trigger home widget. Press and hold below for 5 full seconds to simulate an accidental-pocket-proof backup transmission sequence:",
                                    fontSize = 11.sp,
                                    color = Slate400
                                )
                                Spacer(modifier = Modifier.height(12.dp))

                                var isHoldingWidget by remember { mutableStateOf(false) }
                                var widgetProgress by remember { mutableStateOf(0f) }

                                LaunchedEffect(isHoldingWidget) {
                                    if (isHoldingWidget) {
                                        var count = 0
                                        while (isHoldingWidget && count < 50) {
                                            delay(100)
                                            count++
                                            widgetProgress = count / 50f
                                        }
                                        if (isHoldingWidget) {
                                            viewModel.triggerEmergencySOS("DISTRESS: Pocket-proof Home screen Widget press verified (5-second continuous threshold).")
                                            logDiagnostic("Widget 5s safeguard validation: PASSED. Deploying alarms.")
                                        }
                                        isHoldingWidget = false
                                        widgetProgress = 0f
                                    } else {
                                        widgetProgress = 0f
                                    }
                                }

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Slate950, RoundedCornerShape(4.dp))
                                        .pointerInput(Unit) {
                                            detectTapGestures(
                                                onPress = {
                                                    isHoldingWidget = true
                                                    try {
                                                        awaitPointerEventScope {
                                                            while (true) {
                                                                val event = awaitPointerEvent()
                                                                if (event.changes.any { !it.pressed }) {
                                                                    break
                                                                }
                                                            }
                                                        }
                                                    } finally {
                                                        isHoldingWidget = false
                                                    }
                                                }
                                            )
                                        }
                                        .border(
                                            1.dp,
                                            if (isHoldingWidget) Emerald500 else Slate800,
                                            RoundedCornerShape(4.dp)
                                        )
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Warning,
                                            contentDescription = "Widget icon",
                                            tint = if (isHoldingWidget) Red500 else Slate400,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Column {
                                            Text(
                                                "SafetyLink SOS Widget Trigger",
                                                color = Slate100,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                if (isHoldingWidget) "HOLDING: KEEP PRESSING (${(widgetProgress * 100).toInt()}%)" else "Press and hold for 5s",
                                                color = if (isHoldingWidget) Emerald500 else Slate400,
                                                fontSize = 10.sp
                                            )
                                        }
                                    }
                                    if (isHoldingWidget) {
                                        CircularProgressIndicator(
                                            progress = widgetProgress,
                                            modifier = Modifier.size(20.dp),
                                            color = Emerald500,
                                            strokeWidth = 3.dp
                                        )
                                    } else {
                                        Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Hold", tint = Slate400)
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "MULTI-CHANNEL OUTBOUND TRANSCEIVER LOGS",
                                        fontSize = 10.sp,
                                        color = Emerald500,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = JetBrainsMono
                                    )
                                    Text(
                                        "LIVE TELEMETRY",
                                        fontSize = 8.sp,
                                        color = Slate400,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(120.dp)
                                        .background(Slate950, RoundedCornerShape(4.dp))
                                        .padding(8.dp)
                                ) {
                                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                                        if (diagnosticsLog.isEmpty()) {
                                            item {
                                                Text(
                                                    "Logs terminal initialized. Waiting for emergency broadcast routing activities...",
                                                    color = Slate400,
                                                    fontSize = 10.sp,
                                                    fontFamily = JetBrainsMono
                                                )
                                            }
                                        } else {
                                            items(diagnosticsLog) { log ->
                                                Text(
                                                    text = log,
                                                    color = if (log.contains("SENT") || log.contains("SUCCESS") || log.contains("SHIPPED")) Emerald500 else if (log.contains("Warning") || log.contains("ALERT")) Red500 else Slate100,
                                                    fontSize = 10.sp,
                                                    fontFamily = JetBrainsMono,
                                                    modifier = Modifier.padding(vertical = 1.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (sosState != SOSState.IDLE) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.cancelSOS() },
                                colors = ButtonDefaults.buttonColors(containerColor = Red500, contentColor = Slate100),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Cancel")
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("CANCEL EMERGENCY SOS Sequences")
                            }
                        }
                    }
                }

                "CHANNELS" -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Text(
                                "CUSTOM MULTI-CHANNEL ROUTING WIZARD",
                                color = Emerald500,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = JetBrainsMono
                            )
                            Text(
                                "Configure your 5 sequential backup emergency alert methods below. These trigger simultaneously to bypass offline or network failures.",
                                color = Slate400,
                                fontSize = 11.sp
                            )
                        }

                        items(emergencyContacts) { contact ->
                            val icon = when (contact.channelType) {
                                "CALL" -> Icons.Default.Phone
                                "SMS" -> Icons.Default.Send
                                "WHATSAPP" -> Icons.Default.Share
                                "GROUP" -> Icons.Default.Notifications
                                "POLICE" -> Icons.Default.Star
                                else -> Icons.Default.Send
                            }
                            val badgeColor = when (contact.channelType) {
                                "CALL" -> Color(0xFF3B82F6)
                                "SMS" -> Color(0xFFF59E0B)
                                "WHATSAPP" -> Color(0xFF10B981)
                                "GROUP" -> Color(0xFF8B5CF6)
                                "POLICE" -> Color(0xFFEF4444)
                                else -> Emerald500
                            }

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.6f)),
                                border = BorderStroke(1.dp, Slate800)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(imageVector = icon, contentDescription = contact.channelType, tint = badgeColor, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                contact.label,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = Slate100
                                            )
                                        }

                                        Box(
                                            modifier = Modifier
                                                .background(badgeColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                contact.channelType,
                                                color = badgeColor,
                                                fontSize = 8.sp,
                                                fontWeight = FontWeight.Bold,
                                                fontFamily = JetBrainsMono
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Phone: ${contact.phone}", fontSize = 11.sp, color = Slate400, fontFamily = JetBrainsMono)
                                    Text("Template: ${contact.template}", fontSize = 11.sp, color = Slate400)

                                    Spacer(modifier = Modifier.height(12.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Button(
                                            onClick = {
                                                editingContactKey = contact.key
                                                editLabel = contact.label
                                                editPhone = contact.phone
                                                editTemplate = contact.template
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(12.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("EDIT CONFIG", fontSize = 10.sp)
                                        }

                                        Button(
                                            onClick = {
                                                logDiagnostic("[TESTING CHANNEL ${contact.key}] Routing diagnostic payload...")
                                                when (contact.channelType) {
                                                    "CALL" -> logDiagnostic("[SIMULATED CALL] Voice interface dial: OK to ${contact.phone}")
                                                    "SMS" -> logDiagnostic("[SIMULATED SMS] Gateway carrier response: enqueued to SMS queue (${contact.phone})")
                                                    "WHATSAPP" -> logDiagnostic("[SIMULATED WHATSAPP] Direct hook package dispatch success: message = '${contact.template}'")
                                                    "GROUP" -> logDiagnostic("[SIMULATED BROADCAST] Group notification package delivered successfully")
                                                    "POLICE" -> logDiagnostic("[SIMULATED EMERGENCY] SA Police dispatch alert sequence verified at ${contact.phone}")
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Slate950, contentColor = Emerald500),
                                            border = BorderStroke(1.dp, Slate800),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Test", modifier = Modifier.size(12.dp), tint = Emerald500)
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("TEST CHANNEL", fontSize = 10.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                "WEARABLE" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "BLUETOOTH iTAG PROFILE BINDING",
                            color = Emerald500,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = JetBrainsMono
                        )
                        Text(
                            "Securely link a physical Bluetooth iTAG keychain clicker. A click triggers standard backup alert channels immediately.",
                            color = Slate400,
                            fontSize = 11.sp
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        if (bleDevices.any { it.connectionState == "CONNECTED" }) {
                            val primaryDev = bleDevices.first { it.connectionState == "CONNECTED" }
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Emerald500.copy(alpha = 0.1f)),
                                border = BorderStroke(1.dp, Emerald500)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(primaryDev.friendlyName, fontWeight = FontWeight.Bold, color = Slate100)
                                        Box(
                                            modifier = Modifier
                                                .background(Emerald500.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("BONDED & ACTIVE", color = Emerald500, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("MAC Address: ${primaryDev.macAddress}", fontSize = 11.sp, color = Slate400, fontFamily = JetBrainsMono)
                                    Text("Battery Level: ${primaryDev.batteryLevel}% | Signal: ${primaryDev.rssi} dBm", fontSize = 11.sp, color = Slate400)

                                    Spacer(modifier = Modifier.height(16.dp))

                                    Text("SIMULATE DIRECT PHYSICAL CLICK EVENTS:", fontSize = 10.sp, color = Slate400, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = { viewModel.simulateBleClick("SINGLE") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                                            modifier = Modifier.weight(1f),
                                            contentPadding = PaddingValues(4.dp)
                                        ) {
                                            Text("1-Click", fontSize = 10.sp)
                                        }
                                        Button(
                                            onClick = { viewModel.simulateBleClick("FALL_DETECTED") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                                            modifier = Modifier.weight(1f),
                                            contentPadding = PaddingValues(4.dp)
                                        ) {
                                            Text("Impact/Fall", fontSize = 10.sp)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    Button(
                                        onClick = { viewModel.disconnectDevice(primaryDev.macAddress) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = Red500),
                                        border = BorderStroke(1.dp, Red500),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("DISCONNECT PROFILE", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        } else {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.6f)),
                                border = BorderStroke(1.dp, Slate800)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(imageVector = Icons.Default.Refresh, contentDescription = "Scan", tint = Slate400, modifier = Modifier.size(32.dp))
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text("No hardware wearables registered", color = Slate100, fontWeight = FontWeight.Bold)
                                    Text("Scan and register a nearby BLE clicker tag now to configure primary triggers.", color = Slate400, fontSize = 11.sp, textAlign = TextAlign.Center)

                                    Spacer(modifier = Modifier.height(16.dp))

                                    if (isScanning) {
                                        Text(pairingProgress ?: "Scanning...", color = Emerald500, fontSize = 11.sp, fontFamily = JetBrainsMono)
                                        Spacer(modifier = Modifier.height(8.dp))
                                        CircularProgressIndicator(color = Emerald500)
                                    } else {
                                        Button(
                                            onClick = { viewModel.startBleScan() },
                                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Text("SCAN FOR iTAG DECOYS", fontWeight = FontWeight.Black)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                "NETGUARD" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "TACTICAL NETGUARD FIREWALL",
                            color = Emerald500,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = JetBrainsMono
                        )
                        Text(
                            "Hardened Local VPN Tunnel & Threat Intelligence",
                            color = Slate400,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Hero Shield Container
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isNetGuardActive) Emerald500.copy(alpha = 0.05f) else Red500.copy(alpha = 0.05f)
                            ),
                            border = BorderStroke(
                                1.dp,
                                if (isNetGuardActive) Emerald500.copy(alpha = 0.4f) else Red500.copy(alpha = 0.4f)
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = if (isNetGuardActive) Icons.Default.Lock else Icons.Default.Warning,
                                        contentDescription = "Shield",
                                        tint = if (isNetGuardActive) Emerald500 else Red500,
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = if (isNetGuardActive) "LOCAL SECURE VPN ACTIVE" else "FIREWALL DISARMED",
                                        fontWeight = FontWeight.Bold,
                                        color = if (isNetGuardActive) Emerald500 else Red500,
                                        fontSize = 13.sp,
                                        fontFamily = JetBrainsMono
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = if (isNetGuardActive) 
                                        "Routing traffic through a secure local firewall. Encrypted DoH handshakes active." 
                                        else "Background data leakage unmonitored. Threat vector active.",
                                    color = Slate400,
                                    fontSize = 11.sp,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Stats Dashboard Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Blocked
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                                colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.4f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("BLOCKED", fontSize = 8.sp, color = Red500, fontWeight = FontWeight.Bold, fontFamily = JetBrainsMono)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("${blockedRequests}", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Slate100, fontFamily = JetBrainsMono)
                                    Text("Threat queries", fontSize = 8.sp, color = Slate400)
                                }
                            }

                            // Saved Data
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                                colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.4f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("DATA SAVED", fontSize = 8.sp, color = Color(0xFF3B82F6), fontWeight = FontWeight.Bold, fontFamily = JetBrainsMono)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(String.format("%.1f MB", dataSavedMb), fontSize = 16.sp, fontWeight = FontWeight.Black, color = Slate100, fontFamily = JetBrainsMono)
                                    Text("Emergency buffer", fontSize = 8.sp, color = Slate400)
                                }
                            }

                            // Throughput
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                                colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.4f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("BANDWIDTH", fontSize = 8.sp, color = Emerald500, fontWeight = FontWeight.Bold, fontFamily = JetBrainsMono)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(String.format("%.1f KB/s", currentThroughputKb), fontSize = 16.sp, fontWeight = FontWeight.Black, color = Slate100, fontFamily = JetBrainsMono)
                                    Text("Throughput", fontSize = 8.sp, color = Slate400)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Toggles
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.6f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Active Tactical Guard VPN", color = Slate100, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        Text("Intercept trackers, ad networks & bandwidth leaks", color = Slate400, fontSize = 10.sp)
                                    }
                                    Switch(
                                        checked = isNetGuardActive,
                                        onCheckedChange = { viewModel.toggleNetGuard() },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Emerald500,
                                            checkedTrackColor = Emerald500.copy(alpha = 0.2f),
                                            uncheckedThumbColor = Slate400,
                                            uncheckedTrackColor = Slate800
                                        )
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))
                                HorizontalDivider(color = Slate800, thickness = 1.dp)
                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("DNS-over-HTTPS (DoH) Hardening", color = Slate100, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        Text("Encrypted name resolution to bypass IMSI-jammers", color = Slate400, fontSize = 10.sp)
                                    }
                                    Switch(
                                        checked = isDnsOverHttpsActive,
                                        onCheckedChange = { viewModel.toggleDnsOverHttps() },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Emerald500,
                                            checkedTrackColor = Emerald500.copy(alpha = 0.2f),
                                            uncheckedThumbColor = Slate400,
                                            uncheckedTrackColor = Slate800
                                        ),
                                        enabled = isNetGuardActive
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Live Connections Feed
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.6f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "REALTIME PACKET INSPECTOR LOGS",
                                        fontSize = 10.sp,
                                        color = Emerald500,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = JetBrainsMono
                                    )
                                    Box(
                                        modifier = Modifier
                                            .background(Emerald500.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("FILTER ACTIVE", color = Emerald500, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(200.dp)
                                        .background(Slate950, RoundedCornerShape(4.dp))
                                        .padding(8.dp)
                                ) {
                                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                                        if (networkPackets.isEmpty()) {
                                            item {
                                                Text(
                                                    "Monitoring loop initialized. Waiting for local tunnel frames...",
                                                    color = Slate400,
                                                    fontSize = 10.sp,
                                                    fontFamily = JetBrainsMono
                                                )
                                            }
                                        } else {
                                            items(networkPackets) { packet ->
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(vertical = 4.dp),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(
                                                            text = "${packet.timestamp} - ${packet.domain}",
                                                            color = if (packet.isBlocked) Red500 else Slate100,
                                                            fontSize = 10.sp,
                                                            fontFamily = JetBrainsMono,
                                                            fontWeight = FontWeight.SemiBold
                                                        )
                                                        Text(
                                                            text = "App: ${packet.appName} | Proto: ${packet.protocol}",
                                                            color = Slate400,
                                                            fontSize = 9.sp
                                                        )
                                                    }
                                                    Box(
                                                        modifier = Modifier
                                                            .background(
                                                                if (packet.isBlocked) Red500.copy(alpha = 0.15f) else Emerald500.copy(alpha = 0.15f),
                                                                RoundedCornerShape(4.dp)
                                                            )
                                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                                    ) {
                                                        Text(
                                                            text = if (packet.isBlocked) "BLOCKED" else String.format("%.1f KB", packet.sizeKb),
                                                            color = if (packet.isBlocked) Red500 else Emerald500,
                                                            fontSize = 8.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            fontFamily = JetBrainsMono
                                                        )
                                                    }
                                                }
                                                HorizontalDivider(color = Slate900, thickness = 0.5.dp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // South Africa specific defensive warning card
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Slate800, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.4f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    "SOUTH AFRICA EMERGENCY RESILIENCE STANDARDS",
                                    fontSize = 9.sp,
                                    color = Color(0xFFF59E0B),
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = JetBrainsMono
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "In South Africa, power load-shedding and battery theft at base stations frequently result in localized cellular tower congestion, signal degradation, and packet drops. NetGuard's offline prioritization rules limit unessential background syncs to guarantee SOS UDP datagram broadcasts reach tactical dispatch gates first.",
                                    color = Slate400,
                                    fontSize = 10.sp,
                                    lineHeight = 13.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (editingContactKey != null) {
        AlertDialog(
            onDismissRequest = { editingContactKey = null },
            title = {
                Text(
                    "EDIT ALERTING CHANNEL #${editingContactKey}",
                    color = Emerald500,
                    fontWeight = FontWeight.Bold,
                    fontFamily = JetBrainsMono,
                    fontSize = 14.sp
                )
            },
            text = {
                Column {
                    OutlinedTextField(
                        value = editLabel,
                        onValueChange = { editLabel = it },
                        label = { Text("Display Name / Tag") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Emerald500,
                            unfocusedBorderColor = Slate800
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Destination Phone Number") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Emerald500,
                            unfocusedBorderColor = Slate800
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = editTemplate,
                        onValueChange = { editTemplate = it },
                        label = { Text("Predefined Text Message Template") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Emerald500,
                            unfocusedBorderColor = Slate800
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Tip: Use {LAT} and {LNG} to dynamically overlay current coordinates.", color = Slate400, fontSize = 10.sp)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.updateContact(editingContactKey!!, editLabel, editPhone, editTemplate)
                        editingContactKey = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950)
                ) {
                    Text("SAVE CHANGES", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { editingContactKey = null }) {
                    Text("CANCEL", color = Slate400)
                }
            },
            containerColor = Slate900,
            shape = RoundedCornerShape(12.dp)
        )
    }
}

@Composable
fun BleDisconnectedOverlayBubble(
    onDismiss: () -> Unit,
    onScan: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulseDisconnect")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f))
            .clickable(enabled = false) {},
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .width(320.dp)
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate900),
            border = BorderStroke(2.dp, Red500.copy(alpha = alpha)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Warning",
                    tint = Red500,
                    modifier = Modifier
                        .size(48.dp)
                        .graphicsLayer {
                            scaleX = alpha * 0.2f + 0.8f
                            scaleY = alpha * 0.2f + 0.8f
                        }
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "CRITICAL HARDWARE FAULT",
                    color = Red500,
                    fontWeight = FontWeight.Black,
                    fontSize = 14.sp,
                    fontFamily = JetBrainsMono
                )
                Text(
                    text = "iTAG WEARABLE DISCONNECTED",
                    color = Slate100,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    fontFamily = JetBrainsMono
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "The connection to your primary emergency clicker was severed. Multi-channel backup alerting lines have been armed over standard cellular carrier lines.",
                    color = Slate400,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onScan,
                    colors = ButtonDefaults.buttonColors(containerColor = Red500, contentColor = Slate100),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = "Re-pair")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("RE-CONNECT DECOY NOW", fontWeight = FontWeight.Black)
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("MUTE ALERT (ARM CELLULAR ONLY)", color = Slate400, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun AdminOrgRegistryView(
    viewModel: SafetyViewModel,
    modifier: Modifier = Modifier
) {
    val orgRequests by viewModel.orgRequests.collectAsState()
    val lockedOrgs by viewModel.lockedOrgs.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "SAFETYLINK ENTERPRISE ORGANIZATIONS REGISTRY",
            color = Emerald500,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = JetBrainsMono
        )
        Text(
            text = "Platform administration center to accept, suspension-lock, and lodge organization links in local persistence.",
            color = Slate400,
            fontSize = 11.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (orgRequests.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No pending organization requests found in sqlite.",
                            color = Slate400,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                items(orgRequests) { request ->
                    val isLocked = lockedOrgs.contains(request.orgId)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Slate900.copy(alpha = 0.7f)),
                        border = BorderStroke(1.dp, if (isLocked) Red500 else if (request.isApproved) Emerald500 else Slate800)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = request.orgName.uppercase(),
                                        fontWeight = FontWeight.Black,
                                        color = Slate100,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = "ID: ${request.orgId}",
                                        fontFamily = JetBrainsMono,
                                        fontSize = 11.sp,
                                        color = Slate400
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .background(
                                            if (isLocked) Red500.copy(alpha = 0.15f) else if (request.isApproved) Emerald500.copy(alpha = 0.15f) else Color(0xFFF59E0B).copy(alpha = 0.15f),
                                            RoundedCornerShape(4.dp)
                                        )
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = if (isLocked) "PAYMENT SUSPENDED" else if (request.isApproved) "LODGED & ACTIVE" else "PENDING APPROVAL",
                                        color = if (isLocked) Red500 else if (request.isApproved) Emerald500 else Color(0xFFF59E0B),
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = JetBrainsMono
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            HorizontalDivider(color = Slate800, thickness = 1.dp)
                            Spacer(modifier = Modifier.height(8.dp))

                            Text("Registrant/Representative: ${request.representativeName}", fontSize = 11.sp, color = Slate100)
                            Text("Contact Number: ${request.phone}", fontSize = 11.sp, color = Slate100)
                            Text("Coordinator Email: ${request.billingEmail}", fontSize = 11.sp, color = Slate100)

                            if (!request.isApproved) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = { viewModel.approveOrg(request.orgId) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                                    shape = RoundedCornerShape(4.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(imageVector = Icons.Default.Check, contentDescription = "Approve")
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("LODGE INTO DATABASE & ASSIGN CHANNEL", fontWeight = FontWeight.Bold)
                                }
                            } else {
                                Spacer(modifier = Modifier.height(12.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.CheckCircle,
                                            contentDescription = "Lock State",
                                            tint = if (isLocked) Red500 else Emerald500,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = if (isLocked) "PAYMENT SUSPENDED" else "ACTIVE STATUS",
                                            color = if (isLocked) Red500 else Emerald500,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = JetBrainsMono
                                        )
                                    }

                                    Button(
                                        onClick = { viewModel.toggleOrgLock(request.orgId) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (isLocked) Emerald500 else Red500,
                                            contentColor = Slate950
                                        ),
                                        shape = RoundedCornerShape(4.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            text = if (isLocked) "UNLOCK APP" else "SUSPEND APP",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainCommandDashboard(
    modifier: Modifier = Modifier,
    viewModel: SafetyViewModel = viewModel()
) {
    val incidents by viewModel.incidents.collectAsState()
    val bleDevices by viewModel.bleDevices.collectAsState()
    val auditLogs by viewModel.auditLogs.collectAsState()

    val currentRole by viewModel.selectedRole.collectAsState()
    val selectedIncidentId by viewModel.selectedIncidentId.collectAsState()
    val sosState by viewModel.sosState.collectAsState()
    val isScanning by viewModel.isScanning.collectAsState()
    val pairingProgress by viewModel.pairingProgress.collectAsState()
    val telemetryLogs by viewModel.telemetryLogs.collectAsState()
    val escalationLogs by viewModel.escalationLogs.collectAsState()
    val gpsAccuracy by viewModel.gpsAccuracy.collectAsState()
    val mockCurrentGps by viewModel.mockCurrentGps.collectAsState()

    val currentOrgId by viewModel.currentOrgId.collectAsState()

    // Multi-tenant control
    val tenants = listOf("ALL TENANTS", "Table Mountain Patrols", "Wits University", "Sandton Tactical", "Umhlanga Watch")
    var selectedTenant by remember { mutableStateOf("ALL TENANTS") }
    var expandedTenantMenu by remember { mutableStateOf(false) }

    var activeTab by remember { mutableStateOf("DASH") }

    val selectedIncident = incidents.find { it.id == selectedIncidentId }

    val filteredIncidents = remember(incidents, selectedTenant) {
        if (selectedTenant == "ALL TENANTS") {
            incidents
        } else {
            incidents.filter { it.organization.contains(selectedTenant.take(12), ignoreCase = true) }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
    ) {
        if (sosState != SOSState.IDLE) {
            val infiniteTransition = rememberInfiniteTransition(label = "blink")
            val alpha by infiniteTransition.animateFloat(
                initialValue = 0.4f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(500, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "alpha"
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Red500.copy(alpha = alpha))
                    .padding(vertical = 8.dp, horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(imageVector = Icons.Default.Warning, contentDescription = "Siren", tint = Slate100)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "CRITICAL EMERGENCY PANIC SOS BROADCAST IN PROGRESS",
                    color = Slate100,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    fontFamily = JetBrainsMono
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Slate900)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "SAFETYLINK ADMIN v5",
                    style = MaterialTheme.typography.titleMedium,
                    color = Emerald500,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Enterprise Command & Response System",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate400
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box {
                    Button(
                        onClick = { expandedTenantMenu = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                        shape = RoundedCornerShape(4.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Home, contentDescription = "Tenant Picker", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = selectedTenant, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = "Open")
                    }

                    DropdownMenu(
                        expanded = expandedTenantMenu,
                        onDismissRequest = { expandedTenantMenu = false },
                        modifier = Modifier.background(Slate900).border(1.dp, Slate800)
                    ) {
                        tenants.forEach { tenant ->
                            DropdownMenuItem(
                                text = { Text(tenant, color = Slate100, fontSize = 13.sp) },
                                onClick = {
                                    selectedTenant = tenant
                                    expandedTenantMenu = false
                                    viewModel.addTelemetry("TENANT", "Enforcing isolation filter: $tenant", "WARN")
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                Button(
                    onClick = { viewModel.logout() },
                    colors = ButtonDefaults.buttonColors(containerColor = Slate800, contentColor = Slate100),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(imageVector = Icons.Default.ExitToApp, contentDescription = "Logout", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("LOGOUT", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        HorizontalDivider(color = Slate800, thickness = 1.dp)

        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .width(72.dp)
                    .fillMaxHeight()
                    .background(Slate900)
                    .padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                SidebarTabItem(
                    icon = Icons.Default.Home,
                    label = "DASH",
                    isActive = activeTab == "DASH",
                    onClick = { activeTab = "DASH" }
                )
                SidebarTabItem(
                    icon = Icons.Default.Place,
                    label = "MAP",
                    isActive = activeTab == "MAP",
                    onClick = { activeTab = "MAP" }
                )
                SidebarTabItem(
                    icon = Icons.Default.Warning,
                    label = "PANIC",
                    isActive = activeTab == "PANIC",
                    onClick = { activeTab = "PANIC" }
                )
                SidebarTabItem(
                    icon = Icons.Default.Share,
                    label = "WEAR",
                    isActive = activeTab == "WEAR",
                    onClick = { activeTab = "WEAR" }
                )
                if (currentOrgId == "SL-ADMIN-000") {
                    SidebarTabItem(
                        icon = Icons.Default.List,
                        label = "ORGS",
                        isActive = activeTab == "ORGS",
                        onClick = { activeTab = "ORGS" }
                    )
                }
                SidebarTabItem(
                    icon = Icons.Default.Lock,
                    label = "AUDIT",
                    isActive = activeTab == "AUDIT",
                    onClick = { activeTab = "AUDIT" }
                )
            }

            VerticalDivider(color = Slate800, modifier = Modifier.width(1.dp).fillMaxHeight())

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
            ) {
                when (activeTab) {
                    "DASH" -> {
                        RealtimeEmergencyDashboard(viewModel = viewModel, filteredIncidents = filteredIncidents)
                    }
                    "MAP" -> {
                        Row(modifier = Modifier.fillMaxSize()) {
                            Column(
                                modifier = Modifier
                                    .weight(1.3f)
                                    .fillMaxHeight()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Slate900)
                                        .padding(8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    MapMetricItem(label = "ACTIVE INCIDENTS", count = filteredIncidents.count { it.status != "RESOLVED" }.toString(), color = Red500)
                                    MapMetricItem(label = "RESPONDERS DISPATCHED", count = filteredIncidents.count { it.status == "DISPATCHED" }.toString(), color = Amber500)
                                    MapMetricItem(label = "MITIGATED PROTOCOLS", count = filteredIncidents.count { it.status == "RESOLVED" }.toString(), color = Blue500)
                                }

                                HorizontalDivider(color = Slate800, thickness = 1.dp)

                                Box(modifier = Modifier.weight(1f)) {
                                    TacticalVectorMap(
                                        incidents = filteredIncidents,
                                        selectedIncidentId = selectedIncidentId,
                                        onIncidentSelect = { viewModel.selectIncident(it) }
                                    )

                                    Row(
                                        modifier = Modifier
                                            .align(Alignment.BottomStart)
                                            .padding(16.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = { viewModel.loadDemoScenarios() },
                                            colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                                            border = BorderStroke(1.dp, Slate800),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Icon(imageVector = Icons.Default.Refresh, contentDescription = "Reload Dem", tint = Emerald500)
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("RELOAD SCENARIOS", color = Slate100, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }

                            Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Slate800))

                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .background(Slate900)
                            ) {
                                if (selectedIncident != null) {
                                    IncidentDrawer(
                                        incident = selectedIncident,
                                        currentRole = currentRole,
                                        onAssignResponder = { incId, unit -> viewModel.assignResponder(incId, unit) },
                                        onResolve = { incId -> viewModel.resolveIncident(incId) },
                                        onClose = { viewModel.selectIncident(null) }
                                    )
                                } else {
                                    Text(
                                        text = "COMMAND FEED INCIDENTS",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Slate400,
                                        modifier = Modifier.padding(16.dp)
                                    )

                                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                                        if (filteredIncidents.isEmpty()) {
                                            item {
                                                Box(
                                                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(
                                                        text = "No active incidents reported in this tenant workspace.",
                                                        color = Slate400,
                                                        textAlign = TextAlign.Center
                                                    )
                                                }
                                            }
                                        } else {
                                            items(filteredIncidents) { incident ->
                                                val badgeColor = when (incident.status) {
                                                    "TRIGGERED" -> Red500
                                                    "ACTIVE" -> Red500
                                                    "DISPATCHED" -> Amber500
                                                    "RESPONDER_ARRIVED" -> Emerald500
                                                    "RESOLVED" -> Blue500
                                                    else -> Emerald500
                                                }

                                                Card(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                                        .clickable { viewModel.selectIncident(incident.id) },
                                                    colors = CardDefaults.cardColors(
                                                        containerColor = if (selectedIncidentId == incident.id) Slate800 else Slate950
                                                    ),
                                                    border = BorderStroke(
                                                        width = 1.dp,
                                                        color = if (selectedIncidentId == incident.id) Emerald500 else Slate800
                                                    )
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Row(
                                                            modifier = Modifier.fillMaxWidth(),
                                                            horizontalArrangement = Arrangement.SpaceBetween
                                                        ) {
                                                            Text(
                                                                text = incident.id,
                                                                style = MaterialTheme.typography.bodyMedium.copy(fontFamily = JetBrainsMono),
                                                                color = Slate100,
                                                                fontWeight = FontWeight.Bold
                                                            )
                                                            Box(
                                                                modifier = Modifier
                                                                    .background(badgeColor.copy(alpha = 0.15f), RoundedCornerShape(2.dp))
                                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                                            ) {
                                                                Text(
                                                                    text = incident.status,
                                                                    color = badgeColor,
                                                                    fontSize = 9.sp,
                                                                    fontWeight = FontWeight.Bold
                                                                )
                                                            }
                                                        }
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text(
                                                            text = incident.description,
                                                            maxLines = 2,
                                                            style = MaterialTheme.typography.bodySmall,
                                                            color = Slate400
                                                        )
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text(
                                                            text = "Responder: ${incident.assignedResponder}",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = if (incident.assignedResponder.contains("Unassigned")) Slate400 else Amber500
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    "PANIC" -> {
                        EscalationEngineView(
                            sosState = sosState,
                            gpsAccuracy = gpsAccuracy,
                            mockCurrentGps = mockCurrentGps,
                            escalationLogs = escalationLogs,
                            onTriggerSos = { viewModel.triggerEmergencySOS() },
                            onCancelSos = { viewModel.cancelSOS() }
                        )
                    }

                    "WEAR" -> {
                        BlerSimulator(
                            devices = bleDevices,
                            isScanning = isScanning,
                            pairingProgress = pairingProgress,
                            telemetryLogs = telemetryLogs,
                            onStartScan = { viewModel.startBleScan() },
                            onDisconnect = { mac -> viewModel.disconnectDevice(mac) },
                            onSimulateClick = { action -> viewModel.simulateBleClick(action) },
                            onClearTelemetry = { viewModel.addTelemetry("BLE", "Telemetry debug log buffer cleared.", "INFO") }
                        )
                    }

                    "ORGS" -> {
                        AdminOrgRegistryView(viewModel = viewModel)
                    }

                    "AUDIT" -> {
                        AuditLedger(
                            logs = auditLogs,
                            currentRole = currentRole,
                            onRoleChange = { role -> viewModel.setRole(role) },
                            onClearLogs = { viewModel.clearAuditLogs() }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SidebarTabItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (isActive) Emerald500 else Slate400,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = if (isActive) Emerald500 else Slate400
        )
    }
}

@Composable
fun MapMetricItem(label: String, count: String, color: Color) {
    Column(modifier = Modifier.padding(horizontal = 12.dp)) {
        Text(text = label, fontSize = 8.sp, color = Slate400, fontWeight = FontWeight.Bold)
        Text(
            text = count,
            fontSize = 14.sp,
            color = color,
            fontWeight = FontWeight.Black,
            fontFamily = JetBrainsMono
        )
    }
}

@Composable
fun RealtimeEmergencyDashboard(
    viewModel: SafetyViewModel,
    filteredIncidents: List<com.example.data.db.IncidentEntity>,
    modifier: Modifier = Modifier
) {
    var severityFilter by remember { mutableStateOf("ALL") }
    var selectedIncidentId by remember { mutableStateOf<String?>(null) }
    
    val selectedIncident = filteredIncidents.find { it.id == selectedIncidentId } ?: filteredIncidents.firstOrNull()

    // Calculate interactive stats
    val totalActive = filteredIncidents.count { it.status != "RESOLVED" }
    val totalCritical = filteredIncidents.count { it.severity == "CRITICAL" && it.status != "RESOLVED" }
    val totalDispatched = filteredIncidents.count { it.status == "DISPATCHED" }
    val totalResolved = filteredIncidents.count { it.status == "RESOLVED" }

    val displayIncidents = remember(filteredIncidents, severityFilter) {
        if (severityFilter == "ALL") filteredIncidents
        else filteredIncidents.filter { it.severity == severityFilter }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp)
    ) {
        // Dashboard Title and Subtitle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "REAL-TIME EMERGENCY COMMAND INCIDENTS DASHBOARD",
                    color = Emerald500,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = JetBrainsMono
                )
                Text(
                    text = "Live monitoring of incident triggers, responder deployment, and visual protocol lifecycles.",
                    color = Slate400,
                    fontSize = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // High fidelity stat rows
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            StatCard(label = "ACTIVE ALERTS", count = totalActive.toString(), color = Red500, modifier = Modifier.weight(1f))
            StatCard(label = "CRITICALS", count = totalCritical.toString(), color = Amber500, modifier = Modifier.weight(1f))
            StatCard(label = "DISPATCHED", count = totalDispatched.toString(), color = Emerald500, modifier = Modifier.weight(1f))
            StatCard(label = "RESOLVED", count = totalResolved.toString(), color = Blue500, modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Quick Controls Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.triggerDemoIncident() },
                colors = ButtonDefaults.buttonColors(containerColor = Red500, contentColor = Slate950),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier.weight(1f)
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Simulate", modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("TRIGGER TEST INCIDENT", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = JetBrainsMono)
            }

            Button(
                onClick = {
                    selectedIncident?.let {
                        viewModel.advanceIncidentStatus(it.id)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                shape = RoundedCornerShape(4.dp),
                enabled = selectedIncident != null && selectedIncident.status != "RESOLVED",
                modifier = Modifier.weight(1f)
            ) {
                Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Advance", modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("ADVANCE ALERT STATUS", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = JetBrainsMono)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Split Main Dashboard Layout
        Row(
            modifier = Modifier.fillMaxWidth().weight(1f),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Left Column: Alert list
            Column(
                modifier = Modifier
                    .weight(1.2f)
                    .fillMaxHeight()
            ) {
                // Filter Tabs
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    val filters = listOf("ALL", "CRITICAL", "HIGH", "LOW")
                    filters.forEach { filter ->
                        Box(
                            modifier = Modifier
                                .background(if (severityFilter == filter) Slate800 else Slate900, RoundedCornerShape(4.dp))
                                .border(1.dp, if (severityFilter == filter) Emerald500 else Slate800, RoundedCornerShape(4.dp))
                                .clickable { severityFilter = filter }
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = filter,
                                color = if (severityFilter == filter) Emerald500 else Slate400,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = JetBrainsMono
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Slate900)
                        .border(1.dp, Slate800)
                ) {
                    if (displayIncidents.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No incidents match filter.", color = Slate400, fontSize = 11.sp)
                            }
                        }
                    } else {
                        items(displayIncidents) { incident ->
                            val isSelected = incident.id == selectedIncident?.id
                            val severityColor = when (incident.severity) {
                                "CRITICAL" -> Red500
                                "HIGH" -> Amber500
                                else -> Blue500
                            }
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (isSelected) Slate800 else Slate900)
                                    .clickable { selectedIncidentId = incident.id }
                                    .padding(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = incident.id,
                                        color = Slate100,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        fontFamily = JetBrainsMono
                                    )
                                    BadgeContainer(label = incident.severity, color = severityColor)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = incident.description,
                                    color = Slate400,
                                    fontSize = 11.sp,
                                    maxLines = 1
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Status: ${incident.status}", color = Emerald500, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Text("Tenant: ${incident.organization}", color = Slate400, fontSize = 9.sp)
                                }
                                HorizontalDivider(color = Slate800, modifier = Modifier.padding(top = 8.dp))
                            }
                        }
                    }
                }
            }

            // Right Column: Detail, Timeline, and Active tracker progress!
            Column(
                modifier = Modifier
                    .weight(1.5f)
                    .fillMaxHeight()
                    .background(Slate900)
                    .border(1.dp, Slate800)
                    .padding(12.dp)
            ) {
                if (selectedIncident == null) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Select an incident to view live command tracking.", color = Slate400, fontSize = 11.sp, textAlign = TextAlign.Center)
                    }
                } else {
                    Text(
                        text = "INCIDENT TELEMETRY TRACKER",
                        color = Emerald500,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = JetBrainsMono
                    )
                    Text(
                        text = selectedIncident.id,
                        color = Slate100,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = JetBrainsMono
                    )
                    Text(
                        text = "Organization Link: ${selectedIncident.organization}",
                        color = Slate400,
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // LIVE STATUS TIMELINE PROGRESS BAR
                    Text(
                        text = "LIVE PROTOCOL STATUS TRACKER",
                        color = Slate400,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = JetBrainsMono
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    val stages = listOf("TRIGGERED", "DISPATCHED", "ARRIVED", "RESOLVED")
                    val currentStageIndex = when (selectedIncident.status) {
                        "TRIGGERED", "ACTIVE" -> 0
                        "DISPATCHED" -> 1
                        "RESPONDER_ARRIVED" -> 2
                        "RESOLVED" -> 3
                        else -> 0
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        stages.forEachIndexed { index, stage ->
                            val isActive = index <= currentStageIndex
                            val color = if (isActive) {
                                if (stage == "RESOLVED") Blue500 else if (stage == "TRIGGERED") Red500 else Emerald500
                            } else Slate800
                            
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(color.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                        .border(2.dp, color, RoundedCornerShape(12.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = (index + 1).toString(),
                                        color = if (isActive) color else Slate400,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = stage,
                                    color = if (isActive) color else Slate400,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            if (index < stages.size - 1) {
                                Box(
                                    modifier = Modifier
                                        .height(2.dp)
                                        .weight(0.5f)
                                        .background(if (index < currentStageIndex) Emerald500 else Slate800)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "COORDINATES & DESCRIPTION",
                        color = Slate400,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = JetBrainsMono
                    )
                    Text(
                        text = "GPS: ${selectedIncident.lat}, ${selectedIncident.lng}",
                        color = Emerald500,
                        fontSize = 11.sp,
                        fontFamily = JetBrainsMono,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = selectedIncident.description,
                        color = Slate100,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "RESPONDER ASSIGNED",
                        color = Slate400,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = JetBrainsMono
                    )
                    Text(
                        text = selectedIncident.assignedResponder,
                        color = Amber500,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "TIMELINE PROTOCOL EVENTS",
                        color = Slate400,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = JetBrainsMono
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .background(Slate950)
                            .border(1.dp, Slate800)
                            .padding(8.dp)
                    ) {
                        val events = selectedIncident.timelineData.split(", ")
                        events.forEach { ev ->
                            Row(
                                modifier = Modifier.padding(vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = Emerald500, modifier = Modifier.size(10.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(text = ev, color = Slate100, fontSize = 9.sp, fontFamily = JetBrainsMono)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(
    label: String,
    count: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Slate900),
        border = BorderStroke(1.dp, Slate800)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, fontSize = 8.sp, color = Slate400, fontWeight = FontWeight.Bold, fontFamily = JetBrainsMono)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = count, fontSize = 18.sp, color = color, fontWeight = FontWeight.Black, fontFamily = JetBrainsMono)
        }
    }
}
