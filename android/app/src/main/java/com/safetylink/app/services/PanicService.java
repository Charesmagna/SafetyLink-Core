package com.safetylink.app.services;

import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;

public class PanicService extends Service {
    public static final String ACTION_TRIGGER_PANIC = "com.safetylink.ACTION_TRIGGER";
    public static final String ACTION_CANCEL_PANIC = "com.safetylink.ACTION_CANCEL";
    
    private Handler handler = new Handler();
    private PowerManager.WakeLock wakeLock;
    private Runnable dispatchRunnable;
    private boolean isCountdownActive = false;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) return START_STICKY;

        if (ACTION_TRIGGER_PANIC.equals(intent.getAction())) {
            startPanicSequence(intent.getStringExtra("description"));
        } else if (ACTION_CANCEL_PANIC.equals(intent.getAction())) {
            cancelPanicSequence();
        }

        return START_STICKY;
    }

    private void startPanicSequence(String description) {
        if (isCountdownActive) return;
        isCountdownActive = true;

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SafetyLink::PanicCountdown");
            wakeLock.acquire(15000); 
        }

        dispatchRunnable = () -> {
            isCountdownActive = false;
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
            
            Intent dispatchIntent = new Intent(this, EmergencyService.class);
            dispatchIntent.putExtra("description", description);
            startForegroundService(dispatchIntent);
            
            stopSelf();
        };

        handler.postDelayed(dispatchRunnable, 10000);
    }

    private void cancelPanicSequence() {
        if (isCountdownActive && dispatchRunnable != null) {
            handler.removeCallbacks(dispatchRunnable);
            isCountdownActive = false;
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
            stopSelf();
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
