package com.aistudio.safetylink.vqnztp.data;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * OfflineSyncWorker
 *
 * Java implementation of the offline incident synchronization worker.
 * Synchronizes pending offline emergency incidents directly with the SafetyLink backend API.
 */
public class OfflineSyncWorker extends Worker {
    private static final String TAG = "OfflineSyncWorker";
    private static final String PREF_OFFLINE_QUEUE = "safetylink_offline_incidents";
    private static final String BACKEND_BASE_URL = "https://safetylink.online";
    private static final String BACKEND_FALLBACK_URL = "http://10.0.2.2:3000";

    public OfflineSyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "Starting offline incident sync background job");
        Context context = getApplicationContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_OFFLINE_QUEUE, Context.MODE_PRIVATE);
        Map<String, ?> allEntries = prefs.getAll();

        if (allEntries == null || allEntries.isEmpty()) {
            Log.i(TAG, "No pending offline incidents found to sync");
            return Result.success();
        }

        boolean allSuccess = true;
        for (Map.Entry<String, ?> entry : allEntries.entrySet()) {
            String incidentId = entry.getKey();
            Object rawVal = entry.getValue();
            if (rawVal instanceof String) {
                String payloadStr = (String) rawVal;
                boolean synced = syncIncidentToBackend(payloadStr);
                if (synced) {
                    prefs.edit().remove(incidentId).apply();
                    Log.i(TAG, "Successfully synced and cleared offline incident: " + incidentId);
                } else {
                    allSuccess = false;
                }
            }
        }

        return allSuccess ? Result.success() : Result.retry();
    }

    public static void queueOfflineIncident(Context context, String incidentId, double lat, double lng,
                                            String description, String orgId, String triggeredBy) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_OFFLINE_QUEUE, Context.MODE_PRIVATE);
            JSONObject json = new JSONObject();
            json.put("id", incidentId);
            json.put("latitude", lat);
            json.put("longitude", lng);
            json.put("description", description);
            json.put("org_id", orgId);
            json.put("triggered_by", triggeredBy);
            json.put("status", "DISPATCHED");
            json.put("severity", "CRITICAL");
            json.put("sync_type", "OFFLINE_BATCH");

            prefs.edit().putString(incidentId, json.toString()).apply();
            Log.i(TAG, "Queued offline incident for future sync: " + incidentId);
        } catch (Exception e) {
            Log.e(TAG, "Failed to queue offline incident: " + e.getMessage());
        }
    }

    private boolean syncIncidentToBackend(String jsonPayload) {
        String[] targets = new String[]{ BACKEND_BASE_URL, BACKEND_FALLBACK_URL };
        for (String baseUrl : targets) {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(baseUrl + "/api/incidents");
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json");

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    return true;
                }
            } catch (Exception e) {
                Log.w(TAG, "Sync attempt to " + baseUrl + " failed: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        return false;
    }
}
