package com.aistudio.safetylink.vqnztp

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityEvent
import android.content.Intent
import android.util.Log
import android.view.KeyEvent

class SafetyAccessibilityService : AccessibilityService() {
    override fun onServiceConnected() {
        Log.d("SafetyAccessibility", "Service Connected")
        val info = AccessibilityServiceInfo()
        info.eventTypes = AccessibilityEvent.TYPES_ALL_MASK
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        info.flags = AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        this.serviceInfo = info
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Passive listening to keep process active
    }

    override fun onKeyEvent(event: KeyEvent): Boolean {
        // Can optionally intercept volume keys for SOS if needed
        return super.onKeyEvent(event)
    }
    
    override fun onInterrupt() {}
}
