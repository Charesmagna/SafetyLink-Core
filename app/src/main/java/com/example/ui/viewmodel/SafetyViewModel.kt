package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.db.AppDatabase
import com.example.data.db.AuditLogEntity
import com.example.data.db.BleDeviceEntity
import com.example.data.db.IncidentEntity
import com.example.data.repository.SafetyRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import java.text.SimpleDateFormat
import java.util.Date

enum class SOSState {
    IDLE,
    ACQUIRING_GPS,
    CAPTURING_EVIDENCE,
    ESCALATING,
    MOCK_SYNCING,
    DISPATCHED,
    RESOLVED
}

enum class UserRole(val displayName: String) {
    CITIZEN("Citizen"),
    RESPONDER("First Responder"),
    SUPERVISOR("Supervisor"),
    DISPATCHER("Dispatcher"),
    ORG_ADMIN("Org Administrator")
}

data class TelemetryLog(
    val timestamp: Long = System.currentTimeMillis(),
    val tag: String,
    val message: String,
    val level: String = "INFO" // INFO, DEBUG, WARN, ERROR
)

class SafetyViewModel(application: Application) : AndroidViewModel(application) {

    private val database = AppDatabase.getDatabase(application)
    private val repository = SafetyRepository(database.safetyDao())

    // SharedPreferences for persistent session & emergency contact channels
    private val prefs = application.getSharedPreferences("safetylink_session", android.content.Context.MODE_PRIVATE)

    private val _isLoggedIn = MutableStateFlow(prefs.getBoolean("is_logged_in", false))
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _currentUser = MutableStateFlow(prefs.getString("current_user", "") ?: "")
    val currentUser: StateFlow<String> = _currentUser.asStateFlow()

    private val _currentOrgId = MutableStateFlow(prefs.getString("current_org_id", "") ?: "")
    val currentOrgId: StateFlow<String> = _currentOrgId.asStateFlow()

    private val _isBleDisconnectedAlertActive = MutableStateFlow(false)
    val isBleDisconnectedAlertActive: StateFlow<Boolean> = _isBleDisconnectedAlertActive.asStateFlow()

    // Exposed DB data streams
    val incidents = repository.allIncidents.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val bleDevices = repository.allBleDevices.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val auditLogs = repository.allAuditLogs.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val orgRequests = repository.allOrgRequests.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Customizable backup alerting contacts
    data class EmergencyContact(
        val key: String,
        val label: String,
        val phone: String,
        val template: String,
        val channelType: String // "CALL", "SMS", "WHATSAPP", "GROUP", "POLICE"
    )

    private val _emergencyContacts = MutableStateFlow<List<EmergencyContact>>(emptyList())
    val emergencyContacts: StateFlow<List<EmergencyContact>> = _emergencyContacts.asStateFlow()

    // UI state
    private val _selectedRole = MutableStateFlow(UserRole.CITIZEN)
    val selectedRole: StateFlow<UserRole> = _selectedRole.asStateFlow()

    private val _selectedIncidentId = MutableStateFlow<String?>(null)
    val selectedIncidentId: StateFlow<String?> = _selectedIncidentId.asStateFlow()

    private val _sosState = MutableStateFlow(SOSState.IDLE)
    val sosState: StateFlow<SOSState> = _sosState.asStateFlow()

    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    private val _pairingProgress = MutableStateFlow<String?>(null)
    val pairingProgress: StateFlow<String?> = _pairingProgress.asStateFlow()

    // Simulated telemetries and live-tracking variables
    private val _telemetryLogs = MutableStateFlow<List<TelemetryLog>>(emptyList())
    val telemetryLogs: StateFlow<List<TelemetryLog>> = _telemetryLogs.asStateFlow()

    private val _escalationLogs = MutableStateFlow<List<String>>(emptyList())
    val escalationLogs: StateFlow<List<String>> = _escalationLogs.asStateFlow()

    private val _gpsAccuracy = MutableStateFlow("Accuracy: Pending")
    val gpsAccuracy: StateFlow<String> = _gpsAccuracy.asStateFlow()

    private val _mockCurrentGps = MutableStateFlow("-26.1912, 28.0264") // Wits Campus by default
    val mockCurrentGps: StateFlow<String> = _mockCurrentGps.asStateFlow()

    // Timeline playback for Map Center
    private val _isPlayingTimeline = MutableStateFlow(false)
    val isPlayingTimeline: StateFlow<Boolean> = _isPlayingTimeline.asStateFlow()

