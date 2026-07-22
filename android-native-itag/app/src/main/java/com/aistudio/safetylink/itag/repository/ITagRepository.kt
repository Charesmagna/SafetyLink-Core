package com.aistudio.safetylink.itag.repository

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import com.aistudio.safetylink.itag.model.ConnectionStatus
import com.aistudio.safetylink.itag.model.ITagDevice
import com.aistudio.safetylink.itag.model.ITagEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

@SuppressLint("MissingPermission")
class ITagRepository(private val context: Context) {

    companion object {
        private const val TAG = "ITagRepository"

        // iTAG Custom FFE0 Service and Characteristics
        val SERVICE_UUID_FFE0: UUID = UUID.fromString("0000ffe0-0000-1000-8000-00805f9b34fb")
        val CHARACTERISTIC_UUID_FFE1: UUID = UUID.fromString("0000ffe1-0000-1000-8000-00805f9b34fb") // Buttons & Notifications
        val CHARACTERISTIC_UUID_FFE2: UUID = UUID.fromString("0000ffe2-0000-1000-8000-00805f9b34fb") // Write Beep Commands

        // Immediate Alert Service UUID (standard way to make a tag beep)
        val SERVICE_UUID_ALERT: UUID = UUID.fromString("00001802-0000-1000-8000-00805f9b34fb")
        val CHARACTERISTIC_UUID_ALERT_LEVEL: UUID = UUID.fromString("00002a06-0000-1000-8000-00805f9b34fb")

        // Standard Battery Service UUIDs
        val SERVICE_UUID_BATTERY: UUID = UUID.fromString("0000180f-0000-1000-8000-00805f9b34fb")
        val CHARACTERISTIC_UUID_BATTERY_LEVEL: UUID = UUID.fromString("00002a19-0000-1000-8000-00805f9b34fb")

        // Client Characteristic Configuration Descriptor (CCCD) for subscription
        val CLIENT_CHARACTERISTIC_CONFIG: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
    }

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
    private val bluetoothLeScanner: BluetoothLeScanner? by lazy { bluetoothAdapter?.bluetoothLeScanner }

    private val _scannedDevices = MutableStateFlow<List<ITagDevice>>(emptyList())
    val scannedDevices: StateFlow<List<ITagDevice>> = _scannedDevices.asStateFlow()

    private val _connectedDevices = MutableStateFlow<Map<String, ITagDevice>>(emptyMap())
    val connectedDevices: StateFlow<Map<String, ITagDevice>> = _connectedDevices.asStateFlow()

    private val _events = MutableStateFlow<List<ITagEvent>>(emptyList())
    val events: StateFlow<List<ITagEvent>> = _events.asStateFlow()

    private val activeGatts = mutableMapOf<String, BluetoothGatt>()
    private val reconnectHandlers = mutableMapOf<String, Handler>()
    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    // Trigger on button pressed callback
    var onButtonTriggered: ((address: String) -> Unit)? = null
    // Trigger on link lost callback
    var onLinkLost: ((ITagDevice) -> Unit)? = null

    private var scanCallback: ScanCallback? = null
    var isScanning = MutableStateFlow(false)

    fun startScanning() {
        if (isScanning.value || bluetoothLeScanner == null) return

        _scannedDevices.value = emptyList()
        scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                val device = result.device
                val address = device.address
                val name = device.name ?: result.scanRecord?.deviceName ?: "Generic Tag"

                // Filtering for common iTags names
                val lowerName = name.lowercase()
                val isTarget = lowerName.contains("itag") || 
                               lowerName.contains("tag") || 
                               lowerName.contains("key") || 
                               lowerName.contains("beacon") || 
                               lowerName.contains("mle-15") || 
                               lowerName.contains("tracker") || 
                               lowerName.contains("smart") ||
                               result.scanRecord?.serviceUuids?.contains(ParcelUuid(SERVICE_UUID_FFE0)) == true

                if (isTarget) {
                    val currentList = _scannedDevices.value
                    if (!currentList.any { it.address == address }) {
                        val parsedDevice = ITagDevice(
                            address = address,
                            name = name,
                            rssi = result.rssi
                        )
                        _scannedDevices.value = currentList + parsedDevice
                        addEvent(address, name, "DISCOVERED", "Discovered in BLE scan. RSSI: ${result.rssi} dBm")
                    } else {
                        // Update RSSI of scanned item
                        _scannedDevices.value = currentList.map {
                            if (it.address == address) it.copy(rssi = result.rssi) else it
                        }
                    }
                }
            }

