package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EmergencyDispatchPlugin.class);
        registerPlugin(ITagPlugin.class);
        super.onCreate(savedInstanceState);

        // Start the persistent foreground service so BLE + GPS stay alive
        startSafelinkService();

        // Enqueue unique 15-minute keepalive work to survive aggressive OEM memory sweeps
        scheduleKeepAlive();

        // Prompt the user to whitelist the app from battery optimizations
        requestBatteryOptimizationBypass();
    }

    @Override
    public void onStop() {
        super.onStop();
        // App went to background / screen locked – make sure service is running
        // so the "Device Locked" notification banner appears in the shade.
        startSafelinkService();
        Log.i(TAG, "App backgrounded – foreground service ensured running");
    }

    // ------------------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------------------

    private void startSafelinkService() {
        Intent serviceIntent = new Intent(this, SafelinkForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    private void scheduleKeepAlive() {
        try {
            PeriodicWorkRequest keepAliveRequest = new PeriodicWorkRequest.Builder(
                    SafetyKeepAliveWorker.class,
                    15, TimeUnit.MINUTES
            ).build();

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                    "SafetyLinkKeepAlive",
                    ExistingPeriodicWorkPolicy.KEEP,
                    keepAliveRequest
            );
            Log.i(TAG, "Unique Periodic KeepAlive scheduled successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule KeepAlive WorkManager: " + e.getMessage());
        }
    }

    private void requestBatteryOptimizationBypass() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(android.content.Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                try {
                    Intent intent = new Intent();
                    intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    Log.i(TAG, "Launched ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS prompt");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to prompt for battery optimization bypass: " + e.getMessage());
                }
            } else {
                Log.i(TAG, "Battery optimizations already ignored");
            }
        }
    }
}
