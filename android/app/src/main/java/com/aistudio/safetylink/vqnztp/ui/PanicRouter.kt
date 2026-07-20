package com.aistudio.safetylink.vqnztp.ui

import android.content.Context
import android.content.Intent
import android.net.Uri

object PanicRouter {
    fun sendPanic(context: Context, data: String, hasInternet: Boolean, hasMoya: Boolean, smsEnabled: Boolean, batteryPct: Int) {
        val payload = if (batteryPct < 15) "LOW BATTERY $data" else data
        
        // 1. CameraX & Audio capture would trigger here
        // 2. Vibration + Siren
        
        if (hasInternet) {
            // api.postPanic(payload)
        } else if (hasMoya) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("moya://share?text=$payload"))
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
