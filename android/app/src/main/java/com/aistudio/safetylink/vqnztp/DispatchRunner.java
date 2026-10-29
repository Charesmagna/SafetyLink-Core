package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * Runs the dispatch steps strictly one after another, on one thread:
 *   1. SERVER   if there is data: send the alert and profile to the SafetyLink server
 *   2. SMS      every contact set to receive SMS (full details)
 *   3. CALL     first priority contact set to receive calls; failed if it never connects
 *   4. USSD     Please Call Me to the Rain SIM, so the server can forward the alert
 * Each step's result is written to the audit log.
 */
public final class DispatchRunner {
    private static final String TAG = "DispatchRunner";
    private static final String API = "https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/panic";
    private static final long CALL_CONNECT_WAIT_MS = 7000L;

    private DispatchRunner() {}

    /** Native contact store, written by the app when contacts change: a JSON array. */
    public static List<JSONObject> contacts(Context ctx) {
        List<JSONObject> out = new ArrayList<>();
        try {
            String raw = ctx.getSharedPreferences("sl_contacts_store", Context.MODE_PRIVATE).getString("list", "[]");
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) out.add(arr.getJSONObject(i));
        } catch (Exception e) {
            Log.w(TAG, "contacts unreadable: " + e.getMessage());
        }
        return out;
    }

    public static void run(Context ctx) {
        StringBuilder log = new StringBuilder();
        String name = nameFor(ctx);
        String place = locationText(ctx);
        String note = noteFor(ctx);
        List<JSONObject> contacts = contacts(ctx);
        String sms = buildSms(name, place, note);

        // 1. SERVER
        String server = "skipped (no data)";
        if (hasData(ctx)) {
            server = postToServer(ctx, name, place, note, contacts) ? "ok" : "failed";
        }
        log.append("1 SERVER ").append(server).append("; ");

        // 2. SMS to every contact set to receive SMS
        int smsSent = 0, smsTotal = 0;
        for (JSONObject c : contacts) {
            if (!c.optBoolean("sms", true)) continue;
            String to = c.optString("phone", "");
            if (to.isEmpty()) continue;
            smsTotal++;
            if (sendSms(to, sms)) smsSent++;
        }
        log.append("2 SMS ").append(smsSent).append("/").append(smsTotal).append("; ");

        // 3. CALL the first priority contact set to receive calls
        String callTo = null;
        for (JSONObject c : contacts) {
            if (c.optBoolean("call", false) && !c.optString("phone", "").isEmpty()) { callTo = c.optString("phone"); break; }
        }
        String call;
        if (callTo == null) {
            call = "skipped (no call contact)";
        } else {
            call = placeAndWaitForConnect(ctx, callTo) ? "connected" : "not connected (failed)";
        }
        log.append("3 CALL ").append(call).append("; ");

        // 4. USSD Please Call Me to the Rain SIM, after the call step has finished
        String ussd = EmergencyService.sendPleaseCallMe(ctx);
        log.append("4 USSD ").append(ussd);

        String result = log.toString();
        Log.i(TAG, "Dispatch: " + result);
        ctx.getSharedPreferences("sl_dispatch", Context.MODE_PRIVATE).edit()
            .putString("last", result).putLong("last_at", System.currentTimeMillis()).apply();
    }

    private static String buildSms(String name, String place, String note) {
        StringBuilder s = new StringBuilder();
        s.append("SAFETYLINK ALERT: ").append(name).append(" has pressed the SafetyLink button.");
        s.append(" Location: ").append(place).append(".");
        if (note != null && !note.isEmpty()) s.append(" Message from ").append(name).append(": ").append(note).append(".");
        s.append(" Please call them now. SafetyLink does not replace 10111 or 112.");
        return s.length() > 480 ? s.substring(0, 480) : s.toString();
    }

    private static boolean sendSms(String to, String text) {
        try {
            SmsManager sm = SmsManager.getDefault();
            List<String> parts = sm.divideMessage(text);
            sm.sendMultipartTextMessage(to, null, new ArrayList<>(parts), null, null);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "SMS to " + to + " failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * Calls the number and waits up to 7 seconds for the call to connect.
     * Not connected in time (no airtime, or the call never went through) = failed, so the sequence moves on.
     */
    private static boolean placeAndWaitForConnect(Context ctx, String number) {
        try {
            Intent i = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + Uri.encode(number)));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            EmergencyService.applyPreferredSim(ctx, i);
            ctx.startActivity(i);
        } catch (Exception e) {
            Log.w(TAG, "call failed to start: " + e.getMessage());
            return false;
        }
        TelephonyManager tm = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
        long end = System.currentTimeMillis() + CALL_CONNECT_WAIT_MS;
        while (System.currentTimeMillis() < end) {
            try {
                if (tm != null && tm.getCallState() == TelephonyManager.CALL_STATE_OFFHOOK) return true;
                Thread.sleep(250);
            } catch (InterruptedException e) {
                return false;
            } catch (SecurityException e) {
                return false;
            }
        }
        return false;
    }

    private static boolean postToServer(Context ctx, String name, String place, String note, List<JSONObject> contacts) {
        HttpURLConnection c = null;
        try {
            JSONArray arr = new JSONArray();
            for (JSONObject o : contacts) arr.put(new JSONObject().put("name", o.optString("name")).put("phone", o.optString("phone")));
            JSONObject body = new JSONObject()
                .put("callerName", name)
                .put("callerNumber", profilePhone(ctx))
                .put("description", "Panic button pressed")
                .put("emergencyContacts", arr);
            c = (HttpURLConnection) new URL(API).openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(4000);
            c.setReadTimeout(6000);
            c.setRequestProperty("Content-Type", "application/json");
            c.setDoOutput(true);
            try (OutputStream os = c.getOutputStream()) { os.write(body.toString().getBytes("UTF-8")); }
            return c.getResponseCode() == 200;
        } catch (Exception e) {
            Log.w(TAG, "server step failed: " + e.getMessage());
            return false;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private static boolean hasData(Context ctx) {
        try {
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
            android.net.Network n = cm.getActiveNetwork();
            if (n == null) return false;
            android.net.NetworkCapabilities caps = cm.getNetworkCapabilities(n);
            return caps != null && caps.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } catch (Exception e) {
            return false;
        }
    }

    private static SharedPreferences profile(Context ctx) { return ctx.getSharedPreferences("safetylink_prefs", Context.MODE_PRIVATE); }
    private static String nameFor(Context ctx) { return profile(ctx).getString("sl_name", "A SafetyLink user"); }
    private static String profilePhone(Context ctx) { return profile(ctx).getString("sl_phone", ""); }
    private static String noteFor(Context ctx) { return profile(ctx).getString("sl_alert_note", ""); }

    private static String locationText(Context ctx) {
        SharedPreferences sp = profile(ctx);
        if (!sp.contains("sl_lat")) return "not available yet";
        double lat = Double.longBitsToDouble(sp.getLong("sl_lat", 0L));
        double lng = Double.longBitsToDouble(sp.getLong("sl_lng", 0L));
        return "https://maps.google.com/?q=" + lat + "," + lng;
    }
}
