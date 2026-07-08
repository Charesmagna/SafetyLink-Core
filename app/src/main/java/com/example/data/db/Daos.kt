package com.example.data.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface SafetyDao {
    // --- Incidents ---
    @Query("SELECT * FROM incidents ORDER BY timestamp DESC")
    fun getAllIncidentsFlow(): Flow<List<IncidentEntity>>

    @Query("SELECT * FROM incidents WHERE id = :id")
    suspend fun getIncidentById(id: String): IncidentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIncident(incident: IncidentEntity)

    @Update
    suspend fun updateIncident(incident: IncidentEntity)

    @Query("DELETE FROM incidents")
    suspend fun clearAllIncidents()

    // --- BLE Devices ---
    @Query("SELECT * FROM ble_devices ORDER BY lastSeen DESC")
    fun getAllBleDevicesFlow(): Flow<List<BleDeviceEntity>>

    @Query("SELECT * FROM ble_devices WHERE macAddress = :mac")
    suspend fun getBleDeviceByMac(mac: String): BleDeviceEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBleDevice(device: BleDeviceEntity)

    @Update
    suspend fun updateBleDevice(device: BleDeviceEntity)

    @Query("DELETE FROM ble_devices WHERE macAddress = :mac")
    suspend fun deleteBleDeviceByMac(mac: String)

    // --- Audit Logs ---
    @Query("SELECT * FROM audit_logs ORDER BY timestamp DESC")
    fun getAllAuditLogsFlow(): Flow<List<AuditLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuditLog(log: AuditLogEntity)

    @Query("DELETE FROM audit_logs")
    suspend fun clearAllAuditLogs()

    // --- Org Requests ---
    @Query("SELECT * FROM org_requests ORDER BY timestamp DESC")
    fun getAllOrgRequestsFlow(): Flow<List<OrgRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrgRequest(request: OrgRequestEntity)

    @Query("UPDATE org_requests SET isApproved = :approved WHERE orgId = :orgId")
    suspend fun updateOrgRequestApproval(orgId: String, approved: Boolean)

    @Query("DELETE FROM org_requests")
    suspend fun clearAllOrgRequests()
}
