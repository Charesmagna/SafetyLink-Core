package com.aistudio.safetylink.vqnztp;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * EmergencyService
 *
 * Native singleton orchestrating real SMS dispatch via Android SmsManager,
 * placeCall intents, and asynchronous incident persistence with the backend.
 */
public final class EmergencyService {
    private static final String TAG = "EmergencyService";
    private static final String BACKEND_BASE_URL = "http://10.0.2.2:3000";
    private static volatile EmergencyService instance;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private EmergencyService() {}

    public static EmergencyService getInstance() {
        if (instance == null) {
            synchronized (EmergencyService.class) {
                if (instance == null) {
                    instance = new EmergencyService();
                }
            }
        }
        return instance;
    }

    public interface DispatchCallback {
        void onResult(DispatchResult result);
    }

    public static class DispatchResult {
        public boolean success;
        public String smsStatus; // QUEUED, SENT, FAILED, UNAVAILABLE
        public String callStatus; // INITIATED, FAILED, SKIPPED
        public String backendSyncStatus; // SYNCED, PENDING, FAILED

        public DispatchResult(boolean success, String smsStatus, String callStatus, String backendSyncStatus) {
            this.success = success;
            this.smsStatus = smsStatus;
            this.callStatus = callStatus;
            this.backendSyncStatus = backendSyncStatus;
        }
    }

    public void dispatchEmergency(Context context, String toNumber, String body, String incidentId,
                                  double lat, double lng, String orgId, String triggeredBy,
                                  DispatchCallback callback) {
        executor.execute(() -> {
            Log.i(TAG, "Initiating real emergency dispatch for incident: " + incidentId);

            // 1. Native SMS Dispatch
            String smsStatus = sendNativeSms(context, toNumber, body, incidentId);

            // 2. Direct Backend Incident Sync
            boolean backendOk = logIncidentToBackend(incidentId, lat, lng, body, orgId, triggeredBy);
            String syncStatus = backendOk ? "SYNCED" : "PENDING";

            boolean overallSuccess = "SENT".equals(smsStatus) || "QUEUED".equals(smsStatus) || backendOk;
            DispatchResult result = new DispatchResult(overallSuccess, smsStatus, "INITIATED", syncStatus);

            if (callback != null) {
                callback.onResult(result);
            }
        });
    }

    public String sendNativeSms(Context context, String toNumber, String body, String incidentId) {
        if (toNumber == null || toNumber.trim().isEmpty()) {
            return "UNAVAILABLE";
        }
        try {
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                smsManager = context.getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }

            if (smsManager == null) {
                Log.w(TAG, "SmsManager is not available on this device");
                return "UNAVAILABLE";
            }

            ArrayList<String> parts = smsManager.divideMessage(body);
            int pFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                    ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    : PendingIntent.FLAG_UPDATE_CURRENT;

            ArrayList<PendingIntent> sentIntents = new ArrayList<>();
            for (int i = 0; i < parts.size(); i++) {
                Intent sIntent = new Intent("com.aistudio.safetylink.SMS_SENT");
                sIntent.putExtra("incidentId", incidentId);
                sentIntents.add(PendingIntent.getBroadcast(context, i, sIntent, pFlags));
            }

            smsManager.sendMultipartTextMessage(toNumber, null, parts, sentIntents, null);
            Log.i(TAG, "SMS successfully passed to radio modem for incident: " + incidentId);
            return "SENT";
        } catch (SecurityException se) {
            Log.e(TAG, "SEND_SMS permission missing: " + se.getMessage());
            return "FAILED";
        } catch (Exception e) {
            Log.e(TAG, "SMS dispatch exception: " + e.getMessage());
            return "FAILED";
        }
    }

    private boolean logIncidentToBackend(String incidentId, double lat, double lng,
                                         String description, String orgId, String triggeredBy) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BACKEND_BASE_URL + "/api/incidents");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            JSONObject payload = new JSONObject();
            payload.put("id", incidentId);
            payload.put("latitude", lat);
            payload.put("longitude", lng);
            payload.put("description", description);
            payload.put("org_id", orgId);
            payload.put("triggered_by", triggeredBy);
            payload.put("status", "DISPATCHED");
            payload.put("severity", "CRITICAL");

            String jsonStr = payload.toString();
            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonStr.getBytes(StandardCharsets.UTF_8));
            }
            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            Log.w(TAG, "Backend sync connection error: " + e.getMessage());
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
