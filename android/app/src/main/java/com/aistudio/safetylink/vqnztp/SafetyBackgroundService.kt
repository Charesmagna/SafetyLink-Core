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
import android.os.PowerManager
import android.util.Log

class SafetyBackgroundService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null
    private var isServiceRunning = false
    
    companion object {
        const val CHANNEL_ID = "SafetyLink_BLE_KeepAlive"
        const val NOTIFICATION_ID = 112
        const val ACTION_START_SERVICE = "START_BACKGROUND_TRACKING"
        const val ACTION_STOP_SERVICE = "STOP_BACKGROUND_TRACKING"
        const val ACTION_TRIGGER_SOS = "TRIGGER_SOS_FROM_BLE"
    }

    override fun onCreate() {
        super.onCreate()
        Log.i("SafetyBackgroundService", "Service Created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SERVICE -> startBackgroundService()
            ACTION_STOP_SERVICE -> stopBackgroundService()
            ACTION_TRIGGER_SOS -> triggerSOSWorkflow()
        }
        
        // STICKY implies the service will be recreated if killed by the OS.
        return START_STICKY
    }

    private fun startBackgroundService() {
        if (isServiceRunning) return

        Log.i("SafetyBackgroundService", "Starting Foreground Service for BLE Keep-Alive")
        
        // Acquire WakeLock to keep CPU running for BLE scanning
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SafetyLink::BLEWakeLock")
        wakeLock?.acquire(10 * 60 * 1000L /*10 minutes*/) 
        
        val notification = buildForegroundNotification()
        startForeground(NOTIFICATION_ID, notification)
        isServiceRunning = true

        // Here we would typically initialize our Android BLE Scanner or 
        // delegate to Capacitor plugin instances to ensure background scanning continues.
    }

    private fun stopBackgroundService() {
        Log.i("SafetyBackgroundService", "Stopping Foreground Service")
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        stopForeground(true)
        stopSelf()
        isServiceRunning = false
    }

    private fun triggerSOSWorkflow() {
        Log.w("SafetyBackgroundService", "BLE Trigger Received in Background! Escalating...")
        // Broadcast back to the Capacitor WebView via a Plugin or BroadcastReceiver
        val sosIntent = Intent("com.aistudio.safetylink.SOS_TRIGGERED")
        sendBroadcast(sosIntent)

        // Wake up the app!
        val wakeIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("sos_triggered", true)
        }
        
        try {
            startActivity(wakeIntent)
        } catch (e: Exception) {
            Log.e("SafetyBackgroundService", "Cannot start activity directly, using full-screen intent", e)
        }
        
        // Use full-screen intent to aggressively force foreground on Android 10+
        val pendingIntent = PendingIntent.getActivity(this, 0, wakeIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        
        val notification = builder
            .setContentTitle("EMERGENCY TRIGGERED")
            .setContentText("Hardware SOS triggered! Opening SafetyLink...")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setFullScreenIntent(pendingIntent, true)
            .setAutoCancel(true)
            .build()
            
        notificationManager.notify(999, notification)
    }

    private fun buildForegroundNotification(): Notification {
        val pendingIntent: PendingIntent =
            Intent(this, MainActivity::class.java).let { notificationIntent ->
                PendingIntent.getActivity(this, 0, notificationIntent,
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("SafetyLink is Armed")
            .setContentText("Listening for emergency BLE beacons.")
            .setSmallIcon(android.R.drawable.ic_secure) // Replace with your own icon
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "SafetyLink Background Service",
                NotificationManager.IMPORTANCE_LOW
            )
            serviceChannel.description = "Maintains connection with BLE Panic Buttons"
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        // We don't provide binding, so return null
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i("SafetyBackgroundService", "Service Destroyed")
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
    }
}
