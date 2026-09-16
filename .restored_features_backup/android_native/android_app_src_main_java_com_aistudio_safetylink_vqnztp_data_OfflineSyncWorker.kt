package com.aistudio.safetylink.vqnztp.data

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.aistudio.safetylink.vqnztp.BuildConfig
import com.aistudio.safetylink.vqnztp.data.entities.EmergencySession
import org.json.JSONObject
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

class OfflineSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val db = AppDatabase.getDatabase(applicationContext)
        val pendingSessions = db.emergencyDao().getPendingSessions("PENDING_SYNC%")
        
        if (pendingSessions.isEmpty()) {
            return Result.success()
        }

        var allSuccess = true
        for (session in pendingSessions) {
            val success = syncSession(session)
            if (success) {
                // Mark as synced
                val updated = session.copy(status = "SYNCED")
                db.emergencyDao().updateSession(updated)
            } else {
                allSuccess = false
            }
        }

        return if (allSuccess) Result.success() else Result.retry()
    }

    private fun syncSession(session: EmergencySession): Boolean {
        // Status format: PENDING_SYNC|lat|lng|description|orgId|triggeredBy
        val parts = session.status.split("|")
        if (parts.size < 6) return false
        
        val lat = parts[1].toDoubleOrNull() ?: 0.0
        val lng = parts[2].toDoubleOrNull() ?: 0.0
        val desc = parts[3]
        val orgId = parts[4]
        val triggeredBy = parts[5]

        var conn: HttpURLConnection? = null
        return try {
            val url = URL("${BuildConfig.BACKEND_BASE_URL}/api/incidents")
            conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            
            val payload = JSONObject().apply {
                put("id", session.sessionId)
                put("latitude", lat)
                put("longitude", lng)
                put("description", desc)
                put("org_id", orgId)
                put("triggered_by", triggeredBy)
                put("status", "DISPATCHED")
                put("severity", "CRITICAL")
                put("sync_type", "OFFLINE_BATCH")
            }
            
            conn.outputStream.use { os ->
                os.write(payload.toString().toByteArray(StandardCharsets.UTF_8))
            }
            
            val code = conn.responseCode
            code in 200..299
        } catch (e: Exception) {
            Log.e("OfflineSyncWorker", "Failed to sync incident", e)
            false
        } finally {
            conn?.disconnect()
        }
    }
}
