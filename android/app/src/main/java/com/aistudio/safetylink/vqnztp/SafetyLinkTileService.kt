package com.aistudio.safetylink.vqnztp

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.util.Log
import androidx.annotation.RequiresApi

// Reference: https://developer.android.com/reference/android/Manifest.permission#BIND_QUICK_SETTINGS_TILE
@RequiresApi(Build.VERSION_CODES.N)
class SafetyLinkTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    override fun onClick() {
        super.onClick()
        Log.d("SafetyLinkTileService", "SOS Tile Clicked")
        
        if (!isServiceRunning(SafetyBackgroundService::class.java)) {
            val serviceIntent = Intent(this, SafetyBackgroundService::class.java)
            try {
                startForegroundService(serviceIntent)
            } catch (e: Exception) {
                Log.e("SafetyLinkTileService", "Failed to start SafetyBackgroundService", e)
            }
        }

        val panicIntent = Intent(this, MainActivity::class.java).apply {
            action = "com.example.ACTION_PANIC"
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        try {
            startActivityAndCollapse(panicIntent)
        } catch (e: Exception) {
            Log.e("SafetyLinkTileService", "Failed to start MainActivity for panic", e)
        }
        
        updateTileState()
    }

    private fun updateTileState() {
        val tile = qsTile ?: return
        
        val isRunning = isServiceRunning(SafetyBackgroundService::class.java)
        
        tile.state = if (isRunning) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.label = "SOS"
        tile.icon = Icon.createWithResource(this, android.R.drawable.ic_lock_lock)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tile.subtitle = if (isRunning) "Active" else "Inactive"
        }
        
        tile.updateTile()
    }

    private fun isServiceRunning(serviceClass: Class<*>): Boolean {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        @Suppress("DEPRECATION")
        for (service in manager.getRunningServices(Integer.MAX_VALUE)) {
            if (serviceClass.name == service.service.className) {
                return true
            }
        }
        return false
    }
}
