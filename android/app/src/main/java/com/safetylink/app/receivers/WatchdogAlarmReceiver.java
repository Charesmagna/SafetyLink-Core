package com.safetylink.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.safetylink.app.services.WatchdogService;

public class WatchdogAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "SafetyLink::WatchdogAlarm";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Watchdog Ping Received. Validating service state.");
        Intent serviceIntent = new Intent(context, WatchdogService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                context.startForegroundService(serviceIntent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start FGS", e);
            }
        } else {
            context.startService(serviceIntent);
        }
    }
}
