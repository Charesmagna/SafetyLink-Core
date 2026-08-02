package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager; import android.provider.Settings; import android.text.TextUtils; import android.content.Context; import android.content.ComponentName;

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
        registerPlugin(SafetyLinkBridgePlugin.class);
        registerPlugin(TacticalSensorPlugin.class);
        registerPlugin(SafeAudioPlugin.class);
        registerPlugin(DataOverAudioPlugin.class);
        registerPlugin(ITagPlugin.class);
        super.onCreate(savedInstanceState);

        // Start the persistent foreground service so BLE + GPS stay alive
        // try { startSafelinkService(); } catch (Exception e) { Log.e(TAG, "Failed to start service without permissions", e); }

        // Enqueue unique 15-minute keepalive work to survive aggressive OEM memory sweeps
        scheduleKeepAlive();

        // Prompt the user to whitelist the app from battery optimizations
        checkPermissionsAndServices();
        handleSosWake(getIntent());
    }

    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleSosWake(intent);
    }

    private void handleSosWake(Intent intent) {
        if (intent != null && intent.getBooleanExtra("sos_triggered", false)) {
            Log.i(TAG, "Aggressive Hardware Wake Triggered");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
            } else {
                getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                );
            }
            
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
            
            try {
                startLockTask(); // Screen Pinning to prevent app switching
            } catch (Exception e) {
                Log.e(TAG, "Failed to start lock task: " + e.getMessage());
            }

            if (SafetyLinkBridgePlugin.getInstance() != null) {
                SafetyLinkBridgePlugin.getInstance().emitPanicEvent("BACKGROUND_TRIGGER", 1);
            }
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // App went to background / screen locked – make sure service is running
        // so the "Device Locked" notification banner appears in the shade.
        // try { startSafelinkService(); } catch (Exception e) { Log.e(TAG, "Failed to start service without permissions", e); }
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

    
    private void checkPermissionsAndServices() {
        // Battery
        requestBatteryOptimizationBypass();
        
        // System Alert Window
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            android.net.Uri.parse("package:" + getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Failed overlay permission", e);
                }
            }
        }
        
        // Accessibility Service Check
        if (!isAccessibilityServiceEnabled(this, SafetyAccessibilityService.class)) {
            try {
                Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                 Log.e(TAG, "Failed accessibility setting", e);
            }
        }
    }
    
    private boolean isAccessibilityServiceEnabled(Context context, Class<?> accessibilityService) {
        ComponentName expectedComponentName = new ComponentName(context, accessibilityService);
        String enabledServicesSetting = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabledServicesSetting == null) return false;
        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServicesSetting);
        while (colonSplitter.hasNext()) {
            String componentNameString = colonSplitter.next();
            ComponentName enabledService = ComponentName.unflattenFromString(componentNameString);
            if (enabledService != null && enabledService.equals(expectedComponentName)) return true;
        }
        return false;
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
