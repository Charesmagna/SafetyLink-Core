package com.aistudio.safetylink.vqnztp;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TacticalSensor")
public class TacticalSensorPlugin extends Plugin implements SensorEventListener {
    private static final String TAG = "TacticalSensor";
    
    private SensorManager sensorManager;
    private Sensor accelerometer;
    
    private boolean isMonitoringImpact = false;
    private boolean isSosActive = false;
    
    // Impact Detection State
    private boolean impactDetected = false;
    private long impactTime = 0;
    
    // Struggle Lock State
    private boolean struggleDetected = false;
    private long struggleEndTime = 0;
    private Handler handler = new Handler(Looper.getMainLooper());
    private Runnable struggleLockRunnable;
    
    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
    }
    
    @PluginMethod
    public void startImpactDetection(PluginCall call) {
        if (sensorManager != null && accelerometer != null && !isMonitoringImpact) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
            isMonitoringImpact = true;
            call.resolve();
        } else {
            call.reject("Sensors not available or already monitoring");
        }
    }
    
    @PluginMethod
    public void stopImpactDetection(PluginCall call) {
        if (isMonitoringImpact) {
            sensorManager.unregisterListener(this);
            isMonitoringImpact = false;
        }
        call.resolve();
    }
    
    @PluginMethod
    public void setSosActive(PluginCall call) {
        isSosActive = call.getBoolean("isActive", false);
        call.resolve();
    }

    @PluginMethod
    public void requestDeviceAdmin(PluginCall call) {
        ComponentName compName = new ComponentName(getContext(), SafetyLinkDeviceAdminReceiver.class);
        Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, compName);
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Required to automatically lock the device during a physical struggle.");
        getActivity().startActivityForResult(intent, 11);
        call.resolve();
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];
            
            double gForce = Math.sqrt(x*x + y*y + z*z) / SensorManager.GRAVITY_EARTH;
            
            // MODULE 3: Impact Detection (Crash/Fall)
            if (!isSosActive) {
                if (gForce > 3.5) { // Severe impact
                    impactDetected = true;
                    impactTime = System.currentTimeMillis();
                } else if (impactDetected) {
                    if (gForce > 0.8 && gForce < 1.2) { // Relatively still
                        if (System.currentTimeMillis() - impactTime > 3000) {
                            Log.w(TAG, "Massive impact followed by stillness detected! Triggering SOS.");
                            triggerPanic();
                            impactDetected = false;
                        }
                    } else {
                        // Reset if movement resumes quickly
                        if (System.currentTimeMillis() - impactTime > 5000) {
                            impactDetected = false;
                        }
                    }
                }
            }
            
            // MODULE 6: Struggle Lock
            if (isSosActive) {
                if (gForce > 2.5) { // Chaotic movement
                    struggleDetected = true;
                    struggleEndTime = System.currentTimeMillis();
                    if (struggleLockRunnable != null) {
                        handler.removeCallbacks(struggleLockRunnable);
                        struggleLockRunnable = null;
                    }
                } else if (struggleDetected) {
                    // If movement stops after a struggle
                    if (System.currentTimeMillis() - struggleEndTime > 2000) {
                        if (struggleLockRunnable == null) {
                            Log.w(TAG, "Struggle ended. Initiating 15-second zero-interaction timer for Device Lock.");
                            struggleLockRunnable = () -> {
                                executeDeviceLock();
                            };
                            handler.postDelayed(struggleLockRunnable, 15000);
                        }
                    }
                }
            }
        }
    }

    private void triggerPanic() {
        if (SafetyLinkBridgePlugin.getInstance() != null) {
            SafetyLinkBridgePlugin.getInstance().emitPanicEvent("ACCELEROMETER_IMPACT", 1);
            
            // hardware wake
            Intent wakeIntent = new Intent(getContext(), MainActivity.class);
            wakeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            wakeIntent.putExtra("sos_triggered", true);
            getContext().startActivity(wakeIntent);
        }
    }

    private void executeDeviceLock() {
        DevicePolicyManager dpm = (DevicePolicyManager) getContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName compName = new ComponentName(getContext(), SafetyLinkDeviceAdminReceiver.class);
        if (dpm != null && dpm.isAdminActive(compName)) {
            Log.e(TAG, "DEAD-MAN'S SWITCH: Locking device!");
            dpm.lockNow();
        } else {
            Log.e(TAG, "Could not lock device. Device Admin not granted.");
        }
        struggleDetected = false;
        struggleLockRunnable = null;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
