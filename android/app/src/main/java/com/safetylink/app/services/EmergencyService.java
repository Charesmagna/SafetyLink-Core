package com.safetylink.app.services;

import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;
import android.telephony.SmsManager;
import android.util.Log;
import java.util.UUID;

public class EmergencyService extends Service {
    private static final String TAG = "SafetyLink::EmergencyService";
    private static final String ACTION_SMS_SENT = "com.safetylink.SMS_SENT";
    private static final String ACTION_SMS_DELIVERED = "com.safetylink.SMS_DELIVERED";

    private BroadcastReceiver smsReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                String incidentId = intent.getStringExtra("incidentId");
                
                if (ACTION_SMS_SENT.equals(action)) {
                    int resultCode = getResultCode();
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        Log.d(TAG, "SMS Status for " + incidentId + ": SENT");
                        // TODO: Update Room DB Status -> SENT
                    } else {
                        Log.e(TAG, "SMS Status for " + incidentId + ": FAILED (Code: " + resultCode + ")");
                        // TODO: Update Room DB Status -> FAILED
                    }
                } else if (ACTION_SMS_DELIVERED.equals(action)) {
                    Log.d(TAG, "SMS Status for " + incidentId + ": DELIVERED");
                    // TODO: Update Room DB Status -> DELIVERED
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_SMS_SENT);
        filter.addAction(ACTION_SMS_DELIVERED);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(smsReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(smsReceiver, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String description = intent != null ? intent.getStringExtra("description") : "Unknown Trigger";
        String incidentId = "INC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Log.d(TAG, "Starting Real Dispatch for Incident: " + incidentId);

        // 1. Obtain GPS Natively (Placeholder for Phase 3/4)
        double lat = 0.0;
        double lng = 0.0;
        
        // 2. Create local Incident in Room DB (Offline First) - Placeholder
        
        // 3. Dispatch Native SMS
        String emergencyPayload = "EMERGENCY ALERT: " + description + " | ID: " + incidentId + " | Loc: " + lat + "," + lng;
        
        // In full implementation, retrieve authorized contacts from RoomDB.
        // For testing/reconstruction, we just simulate the dispatch mechanism.
        // If we had a real number, we'd call dispatchNativeSMS(number, emergencyPayload, incidentId)
        Log.d(TAG, "Prepared Emergency Payload: " + emergencyPayload);
        
        // Simulate completion for now so the service doesn't hang if no contacts are configured.
        stopSelf();
        return START_NOT_STICKY;
    }

    public void dispatchNativeSMS(String phoneNumber, String message, String incidentId) {
        try {
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                smsManager = getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }

            Intent sentIntent = new Intent(ACTION_SMS_SENT);
            sentIntent.putExtra("incidentId", incidentId);
            PendingIntent sentPI = PendingIntent.getBroadcast(this, incidentId.hashCode(), sentIntent, PendingIntent.FLAG_IMMUTABLE);

            Intent deliveredIntent = new Intent(ACTION_SMS_DELIVERED);
            deliveredIntent.putExtra("incidentId", incidentId);
            PendingIntent deliveredPI = PendingIntent.getBroadcast(this, incidentId.hashCode(), deliveredIntent, PendingIntent.FLAG_IMMUTABLE);

            Log.d(TAG, "SMS Status for " + incidentId + ": QUEUED");
            smsManager.sendTextMessage(phoneNumber, null, message, sentPI, deliveredPI);
        } catch (Exception e) {
            Log.e(TAG, "SMS Dispatch Exception", e);
            // Update Room DB Status -> FAILED
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (smsReceiver != null) {
            unregisterReceiver(smsReceiver);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
