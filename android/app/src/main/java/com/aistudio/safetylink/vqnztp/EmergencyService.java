package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telephony.SmsManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.aistudio.safetylink.vqnztp.data.OfflineSyncWorker;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * EmergencyService
 *
 * Native singleton orchestrating real SMS dispatch via Android SmsManager with BroadcastReceiver
 * confirmation and Dual-SIM failover, direct voice call placement, USSD Please Call Me fallback,
 * offline-first profile/contact/GPS hydration, and backend incident synchronization.
 */
public final class EmergencyService {
    private static final String TAG = "EmergencyService";
    private static final String BACKEND_PRIMARY_URL = "https://api.safetylink.online";
    private static final String BACKEND_WORKERS_URL = "https://safetylink-api.tshilidzi-mukwevho54.workers.dev";
    private static final String BACKEND_LOCAL_DEV_URL = "http://10.0.2.2:3000";

    private static volatile EmergencyService instance;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public static final String PREFS = "safetylink_prefs";
    public static final String CONTACTS_PREFS = "sl_contacts_store";
    public static final String PREF_SIM_SUB_ID = "preferred_sim_sub_id";
    public static final String DEFAULT_PCM_GATEWAY = "0816738186";
    private static final String DEFAULT_RESPONSE_CENTRE = "+27680079911";

    private static final AtomicInteger smsRequestSeq = new AtomicInteger(1000);
    private static final java.util.concurrent.atomic.AtomicLong lastDispatchAt = new java.util.concurrent.atomic.AtomicLong(0);

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

