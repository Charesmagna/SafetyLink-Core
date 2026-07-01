package com.aistudio.safetylink.vqnztp;

import android.util.Base64;
import android.util.Log;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * EmergencyService
 *
 * Thread-safe singleton that performs the two side effects a triggered
 * panic event needs on the native side:
 *   1. POST an SMS dispatch to Twilio's Messages endpoint.
 *   2. POST the incident row to CockroachDB's HTTP/SQL gateway (org_events).
 *
 * Designed to be bridgeable from a Capacitor custom plugin so the React/TS
 * layer (BaseService.ts / store.ts) can call into native dispatch when the
 * web-only fetch path isn't sufficient (e.g. background/heads-up delivery).
 *
 * SECURITY TODO (do not ship to production/public users without fixing):
 * TWILIO_* and COCKROACH_* credentials below are placeholders. Calling
 * Twilio and CockroachDB directly from the device means any secret placed
 * here ships inside the APK and can be extracted via decompilation. Before
 * a real rollout, replace both calls with requests to your own backend
 * (which holds the real credentials server-side) rather than posting
 * directly to Twilio/CockroachDB from this class.
 */
public final class EmergencyService {

    private static final String TAG = "EmergencyService";

    // Placeholders only — see SECURITY TODO above. Do not commit real secrets here.
    private static final String TWILIO_ACCOUNT_SID = "REPLACE_WITH_ACCOUNT_SID";
    private static final String TWILIO_AUTH_TOKEN = "REPLACE_WITH_AUTH_TOKEN";
    private static final String TWILIO_FROM_NUMBER = "REPLACE_WITH_TWILIO_NUMBER";
    private static final String TWILIO_MESSAGES_URL =
            "https://api.twilio.com/2010-04-01/Accounts/" + TWILIO_ACCOUNT_SID + "/Messages.json";

    private static final String COCKROACH_EVENTS_URL = "REPLACE_WITH_COCKROACH_HTTP_GATEWAY_URL";

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

    /**
     * Sends an SMS via Twilio and logs the resulting incident to CockroachDB.
     * Runs entirely on a background thread; safe to call from the main thread.
     */
    public void dispatchEmergency(String toNumber, String body, String incidentId,
                                   double lat, double lng, String orgId, String triggeredBy) {
        executor.execute(() -> {
            boolean smsOk = sendTwilioSms(toNumber, body);
            Log.i(TAG, "Twilio SMS dispatch " + (smsOk ? "succeeded" : "failed") + " for " + incidentId);

            boolean dbOk = logIncidentToCockroach(incidentId, lat, lng, body, orgId, triggeredBy);
            Log.i(TAG, "CockroachDB event log " + (dbOk ? "succeeded" : "failed") + " for " + incidentId);
        });
    }

    private boolean sendTwilioSms(String toNumber, String body) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(TWILIO_MESSAGES_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);

            String credentials = TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN;
            String basicAuth = Base64.encodeToString(credentials.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
            conn.setRequestProperty("Authorization", "Basic " + basicAuth);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            String params = "To=" + URLEncoder.encode(toNumber, "UTF-8")
                    + "&From=" + URLEncoder.encode(TWILIO_FROM_NUMBER, "UTF-8")
                    + "&Body=" + URLEncoder.encode(body, "UTF-8");

            try (OutputStream os = conn.getOutputStream()) {
                os.write(params.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            Log.e(TAG, "Twilio dispatch error", e);
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private boolean logIncidentToCockroach(String incidentId, double lat, double lng,
                                            String description, String orgId, String triggeredBy) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(COCKROACH_EVENTS_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            String json = "{"
                    + "\"id\":\"" + escape(incidentId) + "\","
                    + "\"latitude\":" + lat + ","
                    + "\"longitude\":" + lng + ","
                    + "\"description\":\"" + escape(description) + "\","
                    + "\"org_id\":\"" + escape(orgId) + "\","
                    + "\"triggered_by\":\"" + escape(triggeredBy) + "\""
                    + "}";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            Log.e(TAG, "CockroachDB insert error", e);
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
