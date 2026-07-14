package com.example

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.util.Log

/**
 * SafetyLinkTileService
 *
 * Exposes a Quick Settings SOS Tile that updates active/inactive state based on service telemetry
 * and triggers immediate full panic on-click.
 * Requires BIND_QUICK_SETTINGS_TILE permission.
 * Reference: Manifest.permission.BIND_QUICK_SETTINGS_TILE from https://developer.android.com/reference/android/Manifest.permission
 */
class SafetyLinkTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    override fun onClick() {
        super.onClick()
        Log.i("SafetyLinkTileService", "SOS QS Tile clicked.")

        // 1. Ensure core safety monitor is active
        if (!isSafetyServiceRunning()) {
            val serviceIntent = Intent(this, SafetyBackgroundService::class.java).apply {
                action = SafetyBackgroundService.ACTION_START
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }
            } catch (e: Exception) {
                Log.e("SafetyLinkTileService", "Failed to start service on tile click: ${e.message}", e)
            }
        }

        // 2. Fire intent to launch MainActivity and trigger SOS Panic state
        val panicIntent = Intent(this, MainActivity::class.java).apply {
            action = "com.example.ACTION_PANIC"
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                val pendingIntent = android.app.PendingIntent.getActivity(
                    this,
                    0,
                    panicIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                )
                startActivityAndCollapse(pendingIntent)
            } else {
                @Suppress("DEPRECATION")
                startActivityAndCollapse(panicIntent)
            }
            Log.i("SafetyLinkTileService", "Successfully fired ACTION_PANIC intent to MainActivity.")
        } catch (e: Exception) {
            Log.e("SafetyLinkTileService", "Failed to start Activity and collapse panel: ${e.message}", e)
        }

        // Immediately update state visually to active
        val tile = qsTile
        if (tile != null) {
            tile.state = Tile.STATE_ACTIVE
            tile.updateTile()
        }
    }

    private fun updateTileState() {
        val tile = qsTile ?: return
        val running = isSafetyServiceRunning()
        tile.state = if (running) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.label = "SOS"
        tile.updateTile()
        Log.d("SafetyLinkTileService", "Updated QS Tile state. Running: $running")
    }

    private fun isSafetyServiceRunning(): Boolean {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        @Suppress("DEPRECATION")
        val runningServices = manager.getRunningServices(Integer.MAX_VALUE) ?: return false
        for (service in runningServices) {
            if (SafetyBackgroundService::class.java.name == service.service.className) {
                return true
            }
        }
        return false
    }
}
