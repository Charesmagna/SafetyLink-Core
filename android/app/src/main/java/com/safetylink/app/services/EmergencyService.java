package com.safetylink.app.services;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.telephony.SmsManager;
import android.util.Log;

public class EmergencyService extends Service {
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String description = intent.getStringExtra("description");
        
        // 1. Obtain GPS Natively
        // Location loc = FusedLocationProvider...
        
        // 2. Create local Incident in Room DB (Offline First)
        // db.incidentDao().insert(...)

        // 3. Dispatch Native SMS
        dispatchNativeSMS("EMERGENCY: " + description);
        
        // 4. Trigger Backend Sync Queue
        // WorkManager.getInstance().enqueue(SyncWorker...)

        stopSelf();
        return START_NOT_STICKY;
    }

    private void dispatchNativeSMS(String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            // In full implementation, loop through authorized contacts
            // smsManager.sendTextMessage(contact, null, message, sentPI, deliveredPI);
            Log.d("SafetyLink", "Native SMS dispatched.");
        } catch (Exception e) {
            Log.e("SafetyLink", "SMS failed", e);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
