package com.example

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.aistudio.safetylink.vqnztp.LockScreenNotificationService
import com.aistudio.safetylink.vqnztp.PanicService
import com.aistudio.safetylink.vqnztp.SafetyBackgroundService
import com.aistudio.safetylink.vqnztp.SafelinkForegroundService

// Reference: https://developer.android.com/reference/android/Manifest.permission#RECEIVE_BOOT_COMPLETED
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d("BootReceiver", "Received boot action: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            val services = listOf(
                Intent(context, SafetyBackgroundService::class.java),
                Intent(context, SafelinkForegroundService::class.java),
                Intent(context, PanicService::class.java),
                Intent(context, LockScreenNotificationService::class.java),
                Intent(context, WatchdogService::class.java)
            )
            for (svc in services) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(svc)
                    } else {
                        context.startService(svc)
                    }
                    Log.d("BootReceiver", "Started ${svc.component?.shortClassName}")
                } catch (e: Exception) {
                    Log.e("BootReceiver", "Failed to start ${svc.component?.shortClassName}", e)
                }
            }
        }
    }
}
