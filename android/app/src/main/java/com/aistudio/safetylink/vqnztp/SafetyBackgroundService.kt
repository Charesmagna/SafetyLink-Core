package com.aistudio.safetylink.vqnztp

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.BatteryManager
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

class SafetyBackgroundService : Service() {
    private val TAG = "SafetyBackgroundService"
    private var locationManager: LocationManager? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    
    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            Log.i(TAG, "Location updated: ${location.latitude}, ${location.longitude}")
            // Emit to Capacitor or Handle Sync
            val intent = Intent("com.aistudio.safetylink.LOCATION_UPDATE")
            intent.putExtra("lat", location.latitude)
            intent.putExtra("lng", location.longitude)
            sendBroadcast(intent)
        }
        
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
        @Deprecated("Deprecated in Java")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    }

    override fun onCreate() {
        super.onCreate()
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "ACTION_TRIGGER_SOS") {
            triggerSOSWakelock()
        } else {
            optimizeLocationPollingFrequency()
        }
        return START_STICKY
    }

    private fun optimizeLocationPollingFrequency() {
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { ifilter ->
            applicationContext.registerReceiver(null, ifilter)
        }

        val batteryPct: Float? = batteryStatus?.let { intent ->
            val level: Int = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale: Int = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            level * 100 / scale.toFloat()
        }

        // Comply with Android 14+ background execution limits by scaling polling
        val pollingInterval = when {
            batteryPct == null -> 60000L
            batteryPct > 50 -> 30000L // 30 seconds
            batteryPct > 20 -> 60000L // 1 minute
            batteryPct > 5 -> 300000L // 5 minutes
            else -> 900000L // 15 minutes
        }
        
        scheduleLocationUpdates(pollingInterval)
    }

    private fun scheduleLocationUpdates(intervalMs: Long) {
        try {
            locationManager?.removeUpdates(locationListener)
            
            val isGpsEnabled = locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true
            val isNetworkEnabled = locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true

            if (isGpsEnabled) {
                locationManager?.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    intervalMs,
                    10f, // 10 meters displacement
                    locationListener,
                    Looper.getMainLooper()
                )
            } else if (isNetworkEnabled) {
                locationManager?.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    intervalMs,
                    10f,
                    locationListener,
                    Looper.getMainLooper()
                )
            } else {
                Log.w(TAG, "No location providers available")
            }
            Log.i(TAG, "Scheduled location updates with interval: ${intervalMs}ms")
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing location permissions", e)
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling location updates", e)
        }
    }

    private fun triggerSOSWakelock() {
        // Wakelocks are now strictly constrained to 30-second bursts during verified SOS triggers
        // as per architecture rules.
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "SafetyLink::SOSWakeLock"
            )
            wakeLock?.acquire(30000L) // 30 seconds max
            Log.i(TAG, "SOS Wakelock acquired for 30s")
            
            // Force immediate location polling during SOS
            scheduleLocationUpdates(5000L) // Poll every 5 seconds during emergency
            
            // Restore normal polling after emergency wakelock expires
            handler.postDelayed({
                optimizeLocationPollingFrequency()
            }, 30000L)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring wakelock", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager?.removeUpdates(locationListener)
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