    private val _timelineMultiplier = MutableStateFlow(1f) // multiplier for map animation
    val timelineMultiplier: StateFlow<Float> = _timelineMultiplier.asStateFlow()

    // --- Tactical NetGuard & AdGuard VPN-Style States ---
    private val _isNetGuardActive = MutableStateFlow(true)
    val isNetGuardActive: StateFlow<Boolean> = _isNetGuardActive.asStateFlow()

    private val _isDnsOverHttpsActive = MutableStateFlow(true)
    val isDnsOverHttpsActive: StateFlow<Boolean> = _isDnsOverHttpsActive.asStateFlow()

    private val _blockedRequests = MutableStateFlow(1420)
    val blockedRequests: StateFlow<Int> = _blockedRequests.asStateFlow()

    private val _dataSavedMb = MutableStateFlow(42.8f)
    val dataSavedMb: StateFlow<Float> = _dataSavedMb.asStateFlow()

    private val _currentThroughputKb = MutableStateFlow(4.8f)
    val currentThroughputKb: StateFlow<Float> = _currentThroughputKb.asStateFlow()

    // Foreground Background service
    private val _isBackgroundServiceActive = MutableStateFlow(false)
    val isBackgroundServiceActive: StateFlow<Boolean> = _isBackgroundServiceActive.asStateFlow()

    // Locked organization IDs for Payment Suspension (failed payment lockdown)
    private val _lockedOrgs = MutableStateFlow<Set<String>>(emptySet())
    val lockedOrgs: StateFlow<Set<String>> = _lockedOrgs.asStateFlow()

    data class NetworkPacket(
        val timestamp: String,
        val domain: String,
        val appName: String,
        val protocol: String,
        val isBlocked: Boolean,
        val sizeKb: Float
    )

    private val _networkPackets = MutableStateFlow<List<NetworkPacket>>(emptyList())
    val networkPackets: StateFlow<List<NetworkPacket>> = _networkPackets.asStateFlow()

    private var netGuardJob: Job? = null
    private var simulationJob: Job? = null
    private var trackingJob: Job? = null

    init {
        // Load locked orgs set from SharedPreferences
        val savedLockedOrgs = prefs.getStringSet("locked_orgs_set", emptySet()) ?: emptySet()
        _lockedOrgs.value = savedLockedOrgs

        // Restore role based on stored session organization
        val savedOrg = prefs.getString("current_org_id", "") ?: ""
        if (savedOrg == "SL-ADMIN-000") {
            _selectedRole.value = UserRole.SUPERVISOR
        } else if (savedOrg.isNotEmpty()) {
            _selectedRole.value = UserRole.CITIZEN
        } else {
            _selectedRole.value = UserRole.CITIZEN
        }

        loadContacts()

        viewModelScope.launch {
            // Check if DB has data. If not, populate it with rich emergency operation scenarios
            repository.allIncidents.first().let { list ->
                if (list.isEmpty()) {
                    loadDemoScenarios()
                }
            }
            addTelemetry("SYSTEM", "SafetyLink BLE Engine initialized successfully", "INFO")
        }

        // Initialize NetGuard Traffic Simulation
        startNetGuardSimulation()
    }

    fun toggleNetGuard() {
        _isNetGuardActive.value = !_isNetGuardActive.value
        addTelemetry("NETGUARD", "Tactical firewall turned ${if (_isNetGuardActive.value) "ON" else "OFF"}", "SEVERE")
        if (_isNetGuardActive.value) {
            startNetGuardSimulation()
        } else {
            netGuardJob?.cancel()
            _currentThroughputKb.value = 0f
        }
    }

    fun toggleDnsOverHttps() {
        _isDnsOverHttpsActive.value = !_isDnsOverHttpsActive.value
        addTelemetry("NETGUARD", "DNS over HTTPS (DoH) secure tunnel ${if (_isDnsOverHttpsActive.value) "ENABLED" else "DISABLED"}", "WARN")
    }

