package com.aistudio.safetylink.vqnztp;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

/**
 * WatchdogAlarmReceiver
 *
 * Golden Android Survival layer: Catches periodic AlarmManager heartbeats
 * and re-asserts foreground service / background sentinel execution.
 */
public class WatchdogAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "WatchdogAlarmReceiver";
    public static final String ACTION_WATCHDOG_HEARTBEAT = "com.aistudio.safetylink.ACTION_WATCHDOG_HEARTBEAT";
    private static final long INTERVAL_MS = 15 * 60 * 1000L; // 15 minutes

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "Watchdog heartbeat received — verifying sentinel status");

        try {
            // 1. Ensure SafelinkForegroundService is running
            Intent serviceIntent = new Intent(context, SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // 2. Schedule next Alarm tick (survival across doze)
            scheduleWatchdog(context);

            // 3. Ensure KeepAlive WorkManager job is registered
            PeriodicWorkRequest keepAliveRequest = new PeriodicWorkRequest.Builder(
                    SafetyKeepAliveWorker.class,
                    15,
                    TimeUnit.MINUTES
            ).build();

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                    "SafetyKeepAliveWork",
                    ExistingPeriodicWorkPolicy.KEEP,
                    keepAliveRequest
            );

        } catch (Exception e) {
            Log.e(TAG, "Watchdog heartbeat error: " + e.getMessage(), e);
        }
    }

    public static void scheduleWatchdog(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, WatchdogAlarmReceiver.class);
            intent.setAction(ACTION_WATCHDOG_HEARTBEAT);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 7701, intent, flags);
            long triggerAt = SystemClock.elapsedRealtime() + INTERVAL_MS;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent);
            }
            Log.d(TAG, "Next Watchdog alarm scheduled for " + (INTERVAL_MS / 1000) + "s");
        } catch (Exception e) {
            Log.w(TAG, "Failed to schedule watchdog alarm: " + e.getMessage());
        }
    }
}
