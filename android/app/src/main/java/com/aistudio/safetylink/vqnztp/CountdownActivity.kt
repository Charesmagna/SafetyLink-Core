package com.aistudio.safetylink.vqnztp

import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity

class CountdownActivity : AppCompatActivity() {
    private var dismissReceiver: android.content.BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Force screen on and show over lock screen
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or 
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )

        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(android.graphics.Color.parseColor("#090D16"))
            setPadding(48, 48, 48, 48)
        }

        val title = android.widget.TextView(this).apply {
            text = "🚨 EMERGENCY COUNTDOWN"
            textSize = 22f
            setTextColor(android.graphics.Color.parseColor("#EF4444"))
            gravity = android.view.Gravity.CENTER
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        layout.addView(title)

        val desc = android.widget.TextView(this).apply {
            text = "Press button again or enter PIN to cancel dispatch."
            textSize = 14f
            setTextColor(android.graphics.Color.parseColor("#94A3B8"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 16, 0, 32)
        }
        layout.addView(desc)

        val cancelBtn = android.widget.Button(this).apply {
            text = "🛡️ DISARM NOW"
            setBackgroundColor(android.graphics.Color.parseColor("#10B981"))
            setTextColor(android.graphics.Color.WHITE)
            textSize = 16f
            setOnClickListener {
                // Disarm: handled by PanicService (PIN check is added in the next build step)
                finish()
            }
        }
        layout.addView(cancelBtn)

        setContentView(layout)

        dismissReceiver = object : android.content.BroadcastReceiver() {
            override fun onReceive(context: android.content.Context?, intent: android.content.Intent?) {
                finish()
            }
        }
        val filter = android.content.IntentFilter("com.aistudio.safetylink.ACTION_DISMISS_COUNTDOWN")
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dismissReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(dismissReceiver, filter)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        dismissReceiver?.let {
            try { unregisterReceiver(it) } catch (e: Exception) {}
        }
    }
}
