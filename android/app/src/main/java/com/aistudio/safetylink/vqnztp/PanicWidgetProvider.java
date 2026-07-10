package com.aistudio.safetylink.vqnztp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

/**
 * PanicWidgetProvider — SafetyLink home screen quick-panic AppWidget.
 * Triggers PanicService directly without opening the app.
 * Displays live BLE connection status from SharedPreferences.
 */
public class PanicWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "SafetyLinkWidget";
    private static final String KEY_BLE_STATUS = "ble_connected";
    private static final String KEY_SOS_ACTIVE = "sos_active";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.panic_widget_layout);

        // Read persisted BLE/SOS state
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean bleConnected = prefs.getBoolean(KEY_BLE_STATUS, false);
        boolean sosActive = prefs.getBoolean(KEY_SOS_ACTIVE, false);

        // Update status labels
        views.setTextViewText(R.id.widget_status, sosActive ? "⚠ ALERT ACTIVE" : "TAP TO TRIGGER");
        views.setTextViewText(R.id.widget_ble_status, bleConnected ? "● iTAG Connected" : "○ No Device");

        // Button colour based on SOS state
        int btnColor = sosActive ? 0xFF7f1d1d : 0xFFb91c1c;
        views.setInt(R.id.widget_panic_btn, "setBackgroundColor", btnColor);

        // Panic trigger intent → PanicService
        Intent panicIntent = new Intent(context, PanicService.class);
        panicIntent.setAction("com.aistudio.safetylink.ACTION_TRIGGER_PANIC");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getService(context, 0, panicIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_panic_btn, pendingIntent);

        // Open app intent on logo tap
        Intent openApp = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (openApp != null) {
            PendingIntent openPi = PendingIntent.getActivity(context, 1, openApp,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                    ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                    : PendingIntent.FLAG_UPDATE_CURRENT);
            views.setOnClickPendingIntent(R.id.widget_logo, openPi);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onEnabled(Context context) { /* Widget first added */ }

    @Override
    public void onDisabled(Context context) { /* Last widget removed */ }
}
