package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import com.getcapacitor.JSObject;

/**
 * Flexible hardware press aggregator and multi-action executor for BLE / iTAG buttons.
 *
 * Configurable via Settings (SharedPreferences "sl_button_map"):
 * - 1x, 2x, 3x, 4x presses and Long Hold can each map to any supported action:
 *   PANIC, INSTANT_PANIC, SILENT_PANIC, CHECK_IN_SAFE, SHARE_GPS_PING,
 *   SAFETY_TIMEOUT, FIND_PHONE, VOICE_LIZZY, SIREN_ONLY, CANCEL, DISABLED, NONE
 * - Configurable multi-tap detection window (350ms - 900ms, default 550ms)
 * - Configurable SOS countdown duration override (0s - 15s, default 10s)
 */
public final class ButtonPatternDetector {
    private static final String TAG = "ButtonPattern";
    public static final String PREFS = "sl_button_map";
    private static final int DEFAULT_MULTI_PRESS_WINDOW_MS = 550;

    public static final String ACTION_NONE = "NONE";
    public static final String ACTION_DISABLED = "DISABLED";
    public static final String ACTION_PANIC = "PANIC";
    public static final String ACTION_INSTANT_PANIC = "INSTANT_PANIC";
    public static final String ACTION_SILENT_PANIC = "SILENT_PANIC";
    public static final String ACTION_CHECK_IN_SAFE = "CHECK_IN_SAFE";
    public static final String ACTION_SHARE_GPS_PING = "SHARE_GPS_PING";
    public static final String ACTION_VOICE_LIZZY = "VOICE_LIZZY";
    public static final String ACTION_SIREN_ONLY = "SIREN_ONLY";
    public static final String ACTION_CANCEL = "CANCEL";
    public static final String ACTION_FIND_PHONE = "FIND_PHONE";
    public static final String ACTION_SAFETY_TIMEOUT = "SAFETY_TIMEOUT";

    public static final String KEY_PRESS_1 = "press_1";
    public static final String KEY_CANCEL_DURING_COUNTDOWN = "cancel_during_countdown";
    public static final String KEY_PRESS_2 = "press_2";
    public static final String KEY_PRESS_3 = "press_3";
    public static final String KEY_PRESS_4 = "press_4";
    public static final String KEY_LONG_PRESS = "long_press";
    public static final String KEY_MULTI_PRESS_WINDOW_MS = "multi_press_window_ms";
    public static final String KEY_COUNTDOWN_OVERRIDE_SEC = "countdown_override_sec";
    public static final String KEY_TIMEOUT_MINUTES = "safety_timeout_minutes";
    public static final String KEY_HAPTIC_FEEDBACK = "haptic_feedback";

    private static int count = 0;
    private static final Handler handler = new Handler(Looper.getMainLooper());
    private static final Runnable fireRunnable = ButtonPatternDetector::fireNow;
    private static Context appContext;
    private static ToneGenerator activeToneGenerator = null;

    public static void onPress(Context ctx, String deviceAddress) {
        if (ctx == null) return;
        appContext = ctx.getApplicationContext();

        SharedPreferences p = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean cancelDuringCountdown = p.getBoolean(KEY_CANCEL_DURING_COUNTDOWN, true);
        boolean hapticEnabled = p.getBoolean(KEY_HAPTIC_FEEDBACK, true);

        // Support direct long-press signaling if caller prefixes LONG_PRESS:
        if (deviceAddress != null && deviceAddress.startsWith("LONG_PRESS")) {
            String longAction = p.getString(KEY_LONG_PRESS, ACTION_SILENT_PANIC);
            executeAction(appContext, longAction, 0, hapticEnabled, p);
            return;
        }

        // 1. Critical Fail-Safe: If SOS countdown is already active, cancel immediately when enabled
        if (PanicService.isCountdownActiveState()) {
            if (cancelDuringCountdown) {
                Log.i(TAG, "Hardware press received during active countdown -> Instant Cancel & Disarm");
                handler.removeCallbacks(fireRunnable);
                count = 0;

                Intent cancelIntent = new Intent(appContext, PanicService.class);
                cancelIntent.setAction(PanicService.ACTION_CANCEL_PANIC);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    appContext.startForegroundService(cancelIntent);
                } else {
                    appContext.startService(cancelIntent);
                }

                if (hapticEnabled) {
                    vibrate(appContext, new long[]{0, 700});
                }
                return;
            }
        }

