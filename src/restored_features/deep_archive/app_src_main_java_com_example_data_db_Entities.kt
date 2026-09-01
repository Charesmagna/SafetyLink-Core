package com.example.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "incidents")
data class IncidentEntity(
    @PrimaryKey val id: String,
    val status: String, // TRIGGERED, ACTIVE, DISPATCHED, RESPONDER_ARRIVED, RESOLVED
    val severity: String, // LOW, MEDIUM, HIGH, CRITICAL
    val lat: Double,
    val lng: Double,
    val timestamp: Long,
    val organization: String,
    val assignedResponder: String,
    val medicalProfile: String,
    val description: String,
    val timelineData: String // Comma-separated or JSON array representation of communication timeline logs
)

@Entity(tableName = "ble_devices")
data class BleDeviceEntity(
    @PrimaryKey val macAddress: String,
    val friendlyName: String,
    val deviceType: String, // iTAG, Generic panic, SmartBand
    val isPrimary: Boolean,
    val batteryLevel: Int,
    val rssi: Int,
    val connectionState: String, // CONNECTED, DISCONNECTED, BONDED, PAIRING
    val lastSeen: Long
)

@Entity(tableName = "audit_logs")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val timestamp: Long,
    val category: String, // AUTH, PERMISSION, BLE, INCIDENT, DISPATCH, SECURITY
    val severity: String, // INFO, WARNING, SEVERE
    val message: String,
    val details: String
)

@Entity(tableName = "org_requests")
data class OrgRequestEntity(
    @PrimaryKey val orgId: String,
    val orgName: String,
    val billingEmail: String,
    val representativeName: String,
    val phone: String,
    val isApproved: Boolean,
    val timestamp: Long
)

