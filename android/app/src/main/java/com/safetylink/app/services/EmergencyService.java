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
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.safetylink.app.db.IncidentEntity;
import com.safetylink.app.db.SafetyLinkDatabase;
import java.util.UUID;
import java.util.concurrent.Executors;

public class EmergencyService extends Service {
    private static final String TAG = "SafetyLink::EmergencyService";
    private static final String ACTION_SMS_SENT = "com.safetylink.SMS_SENT";
    private static final String ACTION_SMS_DELIVERED = "com.safetylink.SMS_DELIVERED";

    private BroadcastReceiver smsReceiver;
    private SafetyLinkDatabase db;

    @Override
    public void onCreate() {
        super.onCreate();
        db = SafetyLinkDatabase.getDatabase(this);
        
        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                String incidentId = intent.getStringExtra("incidentId");
                
                if (ACTION_SMS_SENT.equals(action)) {
                    int resultCode = getResultCode();
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        Log.d(TAG, "SMS Status for " + incidentId + ": SENT");
                        updateDispatchStatus(incidentId, "SENT");
                    } else {
                        Log.e(TAG, "SMS Status for " + incidentId + ": FAILED (Code: " + resultCode + ")");
                        updateDispatchStatus(incidentId, "FAILED");
                    }
                } else if (ACTION_SMS_DELIVERED.equals(action)) {
                    Log.d(TAG, "SMS Status for " + incidentId + ": DELIVERED");
                    updateDispatchStatus(incidentId, "DELIVERED");
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

    private void updateDispatchStatus(String incidentId, String status) {
        Executors.newSingleThreadExecutor().execute(() -> {
            db.incidentDao().updateDispatchState(incidentId, status);
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String description = intent != null ? intent.getStringExtra("description") : "Unknown Trigger";
        String incidentId = "INC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Log.d(TAG, "Starting Real Dispatch for Incident: " + incidentId);

        // 1. Obtain GPS Natively (Placeholder for Phase 3/4)
        double lat = 0.0;
        double lng = 0.0;
        
        // 2. Create local Incident in Room DB (Offline First)
        String jsonPayload = String.format("{\"description\":\"%s\",\"incidentId\":\"%s\",\"lat\":%f,\"lng\":%f}", description, incidentId, lat, lng);
        IncidentEntity incident = new IncidentEntity(incidentId);
        incident.payload = jsonPayload;
        incident.dispatchState = "QUEUED";
        incident.syncState = "PENDING";
        incident.timestamp = System.currentTimeMillis();
        incident.latitude = lat;
        incident.longitude = lng;
        
        Executors.newSingleThreadExecutor().execute(() -> {
            db.incidentDao().insert(incident);
            
            // 3. Dispatch Native SMS
            String emergencyPayload = "EMERGENCY ALERT: " + description + " | ID: " + incidentId + " | Loc: " + lat + "," + lng;
            // In full implementation, retrieve authorized contacts from RoomDB.
            Log.d(TAG, "Prepared Emergency Payload: " + emergencyPayload);
            
            // 4. Trigger Backend Sync Queue
            Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();
                
            OneTimeWorkRequest syncWork = new OneTimeWorkRequest.Builder(SyncWorker.class)
                .setConstraints(constraints)
                .build();
                
            WorkManager.getInstance(getApplicationContext()).enqueue(syncWork);
            
            stopSelf();
        });

        return START_NOT_STICKY;
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
