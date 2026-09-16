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
 * Includes BLE reconnect button and Watch Me 10min trigger.
 */
public class PanicWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME       = "SafetyLinkWidget";
    private static final String KEY_BLE_STATUS   = "ble_connected";
    private static final String KEY_SOS_ACTIVE   = "sos_active";

    public static final String ACTION_PANIC        = "com.aistudio.safetylink.ACTION_TRIGGER_PANIC";
    public static final String ACTION_BLE_RECONNECT = "com.aistudio.safetylink.ACTION_BLE_RECONNECT";
    public static final String ACTION_WATCH_ME     = "com.aistudio.safetylink.ACTION_WATCH_ME_10M";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.panic_widget_layout);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean bleConnected = prefs.getBoolean(KEY_BLE_STATUS, false);
        boolean sosActive    = prefs.getBoolean(KEY_SOS_ACTIVE, false);

        views.setTextViewText(R.id.widget_status,     sosActive ? "⚠ ALERT ACTIVE" : "TAP TO TRIGGER");
        views.setTextViewText(R.id.widget_ble_status, bleConnected ? "● iTAG Connected" : "○ No Device");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;

        // SOS panic button
        Intent panicIntent = new Intent(context, PanicService.class);
        panicIntent.setAction(ACTION_PANIC);
        PendingIntent panicPi = PendingIntent.getService(context, 0, panicIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_panic_btn, panicPi);

        // BLE reconnect button
        Intent bleIntent = new Intent(context, SafelinkForegroundService.class);
        bleIntent.setAction(ACTION_BLE_RECONNECT);
        PendingIntent blePi = PendingIntent.getService(context, 1, bleIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_ble_reconnect, blePi);

        // Watch Me 10 min button
        Intent watchIntent = new Intent(context, PanicService.class);
        watchIntent.setAction(ACTION_WATCH_ME);
        PendingIntent watchPi = PendingIntent.getService(context, 2, watchIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_watch_me, watchPi);

        // Logo → open app
        Intent openApp = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (openApp != null) {
            PendingIntent openPi = PendingIntent.getActivity(context, 3, openApp, flags);
            views.setOnClickPendingIntent(R.id.widget_logo, openPi);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override public void onEnabled(Context context)  { /* first widget added */ }
    @Override public void onDisabled(Context context) { /* last widget removed */ }
}