    fun startNetGuardSimulation() {
        netGuardJob?.cancel()
        netGuardJob = viewModelScope.launch {
            val domains = listOf(
                "saps-emergency.gov.za" to ("SafetyLink Core" to false),
                "firebaseio.com" to ("SafetyLink Core" to false),
                "secure-route.aura.co.za" to ("SafetyLink Core" to false),
                "google-analytics.com" to ("Background Sync" to true),
                "tracking-pixel.adtech.com" to ("Social App" to true),
                "whatsapp-media.whatsapp.net" to ("WhatsApp" to false),
                "unauthorized-beacon.ru" to ("Trojan-Alert" to true),
                "covert-jammer-node.net" to ("System Spy" to true),
                "saps.gov.za" to ("Chrome" to false),
                "doubleclick.net" to ("Browser Ads" to true)
            )
            while (_isNetGuardActive.value) {
                delay(2000 + (Math.random() * 2000).toLong())
                val choice = domains.random()
                val isBlocked = choice.second.second
                val size = if (isBlocked) 0f else (Math.random() * 15f + 0.5f).toFloat()
                
                if (isBlocked) {
                    _blockedRequests.value += 1
                } else {
                    _dataSavedMb.value += (Math.random() * 0.1f + 0.02f).toFloat()
                }
                
                _currentThroughputKb.value = if (isBlocked) 0.5f else (Math.random() * 25f + 1.2f).toFloat()

                val sdf = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
                val timeStr = sdf.format(java.util.Date())

                val newPacket = NetworkPacket(
                    timestamp = timeStr,
                    domain = choice.first,
                    appName = choice.second.first,
                    protocol = if (choice.first.contains("saps") || choice.first.contains("firebase")) "DoH (HTTPS)" else "TLS 1.3",
                    isBlocked = isBlocked,
                    sizeKb = size
                )

                _networkPackets.value = (listOf(newPacket) + _networkPackets.value).take(40)
            }
        }
    }

    fun loadContacts() {
        val list = mutableListOf<EmergencyContact>()
        val defaultContacts = listOf(
            EmergencyContact("1", "1st Contact - Direct Voice Call Dispatch", "+27829110000", "Dialing initiated automatically for audio monitoring.", "CALL"),
            EmergencyContact("2", "2nd Contact - SMS Mobile GPS Handshake", "+27839119112", "EMERGENCY: Distress beacon active. Realtime GPS: https://maps.google.com/?q={LAT},{LNG}", "SMS"),
            EmergencyContact("3", "3rd Contact - Custom WhatsApp Number", "+27600123456", "CRITICAL: BLE iTAG button press verified. GPS: {LAT},{LNG}. Please deploy unit.", "WHATSAPP"),
            EmergencyContact("4", "4th Contact - SafetyLink Community Channel", "+27650987654", "SafetyLink Broadcast Group alert active near -26.1912, 28.0264", "GROUP"),
            EmergencyContact("5", "5th Contact - SAPS South African Police Station", "10111", "Police emergency notification direct dial.", "POLICE")
        )
        for (i in 1..5) {
            val label = prefs.getString("contact_${i}_label", defaultContacts[i-1].label) ?: ""
            val phone = prefs.getString("contact_${i}_phone", defaultContacts[i-1].phone) ?: ""
            val template = prefs.getString("contact_${i}_template", defaultContacts[i-1].template) ?: ""
            val type = prefs.getString("contact_${i}_type", defaultContacts[i-1].channelType) ?: ""
            list.add(EmergencyContact(i.toString(), label, phone, template, type))
        }
        _emergencyContacts.value = list
    }

    fun updateContact(key: String, label: String, phone: String, template: String) {
        prefs.edit().apply {
            putString("contact_${key}_label", label)
            putString("contact_${key}_phone", phone)
            putString("contact_${key}_template", template)
            apply()
        }
        loadContacts()
        addTelemetry("CONTACTS", "Custom alert backup route contact #$key updated.", "INFO")
    }

    fun login(username: String, orgId: String): Boolean {
        if (orgId == "SL-ADMIN-000") {
            _currentUser.value = "Super Administrator (Char)"
            _currentOrgId.value = "SL-ADMIN-000"
            _isLoggedIn.value = true
            setRole(UserRole.SUPERVISOR)

            prefs.edit().apply {
                putBoolean("is_logged_in", true)
                putString("current_user", "Super Administrator (Char)")
                putString("current_org_id", "SL-ADMIN-000")
                apply()
            }
            addTelemetry("AUTH", "Super Administrator bypass activated via secret ID.", "SEVERE")
            return true
        }

        if (username.isBlank() || orgId.isBlank()) return false

        _currentUser.value = username
        _currentOrgId.value = orgId
        _isLoggedIn.value = true
        setRole(UserRole.CITIZEN)

        prefs.edit().apply {
            putBoolean("is_logged_in", true)
            putString("current_user", username)
            putString("current_org_id", orgId)
            apply()
        }
        addTelemetry("AUTH", "User $username logged into workspace $orgId", "INFO")
        return true
    }

