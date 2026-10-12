package com.aistudio.safetylink.vqnztp;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

/**
 * WatchdogService
 *
 * Companion service to monitor process health, enforce keep-alive,
 * and provide immediate recovery if foreground tasks are dropped.
 */
public class WatchdogService extends Service {
    private static final String TAG = "WatchdogService";
    public static final String ACTION_CHECK_HEALTH = "com.aistudio.safetylink.ACTION_CHECK_HEALTH";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "WatchdogService checking sentinel and panic engine state");

        try {
            // Verify and reschedule watchdog alarm
            WatchdogAlarmReceiver.scheduleWatchdog(getApplicationContext());

            // Ensure SafelinkForegroundService is active
            Intent sentinelIntent = new Intent(this, SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(sentinelIntent);
            } else {
                startService(sentinelIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in WatchdogService health check", e);
        }

        stopSelf(startId);
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
