package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SafetyLinkEmergency")
public class SafetyLinkBridgePlugin extends Plugin {
    private static final String TAG = "SafetyLinkBridge";
    private static SafetyLinkBridgePlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.i(TAG, "SafetyLinkBridgePlugin initialized and registered");
    }

    public static SafetyLinkBridgePlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void trigger(PluginCall call) {
        String description = call.getString("description", "Software Emergency SOS Trigger");
        String phone = call.getString("phone", "");
        double lat = call.getDouble("latitude", 0.0);
        double lng = call.getDouble("longitude", 0.0);
        String orgId = call.getString("organizationId", "SL-ORG-DEFAULT");
        String userId = call.getString("userId", "UNKNOWN");
        boolean directDispatch = Boolean.TRUE.equals(call.getBoolean("directDispatch", false));

        try {
            Intent intent = new Intent(getContext(), PanicService.class);
            intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
            intent.putExtra("description", description);
            intent.putExtra("phone", phone);
            intent.putExtra("latitude", lat);
            intent.putExtra("longitude", lng);
            intent.putExtra("orgId", orgId);
            intent.putExtra("triggeredBy", userId);
            intent.putExtra("directDispatch", directDispatch);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }

            JSObject ret = new JSObject();
            ret.put("status", directDispatch ? "DISPATCHING" : "TRIGGERED");
            ret.put("countdownSeconds", directDispatch ? 0 : 10);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to trigger PanicService: " + e.getMessage(), e);
            call.reject("Failed to trigger PanicService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open accessibility settings: " + e.getMessage(), e);
            call.reject("Could not open accessibility settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName())) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                }
            }
            JSObject ret = new JSObject();
            ret.put("requested", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to request battery optimization: " + e.getMessage(), e);
            call.reject("Could not request battery optimization: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open app settings: " + e.getMessage(), e);
            call.reject("Could not open app settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), PanicService.class);
            intent.setAction(PanicService.ACTION_CANCEL_PANIC);
            getContext().startService(intent);

            JSObject ret = new JSObject();
            ret.put("status", "CANCELLED");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel PanicService: " + e.getMessage(), e);
            call.reject("Failed to cancel PanicService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getState(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isCountdownActive", PanicService.isCountdownActiveState());
        ret.put("secondsRemaining", PanicService.getSecondsRemainingState());
        ret.put("lastStatus", PanicService.getLastKnownStatus());
        call.resolve(ret);
    }

    @PluginMethod
    public void enforceHardwareWake(PluginCall call) {
        try {
            if (getActivity() != null) {
                getActivity().runOnUiThread(() -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                        getActivity().setShowWhenLocked(true);
                        getActivity().setTurnScreenOn(true);
                    } else {
                        getActivity().getWindow().addFlags(
                            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        );
                    }
                    getActivity().getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    );
                });
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to enforce hardware wake: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            JSObject ret = new JSObject();
            ret.put("granted", Settings.canDrawOverlays(getContext()));
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getContext())) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        android.net.Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void getDeviceBattery(PluginCall call) {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = getContext().registerReceiver(null, ifilter);

            int level = -1;
            int scale = -1;
            int status = -1;
            boolean isCharging = false;
            float batteryPct = -1;

            if (batteryStatus != null) {
                level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                             status == BatteryManager.BATTERY_STATUS_FULL;

                if (level >= 0 && scale > 0) {
                    batteryPct = (level * 100f) / (float) scale;
                }
            }

            JSObject ret = new JSObject();
            ret.put("level", batteryPct >= 0 ? Math.round(batteryPct) : 100);
            ret.put("isCharging", isCharging);
            ret.put("status", status);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to read device battery status: " + e.getMessage(), e);
            JSObject fallback = new JSObject();
            fallback.put("level", 100);
            fallback.put("isCharging", false);
            call.resolve(fallback);
        }
    }

    public void emitPanicEvent(String source, int countdownSeconds, String status) {
        JSObject ret = new JSObject();
        ret.put("source", source);
        ret.put("countdownSeconds", countdownSeconds);
        ret.put("status", status);
        notifyListeners("onPanicStatusChange", ret);
    }
}
