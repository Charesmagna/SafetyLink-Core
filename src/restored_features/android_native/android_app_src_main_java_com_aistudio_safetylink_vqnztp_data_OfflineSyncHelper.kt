package com.aistudio.safetylink.vqnztp.data

import android.content.Context
import androidx.work.*
import com.aistudio.safetylink.vqnztp.data.entities.EmergencySession
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

object OfflineSyncHelper {
    
    @OptIn(DelicateCoroutinesApi::class)
    @JvmStatic
    fun recordFailedDispatch(context: Context, incidentId: String, lat: Double, lng: Double, description: String, orgId: String, triggeredBy: String) {
        GlobalScope.launch {
            val db = AppDatabase.getDatabase(context)
            val session = EmergencySession(
                sessionId = incidentId,
                startTime = System.currentTimeMillis(),
                status = "PENDING_SYNC|${lat}|${lng}|${description}|${orgId}|${triggeredBy}" 
                // Hacky way to store details without changing schema for now, or we can just parse it later
            )
            db.emergencyDao().insertSession(session)
        }
        scheduleSync(context)
    }

    @JvmStatic
    fun scheduleSync(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
            
        val workRequest = OneTimeWorkRequestBuilder<OfflineSyncWorker>()
            .setConstraints(constraints)
            .build()
            
        WorkManager.getInstance(context).enqueueUniqueWork(
            "OfflineSyncWork",
            ExistingWorkPolicy.REPLACE,
            workRequest
        )
    }
}
