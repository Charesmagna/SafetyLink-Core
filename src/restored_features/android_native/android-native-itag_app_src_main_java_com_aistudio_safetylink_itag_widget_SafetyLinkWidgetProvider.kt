package com.aistudio.safetylink.itag.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews
import android.widget.Toast
import com.aistudio.safetylink.itag.MainActivity
import com.aistudio.safetylink.itag.service.ITagForegroundService

class SafetyLinkWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val TAG = "SafetyLinkWidgetProvider"
        const val ACTION_WIDGET_SOS = "com.aistudio.safetylink.itag.ACTION_WIDGET_SOS"
        const val ACTION_WIDGET_TOGGLE_ARM = "com.aistudio.safetylink.itag.ACTION_WIDGET_TOGGLE_ARM"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        Log.d(TAG, "onUpdate called for widget")
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val action = intent.action
        Log.i(TAG, "Widget received broadcast action: $action")

        if (action == ACTION_WIDGET_SOS) {
            Toast.makeText(context, "🚨 SafetyLink SOS Activated via Widget!", Toast.LENGTH_LONG).show()
            
            // Send broadcast or trigger foreground service SOS routine
            val serviceIntent = Intent(context, ITagForegroundService::class.java).apply {
                this.action = ITagForegroundService.ACTION_START
                putExtra("SOS_TRIGGERED_BY", "HOME_SCREEN_WIDGET")
            }
            context.startService(serviceIntent)
            
            // Force quick visual update on all widgets
            updateAllWidgets(context)
        } else if (action == ACTION_WIDGET_TOGGLE_ARM) {
            Toast.makeText(context, "📳 System armed state changed from widget.", Toast.LENGTH_SHORT).show()
            updateAllWidgets(context)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, com.aistudio.safetylink.itag.R.layout.safetylink_widget_layout)

        // Bind SOS Intent
        val sosIntent = Intent(context, SafetyLinkWidgetProvider::class.java).apply {
            this.action = ACTION_WIDGET_SOS
        }
        val pendingSosIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId,
            sosIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(com.aistudio.safetylink.itag.R.id.btn_widget_sos, pendingSosIntent)

        // Bind title click to restore / launch full main app view
        val launchIntent = Intent(context, MainActivity::class.java)
        val pendingLaunchIntent = PendingIntent.getActivity(
            context,
            appWidgetId,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(com.aistudio.safetylink.itag.R.id.widget_title, pendingLaunchIntent)

        // Read active states (simulated or shared preferences)
        val prefs = context.getSharedPreferences("safetylink_prefs", Context.MODE_PRIVATE)
        val isArmed = prefs.getBoolean("system_armed", true)
        val isBleConnected = prefs.getBoolean("ble_connected", true)
        val isGpsLocked = prefs.getBoolean("gps_locked", true)
        val latency = prefs.getInt("network_latency", 42)

        views.setTextViewText(
            com.aistudio.safetylink.itag.R.id.widget_status,
            if (isArmed) "● ARMED" else "○ DISARMED"
        )
        views.setTextColor(
            com.aistudio.safetylink.itag.R.id.widget_status,
            context.resources.getColor(if (isArmed) android.R.color.holo_green_light else android.R.color.darker_gray)
        )

        views.setTextViewText(
            com.aistudio.safetylink.itag.R.id.widget_gps_text,
            if (isGpsLocked) "LOCKED" else "SEARCHING"
        )
        views.setTextColor(
            com.aistudio.safetylink.itag.R.id.widget_gps_text,
            context.resources.getColor(if (isGpsLocked) android.R.color.holo_blue_bright else android.R.color.holo_orange_light)
        )

        views.setTextViewText(
            com.aistudio.safetylink.itag.R.id.widget_itag_text,
            if (isBleConnected) "CONNECTED" else "OFFLINE"
        )
        views.setTextColor(
            com.aistudio.safetylink.itag.R.id.widget_itag_text,
            context.resources.getColor(if (isBleConnected) android.R.color.holo_blue_light else android.R.color.darker_gray)
        )

        views.setTextViewText(
            com.aistudio.safetylink.itag.R.id.widget_gateway_text,
            "$latency ms"
        )

        // Notify widget manager of changes
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun updateAllWidgets(context: Context) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val thisWidget = ComponentName(context, SafetyLinkWidgetProvider::class.java)
        val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
        for (id in allWidgetIds) {
            updateAppWidget(context, appWidgetManager, id)
        }
    }
}
