package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Fetches this device's live FCM registration token and registers it with SafetyLink servers
 * keyed by the user's/contact's phone number so incoming emergency alerts can ring the phone
 * in any state (locked, background, Doze, or killed).
 */
public final class PushRegistrar {
    private static final String TAG = "PushRegistrar";
    private static final String PREFS = "safetylink_prefs";
    public static final String BACKEND = "https://api.safetylink.online";
    private static final String BACKEND_FALLBACK = "https://safetylink-api.tshilidzi-mukwevho54.workers.dev";

    /** Call on app launch so fcm_token is ALWAYS populated even if onNewToken fired before sign-in. */
    public static void fetchAndRegister(Context ctx) {
        if (ctx == null) return;
        final Context appCtx = ctx.getApplicationContext();
        try {
            FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "FirebaseMessaging.getToken() failed", task.getException());
                    return;
                }
                String token = task.getResult();
                if (token != null && !token.trim().isEmpty()) {
                    appCtx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                        .edit()
                        .putString("fcm_token", token.trim())
                        .apply();
                    Log.i(TAG, "Fetched active FCM token (prefix=" + token.substring(0, Math.min(10, token.length())) + ")");
                    register(appCtx);
                }
            });
        } catch (Exception e) {
            Log.w(TAG, "FCM getToken error: " + e.getMessage());
        }
    }

    public static void saveIdentity(Context ctx, String phone, String profileToken) {
        if (ctx == null || phone == null || phone.trim().isEmpty()) return;
        SharedPreferences.Editor ed = ctx.getApplicationContext()
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("sl_phone", phone.trim());
        if (profileToken != null && !profileToken.trim().isEmpty()) {
            ed.putString("sl_profile_token", profileToken.trim());
        }
        ed.apply();
        register(ctx.getApplicationContext());
    }

    public static void register(Context ctx) {
        if (ctx == null) return;
        final Context appCtx = ctx.getApplicationContext();
        final SharedPreferences p = appCtx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        final String phone = p.getString("sl_phone", null);
        final String profileToken = p.getString("sl_profile_token", "");
        final String fcm = p.getString("fcm_token", null);

        if (phone == null || phone.trim().isEmpty()) return;

        // If fcm_token is missing locally, fetch it live from FirebaseMessaging and retry registration
        if (fcm == null || fcm.trim().isEmpty()) {
            fetchAndRegister(appCtx);
            return;
        }

        new Thread(() -> {
            for (String base : new String[] { BACKEND, BACKEND_FALLBACK }) {
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(base + "/api/device/token").openConnection();
                    c.setRequestMethod("POST");
                    c.setConnectTimeout(5000);
                    c.setReadTimeout(5000);
                    c.setRequestProperty("Content-Type", "application/json");
                    if (profileToken != null && !profileToken.trim().isEmpty()) {
                        c.setRequestProperty("X-Profile-Token", profileToken.trim());
                    }
                    c.setDoOutput(true);
                    JSONObject body = new JSONObject()
                        .put("phone", phone.trim())
                        .put("token", fcm.trim());
                    try (OutputStream os = c.getOutputStream()) {
                        os.write(body.toString().getBytes("UTF-8"));
                    }
                    int code = c.getResponseCode();
                    Log.i(TAG, "device token registration HTTP " + code + " via " + base);
                    p.edit().putInt("fcm_last_http", code).apply();
                    if (code >= 200 && code < 300) {
                        p.edit()
                            .putLong("fcm_registered_at", System.currentTimeMillis())
                            .putString("fcm_registered_phone", phone.trim())
                            .apply();
                        return;
                    }
                } catch (Exception e) {
                    Log.w(TAG, "device token registration failed via " + base + ": " + e.getMessage());
                } finally {
                    if (c != null) c.disconnect();
                }
            }
        }).start();
    }
}
