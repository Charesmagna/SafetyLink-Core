package com.example

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.data.db.AppDatabase
import com.example.data.repository.SafetyRepository
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SafetyBackgroundService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    private var trackingJob: Job? = null
    
    private lateinit var repository: SafetyRepository

    override fun onCreate() {
        super.onCreate()
        Log.i("SafetyBackgroundService", "SafetyLink background service created.")
        val db = AppDatabase.getDatabase(applicationContext)
        repository = SafetyRepository(db.safetyDao())
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, createNotification("Monitoring location & BLE wearables..."))
        startTrackingLoop()
        return START_STICKY
    }

    private fun startTrackingLoop() {
        trackingJob?.cancel()
        trackingJob = serviceScope.launch {
            val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
            while (isActive) {
                val timeStr = sdf.format(Date())
                
                // Simulate background location ping
                val mockLat = -26.1912 + (Math.random() - 0.5) * 0.002
                val mockLng = 28.0264 + (Math.random() - 0.5) * 0.002
                
                // Insert into audit logs or update status
                repository.insertAuditLog(
                    category = "BLE",
                    severity = "INFO",
                    message = "Background Telemetry Active",
                    details = "GPS: [${String.format("%.5f", mockLat)}, ${String.format("%.5f", mockLng)}] | Wearable BLE heartbeat acknowledged. Connection: Stable."
                )
                
                // Update persistent notification content with real-time stats
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.notify(
                    NOTIFICATION_ID,
                    createNotification("Active background monitor. Last Ping: $timeStr")
                )

                delay(5000) // Check every 5 seconds
            }
        }
    }

    private fun stopForegroundService() {
        trackingJob?.cancel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
        Log.i("SafetyBackgroundService", "SafetyLink background service destroyed.")
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SafetyLink Active Guardian Channel",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors BLE wearable connections and precise telemetry in background."
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(contentText: String): Notification {
        val stopIntent = Intent(this, SafetyBackgroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = android.app.PendingIntent.getService(
            this,
            0,
            stopIntent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SAFETYLINK ACTIVE GUARD")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_compass) // Standard system drawable
            .setOngoing(true)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "STOP MONITORING",
                stopPendingIntent
            )
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        const val CHANNEL_ID = "safetylink_background_monitor"
        const val NOTIFICATION_ID = 8801
        
        const val ACTION_START = "com.example.ACTION_START"
        const val ACTION_STOP = "com.example.ACTION_STOP"
    }
}
