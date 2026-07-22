package com.aistudio.safetylink.vqnztp

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

/**
 * LockScreenNotificationService
 *
 * Delivers a persistent lock-screen banner with three quick-action buttons:
 *   1. SOS Panic Circle  — triggers PanicService ACTION_TRIGGER_PANIC
 *   2. BLE Reconnect     — triggers SafelinkForegroundService ACTION_BLE_RECONNECT
 *   3. Watch Me 10 min   — triggers PanicService ACTION_WATCH_ME_10M
 *
 * The notification uses VISIBILITY_PUBLIC so it appears on the lock screen
 * even when the device is secured.
 */
class LockScreenNotificationService : Service() {

    companion object {
        const val CHANNEL_ID = "safetylink_lockscreen"
        const val NOTIFICATION_ID = 5500
        const val TAG = "LockScreenSvc"
    }

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildBanner())
        Log.i(TAG, "Lock screen banner active")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ──────────────────────────────────────────────────────────────
    private fun buildBanner(): Notification {
        val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        else
            PendingIntent.FLAG_UPDATE_CURRENT

        // SOS panic action
        val panicPi = PendingIntent.getService(
            this, 0,
            Intent(this, PanicService::class.java).apply {
                action = "com.aistudio.safetylink.ACTION_TRIGGER_PANIC"
            }, piFlags
        )

        // BLE reconnect action
        val blePi = PendingIntent.getService(
            this, 1,
            Intent(this, SafelinkForegroundService::class.java).apply {
                action = "com.aistudio.safetylink.ACTION_BLE_RECONNECT"
            }, piFlags
        )

        // Watch Me 10 min action
        val watchPi = PendingIntent.getService(
            this, 2,
            Intent(this, PanicService::class.java).apply {
                action = "com.aistudio.safetylink.ACTION_WATCH_ME_10M"
            }, piFlags
        )

        // Open app on banner tap
        val openPi = PendingIntent.getActivity(
            this, 3,
            packageManager.getLaunchIntentForPackage(packageName) ?: Intent(),
            piFlags
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("SafetyLink Armed")
            .setContentText("Tap SOS to trigger • BLE sync • Watch Me")
            .setContentIntent(openPi)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_delete, "🔴 SOS", panicPi)
            .addAction(android.R.drawable.stat_sys_data_bluetooth, "📶 BLE", blePi)
            .addAction(android.R.drawable.ic_menu_view, "👁 WATCH ME", watchPi)
            .build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID,
                "SafetyLink Lock Screen",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Lock screen quick-action banner"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }
}