    fun registerOrganization(
        repName: String,
        repPhone: String,
        billingEmail: String,
        orgName: String
    ): String {
        val uniqueId = "SL-ORG-${UUID.randomUUID().toString().take(4).uppercase()}"
        viewModelScope.launch {
            val req = com.example.data.db.OrgRequestEntity(
                orgId = uniqueId,
                orgName = orgName,
                billingEmail = billingEmail,
                representativeName = repName,
                phone = repPhone,
                isApproved = false,
                timestamp = System.currentTimeMillis()
            )
            repository.insertOrgRequest(req)
            repository.insertAuditLog(
                category = "SECURITY",
                severity = "INFO",
                message = "New Organization Registration Request",
                details = "Pending org $orgName ($uniqueId) created by registrant $repName."
            )
            addTelemetry("REGISTRATION", "Registered pending org $orgName: $uniqueId", "WARN")
        }
        return uniqueId
    }

    fun approveOrg(orgId: String) {
        viewModelScope.launch {
            repository.approveOrgRequest(orgId)
            repository.insertAuditLog(
                category = "SECURITY",
                severity = "INFO",
                message = "Organization Request Approved",
                details = "Organization request $orgId has been approved by Platform Administrator."
            )
            addTelemetry("REGISTRATION", "Admin approved Org request $orgId", "INFO")
        }
    }

    fun toggleOrgLock(orgId: String) {
        val current = _lockedOrgs.value.toMutableSet()
        if (current.contains(orgId)) {
            current.remove(orgId)
            addTelemetry("ADMIN", "Unlocked organization: $orgId (Access Restored)", "INFO")
        } else {
            current.add(orgId)
            addTelemetry("ADMIN", "SUSPENDED organization: $orgId (Payment Lockout Enforced)", "SEVERE")
        }
        _lockedOrgs.value = current
        prefs.edit().putStringSet("locked_orgs_set", current).apply()
        
        viewModelScope.launch {
            repository.insertAuditLog(
                category = "SECURITY",
                severity = if (current.contains(orgId)) "SEVERE" else "INFO",
                message = if (current.contains(orgId)) "Organization Payment Locked" else "Organization Payment Unlocked",
                details = "Organization ID $orgId payment lock state toggled. Current suspended status: ${current.contains(orgId)}"
            )
        }
    }

