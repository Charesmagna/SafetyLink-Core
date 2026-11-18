package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Registers this phone's FCM token with the SafetyLink server, once phone + profile token are known. */
public final class PushRegistrar {
    private static final String TAG = "PushRegistrar";
    private static final String PREFS = "safetylink_prefs";
    public static final String BACKEND = "https://api.safetylink.online";
    private static final String BACKEND_FALLBACK = "https://safetylink-api.tshilidzi-mukwevho54.workers.dev";

    public static void saveIdentity(Context ctx, String phone, String profileToken) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("sl_phone", phone).putString("sl_profile_token", profileToken).apply();
        register(ctx);
    }

    public static void register(Context ctx) {
        final SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        final String phone = p.getString("sl_phone", null);
        final String profileToken = p.getString("sl_profile_token", null);
        final String fcm = p.getString("fcm_token", null);
        if (phone == null || profileToken == null || fcm == null) return;
        new Thread(() -> {
            for (String base : new String[] { BACKEND, BACKEND_FALLBACK }) {
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(base + "/api/device/token").openConnection();
                    c.setRequestMethod("POST");
                    c.setConnectTimeout(4500);
                    c.setReadTimeout(4500);
                    c.setRequestProperty("Content-Type", "application/json");
                    c.setRequestProperty("X-Profile-Token", profileToken);
                    c.setDoOutput(true);
                    JSONObject body = new JSONObject().put("phone", phone).put("token", fcm);
                    try (OutputStream os = c.getOutputStream()) { os.write(body.toString().getBytes("UTF-8")); }
                    int code = c.getResponseCode();
                    Log.i(TAG, "device token registration HTTP " + code + " via " + base);
                    if (code >= 200 && code < 300) return;
                } catch (Exception e) {
                    Log.w(TAG, "device token registration failed via " + base + ": " + e.getMessage());
                } finally {
                    if (c != null) c.disconnect();
                }
            }
        }).start();
    }
}
