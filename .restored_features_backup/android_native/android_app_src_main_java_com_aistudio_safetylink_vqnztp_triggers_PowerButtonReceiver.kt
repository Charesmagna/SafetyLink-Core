
package com.aistudio.safetylink.vqnztp.triggers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PowerButtonReceiver : BroadcastReceiver() {
    private var clickCount = 0
    private var lastClickTime = 0L

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_SCREEN_ON || action == Intent.ACTION_SCREEN_OFF) {
            val now = System.currentTimeMillis()
            if (now - lastClickTime < 500) {
                clickCount++
                if (clickCount >= 3) {
                    // Trigger emergency
                    clickCount = 0
                }
            } else {
                clickCount = 1
            }
            lastClickTime = now
        }
    }
}
