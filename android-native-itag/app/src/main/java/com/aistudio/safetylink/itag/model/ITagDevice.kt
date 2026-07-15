package com.aistudio.safetylink.itag.model

import java.util.Date

enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED
}

enum class AlertDistance {
    SHORT,   // Beep if RSSI drop below -75 dBm
    MEDIUM,  // Beep if RSSI drop below -85 dBm
    LONG     // Beep only on link lost (GATT disconnect)
}

data class ITagDevice(
    val address: String,
    val name: String,
    val avatarResId: Int? = null,
    val customName: String = name,
    val status: ConnectionStatus = ConnectionStatus.DISCONNECTED,
    val batteryLevel: Int = 100,
    val rssi: Int = -100,
    val alertDistance: AlertDistance = AlertDistance.MEDIUM,
    val linkLostAlarmEnabled: Boolean = true,
    val lastKnownLatitude: Double? = null,
    val lastKnownLongitude: Double? = null,
    val lastSeenTimestamp: Long = System.currentTimeMillis()
)

data class ITagEvent(
    val id: String = java.util.UUID.randomUUID().toString(),
    val address: String,
    val deviceName: String,
    val eventType: String, // "CONNECTED", "DISCONNECTED", "RING_CLICKED", "TAG_BUTTON_PRESSED", "BATTERY_LOW", "LINK_LOST_ALERT"
    val timestamp: Long = System.currentTimeMillis(),
    val details: String
)
