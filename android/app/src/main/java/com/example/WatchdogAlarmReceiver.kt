package com.example

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

// Reference: https://developer.android.com/reference/android/Manifest.permission#SCHEDULE_EXACT_ALARM
class WatchdogAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "com.example.ACTION_WATCHDOG_CHECK") {
            Log.d("WatchdogAlarmReceiver", "Watchdog alarm triggered")
            val serviceIntent = Intent(context, WatchdogService::class.java)
            try {
                context.startForegroundService(serviceIntent)
            } catch (e: Exception) {
                Log.e("WatchdogAlarmReceiver", "Failed to start WatchdogService", e)
            }
        }
    }
}
