package com.aistudio.safetylink.vqnztp;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telephony.SmsManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.content.SharedPreferences;
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
    private static final String BACKEND_BASE_URL = "https://api.safetylink.online";
    private static final String BACKEND_FALLBACK_URL = "http://10.0.2.2:3000";
    private static volatile EmergencyService instance;
    private final ExecutorService executor = Executors.newCachedThreadPool();


    // ---- Dual-SIM support ----
    public static final String PREFS = "safetylink_prefs";
    public static final String PREF_SIM_SUB_ID = "preferred_sim_sub_id";

    public static int getPreferredSubId(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(PREF_SIM_SUB_ID, -1);
    }

    public static void setPreferredSubId(Context ctx, int subId) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putInt(PREF_SIM_SUB_ID, subId).apply();
    }

    @SuppressWarnings("MissingPermission")
    public static SmsManager smsManagerFor(Context ctx) {
        int subId = getPreferredSubId(ctx);
        try {
            if (subId >= 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    SmsManager base = ctx.getSystemService(SmsManager.class);
                    if (base != null) return base.createForSubscriptionId(subId);
                } else {
                    return SmsManager.getSmsManagerForSubscriptionId(subId);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Preferred SIM SMS manager unavailable, using default: " + e.getMessage());
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) return ctx.getSystemService(SmsManager.class);
        return SmsManager.getDefault();
    }

    /** Attaches the preferred SIM's PhoneAccountHandle to a call intent. Silent no-op if unavailable. */
    @SuppressWarnings("MissingPermission")
    public static void applyPreferredSim(Context ctx, Intent callIntent) {
        int subId = getPreferredSubId(ctx);
        if (subId < 0) return;
        try {
            PhoneAccountHandle handle = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                TelephonyManager tm = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
                if (tm != null) {
                    TelephonyManager sim = tm.createForSubscriptionId(subId);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) handle = sim.getPhoneAccountHandle();
                }
            }
            if (handle == null) {
                SubscriptionManager sm = (SubscriptionManager) ctx.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                TelecomManager tc = (TelecomManager) ctx.getSystemService(Context.TELECOM_SERVICE);
                SubscriptionInfo info = sm != null ? sm.getActiveSubscriptionInfo(subId) : null;
                if (info != null && tc != null) {
                    for (PhoneAccountHandle h : tc.getCallCapablePhoneAccounts()) {
                        String id = h.getId();
                        if (id != null && (id.equals(info.getIccId()) || id.equals(String.valueOf(subId)))) { handle = h; break; }
                    }
                }
            }
            if (handle != null) callIntent.putExtra(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, handle);
        } catch (Exception e) {
            Log.w(TAG, "Could not apply preferred SIM to call: " + e.getMessage());
        }
    }

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

    private static final java.util.concurrent.atomic.AtomicLong lastDispatchAt = new java.util.concurrent.atomic.AtomicLong(0);

    public void dispatchEmergency(Context context, String toNumber, String allPhones, String body, String incidentId,
                                  double lat, double lng, String orgId, String triggeredBy,
                                  DispatchCallback callback) {
        // Guard against rapid duplicate triggers (widget + button + BLE firing together)
        long nowMs = System.currentTimeMillis();
        long prev = lastDispatchAt.get();
        if (nowMs - prev < 5000 || !lastDispatchAt.compareAndSet(prev, nowMs)) {
            Log.w(TAG, "Duplicate dispatch suppressed for incident: " + incidentId);
            if (callback != null) callback.onResult(new DispatchResult(true, "SUPPRESSED", "SUPPRESSED", "SUPPRESSED"));
            return;
        }

        boolean isDemo = (triggeredBy != null && triggeredBy.equals("SIMULATED_DEMO_ONLY"))
                || (body != null && body.contains("[SIMULATED_DEMO_ONLY]"));
        if (isDemo) {
            Log.i(TAG, "[DEMO SOS] Suppressing native SMS and telephony for simulated test: " + triggeredBy);
            if (callback != null) {
                callback.onResult(new DispatchResult(true, "SIMULATED_DEMO", "SKIPPED_DEMO", "SYNCED"));
            }
            return;
        }

        executor.execute(() -> {
            Log.i(TAG, "Initiating real emergency dispatch for incident: " + incidentId);

            String smsText = (body == null ? "Emergency" : body) + " - SafetyLink SOS"
                    + ((lat != 0.0 || lng != 0.0) ? " Location: https://maps.google.com/?q=" + lat + "," + lng : "");

            // 1. Native SMS Dispatch to every saved contact (up to 5)
            java.util.LinkedHashSet<String> recipients = new java.util.LinkedHashSet<>();
            if (toNumber != null && !toNumber.trim().isEmpty()) recipients.add(toNumber.trim());
            if (allPhones != null) {
                for (String ph : allPhones.split(",")) { if (!ph.trim().isEmpty()) recipients.add(ph.trim()); }
            }
            if (recipients.isEmpty()) {
                recipients.add("+27680079911");
            }

            String smsStatus = "FAILED";
            int sentCount = 0;
            for (String ph : recipients) {
                String st = sendNativeSms(context, ph, smsText, incidentId);
                if ("SENT".equals(st)) sentCount++;
            }
            if (sentCount > 0) smsStatus = "SENT";

            // Let the USSD session finish before any call, so the two never interrupt each other
            if (pcmStatus != null && pcmStatus.startsWith("DIALED")) {
                try { Thread.sleep(20000); } catch (InterruptedException ignored) { }
            }

            // 2. Native Emergency Telephony Call
            String callTarget = (toNumber != null && !toNumber.trim().isEmpty()) ? toNumber.trim() : recipients.iterator().next();
            String callStatus = placeNativeCall(context, callTarget);

            // 3. Direct Backend Incident Sync (Cloud + local fallback)
            boolean backendOk = logIncidentToBackend(incidentId, lat, lng, body, orgId, triggeredBy);
            String syncStatus = backendOk ? "SYNCED" : "PENDING";
            if (!backendOk && context != null) {
                com.aistudio.safetylink.vqnztp.data.OfflineSyncWorker.queueOfflineIncident(
                        context, incidentId, lat, lng, body, orgId, triggeredBy
                );
            }

            boolean overallSuccess = "SENT".equals(smsStatus) || "QUEUED".equals(smsStatus) || "INITIATED".equals(callStatus) || backendOk;
            DispatchResult result = new DispatchResult(overallSuccess, smsStatus, callStatus, syncStatus);

            if (callback != null) {
                callback.onResult(result);
            }
        });
    }

    public String placeNativeCall(Context context, String toNumber) {
        if (toNumber == null || toNumber.trim().isEmpty()) {
            return "SKIPPED";
        }
        try {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + toNumber.trim()));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            applyPreferredSim(context, callIntent);
            context.startActivity(callIntent);
            Log.i(TAG, "Native ACTION_CALL placed to: " + toNumber);
            return "INITIATED";
        } catch (SecurityException se) {
            Log.w(TAG, "CALL_PHONE permission not granted, falling back to ACTION_DIAL");
            try {
                Intent dialIntent = new Intent(Intent.ACTION_DIAL);
                dialIntent.setData(Uri.parse("tel:" + toNumber.trim()));
                dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(dialIntent);
                return "INITIATED";
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch dialer fallback: " + e.getMessage());
                return "FAILED";
            }
        } catch (Exception e) {
            Log.e(TAG, "Call dispatch error: " + e.getMessage());
            return "FAILED";
        }
    }

    public String sendNativeSms(Context context, String toNumber, String body, String incidentId) {
        if (toNumber == null || toNumber.trim().isEmpty()) {
            return "UNAVAILABLE";
        }
        try {
            SmsManager smsManager = smsManagerFor(context);

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
        String[] targets = new String[]{ BACKEND_BASE_URL, BACKEND_FALLBACK_URL };
        String[] paths = new String[]{ "/api/panic", "/api/incidents" };
        for (String baseUrl : targets) {
            for (String path : paths) {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(baseUrl + path);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(4000);
                    conn.setReadTimeout(4000);
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Content-Type", "application/json");

                    JSONObject payload = new JSONObject();
                    payload.put("id", incidentId);
                    payload.put("userId", triggeredBy);
                    payload.put("orgId", orgId);
                    payload.put("latitude", lat);
                    payload.put("longitude", lng);
                    payload.put("callerName", "Native Android User");
                    payload.put("callerNumber", "+27680079911");
                    payload.put("description", description);
                    payload.put("status", "DISPATCHED");
                    payload.put("severity", "CRITICAL");

                    String jsonStr = payload.toString();
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(jsonStr.getBytes(StandardCharsets.UTF_8));
                    }
                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        Log.i(TAG, "Successfully logged incident " + incidentId + " via " + baseUrl + path);
                        return true;
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Backend sync connection error for " + baseUrl + path + ": " + e.getMessage());
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }
        return false;
    }
}