            override fun onScanFailed(errorCode: Int) {
                Log.e(TAG, "Scan failed with error code: $errorCode")
                isScanning.value = false
            }
        }

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        isScanning.value = true
        bluetoothLeScanner?.startScan(null, settings, scanCallback)

        // Stop scanning automatically after 15 seconds
        Handler(Looper.getMainLooper()).postDelayed({
            stopScanning()
        }, 15000)
    }

    fun stopScanning() {
        if (!isScanning.value) return
        bluetoothLeScanner?.stopScan(scanCallback)
        scanCallback = null
        isScanning.value = false
    }

    fun connectDevice(address: String) {
        val device = bluetoothAdapter?.getRemoteDevice(address) ?: return
        stopScanning()

        // Update status to connecting
        val deviceName = device.name ?: "iTAG"
        updateDeviceStatus(address, deviceName, ConnectionStatus.CONNECTING)

        // Check if we should bond
        if (device.bondState == BluetoothDevice.BOND_NONE) {
            Log.i(TAG, "Initiating pairing/bonding for: $address")
            device.createBond()
        }

        val gattCallback = object : BluetoothGattCallback() {
            override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
                val devAddress = gatt.device.address
                val devName = gatt.device.name ?: "iTAG"

                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    Log.i(TAG, "GATT connected: $devAddress")
                    activeGatts[devAddress] = gatt
                    updateDeviceStatus(devAddress, devName, ConnectionStatus.CONNECTED)
                    addEvent(devAddress, devName, "CONNECTED", "Bluetooth link established successfully.")
                    
                    // Request service discovery
                    gatt.discoverServices()

                    // Start monitoring RSSI
                    startRssiMonitoring(gatt)

                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    Log.w(TAG, "GATT disconnected: $devAddress. Status code: $status")
                    activeGatts.remove(devAddress)
                    
                    val previousState = _connectedDevices.value[devAddress]
                    updateDeviceStatus(devAddress, devName, ConnectionStatus.DISCONNECTED)
                    
                    gatt.close()

                    if (previousState != null && previousState.linkLostAlarmEnabled) {
                        addEvent(devAddress, devName, "DISCONNECTED", "Link lost! Anti-lost alert triggered.")
                        onLinkLost?.invoke(previousState)
                    } else {
                        addEvent(devAddress, devName, "DISCONNECTED", "Disconnected by user request.")
                    }

                    // Attempt persistent reconnect
                    scheduleAutoReconnect(device)
                }
            }

            override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
                if (status == BluetoothGatt.GATT_SUCCESS) {
                    Log.i(TAG, "GATT services discovered for ${gatt.device.address}")
                    
                    // 1. Subscribe to button press notifications
                    subscribeToNotifications(gatt)
                    
                    // 2. Read initial battery level
                    readBatteryLevel(gatt)
                }
            }

            override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
                if (characteristic.uuid == CHARACTERISTIC_UUID_FFE1) {
                    val value = characteristic.value
                    val byteVal = if (value != null && value.isNotEmpty()) value[0].toInt() and 0xFF else 0
                    Log.i(TAG, "Hardware trigger pressed on ${gatt.device.address}: $byteVal")
                    
                    val devName = gatt.device.name ?: "iTAG"
                    addEvent(gatt.device.address, devName, "TAG_BUTTON_PRESSED", "Physical tag button clicked (Find Phone).")
                    onButtonTriggered?.invoke(gatt.device.address)
                }
            }

            override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
                if (status == BluetoothGatt.GATT_SUCCESS && characteristic.uuid == CHARACTERISTIC_UUID_BATTERY_LEVEL) {
                    val value = characteristic.value
                    if (value != null && value.isNotEmpty()) {
                        val battery = value[0].toInt() and 0xFF
                        Log.i(TAG, "Battery level read for ${gatt.device.address}: $battery%")
                        
                        _connectedDevices.value = _connectedDevices.value.toMutableMap().apply {
                            this[gatt.device.address] = this[gatt.device.address]?.copy(batteryLevel = battery) ?: return
                        }
                    }
                }
            }

            override fun onReadRemoteRssi(gatt: BluetoothGatt, rssi: Int, status: Int) {
                if (status == BluetoothGatt.GATT_SUCCESS) {
                    val devAddress = gatt.device.address
                    _connectedDevices.value = _connectedDevices.value.toMutableMap().apply {
                        this[devAddress] = this[devAddress]?.copy(rssi = rssi) ?: return
                    }
                }
            }
        }

        device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
    }

    fun disconnectDevice(address: String) {
        reconnectHandlers[address]?.removeCallbacksAndMessages(null)
        reconnectHandlers.remove(address)

        val gatt = activeGatts[address]
        if (gatt != null) {
            // Disable link lost trigger temporarily so it doesn't alert on intentional disconnect
            _connectedDevices.value = _connectedDevices.value.toMutableMap().apply {
                this[address] = this[address]?.copy(linkLostAlarmEnabled = false) ?: return
            }
            gatt.disconnect()
        } else {
            _connectedDevices.value = _connectedDevices.value.toMutableMap().apply {
                remove(address)
            }
        }
    }

    fun triggerRingDevice(address: String, makeBeep: Boolean) {
        val gatt = activeGatts[address] ?: return
        coroutineScope.launch {
            // Write alert level to FFE2 characteristic
            var service = gatt.getService(SERVICE_UUID_FFE0)
            var characteristic = service?.getCharacteristic(CHARACTERISTIC_UUID_FFE2)

            if (characteristic == null) {
                // Try fallback to Standard Immediate Alert Service (0x1802 -> 0x2A06)
                service = gatt.getService(SERVICE_UUID_ALERT)
                characteristic = service?.getCharacteristic(CHARACTERISTIC_UUID_ALERT_LEVEL)
            }

            if (characteristic != null) {
                val value = if (makeBeep) byteArrayOf(0x02) else byteArrayOf(0x00) // 0x02 is High Alert, 0x00 is No Alert
                characteristic.value = value
                gatt.writeCharacteristic(characteristic)
                
                val devName = gatt.device.name ?: "iTAG"
                val act = if (makeBeep) "Triggered tag alert beeper" else "Silenced tag alert beeper"
                addEvent(address, devName, "RING_CLICKED", act)
            } else {
                Log.e(TAG, "Beep characteristic not found on device $address")
            }
        }
    }

    fun updateSettings(address: String, alertDist: com.aistudio.safetylink.itag.model.AlertDistance, linkLost: Boolean, name: String) {
        _connectedDevices.value = _connectedDevices.value.toMutableMap().apply {
            val dev = this[address]
            if (dev != null) {
                this[address] = dev.copy(alertDistance = alertDist, linkLostAlarmEnabled = linkLost, customName = name)
            }
        }
    }

    private fun startRssiMonitoring(gatt: BluetoothGatt) {
        val handler = Handler(Looper.getMainLooper())
        val runnable = object : Runnable {
            override fun run() {
                val devAddress = gatt.device.address
                if (activeGatts.containsKey(devAddress)) {
                    gatt.readRemoteRssi()
                    handler.postDelayed(this, 3000) // Read RSSI every 3 seconds
                }
            }
        }
        handler.postDelayed(runnable, 3000)
    }

    private fun readBatteryLevel(gatt: BluetoothGatt) {
        val service = gatt.getService(SERVICE_UUID_BATTERY)
        val characteristic = service?.getCharacteristic(CHARACTERISTIC_UUID_BATTERY_LEVEL)
        if (characteristic != null) {
            gatt.readCharacteristic(characteristic)
        }
    }

    private fun subscribeToNotifications(gatt: BluetoothGatt) {
        val service = gatt.getService(SERVICE_UUID_FFE0)
        val characteristic = service?.getCharacteristic(CHARACTERISTIC_UUID_FFE1) ?: return

        gatt.setCharacteristicNotification(characteristic, true)

        val descriptor = characteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG)
        if (descriptor != null) {
            descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
            gatt.writeDescriptor(descriptor)
            Log.i(TAG, "Subscribed to physical button notifications for ${gatt.device.address}")
        }
    }

    private fun scheduleAutoReconnect(device: BluetoothDevice) {
        val address = device.address
        reconnectHandlers[address]?.removeCallbacksAndMessages(null)

        val handler = Handler(Looper.getMainLooper())
        reconnectHandlers[address] = handler

        val reconnectRunnable = object : Runnable {
            override fun run() {
                if (activeGatts.containsKey(address)) return
                Log.i(TAG, "Auto-reconnect triggered in background for: $address")
                connectDevice(address)
                handler.postDelayed(this, 10000) // Try connecting every 10 seconds
            }
        }
        handler.postDelayed(reconnectRunnable, 5000) // First retry in 5s
    }

    private fun updateDeviceStatus(address: String, name: String, status: ConnectionStatus) {
        val currentConnected = _connectedDevices.value.toMutableMap()
        val device = currentConnected[address] ?: ITagDevice(address = address, name = name)
        currentConnected[address] = device.copy(status = status)
        _connectedDevices.value = currentConnected
    }

    private fun addEvent(address: String, name: String, type: String, details: String) {
        val newEvent = ITagEvent(address = address, deviceName = name, eventType = type, details = details)
        val updated = (_events.value + newEvent).takeLast(50) // keep last 50 events
        _events.value = updated
    }
}
