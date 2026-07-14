package com.example

import android.app.ActivityManager
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

/**
 * WatchdogService
 *
 * Runs as a persistent background watchdog in a separate service to monitor SafetyBackgroundService.
 * Uses foregroundServiceType="dataSync" as defined by Manifest.permission.FOREGROUND_SERVICE_DATA_SYNC.
 * Reference: Manifest.permission.FOREGROUND_SERVICE_DATA_SYNC from https://developer.android.com/reference/android/Manifest.permission
 */
class WatchdogService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    private var monitoringJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        Log.i("WatchdogService", "SafetyLink Watchdog Service created.")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i("WatchdogService", "Watchdog service started with action: ${intent?.action}")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // API 29+ requires specifying the service type
            startForeground(
                NOTIFICATION_ID,
                createNotification("Watchdog service keeping core telemetry alive..."),
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, createNotification("Watchdog service keeping core telemetry alive..."))
        }

        startWatchdogLoop()
        scheduleWatchdogAlarm(this)

        return START_STICKY
    }

    private fun startWatchdogLoop() {
        monitoringJob?.cancel()
        monitoringJob = serviceScope.launch {
            while (isActive) {
                try {
                    checkAndReviveSafetyService()
                } catch (e: Exception) {
                    Log.e("WatchdogService", "Error during safety service health check: ${e.message}", e)
                }
                delay(30_000) // Run checks every 30 seconds
            }
        }
    }

    private fun checkAndReviveSafetyService() {
        if (!isSafetyServiceRunning()) {
            Log.w("WatchdogService", "SafetyBackgroundService is NOT running! Reviving service now.")
            val serviceIntent = Intent(this, SafetyBackgroundService::class.java).apply {
                action = SafetyBackgroundService.ACTION_START
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }
            } catch (e: Exception) {
                Log.e("WatchdogService", "Failed to auto-restart SafetyBackgroundService: ${e.message}", e)
            }
        } else {
            Log.d("WatchdogService", "SafetyBackgroundService is confirmed running. Telemetry stable.")
        }
    }

    private fun isSafetyServiceRunning(): Boolean {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        @Suppress("DEPRECATION")
        val runningServices = manager.getRunningServices(Integer.MAX_VALUE) ?: return false
        for (service in runningServices) {
            if (SafetyBackgroundService::class.java.name == service.service.className) {
                return true
            }
        }
        return false
    }

    override fun onDestroy() {
        super.onDestroy()
        monitoringJob?.cancel()
        serviceJob.cancel()
        Log.i("WatchdogService", "WatchdogService destroyed. Scheduling emergency alarm re-check.")
        scheduleWatchdogAlarm(this)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SafetyLink Watchdog Channel",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Guarantees continuous uptime and failover recovery for SafetyLink core processes."
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(contentText: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SAFETYLINK WATCHDOG")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        const val CHANNEL_ID = "safetylink_watchdog"
        const val NOTIFICATION_ID = 8802
        const val ACTION_WATCHDOG_CHECK = "com.example.ACTION_WATCHDOG_CHECK"

        fun scheduleWatchdogAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, WatchdogAlarmReceiver::class.java).apply {
                action = ACTION_WATCHDOG_CHECK
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val triggerTime = System.currentTimeMillis() + 60_000L // Run check in 60s

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        pendingIntent
                    )
                } else {
                    alarmManager.set(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        pendingIntent
                    )
                }
                Log.d("WatchdogService", "Watchdog exact backup alarm set for 60s from now.")
            } catch (e: Exception) {
                Log.e("WatchdogService", "Failed to schedule exact alarm: ${e.message}", e)
                // Fallback to non-exact
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            }
        }
    }
}
