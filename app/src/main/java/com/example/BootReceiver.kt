package com.example

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BootReceiver
 *
 * Automatically launches SafetyBackgroundService after device boot completes.
 * Reference: Manifest.permission.RECEIVE_BOOT_COMPLETED from https://developer.android.com/reference/android/Manifest.permission
 *
 * Caveat: Android 8.0 (API 26) and above restricts background execution. Receivers registered in the
 * manifest for standard implicit broadcasts are limited, but BOOT_COMPLETED is explicitly allowed.
 * Note: priority on intent-filters for manifest broadcast receivers is not actually honored by the Android OS
 * for unordered broadcasts like ACTION_BOOT_COMPLETED, so this priority serves mostly as documentation of intent.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i("BootReceiver", "Received broadcast action: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            try {
                val serviceIntent = Intent(context, SafetyBackgroundService::class.java).apply {
                    this.action = SafetyBackgroundService.ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.i("BootReceiver", "Successfully dispatched SafetyBackgroundService launch command.")
            } catch (e: Exception) {
                Log.e("BootReceiver", "Failed to start SafetyBackgroundService on boot: ${e.message}", e)
            }
        }
    }
}
