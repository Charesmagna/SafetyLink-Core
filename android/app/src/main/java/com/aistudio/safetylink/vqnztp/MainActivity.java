package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.WindowManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.content.Context;
import android.content.ComponentName;

import androidx.core.splashscreen.SplashScreen;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    // Delay permission prompts until after webview has rendered
    private static final long PERMISSION_DELAY_MS = 3000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(EmergencyDispatchPlugin.class);
        registerPlugin(SafetyLinkBridgePlugin.class);
        registerPlugin(TacticalSensorPlugin.class);
        registerPlugin(SafeAudioPlugin.class);
        registerPlugin(DataOverAudioPlugin.class);
        registerPlugin(ITagPlugin.class);
        super.onCreate(savedInstanceState);

        // Start foreground service quietly
        try { startSafelinkService(); } catch (Exception e) {
            Log.e(TAG, "Failed to start service: " + e.getMessage());
        }

        scheduleKeepAlive();
        handleSosWake(getIntent());

        // Defer all permission prompts so the app renders first
        new Handler(Looper.getMainLooper()).postDelayed(
            this::checkPermissionsAndServices, PERMISSION_DELAY_MS
        );
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleSosWake(intent);
    }

    private void handleSosWake(Intent intent) {
        if (intent != null && intent.getBooleanExtra("sos_triggered", false)) {
            Log.i(TAG, "SOS Wake Triggered");
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
            try { startLockTask(); } catch (Exception e) {
                Log.e(TAG, "Lock task failed: " + e.getMessage());
            }
            if (SafetyLinkBridgePlugin.getInstance() != null) {
                SafetyLinkBridgePlugin.getInstance().emitPanicEvent("BACKGROUND_TRIGGER", 1);
            }
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        try { startSafelinkService(); } catch (Exception e) {
            Log.e(TAG, "Failed to start service on stop: " + e.getMessage());
        }
    }

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
                    SafetyKeepAliveWorker.class, 15, TimeUnit.MINUTES
            ).build();
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                    "SafetyLinkKeepAlive",
                    ExistingPeriodicWorkPolicy.KEEP,
                    keepAliveRequest
            );
        } catch (Exception e) {
            Log.e(TAG, "KeepAlive schedule failed: " + e.getMessage());
        }
    }

    private void checkPermissionsAndServices() {
        requestBatteryOptimizationBypass();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            android.net.Uri.parse("package:" + getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Overlay permission failed: " + e.getMessage());
                }
            }
        }
    }

    private boolean isAccessibilityServiceEnabled(Context context, Class<?> accessibilityService) {
        ComponentName expectedComponentName = new ComponentName(context, accessibilityService);
        String enabledServicesSetting = Settings.Secure.getString(
            context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
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
            android.os.PowerManager pm = (android.os.PowerManager)
                getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                try {
                    Intent intent = new Intent();
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Battery optimization bypass failed: " + e.getMessage());
                }
            }
        }
    }
}