    fun toggleBackgroundService() {
        val nextState = !_isBackgroundServiceActive.value
        _isBackgroundServiceActive.value = nextState
        
        val context = getApplication<Application>().applicationContext
        val serviceIntent = android.content.Intent(context, com.example.SafetyBackgroundService::class.java)
        
        if (nextState) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            addTelemetry("BACKGROUND", "SafetyLink Persistent Guardian Service started in foreground.", "INFO")
        } else {
            serviceIntent.action = com.example.SafetyBackgroundService.ACTION_STOP
            context.startService(serviceIntent)
            addTelemetry("BACKGROUND", "SafetyLink Background Service stopped by operator.", "WARN")
        }
    }

    fun logout() {
        _isLoggedIn.value = false
        _currentUser.value = ""
        _currentOrgId.value = ""
        prefs.edit().apply {
            putBoolean("is_logged_in", false)
            putString("current_user", "")
            putString("current_org_id", "")
            apply()
        }
        addTelemetry("AUTH", "User session terminated gracefully.", "INFO")
    }

    fun dismissBleDisconnectAlert() {
        _isBleDisconnectedAlertActive.value = false
    }

    fun setRole(role: UserRole) {
        viewModelScope.launch {
            _selectedRole.value = role
            repository.insertAuditLog(
                category = "PERMISSION",
                severity = "WARNING",
                message = "Role-Based Privilege Switch",
                details = "User switched active profile to ${role.displayName}. Reconfiguring dynamic security policy enforcement."
            )
            addTelemetry("AUTH", "Dynamic RBAC Switch: Exposing ${role.displayName} Workspace", "WARN")
        }
    }

    fun selectIncident(id: String?) {
        _selectedIncidentId.value = id
        if (id != null) {
            addTelemetry("DISPATCH", "Tactical focus: Incident #${id.take(8)}", "INFO")
        }
    }

    // Dynamic South Africa demo population
    fun loadDemoScenarios() {
        viewModelScope.launch {
            repository.clearAllIncidents()
            repository.clearAllAuditLogs()

            val demoIncidents = listOf(
                IncidentEntity(
                    id = "INC-1092-CT",
                    status = "DISPATCHED",
                    severity = "HIGH",
                    lat = -33.9628,
                    lng = 18.4252,
                    timestamp = System.currentTimeMillis() - 1200000,
                    organization = "Table Mountain Community Patrols",
                    assignedResponder = "Alpha Tactical Unit 1",
                    medicalProfile = "Blood Type: O+, Allergy: Penicillin",
                    description = "Solo hiker reported falling down steep ridge near Platteklip Gorge. Extreme low temperature risk. Signal deteriorating.",
                    timelineData = "13:02 UTC - SOS triggered via iTAG Wearable, 13:03 UTC - GPS established, 13:05 UTC - Alpha Unit Dispatched"
                ),
                IncidentEntity(
                    id = "INC-4820-JHB",
                    status = "ACTIVE",
                    severity = "CRITICAL",
                    lat = -26.1912,
                    lng = 28.0264,
                    timestamp = System.currentTimeMillis() - 600000,
                    organization = "Wits Campus Security",
                    assignedResponder = "Campus Medic Team 3",
                    medicalProfile = "Diabetes Type 1, Wearing Insulin Pump",
                    description = "Student collapsed outside Great Hall. Hypoglycemic shock suspected. Bystanders monitoring breathing. Emergency services notified.",
                    timelineData = "13:10 UTC - Fall Detected by iTAG SmartBand, 13:11 UTC - Campus Security Alerted, 13:12 UTC - Dispatching nearest medic"
                ),
                IncidentEntity(
                    id = "INC-7731-SND",
                    status = "TRIGGERED",
                    severity = "HIGH",
                    lat = -26.1044,
                    lng = 28.0526,
                    timestamp = System.currentTimeMillis() - 60000,
                    organization = "Sandton Tactical Response",
                    assignedResponder = "Unassigned (Pending Dispatch)",
                    medicalProfile = "No chronic medical conditions listed",
                    description = "Armed robbery in progress near retail parking lot. SOS triggered silently via hidden dashboard trigger.",
                    timelineData = "13:15 UTC - Silent SOS Received, 13:15 UTC - High Priority Notification sent to supervisor, 13:16 UTC - Audio evidence recording active"
                ),
                IncidentEntity(
                    id = "INC-2291-DBN",
                    status = "RESOLVED",
                    severity = "LOW",
                    lat = -29.7261,
                    lng = 31.0858,
                    timestamp = System.currentTimeMillis() - 7200000,
                    organization = "Umhlanga Beach Patrols",
                    assignedResponder = "Lifeguard Lead Durban",
                    medicalProfile = "Asthma, inhaler on-person",
                    description = "Lost child located on north pier. Parent reunited after 15-minute sweep. Local security monitored safety.",
                    timelineData = "11:15 UTC - Child reported missing, 11:22 UTC - Search parameters mapped, 11:30 UTC - Reunited & status marked as RESOLVED"
                )
            )

            for (incident in demoIncidents) {
                repository.insertIncident(incident)
            }

            // Populating active BLE Wearable
            val defaultWearable = BleDeviceEntity(
                macAddress = "00:1A:7D:DA:71:0F",
                friendlyName = "Primary iTAG Panic Button",
                deviceType = "iTAG",
                isPrimary = true,
                batteryLevel = 87,
                rssi = -64,
                connectionState = "CONNECTED",
                lastSeen = System.currentTimeMillis()
            )
            repository.insertBleDevice(defaultWearable)

            // Seed audit logs
            repository.insertAuditLog("SECURITY", "INFO", "Database populated", "Initial seed data loaded into Room persistence context.")
            repository.insertAuditLog("BLE", "INFO", "iTAG Profile bound", "Paired primary wearable 'Primary iTAG Panic Button' automatically bound to emergency channel.")

            addTelemetry("DB", "Mock tactical operations scenarios seeded successfully", "INFO")
        }
    }

    fun startBleScan() {
        viewModelScope.launch {
            _isScanning.value = true
            _pairingProgress.value = "Scanning for nearby advertising packets..."
            addTelemetry("BLE", "Started BLE LE Scan (Filters: iTAG legacy advertising 0xFFE0)", "INFO")

            delay(1500)
            _pairingProgress.value = "Found 'iTAG Emergency Button' [00:1A:7D:DA:71:0F] - RSSI: -68 dBm"
            addTelemetry("BLE", "Discovered peripheral 00:1A:7D:DA:71:0F (iTAG) - Legacy advertising flags verified", "INFO")

            delay(1500)
            _pairingProgress.value = "Initiating bonding protocol (createBond)..."
            addTelemetry("BLE", "Executing BluetoothDevice.createBond() on peripheral 00:1A:7D:DA:71:0F", "WARN")

            delay(1500)
            _pairingProgress.value = "Connected and Bonded!"
            _isScanning.value = false

            val newDevice = BleDeviceEntity(
                macAddress = "00:1A:7D:DA:71:0F",
                friendlyName = "Primary iTAG Panic Button",
                deviceType = "iTAG",
                isPrimary = true,
                batteryLevel = 98,
                rssi = -55,
                connectionState = "CONNECTED",
                lastSeen = System.currentTimeMillis()
            )
            repository.insertBleDevice(newDevice)
            _isBleDisconnectedAlertActive.value = false
            repository.insertAuditLog("BLE", "INFO", "Wearable Registered Successfully", "MAC: 00:1A:7D:DA:71:0F. Bond state verified as BOND_BONDED. Primary emergency channel configured.")

            _pairingProgress.value = null
        }
    }

    fun disconnectDevice(mac: String) {
        viewModelScope.launch {
            val device = repository.allBleDevices.first().find { it.macAddress == mac }
            if (device != null) {
                val updated = device.copy(connectionState = "DISCONNECTED", rssi = -100)
                repository.updateBleDevice(updated)
                repository.insertAuditLog("BLE", "SEVERE", "Wearable Connection Terminated", "Primary panic button connection was severed. Immediate action fallback route recommended.")
                addTelemetry("BLE", "Peripheral connection severed gracefully [MAC: $mac]", "ERROR")
                _isBleDisconnectedAlertActive.value = true
            }
        }
    }

    // Inject simulated BLE button clicks
    fun simulateBleClick(triggerType: String) {
        // Triggers map into high-level event bus
        viewModelScope.launch {
            addTelemetry("BLE_GATT", "Notification received on FFE1: type = $triggerType", "WARN")
            val desc = when (triggerType) {
                "SINGLE" -> {
                    triggerEmergencySOS("Silent SOS triggered via wearable single-click")
                    "Single click: Silent SOS initiated."
                }
                "DOUBLE" -> {
                    cancelSOS()
                    "Double click: SOS execution sequence aborted by hardware override."
                }
                "TRIPLE" -> {
                    triggerEmergencySOS("Critical Distress SOS triggered via wearable triple-click")
                    "Triple click: Critical Distress Broadcast."
                }
                "LONG" -> {
                    triggerEmergencySOS("Voice callback request triggered via wearable long-press")
                    "Long press: Critical callback requested."
                }
                "FALL_DETECTED" -> {
                    triggerEmergencySOS("Impact Distress SOS triggered via auto fall detection")
                    "Inertial impact sensor: High-G impact detected. Fall distress SOS initiated."
                }
                else -> "Unknown click profile received."
            }
            repository.insertAuditLog("BLE", "WARNING", "Hardware Event Detected", "$desc MAC: 00:1A:7D:DA:71:0F")
        }
    }

    // Escalation engine implementation
    fun triggerEmergencySOS(customDesc: String = "Manual emergency panic SOS triggered from command board") {
        if (_sosState.value != SOSState.IDLE) return

        simulationJob?.cancel()
        simulationJob = viewModelScope.launch {
            _escalationLogs.value = emptyList()

            // 1. Triggered
            _sosState.value = SOSState.ACQUIRING_GPS
            _gpsAccuracy.value = "Acquiring cellular & GPS fix (LTE Triangulation active)..."
            _escalationLogs.value = listOf("13:16:01 - BLE Wearable broadcast validation OK", "13:16:02 - Initializing high-precision GPS lock")
            addTelemetry("ESCALATION", "Active Emergency Escalation Engine started", "SEVERE")
            delay(1200)

            // 2. GPS Lock
            _gpsAccuracy.value = "Precision Lock: 4.8 meters (HPE Mode)"
            _mockCurrentGps.value = "-26.1912, 28.0264" // Seeded to Great Hall
            _escalationLogs.value = _escalationLogs.value + listOf("13:16:03 - GPS locked at -26.1912, 28.0264. Horizontal precision: 4.8m")
            _sosState.value = SOSState.CAPTURING_EVIDENCE
            delay(1200)

            // 3. Evidence capture
            _escalationLogs.value = _escalationLogs.value + listOf("13:16:05 - Command: Initiating local ambient audio & camera metadata capture", "13:16:06 - Evidence queue: 1 audio fragment (128kbps AAC) cached offline")
            _sosState.value = SOSState.ESCALATING
            delay(1200)

            // 4. Escalating/Broadcasting
            _escalationLogs.value = _escalationLogs.value + listOf("13:16:08 - Broadcasting SOS via SMS Gateway (Primary: Vodacom, Status: SENT)", "13:16:09 - Dispatch pipeline handshake active (API secure transport)")
            _sosState.value = SOSState.MOCK_SYNCING
            delay(1200)

            // 5. Firebase syncing & creating incident
            val newIncidentId = "INC-${UUID.randomUUID().toString().take(6).uppercase()}-CT"
            val newIncident = IncidentEntity(
                id = newIncidentId,
                status = "ACTIVE",
                severity = "CRITICAL",
                lat = -26.1912 + (Math.random() - 0.5) * 0.005, // near the user
                lng = 28.0264 + (Math.random() - 0.5) * 0.005,
                timestamp = System.currentTimeMillis(),
                organization = "SafetyLink Command Center 1",
                assignedResponder = "Unassigned (Dispatch Pending)",
                medicalProfile = "Insulin dependent diabetes, severe peanut allergy",
                description = "$customDesc - Live streaming telemetry.",
                timelineData = "13:16:01 UTC - Ble SOS Received, 13:16:03 UTC - GPS Locked, 13:16:09 UTC - Handshake Sync Complete"
            )
            repository.insertIncident(newIncident)
            selectIncident(newIncidentId)

            _escalationLogs.value = _escalationLogs.value + listOf("13:16:11 - Firebase Firestore write OK. Incident #$newIncidentId created.", "13:16:12 - Multi-tenant push broadcast executed to Dispatch Command Center")
            _sosState.value = SOSState.DISPATCHED

            repository.insertAuditLog("INCIDENT", "SEVERE", "Incident Created", "New emergency record #$newIncidentId created from BLE Wearable broadcast. Severity: CRITICAL.")
            addTelemetry("INCIDENT", "Incident #$newIncidentId written to Firestore and local Room cache", "SEVERE")

            // Simulate auto-dispatching a responder moving toward this incident in real-time!
            simulateResponderArrival(newIncidentId)
        }
    }

    private fun simulateResponderArrival(incidentId: String) {
        trackingJob?.cancel()
        trackingJob = viewModelScope.launch {
            var progress = 0
            while (progress < 5) {
                delay(3000)
                val current = repository.allIncidents.first().find { it.id == incidentId } ?: break
                if (current.status == "RESOLVED") break

                val newStatus = when (progress) {
                    0 -> "ACTIVE"
                    1 -> "DISPATCHED"
                    2 -> "RESPONDER_ARRIVED"
                    else -> "RESPONDER_ARRIVED"
                }

                // Move responder coordinates slightly closer to incident lat/lng
                val responderName = "TacUnit Alpha ${progress + 1}"
                val updated = current.copy(
                    status = newStatus,
                    assignedResponder = responderName,
                    timelineData = current.timelineData + ", 13:17:${10 * progress} UTC - Dispatcher Assigned: $responderName"
                )
                repository.insertIncident(updated)
                progress++

                addTelemetry("TRACKING", "Unit $responderName position updated. ETA: ${5 - progress} mins", "INFO")
            }
        }
    }

    fun cancelSOS() {
        simulationJob?.cancel()
        trackingJob?.cancel()
        _sosState.value = SOSState.IDLE
        _escalationLogs.value = emptyList()
        _gpsAccuracy.value = "Accuracy: Pending"
        addTelemetry("ESCALATION", "Active Emergency Escalation Engine cancelled by operator", "WARN")
    }

    fun assignResponder(incidentId: String, unitName: String) {
        viewModelScope.launch {
            val incident = repository.allIncidents.first().find { it.id == incidentId }
            if (incident != null) {
                val updated = incident.copy(
                    status = "DISPATCHED",
                    assignedResponder = unitName,
                    timelineData = incident.timelineData + ", 13:18:22 UTC - Assigned responder changed manually to: $unitName"
                )
                repository.updateIncident(updated)
                repository.insertAuditLog("DISPATCH", "INFO", "Manual Unit Dispatch", "Incident #$incidentId assigned to tactical responder unit: $unitName.")
                addTelemetry("DISPATCH", "Manual dispatch directive: Unit '$unitName' assigned to incident #${incidentId.take(8)}", "INFO")
            }
        }
    }

    fun resolveIncident(incidentId: String) {
        viewModelScope.launch {
            val incident = repository.allIncidents.first().find { it.id == incidentId }
            if (incident != null) {
                val updated = incident.copy(
                    status = "RESOLVED",
                    timelineData = incident.timelineData + ", 13:19:00 UTC - Marked resolved by Dispatch Operator"
                )
                repository.updateIncident(updated)
                repository.insertAuditLog("INCIDENT", "INFO", "Incident Resolved", "Emergency scenario #$incidentId has been successfully mitigated and marked RESOLVED.")
                addTelemetry("INCIDENT", "Incident #${incidentId.take(8)} closed and resolved", "INFO")
                if (selectedIncidentId.value == incidentId) {
                    // Update current drawer selected state
                }
            }
        }
    }

    // Toggle live playback for timeline/mock analytics simulation
    fun toggleTimelinePlayback() {
        _isPlayingTimeline.value = !_isPlayingTimeline.value
        addTelemetry("TIMELINE", "Dynamic timeline mock simulation ${if (_isPlayingTimeline.value) "started" else "stopped"}", "INFO")
    }

    fun addTelemetry(tag: String, message: String, level: String = "INFO") {
        val newLog = TelemetryLog(tag = tag, message = message, level = level)
        _telemetryLogs.value = (listOf(newLog) + _telemetryLogs.value).take(100)
    }

    fun clearAuditLogs() {
        viewModelScope.launch {
            repository.clearAllAuditLogs()
            repository.insertAuditLog("SECURITY", "WARNING", "Audit Trail Purged", "All historical audit ledger entries were purged from local cache.")
        }
    }

    fun removeDevice(macAddress: String) {
        viewModelScope.launch {
            repository.deleteBleDevice(macAddress)
            repository.insertAuditLog("BLE", "WARNING", "Wearable Unpaired", "Panic wearable with MAC: $macAddress was successfully removed from persistent bonding profiles.")
            addTelemetry("BLE", "Device pairing record removed: $macAddress", "WARN")
        }
    }

    fun triggerDemoIncident() {
        viewModelScope.launch {
            val mockId = "SL-INC-${(1000..9999).random()}"
            val severities = listOf("LOW", "MEDIUM", "HIGH", "CRITICAL")
            val descriptions = listOf(
                "Panic alert from BLE wearable iTAG button press near university square.",
                "Critical distress signal received. High pulse spike detected.",
                "Manual panic trigger logged via app control interface.",
                "Continuous silent distress signal triggered near estate checkpoint."
            )
            val sampleIncident = IncidentEntity(
                id = mockId,
                status = "TRIGGERED",
                severity = severities.random(),
                lat = -26.1912 + (Math.random() - 0.5) * 0.005,
                lng = 28.0264 + (Math.random() - 0.5) * 0.005,
                timestamp = System.currentTimeMillis(),
                organization = "Platform General User",
                assignedResponder = "Unassigned Dispatch Pool",
                medicalProfile = "Blood Type: B+ | Asthma Inhaler User | No Allergies",
                description = descriptions.random(),
                timelineData = "Biometric panic beacon triggered"
            )
            repository.insertIncident(sampleIncident)
            addTelemetry("INCIDENT", "Simulated panic incident $mockId triggered.", "SEVERE")
            repository.insertAuditLog("INCIDENT", "SEVERE", "Simulated Incident Triggered", "Incident $mockId created via Real-time Admin Dashboard.")
            selectIncident(mockId)
        }
    }

    fun advanceIncidentStatus(incidentId: String) {
        viewModelScope.launch {
            val list = repository.allIncidents.first()
            val incident = list.find { it.id == incidentId } ?: return@launch
            if (incident.status == "RESOLVED") return@launch
            
            val nextStatus = when (incident.status) {
                "TRIGGERED", "ACTIVE" -> "DISPATCHED"
                "DISPATCHED" -> "RESPONDER_ARRIVED"
                "RESPONDER_ARRIVED" -> "RESOLVED"
                else -> "RESOLVED"
            }
            
            val updatedTimeline = incident.timelineData + ", Status: $nextStatus at " + SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(Date())

            val updated = incident.copy(
                status = nextStatus,
                assignedResponder = if (nextStatus == "DISPATCHED") "Umhlanga Patrol Unit B" else incident.assignedResponder,
                timelineData = updatedTimeline
            )
            repository.updateIncident(updated)
            addTelemetry("DASHBOARD", "Advanced status of ${incident.id} to $nextStatus", "INFO")
            repository.insertAuditLog("DISPATCH", "INFO", "Incident Advanced", "Incident $incidentId advanced to status $nextStatus.")
        }
    }
}