    @SuppressWarnings("MissingPermission")
    private static List<SmsManager> getOrderedSmsManagers(Context ctx) {
        List<SmsManager> managers = new ArrayList<>();
        LinkedHashSet<Integer> usedSubIds = new LinkedHashSet<>();

        int preferredSubId = getPreferredSubId(ctx);
        if (preferredSubId >= 0) {
            SmsManager pref = createSmsManagerForSubId(ctx, preferredSubId);
            if (pref != null) {
                managers.add(pref);
                usedSubIds.add(preferredSubId);
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1 &&
                ctx.checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            try {
                SubscriptionManager sm = (SubscriptionManager) ctx.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                if (sm != null) {
                    List<SubscriptionInfo> list = sm.getActiveSubscriptionInfoList();
                    if (list != null) {
                        for (SubscriptionInfo info : list) {
                            int subId = info.getSubscriptionId();
                            if (!usedSubIds.contains(subId)) {
                                SmsManager mgr = createSmsManagerForSubId(ctx, subId);
                                if (mgr != null) {
                                    managers.add(mgr);
                                    usedSubIds.add(subId);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "SubscriptionManager enumeration failed: " + e.getMessage());
            }
        }

        if (managers.isEmpty()) {
            SmsManager fallback = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    ? ctx.getSystemService(SmsManager.class)
                    : SmsManager.getDefault();
            if (fallback != null) managers.add(fallback);
        }
        return managers;
    }

    private static SmsManager createSmsManagerForSubId(Context ctx, int subId) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                SmsManager base = ctx.getSystemService(SmsManager.class);
                return base != null ? base.createForSubscriptionId(subId) : null;
            }
            return SmsManager.getSmsManagerForSubscriptionId(subId);
        } catch (Exception e) {
            return null;
        }
    }

    /** Attaches the preferred SIM's PhoneAccountHandle to a call intent. */
    @SuppressWarnings("MissingPermission")
    public static void applyPreferredSim(Context ctx, Intent callIntent) {
        int subId = getPreferredSubId(ctx);
        if (subId < 0) {
            try {
                TelecomManager tc = (TelecomManager) ctx.getSystemService(Context.TELECOM_SERVICE);
                if (tc != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PhoneAccountHandle def = tc.getDefaultOutgoingPhoneAccount("tel");
                    if (def != null) callIntent.putExtra(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, def);
                }
            } catch (Exception ignored) { }
            return;
        }
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
                        if (id != null && (id.equals(info.getIccId()) || id.equals(String.valueOf(subId)))) {
                            handle = h;
                            break;
                        }
                    }
                }
            }
            if (handle != null) callIntent.putExtra(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, handle);
        } catch (Exception e) {
            Log.w(TAG, "Could not apply preferred SIM to call: " + e.getMessage());
        }
    }

    private static String toLocal10Digit(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("27") && digits.length() == 11) return "0" + digits.substring(2);
        if (digits.length() == 9 && (digits.startsWith("6") || digits.startsWith("7") || digits.startsWith("8"))) return "0" + digits;
        return digits;
    }

    private static String getPrimaryContactNumber(Context ctx) {
        try {
            String raw = ctx.getSharedPreferences(CONTACTS_PREFS, Context.MODE_PRIVATE).getString("list", "[]");
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o != null) {
                    String p = o.optString("phone", "").trim();
                    if (!p.isEmpty()) return p;
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    @SuppressWarnings("MissingPermission")
    public static String sendPleaseCallMe(Context ctx) {
        try {
            if (ctx.checkSelfPermission(Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) return "NO_PERMISSION";
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

            // Enforce configurable cooldown (default: 5 minutes) so repeat presses within 5 minutes do NOT spam PCM/USSD
            int cooldownMinutes = Math.max(0, prefs.getInt("pcm_cooldown_minutes", 5));
            long cooldownMs = cooldownMinutes * 60_000L;
            long lastPcmAt = prefs.getLong("last_pcm_sent_at", 0L);
            long now = System.currentTimeMillis();
            if (cooldownMs > 0 && lastPcmAt > 0 && (now - lastPcmAt) < cooldownMs) {
                long remainingSec = Math.max(1L, (cooldownMs - (now - lastPcmAt)) / 1000L);
                Log.i(TAG, "Please Call Me suppressed by " + cooldownMinutes + "m dedupe (" + remainingSec + "s remaining)");
                return "COOLDOWN_" + cooldownMinutes + "M";
            }

            String mode = prefs.getString("offline_ussd_mode", "RAIN_PCM");
            String customPrefix = prefs.getString("reverse_charge_prefix", "127");
            String primaryContact = toLocal10Digit(getPrimaryContactNumber(ctx));
            String gateway = prefs.getString("pcm_gateway", DEFAULT_PCM_GATEWAY);
            if (gateway == null || gateway.trim().isEmpty()) gateway = DEFAULT_PCM_GATEWAY;

            TelephonyManager tm = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
            if (tm == null) return "NO_TELEPHONY";
            int subId = getPreferredSubId(ctx);
            if (subId >= 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) tm = tm.createForSubscriptionId(subId);
            String op = tm.getSimOperator() == null ? "" : tm.getSimOperator();

            // Mode 1: Reverse-Charge Call directly to #1 Emergency Contact (e.g. MTN Pay4Me 127<number>)
            if ("REVERSE_CHARGE_CALL".equalsIgnoreCase(mode) && !primaryContact.isEmpty()) {
                String prefix = (customPrefix != null && !customPrefix.trim().isEmpty()) ? customPrefix.trim() : (op.startsWith("65501") ? "082180" : "127");
                String dialTarget = prefix.endsWith("#") ? prefix.replace("{NUMBER}", primaryContact) : (prefix + primaryContact);
                prefs.edit().putLong("last_pcm_sent_at", now).apply();
                return pcmViaCall(ctx, dialTarget, "REVERSE_CHARGE");
            }

            // Mode 2 or 3: Carrier-matched Please Call Me (either to #1 Emergency Contact or Rain SIM Gateway)
            String targetNumber = ("DIRECT_CONTACT_PCM".equalsIgnoreCase(mode) && !primaryContact.isEmpty())
                    ? primaryContact
                    : gateway.trim();

            String code = "140";                       // Vodacom (65501) and Telkom (65502)
            if (op.startsWith("65510")) code = "121";  // MTN
            else if (op.startsWith("65507")) code = "111"; // Cell C
            String ussd = "*" + code + "*" + targetNumber + "#";

            prefs.edit().putLong("last_pcm_sent_at", now).apply();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                final CountDownLatch latch = new CountDownLatch(1);
                final String[] res = { "SENT" };
                tm.sendUssdRequest(ussd, new TelephonyManager.UssdResponseCallback() {
                    @Override public void onReceiveUssdResponse(TelephonyManager t, String request, CharSequence response) {
                        Log.i(TAG, "USSD carrier response received: " + (response != null ? response.toString() : "OK"));
                        res[0] = "SENT";
                        latch.countDown();
                    }
                    @Override public void onReceiveUssdResponseFailed(TelephonyManager t, String request, int failureCode) {
                        Log.w(TAG, "Headless USSD failed with code " + failureCode + "; falling back to dialer USSD");
                        res[0] = "FAILED_" + failureCode;
                        latch.countDown();
                    }
                }, new Handler(Looper.getMainLooper()));
                // SA carriers (MTN/Vodacom/Cell C/Telkom) typically respond to USSD in 2-6s; wait up to 7s before proceeding
                boolean completed = latch.await(7, TimeUnit.SECONDS);
                if (!completed) return "QUEUED";
                if (res[0].startsWith("FAILED")) return pcmViaCall(ctx, ussd, res[0]);
                return res[0];
            }
            return pcmViaCall(ctx, ussd, "LEGACY");
        } catch (Exception e) {
            Log.w(TAG, "PCM USSD failed: " + e.getMessage());
            return "FAILED";
        }
    }

    private static String pcmViaCall(Context ctx, String ussd, String why) {
        try {
            if (ctx.checkSelfPermission(Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                return "NO_PERMISSION";
            }
            Intent i = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + Uri.encode(ussd)));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            applyPreferredSim(ctx, i);
            ctx.startActivity(i);
            // Keep SafetyLink on screen after dialing so active call/USSD stays in status bar
            bringSafetyLinkToFront(ctx, 1100L);
            return "DIALED(" + why + ")";
        } catch (Exception e) {
            return "FAILED";
        }
    }

    /**
     * Returns SafetyLink's MainActivity to the foreground shortly after placing a native voice call,
     * leveraging Display Over Other Apps / Foreground Service so Android keeps the live call active
     * in the top notification chip while SafetyLink never exits or drops its emergency state.
     */
    public static void bringSafetyLinkToFront(Context ctx, long delayMs) {
        if (ctx == null) return;
        final Context appCtx = ctx.getApplicationContext();
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                Intent reopen = new Intent(appCtx, MainActivity.class);
                reopen.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                );
                reopen.putExtra("safetylink_stay_foreground_call", true);
                appCtx.startActivity(reopen);
                Log.i(TAG, "Returned SafetyLink MainActivity to foreground while call remains active in notification bar.");
            } catch (Exception e) {
                Log.w(TAG, "Return-to-front during call skipped: " + e.getMessage());
            }
        }, Math.max(350L, delayMs));
    }

    /**
     * Verifies REAL internet & SafetyLink backend reachability (not just Wi-Fi/cellular icon)
     * so offline or zero-data SIMs immediately route into Zero-Airtime USSD -> Rain SIM -> FCM + SMS.
     */
    public static boolean isBackendReachable(Context ctx) {
        try {
            if (ctx != null) {
                ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Network active = cm.getActiveNetwork();
                    if (active == null) return false;
                    NetworkCapabilities caps = cm.getNetworkCapabilities(active);
                    if (caps == null || !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                        return false;
                    }
                }
            }
        } catch (Exception ignored) {}

        String[] probes = new String[]{
                BACKEND_PRIMARY_URL + "/api/health",
                BACKEND_WORKERS_URL + "/api/health"
        };
        for (String probe : probes) {
            HttpURLConnection conn = null;
            try {
                conn = (HttpURLConnection) new URL(probe).openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(2200);
                conn.setReadTimeout(2200);
                int code = conn.getResponseCode();
                if (code >= 200 && code < 500) {
                    return true;
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        return false;
    }

    public interface DispatchCallback {
        void onResult(DispatchResult result);
    }

    public static class DispatchResult {
        public String incidentId;
        public boolean success;
        public String smsStatus; // SENT, PARTIAL, FAILED, UNAVAILABLE, QUEUED
        public String callStatus; // INITIATED, FAILED, UNAVAILABLE, SKIPPED
        public String backendSyncStatus; // SYNCED, PENDING, FAILED
        public String pcmStatus; // SENT, QUEUED, DIALED(...), FAILED, NO_PERMISSION

        public DispatchResult(boolean success, String smsStatus, String callStatus, String backendSyncStatus) {
            this("", success, smsStatus, callStatus, backendSyncStatus, "NONE");
        }

        public DispatchResult(String incidentId, boolean success, String smsStatus, String callStatus, String backendSyncStatus, String pcmStatus) {
            this.incidentId = incidentId;
            this.success = success;
            this.smsStatus = smsStatus;
            this.callStatus = callStatus;
            this.backendSyncStatus = backendSyncStatus;
            this.pcmStatus = pcmStatus;
        }
    }

    public void dispatchEmergency(Context context, String toNumber, String allPhones, String body, String incidentId,
                                  double lat, double lng, String orgId, String triggeredBy,
                                  DispatchCallback callback) {
        long nowMs = System.currentTimeMillis();
        long prev = lastDispatchAt.get();
        if (nowMs - prev < 5000 || !lastDispatchAt.compareAndSet(prev, nowMs)) {
            Log.w(TAG, "Duplicate dispatch suppressed for incident: " + incidentId);
            if (callback != null) {
                callback.onResult(new DispatchResult(incidentId, true, "SUPPRESSED", "SUPPRESSED", "SUPPRESSED", "SUPPRESSED"));
            }
            return;
        }

        boolean isDemo = (triggeredBy != null && triggeredBy.equals("SIMULATED_DEMO_ONLY"))
                || (body != null && body.contains("[SIMULATED_DEMO_ONLY]"));
        if (isDemo) {
            Log.i(TAG, "[DEMO SOS] Suppressing native SMS and telephony for simulated test: " + triggeredBy);
            if (callback != null) {
                callback.onResult(new DispatchResult(incidentId, true, "SIMULATED_DEMO", "SKIPPED_DEMO", "SYNCED", "SKIPPED_DEMO"));
            }
            return;
        }

        executor.execute(() -> {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String savedName = prefs.getString("sl_name", "").trim();
            String savedPhone = prefs.getString("sl_phone", "").trim();
            String savedNote = prefs.getString("sl_alert_note", "").trim();
            String savedOrgId = prefs.getString("sl_org_id", "").trim();
            String savedUserId = prefs.getString("sl_user_id", "").trim();

            String resolvedOrgId = (orgId != null && !orgId.trim().isEmpty())
                    ? orgId.trim()
                    : (!savedOrgId.isEmpty() ? savedOrgId : "INDIVIDUAL");
            String resolvedTriggeredBy = (triggeredBy != null && !triggeredBy.trim().isEmpty())
                    ? triggeredBy.trim()
                    : (!savedUserId.isEmpty() ? savedUserId : (!savedName.isEmpty() ? savedName : "SafetyLink User"));

            double[] resolvedCoords = resolveCoordinates(context, prefs, lat, lng);
            double finalLat = resolvedCoords[0];
            double finalLng = resolvedCoords[1];

            // Hydrate saved emergency contacts from sl_contacts_store
            LinkedHashSet<String> recipients = new LinkedHashSet<>();
            String preferredCallTarget = "";
            if (toNumber != null && !toNumber.trim().isEmpty()) {
                String n = normalizePhoneNumber(toNumber.trim());
                if (!n.isEmpty()) {
                    recipients.add(n);
                    preferredCallTarget = n;
                }
            }
            if (allPhones != null && !allPhones.trim().isEmpty()) {
                for (String ph : allPhones.split(",")) {
                    String n = normalizePhoneNumber(ph);
                    if (!n.isEmpty()) {
                        recipients.add(n);
                        if (preferredCallTarget.isEmpty()) preferredCallTarget = n;
                    }
                }
            }

            try {
                String contactsJson = context.getSharedPreferences(CONTACTS_PREFS, Context.MODE_PRIVATE).getString("list", "[]");
                JSONArray arr = new JSONArray(contactsJson);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject cObj = arr.optJSONObject(i);
                    if (cObj == null) continue;
                    String cPhone = normalizePhoneNumber(cObj.optString("phone", ""));
                    if (cPhone.isEmpty()) continue;
                    boolean wantSms = !cObj.has("sms") || cObj.optBoolean("sms", true);
                    boolean wantCall = cObj.optBoolean("call", false);
                    if (wantSms) recipients.add(cPhone);
                    if (preferredCallTarget.isEmpty() && wantCall) preferredCallTarget = cPhone;
                }
                if (preferredCallTarget.isEmpty() && !recipients.isEmpty()) {
                    preferredCallTarget = recipients.iterator().next();
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed parsing sl_contacts_store: " + e.getMessage());
            }

            if (recipients.isEmpty()) {
                recipients.add(DEFAULT_RESPONSE_CENTRE);
            }
            if (preferredCallTarget.isEmpty()) {
                preferredCallTarget = recipients.iterator().next();
            }

            // STAGE 1: Real Online/Offline Verification + Backend & Cloud FCM Loud Alarm Sync
            boolean onlineReachable = isBackendReachable(context);
            boolean backendOk = onlineReachable
                    && logIncidentToBackend(incidentId, finalLat, finalLng, body, resolvedOrgId, resolvedTriggeredBy, savedName, savedPhone, recipients);
            String syncStatus = backendOk ? "SYNCED" : (onlineReachable ? "PENDING" : "OFFLINE_QUEUED");
            if (!backendOk && context != null) {
                OfflineSyncWorker.queueOfflineIncident(context, incidentId, finalLat, finalLng, body, resolvedOrgId, resolvedTriggeredBy);
            }
            Log.i(TAG, "[STAGE 1/4] Real Reachability=" + onlineReachable + " Backend Cloud Sync=" + syncStatus);

            try { Thread.sleep(400); } catch (InterruptedException ignored) {}

            // STAGE 2: Real GSM SMS Broadcast over Android SmsManager with delivery-intent verification
            String senderLabel = !savedName.isEmpty() ? savedName : resolvedTriggeredBy;
            StringBuilder smsBuilder = new StringBuilder("SAFETYLINK SOS [").append(incidentId).append("]: ")
                    .append(senderLabel).append(" - ")
                    .append(body == null || body.trim().isEmpty() ? "Emergency distress alert" : body.trim());
            if (!savedNote.isEmpty()) {
                smsBuilder.append(" | Note: ").append(savedNote);
            }
            if (finalLat != 0.0 || finalLng != 0.0) {
                smsBuilder.append(" Location: https://maps.google.com/?q=").append(finalLat).append(",").append(finalLng);
            }
            String smsText = smsBuilder.toString();

            String smsStatus = "FAILED";
            if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                smsStatus = "UNAVAILABLE";
            } else {
                int sentCount = 0;
                for (String ph : recipients) {
                    String st = sendNativeSms(context, ph, smsText, incidentId);
                    if ("SENT".equals(st)) sentCount++;
                }
                if (sentCount == recipients.size()) {
                    smsStatus = "SENT";
                } else if (sentCount > 0) {
                    smsStatus = "PARTIAL";
                }
            }
            Log.i(TAG, "[STAGE 2/4] SMS Broadcast result: " + smsStatus + " (" + recipients.size() + " target(s))");

            try { Thread.sleep(1000); } catch (InterruptedException ignored) {}

            // STAGE 3: Zero-Data / Zero-Airtime Carrier USSD "Please Call Me" (PCM) to Rain SIM Gateway
            // Runs STRICTLY BEFORE the native voice call when the user has enabled USSD fallback,
            // because GSM networks cannot run a USSD session concurrently with an active voice call.
            boolean ussdEnabled = prefs.getBoolean("ussd_enabled", true);
            String offlineUssdMode = prefs.getString("offline_ussd_mode", "RAIN_PCM");
            boolean needsOfflineFallback = !backendOk || !"SENT".equals(smsStatus);
            boolean shouldSendPcm = ussdEnabled && needsOfflineFallback;
            String pcmStatus = shouldSendPcm
                    ? sendPleaseCallMe(context)
                    : (!ussdEnabled ? "DISABLED_BY_USER" : "SKIPPED_ONLINE_AND_SMS_SENT");
            if (!backendOk && !savedPhone.isEmpty() && (finalLat != 0.0 || finalLng != 0.0)) {
                OfflineSyncWorker.queuePcmLocation(context, savedPhone, finalLat, finalLng);
            }
            Log.i(TAG, "[STAGE 3/4] PCM USSD Status: " + pcmStatus + " (enabled=" + ussdEnabled + ", backendOk=" + backendOk + ", sms=" + smsStatus + ")");

            // Wait for modem/carrier USSD session teardown so Stage 4 voice call NEVER collides with USSD
            boolean pcmUsedVoiceCall = pcmStatus.startsWith("DIALED(REVERSE_CHARGE)");
            if (shouldSendPcm && !pcmUsedVoiceCall) {
                long ussdSettleMs;
                if (pcmStatus.startsWith("DIALED(")) {
                    // Fallback tel: USSD dialog stays open ~6-7s while carrier processes *121*/*140*
                    ussdSettleMs = 7000L;
                } else if ("QUEUED".equals(pcmStatus)) {
                    // Headless USSD still settling after 7s await
                    ussdSettleMs = 3000L;
                } else if ("SENT".equals(pcmStatus)) {
                    // Headless USSD already received carrier confirmation; brief modem release pause
                    ussdSettleMs = 2000L;
                } else {
                    ussdSettleMs = 1000L;
                }
                try { Thread.sleep(ussdSettleMs); } catch (InterruptedException ignored) {}
            }

            // STAGE 4: Native Direct Voice Call (explicit INITIATED / FAILED / UNAVAILABLE / SKIPPED)
            // Runs LAST so the live voice call remains open and uninterrupted. Never interrupts an active call.
            String callStatus;
            if (pcmUsedVoiceCall && "REVERSE_CHARGE_CALL".equalsIgnoreCase(offlineUssdMode)) {
                callStatus = "SKIPPED_REVERSE_CHARGE_ACTIVE";
            } else if (isCallCurrentlyActive(context)) {
                callStatus = "SKIPPED_CALL_IN_PROGRESS";
            } else {
                callStatus = placeNativeCall(context, preferredCallTarget);
            }
            Log.i(TAG, "[STAGE 4/4] Voice Call Status: " + callStatus + " to " + preferredCallTarget);

            boolean overallSuccess = backendOk
                    || "SENT".equals(smsStatus)
                    || "PARTIAL".equals(smsStatus)
                    || "INITIATED".equals(callStatus)
                    || "SKIPPED_REVERSE_CHARGE_ACTIVE".equals(callStatus)
                    || pcmStatus.startsWith("SENT")
                    || pcmStatus.startsWith("QUEUED")
                    || pcmStatus.startsWith("DIALED");

            DispatchResult result = new DispatchResult(incidentId, overallSuccess, smsStatus, callStatus, syncStatus, pcmStatus);
            if (callback != null) {
                callback.onResult(result);
            }
        });
    }

    @SuppressWarnings("MissingPermission")
    private double[] resolveCoordinates(Context context, SharedPreferences prefs, double lat, double lng) {
        if (lat != 0.0 || lng != 0.0) {
            return new double[]{ lat, lng };
        }
        if (prefs.contains("sl_lat") && prefs.contains("sl_lng")) {
            double cLat = Double.longBitsToDouble(prefs.getLong("sl_lat", 0L));
            double cLng = Double.longBitsToDouble(prefs.getLong("sl_lng", 0L));
            if (cLat != 0.0 || cLng != 0.0) {
                return new double[]{ cLat, cLng };
            }
        }
        try {
            if (context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    || context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
                if (lm != null) {
                    Location gps = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    if (gps != null) return new double[]{ gps.getLatitude(), gps.getLongitude() };
                    Location net = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                    if (net != null) return new double[]{ net.getLatitude(), net.getLongitude() };
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Last known location lookup failed: " + e.getMessage());
        }
        return new double[]{ 0.0, 0.0 };
    }

    private boolean isCallCurrentlyActive(Context context) {
        try {
            if (context.checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
            TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (tm == null) return false;
            int state = tm.getCallState();
            return state == TelephonyManager.CALL_STATE_OFFHOOK || state == TelephonyManager.CALL_STATE_RINGING;
        } catch (Exception e) {
            return false;
        }
    }

    private String normalizePhoneNumber(String raw) {
        if (raw == null) return "";
        String cleaned = raw.replaceAll("[^0-9+]", "").trim();
        if (cleaned.length() < 3) return "";
        return cleaned;
    }

    public String placeNativeCall(Context context, String toNumber) {
        String cleanNumber = normalizePhoneNumber(toNumber);
        if (cleanNumber.isEmpty()) {
            return "FAILED";
        }
        PackageManager pm = context.getPackageManager();
        if (pm != null && !pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
            return "UNAVAILABLE";
        }
        if (context.checkSelfPermission(Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "CALL_PHONE permission not granted");
            return "UNAVAILABLE";
        }
        try {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + Uri.encode(cleanNumber)));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            applyPreferredSim(context, callIntent);
            context.startActivity(callIntent);
            // Bring SafetyLink back to the foreground so the live call stays in the notification bar
            // and the user never loses the active SOS cockpit or tracking logic.
            bringSafetyLinkToFront(context, 900L);
            Log.i(TAG, "Native ACTION_CALL placed to: " + cleanNumber + " (returning SafetyLink to front)");
            return "INITIATED";
        } catch (SecurityException se) {
            Log.e(TAG, "CALL_PHONE security error: " + se.getMessage());
            return "UNAVAILABLE";
        } catch (Exception e) {
            Log.e(TAG, "Call dispatch error: " + e.getMessage());
            return "FAILED";
        }
    }

    public String sendNativeSms(Context context, String toNumber, String body, String incidentId) {
        String cleanTarget = normalizePhoneNumber(toNumber);
        if (cleanTarget.isEmpty() || body == null || body.trim().isEmpty()) {
            return "FAILED";
        }
        if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            return "UNAVAILABLE";
        }

        List<SmsManager> candidateManagers = getOrderedSmsManagers(context);
        if (candidateManagers.isEmpty()) {
            return "UNAVAILABLE";
        }

        for (SmsManager smsManager : candidateManagers) {
            String attemptAction = "com.aistudio.safetylink.SMS_SENT_" + UUID.randomUUID();
            ArrayList<String> parts = smsManager.divideMessage(body);
            int partsCount = Math.max(1, parts.size());

            final CountDownLatch latch = new CountDownLatch(partsCount);
            final AtomicBoolean anyFailure = new AtomicBoolean(false);

            BroadcastReceiver sentReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context c, Intent intent) {
                    if (getResultCode() != Activity.RESULT_OK) {
                        anyFailure.set(true);
                    }
                    latch.countDown();
                }
            };

            try {
                IntentFilter filter = new IntentFilter(attemptAction);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.registerReceiver(sentReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
                } else {
                    context.registerReceiver(sentReceiver, filter);
                }

                int pFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                        : PendingIntent.FLAG_UPDATE_CURRENT;

                if (partsCount == 1) {
                    Intent sIntent = new Intent(attemptAction).setPackage(context.getPackageName());
                    sIntent.putExtra("incidentId", incidentId);
                    PendingIntent pi = PendingIntent.getBroadcast(context, smsRequestSeq.incrementAndGet(), sIntent, pFlags);
                    smsManager.sendTextMessage(cleanTarget, null, parts.get(0), pi, null);
                } else {
                    ArrayList<PendingIntent> sentIntents = new ArrayList<>();
                    for (int i = 0; i < partsCount; i++) {
                        Intent sIntent = new Intent(attemptAction).setPackage(context.getPackageName());
                        sIntent.putExtra("incidentId", incidentId);
                        sIntent.putExtra("part", i);
                        sentIntents.add(PendingIntent.getBroadcast(context, smsRequestSeq.incrementAndGet(), sIntent, pFlags));
                    }
                    smsManager.sendMultipartTextMessage(cleanTarget, null, parts, sentIntents, null);
                }

                boolean completed = latch.await(8, TimeUnit.SECONDS);
                if (completed && !anyFailure.get()) {
                    Log.i(TAG, "SMS confirmed SENT for " + cleanTarget + " (" + incidentId + ")");
                    return "SENT";
                }
                Log.w(TAG, "SMS attempt incomplete/failed on SIM for " + cleanTarget + " (completed=" + completed + ", anyFailure=" + anyFailure.get() + ")");
            } catch (SecurityException se) {
                Log.e(TAG, "SEND_SMS permission denied: " + se.getMessage());
                return "UNAVAILABLE";
            } catch (Exception e) {
                Log.w(TAG, "SMS SIM attempt threw exception: " + e.getMessage());
            } finally {
                try {
                    context.unregisterReceiver(sentReceiver);
                } catch (Exception ignored) {}
            }
        }
        return "FAILED";
    }

    private boolean logIncidentToBackend(
            String incidentId,
            double lat,
            double lng,
            String description,
            String orgId,
            String triggeredBy,
            String savedName,
            String savedPhone,
            LinkedHashSet<String> recipients
    ) {
        String[] targets = new String[]{ BACKEND_PRIMARY_URL, BACKEND_WORKERS_URL, BACKEND_LOCAL_DEV_URL };
        String[] paths = new String[]{ "/api/panic", "/api/incidents" };

        String callerName = (savedName != null && !savedName.isEmpty()) ? savedName : triggeredBy;
        String callerNumber = (savedPhone != null && !savedPhone.isEmpty()) ? savedPhone : "";

        for (String baseUrl : targets) {
            for (String path : paths) {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(baseUrl + path);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(4500);
                    conn.setReadTimeout(4500);
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Content-Type", "application/json");

                    JSONObject payload = new JSONObject();
                    payload.put("id", incidentId);
                    payload.put("incidentId", incidentId);
                    payload.put("userId", triggeredBy);
                    payload.put("orgId", orgId);
                    payload.put("lat", lat);
                    payload.put("lng", lng);
                    payload.put("latitude", lat);
                    payload.put("longitude", lng);
                    payload.put("callerName", callerName);
                    payload.put("callerNumber", callerNumber);
                    payload.put("description", description);
                    payload.put("status", "DISPATCHED");
                    payload.put("severity", "CRITICAL");
                    if (recipients != null && !recipients.isEmpty()) {
                        JSONArray contactsArr = new JSONArray();
                        for (String rPhone : recipients) {
                            JSONObject cObj = new JSONObject();
                            cObj.put("phone", rPhone);
                            contactsArr.put(cObj);
                        }
                        payload.put("contacts", contactsArr);
                    }

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
                    Log.w(TAG, "Backend sync error for " + baseUrl + path + ": " + e.getMessage());
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }
        return false;
    }
}