        // 2. Aggregate clicks in the user's configured multi-tap window
        int windowMs = Math.max(250, Math.min(1500, p.getInt(KEY_MULTI_PRESS_WINDOW_MS, DEFAULT_MULTI_PRESS_WINDOW_MS)));
        count++;
        Log.d(TAG, "Hardware click registered from " + deviceAddress + ", count=" + count + " (window=" + windowMs + "ms)");
        handler.removeCallbacks(fireRunnable);
        handler.postDelayed(fireRunnable, windowMs);
    }

    public static void onPress(Context ctx) {
        onPress(ctx, "UNKNOWN_MAC");
    }

    public static String getActionForPressCount(Context ctx, int presses) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (presses == 1) {
            return p.getString(KEY_PRESS_1, ACTION_PANIC);
        } else if (presses == 2) {
            return p.getString(KEY_PRESS_2, ACTION_FIND_PHONE);
        } else if (presses == 3) {
            return p.getString(KEY_PRESS_3, ACTION_SAFETY_TIMEOUT);
        } else {
            return p.getString(KEY_PRESS_4, ACTION_VOICE_LIZZY);
        }
    }

    public static void saveConfig(
            Context ctx,
            String press1,
            boolean cancelDuringCountdown,
            String press2,
            String press3,
            int timeoutMinutes,
            boolean hapticFeedback
    ) {
        saveConfig(ctx, press1, cancelDuringCountdown, press2, press3, ACTION_VOICE_LIZZY, ACTION_SILENT_PANIC, DEFAULT_MULTI_PRESS_WINDOW_MS, 10, timeoutMinutes, hapticFeedback);
    }

    public static void saveConfig(
            Context ctx,
            String press1,
            boolean cancelDuringCountdown,
            String press2,
            String press3,
            String press4,
            String longPress,
            int multiPressWindowMs,
            int countdownOverrideSec,
            int timeoutMinutes,
            boolean hapticFeedback
    ) {
        if (ctx == null) return;
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit()
                .putString(KEY_PRESS_1, press1 != null ? press1 : ACTION_PANIC)
                .putBoolean(KEY_CANCEL_DURING_COUNTDOWN, cancelDuringCountdown)
                .putString(KEY_PRESS_2, press2 != null ? press2 : ACTION_FIND_PHONE)
                .putString(KEY_PRESS_3, press3 != null ? press3 : ACTION_SAFETY_TIMEOUT)
                .putString(KEY_PRESS_4, press4 != null ? press4 : ACTION_VOICE_LIZZY)
                .putString(KEY_LONG_PRESS, longPress != null ? longPress : ACTION_SILENT_PANIC)
                .putInt(KEY_MULTI_PRESS_WINDOW_MS, Math.max(250, Math.min(1500, multiPressWindowMs)))
                .putInt(KEY_COUNTDOWN_OVERRIDE_SEC, Math.max(0, Math.min(30, countdownOverrideSec)))
                .putInt(KEY_TIMEOUT_MINUTES, Math.max(1, timeoutMinutes))
                .putBoolean(KEY_HAPTIC_FEEDBACK, hapticFeedback)
                .apply();
        Log.i(TAG, "Saved flexible BLE button config: 1=" + press1 + ", 2=" + press2 + ", 3=" + press3 + ", 4=" + press4 + ", hold=" + longPress + ", window=" + multiPressWindowMs + "ms");
    }

    public static JSObject getConfigAsJson(Context ctx) {
        JSObject ret = new JSObject();
        if (ctx == null) return ret;
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        ret.put("singlePressAction", p.getString(KEY_PRESS_1, ACTION_PANIC));
        ret.put("cancelDuringCountdown", p.getBoolean(KEY_CANCEL_DURING_COUNTDOWN, true));
        ret.put("doublePressAction", p.getString(KEY_PRESS_2, ACTION_FIND_PHONE));
        ret.put("triplePressAction", p.getString(KEY_PRESS_3, ACTION_SAFETY_TIMEOUT));
        ret.put("quadPressAction", p.getString(KEY_PRESS_4, ACTION_VOICE_LIZZY));
        ret.put("longPressAction", p.getString(KEY_LONG_PRESS, ACTION_SILENT_PANIC));
        ret.put("multiPressWindowMs", p.getInt(KEY_MULTI_PRESS_WINDOW_MS, DEFAULT_MULTI_PRESS_WINDOW_MS));
        ret.put("countdownOverrideSec", p.getInt(KEY_COUNTDOWN_OVERRIDE_SEC, 10));
        ret.put("safetyTimeoutMinutes", p.getInt(KEY_TIMEOUT_MINUTES, 15));
        ret.put("hapticFeedback", p.getBoolean(KEY_HAPTIC_FEEDBACK, true));
        return ret;
    }

    private static void fireNow() {
        int presses = count;
        count = 0;
        if (appContext == null || presses == 0) return;

        SharedPreferences p = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean hapticEnabled = p.getBoolean(KEY_HAPTIC_FEEDBACK, true);
        String action = getActionForPressCount(appContext, presses);
        executeAction(appContext, action, presses, hapticEnabled, p);
    }

    private static void executeAction(Context ctx, String action, int presses, boolean hapticEnabled, SharedPreferences p) {
        int timeoutMinutes = p.getInt(KEY_TIMEOUT_MINUTES, 15);
        int countdownOverride = p.getInt(KEY_COUNTDOWN_OVERRIDE_SEC, 10);
        Log.i(TAG, "Executing Action (" + (presses == 0 ? "LONG_PRESS" : presses + "x") + "): " + action);

        switch (action) {
            case ACTION_PANIC:
            case ACTION_INSTANT_PANIC: {
                boolean immediate = ACTION_INSTANT_PANIC.equals(action) || countdownOverride == 0;
                if (hapticEnabled) {
                    vibrate(ctx, new long[]{0, 350, 150, 350});
                }
                Intent intent = new Intent(ctx, PanicService.class);
                intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
                intent.putExtra("description", "iTAG Hardware Button Trigger (" + (presses == 0 ? "Long Hold" : presses + " press") + ")");
                intent.putExtra("triggeredBy", "ITAG_PHYSICAL_HARDWARE");
                if (immediate) intent.putExtra("directDispatch", true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ctx.startForegroundService(intent);
                } else {
                    ctx.startService(intent);
                }
                break;
            }

            case ACTION_SILENT_PANIC: {
                if (hapticEnabled) {
                    vibrate(ctx, new long[]{0, 200});
                }
                Intent intent = new Intent(ctx, PanicService.class);
                intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
                intent.putExtra("description", "iTAG Silent Hardware Panic");
                intent.putExtra("triggeredBy", "ITAG_SILENT_TRIGGER");
                intent.putExtra("directDispatch", true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ctx.startForegroundService(intent);
                } else {
                    ctx.startService(intent);
                }
                break;
            }

            case ACTION_CANCEL: {
                if (hapticEnabled) {
                    vibrate(ctx, new long[]{0, 700});
                }
                Intent intent = new Intent(ctx, PanicService.class);
                intent.setAction(PanicService.ACTION_CANCEL_PANIC);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ctx.startForegroundService(intent);
                } else {
                    ctx.startService(intent);
                }
                break;
            }

            case ACTION_SAFETY_TIMEOUT: {
                if (hapticEnabled) {
                    vibrate(ctx, new long[]{0, 100, 100, 100, 100, 100});
                }
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitSafetyTimeoutEvent(timeoutMinutes);
                }
                break;
            }

            case ACTION_FIND_PHONE:
            case ACTION_SIREN_ONLY: {
                if (hapticEnabled) {
                    vibrate(ctx, new long[]{0, 200, 100, 200, 100, 500});
                }
                ringFindPhoneAlarm(ctx);
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitFindPhoneEvent();
                }
                break;
            }

            case ACTION_CHECK_IN_SAFE:
            case ACTION_SHARE_GPS_PING:
            case ACTION_VOICE_LIZZY: {
                if (hapticEnabled) {
                    vibrate(ctx, new long[]{0, 140, 80, 140});
                }
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitCustomButtonAction(action);
                }
                break;
            }

            case ACTION_DISABLED:
            case ACTION_NONE:
            default:
                Log.d(TAG, "Action is NONE or DISABLED, ignoring.");
                break;
        }
    }

    private static void ringFindPhoneAlarm(Context ctx) {
        try {
            if (activeToneGenerator != null) {
                activeToneGenerator.release();
            }
            activeToneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            activeToneGenerator.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 4000);
            handler.postDelayed(() -> {
                try {
                    if (activeToneGenerator != null) {
                        activeToneGenerator.stopTone();
                        activeToneGenerator.release();
                        activeToneGenerator = null;
                    }
                } catch (Exception ignored) {}
            }, 4500);
        } catch (Exception e) {
            Log.e(TAG, "Error ringing find phone tone: " + e.getMessage());
        }
    }

    private static void vibrate(Context ctx, long[] pattern) {
        try {
            Vibrator v = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(pattern, -1));
                } else {
                    v.vibrate(pattern, -1);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Vibrate exception: " + e.getMessage());
        }
    }
}
