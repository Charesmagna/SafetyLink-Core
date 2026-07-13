package com.aistudio.safetylink.vqnztp;

import android.util.Log;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * EmergencyService
 *
 * Thread-safe singleton that performs the two side effects a triggered
 * panic event needs on the native side:
 *   1. POST an SMS dispatch request to the central backend.
 *   2. POST the incident row to the central backend incidents table.
 */
public final class EmergencyService {

    private static final String TAG = "EmergencyService";
    private static final String BACKEND_BASE_URL = "http://10.0.2.2:3000";

    private static volatile EmergencyService instance;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private EmergencyService() {
    }

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
        public boolean smsOk;
        public boolean dbOk;
        public DispatchResult(boolean smsOk, boolean dbOk) {
            this.smsOk = smsOk;
            this.dbOk = dbOk;
        }
    }

    /**
     * Sends an SMS via backend and logs the resulting incident to backend database.
     * Runs entirely on a background thread; safe to call from the main thread.
     */
    public void dispatchEmergency(String toNumber, String body, String incidentId,
                                   double lat, double lng, String orgId, String triggeredBy,
                                   DispatchCallback callback) {
        executor.execute(() -> {
            boolean smsOk = sendBackendSms(toNumber, body);
            Log.i(TAG, "Backend SMS dispatch " + (smsOk ? "succeeded" : "failed") + " for " + incidentId);

            boolean dbOk = logIncidentToBackend(incidentId, lat, lng, body, orgId, triggeredBy);
            Log.i(TAG, "Backend incident log " + (dbOk ? "succeeded" : "failed") + " for " + incidentId);

            if (callback != null) {
                callback.onResult(new DispatchResult(smsOk, dbOk));
            }
        });
    }

    private boolean sendBackendSms(String toNumber, String body) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BACKEND_BASE_URL + "/api/dispatch/sms");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            JSONObject payload = new JSONObject();
            payload.put("phone", toNumber);
            payload.put("message", body);

            String jsonStr = payload.toString();

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonStr.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            Log.e(TAG, "Backend SMS dispatch error", e);
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private boolean logIncidentToBackend(String incidentId, double lat, double lng,
                                          String description, String orgId, String triggeredBy) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BACKEND_BASE_URL + "/api/incidents");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
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
            Log.e(TAG, "Backend logIncident error", e);
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
