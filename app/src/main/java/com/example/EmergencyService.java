package com.example;

import android.util.Base64;
import android.util.Log;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * EmergencyService handles secure API transactions for SafetyLink under distress conditions.
 * It broadcasts high-priority SMS notifications via the Twilio REST API
 * and simultaneously logs the critical telemetry transaction into CockroachDB.
 */
public class EmergencyService {

    private static final String TAG = "EmergencyService_Java";
    private static EmergencyService instance;
    private final ExecutorService executorService;

    // Default Fallbacks for Environment Credentials
    private static final String DEFAULT_TWILIO_SID = "AC_MOCK_TWILIO_ACCOUNT_SID_SAFETY_LINK";
    private static final String DEFAULT_TWILIO_TOKEN = "MOCK_AUTH_TOKEN_VALUE_48102947291";
    private static final String DEFAULT_TWILIO_FROM = "+15005550006";
    private static final String DEFAULT_COCKROACH_ENDPOINT = "https://aws-us-east-1.cockroachlabs.cloud/api/v1/databases/safetylink-prod/sql";
    private static final String DEFAULT_COCKROACH_KEY = "MOCK_COCKROACH_SECRET_KEY_8829471";

    private EmergencyService() {
        this.executorService = Executors.newFixedThreadPool(3);
    }

    public static synchronized EmergencyService getInstance() {
        if (instance == null) {
            instance = new EmergencyService();
        }
        return instance;
    }

    public interface DispatchCallback {
        void onSuccess(String responseMessage);
        void onFailure(Exception error);
    }

    /**
     * Dispatches an emergency SMS alert to a list of contacts via Twilio and inserts 
     * a transaction record into CockroachDB. Runs on background thread pool to prevent NetworkOnMainThreadException.
     */
    public void executeEmergencyTransaction(
            final String incidentId,
            final double latitude,
            final double longitude,
            final String description,
            final String recipientPhone,
            final String customMessage,
            final DispatchCallback callback
    ) {
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.i(TAG, "Initiating synchronized emergency dispatch sequence: " + incidentId);

                    // 1. Send Twilio SMS Alert
                    boolean smsSuccess = sendTwilioSms(recipientPhone, customMessage);

                    // 2. Insert SQL telemetry record into CockroachDB
                    boolean dbSuccess = logEventToCockroachDB(incidentId, latitude, longitude, description);

                    if (smsSuccess && dbSuccess) {
                        Log.i(TAG, "Emergency dispatch transactions completed successfully across all nodes.");
                        if (callback != null) {
                            callback.onSuccess("SMS and DB logging successful.");
                        }
                    } else {
                        String errMsg = "Emergency transaction partial failure. Twilio: " + (smsSuccess ? "OK" : "FAIL") 
                                      + " | CockroachDB: " + (dbSuccess ? "OK" : "FAIL");
                        Log.w(TAG, errMsg);
                        if (callback != null) {
                            callback.onFailure(new Exception(errMsg));
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Fatal crash during emergency transaction workflow: " + e.getMessage(), e);
                    if (callback != null) {
                        callback.onFailure(e);
                    }
                }
            }
        });
    }

    private boolean sendTwilioSms(String toPhone, String textBody) {
        try {
            Log.d(TAG, "Preparing Twilio SMS payload to " + toPhone);
            String urlStr = "https://api.twilio.com/2010-04-01/Accounts/" + DEFAULT_TWILIO_SID + "/Messages.json";
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            
            // Basic Auth with Twilio SID and Auth Token
            String auth = DEFAULT_TWILIO_SID + ":" + DEFAULT_TWILIO_TOKEN;
            byte[] authBytes = auth.getBytes(StandardCharsets.UTF_8);
            String base64Auth = Base64.encodeToString(authBytes, Base64.NO_WRAP);
            conn.setRequestProperty("Authorization", "Basic " + base64Auth);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setDoOutput(true);

            // Construct form payload
            String postData = "To=" + toPhone +
                              "&From=" + DEFAULT_TWILIO_FROM +
                              "&Body=" + textBody;

            try (OutputStream os = conn.getOutputStream()) {
                os.write(postData.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
                Log.i(TAG, "Twilio SMS alert sent successfully. Response code: " + responseCode);
                return true;
            } else {
                Log.e(TAG, "Twilio SMS HTTP Error: " + responseCode);
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during Twilio SMS transmission: " + e.getMessage(), e);
            return false;
        }
    }

    private boolean logEventToCockroachDB(String incidentId, double lat, double lng, String description) {
        try {
            Log.d(TAG, "Logging incident transaction to CockroachDB secure API gateway: " + incidentId);
            URL url = new URL(DEFAULT_COCKROACH_ENDPOINT);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + DEFAULT_COCKROACH_KEY);
            conn.setRequestProperty("X-Cockroach-Transaction-Priority", "HIGH");
            conn.setDoOutput(true);

            // Build JSON Body matching CockroachDB serverless requirements
            JSONObject body = new JSONObject();
            body.put("statement", "INSERT INTO org_events (id, timestamp, latitude, longitude, description, severity, status) VALUES ($1, $2, $3, $4, $5, $6, $7);");
            
            JSONArray parameters = new JSONArray();
            parameters.put(incidentId);
            parameters.put(new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).format(new java.util.Date()));
            parameters.put(lat);
            parameters.put(lng);
            parameters.put(description);
            parameters.put("CRITICAL");
            parameters.put("DISPATCHED");
            
            body.put("parameters", parameters);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
                Log.i(TAG, "CockroachDB log transaction committed successfully. Code: " + responseCode);
                return true;
            } else {
                Log.e(TAG, "CockroachDB SQL API Error code: " + responseCode);
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception logging to CockroachDB database: " + e.getMessage(), e);
            return false;
        }
    }
}
