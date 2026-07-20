package com.example

import android.app.ActivityManager
import android.app.AlarmManager
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
import com.aistudio.safetylink.vqnztp.SafetyBackgroundService

// Reference: https://developer.android.com/reference/android/Manifest.permission#FOREGROUND_SERVICE_DATA_SYNC
class WatchdogService : Service() {
    companion object {
        const val CHANNEL_ID = "safetylink_watchdog"
        const val NOTIFICATION_ID = 4001
        const val CHECK_INTERVAL_MS = 60000L
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        
        checkAndRestartMainService()
        scheduleNextCheck()
        
        return START_STICKY
    }

    private fun checkAndRestartMainService() {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        var isRunning = false
        @Suppress("DEPRECATION")
        for (service in manager.getRunningServices(Integer.MAX_VALUE)) {
            if (SafetyBackgroundService::class.java.name == service.service.className) {
                isRunning = true
                break
            }
        }

        if (!isRunning) {
            Log.w("WatchdogService", "SafetyBackgroundService not running. Restarting...")
            val serviceIntent = Intent(this, SafetyBackgroundService::class.java)
            try {
                startForegroundService(serviceIntent)
            } catch (e: Exception) {
                Log.e("WatchdogService", "Error restarting SafetyBackgroundService", e)
            }
        }
    }

    private fun scheduleNextCheck() {
        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(this, WatchdogAlarmReceiver::class.java).apply {
            action = "com.example.ACTION_WATCHDOG_CHECK"
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        System.currentTimeMillis() + CHECK_INTERVAL_MS,
                        pendingIntent
                    )
                } else {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        System.currentTimeMillis() + CHECK_INTERVAL_MS,
                        pendingIntent
                    )
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    System.currentTimeMillis() + CHECK_INTERVAL_MS,
                    pendingIntent
                )
            }
        } catch (e: SecurityException) {
            Log.e("WatchdogService", "Permission missing for exact alarms", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Watchdog Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors safety critical services"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("SafetyLink Watchdog")
        .setContentText("Monitoring critical safety services")
        .setSmallIcon(android.R.drawable.ic_secure)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build()

    override fun onBind(intent: Intent?): IBinder? = null
}
