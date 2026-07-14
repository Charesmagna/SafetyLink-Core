package com.example

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * WatchdogAlarmReceiver
 *
 * Receives the periodic AlarmManager broadcasts and guarantees that WatchdogService is running.
 * Reference: Manifest.permission.SCHEDULE_EXACT_ALARM from https://developer.android.com/reference/android/Manifest.permission
 */
class WatchdogAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i("WatchdogAlarmReceiver", "Received watchdog backup alarm broadcast action: $action")

        if (action == WatchdogService.ACTION_WATCHDOG_CHECK) {
            try {
                val serviceIntent = Intent(context, WatchdogService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.i("WatchdogAlarmReceiver", "WatchdogService started or validated via Alarm trigger.")
            } catch (e: Exception) {
                Log.e("WatchdogAlarmReceiver", "Failed to launch WatchdogService from alarm tick: ${e.message}", e)
            }
        }
    }
}
