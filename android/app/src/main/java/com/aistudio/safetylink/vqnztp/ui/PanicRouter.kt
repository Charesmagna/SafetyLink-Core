package com.aistudio.safetylink.vqnztp.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.aistudio.safetylink.vqnztp.SafetyBackgroundService

object PanicRouter {
    fun sendPanic(context: Context, data: String, hasInternet: Boolean, hasMoya: Boolean, smsEnabled: Boolean, batteryPct: Int) {
        val payload = if (batteryPct < 15) "LOW BATTERY $data" else data
        
        // Elevate privileges via Background Service for real-time tracking
        val serviceIntent = Intent(context, SafetyBackgroundService::class.java).apply {
            action = "ACTION_TRIGGER_SOS"
            putExtra("PAYLOAD", payload)
        }
        context.startService(serviceIntent)
        
        // 1. CameraX & Audio capture would trigger here
        // 2. Vibration + Siren
        
        if (hasInternet) {
            // api.postPanic(payload)
        } else if (hasMoya) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("moya://share?text=$payload")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } else {
            // sendSMS()
            if (smsEnabled) {
                // send WA via Twilio API equivalent
            }
            // Offline Queue: If no internet + no Moya, queue panic
        }
        
        // After success, schedule LizzyPopup in 2min
    }
}
