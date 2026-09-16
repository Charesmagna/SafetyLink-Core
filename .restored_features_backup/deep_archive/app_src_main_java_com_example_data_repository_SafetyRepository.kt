package com.example.data.repository

import com.example.data.db.*
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class SafetyRepository(private val safetyDao: SafetyDao) {

    val allIncidents: Flow<List<IncidentEntity>> = safetyDao.getAllIncidentsFlow()
    val allBleDevices: Flow<List<BleDeviceEntity>> = safetyDao.getAllBleDevicesFlow()
    val allAuditLogs: Flow<List<AuditLogEntity>> = safetyDao.getAllAuditLogsFlow()
    val allOrgRequests: Flow<List<OrgRequestEntity>> = safetyDao.getAllOrgRequestsFlow()

    suspend fun insertOrgRequest(request: OrgRequestEntity) {
        safetyDao.insertOrgRequest(request)
    }

    suspend fun approveOrgRequest(orgId: String) {
        safetyDao.updateOrgRequestApproval(orgId, true)
    }

    suspend fun clearAllOrgRequests() {
        safetyDao.clearAllOrgRequests()
    }

    suspend fun insertIncident(incident: IncidentEntity) {
        safetyDao.insertIncident(incident)
    }

    suspend fun updateIncident(incident: IncidentEntity) {
        safetyDao.updateIncident(incident)
    }

    suspend fun clearAllIncidents() {
        safetyDao.clearAllIncidents()
    }

    suspend fun insertBleDevice(device: BleDeviceEntity) {
        safetyDao.insertBleDevice(device)
    }

    suspend fun updateBleDevice(device: BleDeviceEntity) {
        safetyDao.updateBleDevice(device)
    }

    suspend fun deleteBleDevice(mac: String) {
        safetyDao.deleteBleDeviceByMac(mac)
    }

    suspend fun insertAuditLog(category: String, severity: String, message: String, details: String) {
        val log = AuditLogEntity(
            timestamp = System.currentTimeMillis(),
            category = category,
            severity = severity,
            message = message,
            details = details
        )
        safetyDao.insertAuditLog(log)
    }

    suspend fun clearAllAuditLogs() {
        safetyDao.clearAllAuditLogs()
    }

    // Prepopulate database with rich realistic data if empty
    suspend fun prepopulateIfEmpty() {
        // We will do this from the ViewModel or when initializing
    }
}
