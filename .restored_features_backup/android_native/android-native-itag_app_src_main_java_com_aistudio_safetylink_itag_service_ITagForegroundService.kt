package com.aistudio.safetylink.itag.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.aistudio.safetylink.itag.MainActivity
import com.aistudio.safetylink.itag.model.ITagDevice
import com.aistudio.safetylink.itag.repository.ITagRepository

class ITagForegroundService : Service() {

    companion object {
        private const val TAG = "ITagForegroundService"
        private const val NOTIFICATION_ID = 1010
        private const val CHANNEL_ID = "itag_foreground_service_channel"
        private const val ALARM_CHANNEL_ID = "itag_alarm_service_channel"
        
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
    }

    private lateinit var repository: ITagRepository
    private var phoneRingtone: Ringtone? = null
    private var vibrator: Vibrator? = null

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Foreground connection service created")
        
        repository = ITagRepository(applicationContext)
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        // Initialize notification channels
        createNotificationChannels()

        // Setup repository callbacks
        repository.onButtonTriggered = { address ->
            Log.i(TAG, "Button pressed callback in service for: $address")
            triggerFindPhoneAlert()
        }

        repository.onLinkLost = { device ->
            Log.w(TAG, "Link lost callback in service for: ${device.address}")
            triggerLinkLostAlert(device)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        Log.i(TAG, "Service onStartCommand with action: $action")

        if (action == ACTION_START) {
            startForegroundNotification()
        } else if (action == ACTION_STOP) {
            stopRingtone()
            stopSelf()
        }

        return START_STICKY
    }

    private fun startForegroundNotification() {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Add silent action to dismiss find phone alarm
        val silenceIntent = Intent(this, ITagForegroundService::class.java).apply {
            this.action = ACTION_STOP
        }
        val silencePendingIntent = PendingIntent.getService(
            this,
            1,
            silenceIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SafetyLink iTAG Guard Active")
            .setContentText("Monitoring BLE trackers in the background for active safety mesh.")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_lock_silent_mode, "Silence Phone", silencePendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun triggerFindPhoneAlert() {
        try {
            Log.i(TAG, "Triggering Ringing Find Phone sound & vibration on phone")
            
            // 1. Play standard alarm/notification ringtone
            val notificationUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            
            stopRingtone() // stop any active ringtone first
            phoneRingtone = RingtoneManager.getRingtone(applicationContext, notificationUri)?.apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                }
                play()
            }

            // 2. Continuous SOS Vibrate
            val pattern = longArrayOf(0, 150, 100, 150, 100, 150, 400, 300, 100, 300, 100, 300)
            vibrator?.vibrate(pattern, 1)

            // 3. Post full heads-up notification so user can click to silence
            val notificationIntent = Intent(this, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val silenceIntent = Intent(this, ITagForegroundService::class.java).apply {
                this.action = ACTION_STOP
            }
            val silencePendingIntent = PendingIntent.getService(
                this,
                1,
                silenceIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val alarmNotification = NotificationCompat.Builder(this, ALARM_CHANNEL_ID)
                .setContentTitle("🚨 iTAG Finder Activated! 🚨")
                .setContentText("Your tracker requested a device page. Tap 'Silence Phone' to turn off alert.")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentIntent(pendingIntent)
                .addAction(android.R.drawable.ic_lock_silent_mode, "Silence Phone", silencePendingIntent)
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setFullScreenIntent(pendingIntent, true)
                .build()

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(NOTIFICATION_ID + 1, alarmNotification)

        } catch (e: Exception) {
            Log.e(TAG, "Error playing Ring Phone beeper: ${e.message}")
        }
    }

    private fun triggerLinkLostAlert(device: ITagDevice) {
        try {
            Log.w(TAG, "Triggering Link Lost Notification for device: ${device.address}")
            
            // 1. Brief Warning Vibrate
            vibrator?.vibrate(longArrayOf(0, 500, 200, 500), -1)

            // 2. Post high priority notification
            val notificationIntent = Intent(this, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val warningNotification = NotificationCompat.Builder(this, ALARM_CHANNEL_ID)
                .setContentTitle("⚠️ Tracker Connection Lost!")
                .setContentText("Your beacon '${device.customName}' has disconnected or gone out of range.")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_WARNING)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build()

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(NOTIFICATION_ID + 2, warningNotification)

        } catch (e: Exception) {
            Log.e(TAG, "Error playing link lost alert: ${e.message}")
        }
    }

    private fun stopRingtone() {
        phoneRingtone?.let {
            if (it.isPlaying) {
                it.stop()
            }
        }
        phoneRingtone = null
        vibrator?.cancel()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "iTAG Core Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Required channel for SafetyLink iTAG foreground tracking loops."
                setShowBadge(false)
            }

            val alarmChannel = NotificationChannel(
                ALARM_CHANNEL_ID,
                "iTAG Alerts & Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Rings phone and posts heads-up alerts when iTAG button is pressed."
                enableVibration(true)
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
            manager.createNotificationChannel(alarmChannel)
        }
    }

    override fun onDestroy() {
        stopRingtone()
        Log.i(TAG, "Foreground connection service destroyed")
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
