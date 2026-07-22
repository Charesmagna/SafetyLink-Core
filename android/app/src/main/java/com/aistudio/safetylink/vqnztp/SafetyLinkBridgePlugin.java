package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SafetyLinkBridge")
public class SafetyLinkBridgePlugin extends Plugin {

    private static final String TAG = "SafetyLinkBridge";
    private static SafetyLinkBridgePlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    public static SafetyLinkBridgePlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void startBleService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start BLE service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void enforceHardwareWake(PluginCall call) {
        try {
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

    
    public void emitSurvivalMode(boolean isSurvival) {
        JSObject ret = new JSObject();
        ret.put("isSurvival", isSurvival);
        notifyListeners("onSurvivalMode", ret);
    }

    public void emitPanicEvent(String address, int value) {
        JSObject ret = new JSObject();
        ret.put("address", address);
        ret.put("value", value);
        notifyListeners("onPanicEvent", ret);
    }

    @PluginMethod
    public void toggleFloatingWidget(PluginCall call) {
        Boolean enable = call.getBoolean("enable", false);
        try {
            Intent intent = new Intent(getContext(), FloatingWidgetService.class);
            if (enable) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(intent);
                } else {
                    getContext().startService(intent);
                }
            } else {
                getContext().stopService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to toggle floating widget", e);
        }
    }
  
}