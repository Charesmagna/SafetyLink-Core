package com.safetylink.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.ExistingPeriodicWorkPolicy;
import java.util.concurrent.TimeUnit;
import com.safetylink.app.services.WatchdogService;
import com.safetylink.app.services.SafetyKeepAliveWorker;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "SafetyLink::BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) || 
            "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {
            
            Log.d(TAG, "Device booted. Reviving SafetyLink Watchdog.");
            
            Intent serviceIntent = new Intent(context, WatchdogService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            PeriodicWorkRequest keepAliveWork = new PeriodicWorkRequest.Builder(
                SafetyKeepAliveWorker.class, 15, TimeUnit.MINUTES).build();
            
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "SafetyLinkKeepAlive", 
                ExistingPeriodicWorkPolicy.KEEP, 
                keepAliveWork);
        }
    }
}
