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
 * Intelligent hardware press aggregator and multi-action executor for BLE / iTAG buttons.
 *
 * Configurable via Settings (SharedPreferences "sl_button_map"):
 * - 1 press: PANIC (starts 10s countdown), SILENT_PANIC, or DISABLED
 * - Press during 10s countdown: INSTANT CANCEL / DISARM (enabled by default)
 * - 2 presses: FIND_PHONE (rings alarm tone), CANCEL, SAFETY_TIMEOUT, or NONE
 * - 3 presses: SAFETY_TIMEOUT (starts walk-alone safety timer), FIND_PHONE, PANIC, or DISABLED
 * - Safety Timeout Duration: Configurable in minutes (default: 15)
 * - Haptic Feedback: Distinct pocket vibrations for disarm, timeout armed, and SOS
 */
public final class ButtonPatternDetector {
    private static final String TAG = "ButtonPattern";
    public static final String PREFS = "sl_button_map";
    private static final long MULTI_PRESS_WINDOW_MS = 480;

    public static final String ACTION_NONE = "NONE";
    public static final String ACTION_PANIC = "PANIC";
    public static final String ACTION_SILENT_PANIC = "SILENT_PANIC";
    public static final String ACTION_CANCEL = "CANCEL";
    public static final String ACTION_FIND_PHONE = "FIND_PHONE";
    public static final String ACTION_SAFETY_TIMEOUT = "SAFETY_TIMEOUT";

    public static final String KEY_PRESS_1 = "press_1";
    public static final String KEY_CANCEL_DURING_COUNTDOWN = "cancel_during_countdown";
    public static final String KEY_PRESS_2 = "press_2";
    public static final String KEY_PRESS_3 = "press_3";
    public static final String KEY_TIMEOUT_MINUTES = "safety_timeout_minutes";
    public static final String KEY_HAPTIC_FEEDBACK = "haptic_feedback";

    private static int count = 0;
    private static final Handler handler = new Handler(Looper.getMainLooper());
    private static final Runnable fireRunnable = ButtonPatternDetector::fireNow;
    private static Context appContext;
    private static ToneGenerator activeToneGenerator = null;

    /**
     * Called whenever a physical hardware press arrives from GATT notification.
     */
    public static void onPress(Context ctx, String deviceAddress) {
        if (ctx == null) return;
        appContext = ctx.getApplicationContext();

        SharedPreferences p = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean cancelDuringCountdown = p.getBoolean(KEY_CANCEL_DURING_COUNTDOWN, true);
        boolean hapticEnabled = p.getBoolean(KEY_HAPTIC_FEEDBACK, true);

        // 1. Critical Fail-Safe: If 10s SOS countdown is already active, this press cancels it immediately!
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
                    // One long steady vibration = Disarmed
                    vibrate(appContext, new long[]{0, 700});
                }
                return;
            }
        }

        // 2. Otherwise, aggregate clicks in the short multi-tap window (480ms)
        count++;
        Log.d(TAG, "Hardware click registered from " + deviceAddress + ", count=" + count);
        handler.removeCallbacks(fireRunnable);
        handler.postDelayed(fireRunnable, MULTI_PRESS_WINDOW_MS);
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
        } else {
            return p.getString(KEY_PRESS_3, ACTION_SAFETY_TIMEOUT);
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
        if (ctx == null) return;
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit()
                .putString(KEY_PRESS_1, press1 != null ? press1 : ACTION_PANIC)
                .putBoolean(KEY_CANCEL_DURING_COUNTDOWN, cancelDuringCountdown)
                .putString(KEY_PRESS_2, press2 != null ? press2 : ACTION_FIND_PHONE)
                .putString(KEY_PRESS_3, press3 != null ? press3 : ACTION_SAFETY_TIMEOUT)
                .putInt(KEY_TIMEOUT_MINUTES, Math.max(1, timeoutMinutes))
                .putBoolean(KEY_HAPTIC_FEEDBACK, hapticFeedback)
                .apply();
        Log.i(TAG, "Saved BLE button config: 1=" + press1 + ", cancelOnCountdown=" + cancelDuringCountdown +
                ", 2=" + press2 + ", 3=" + press3 + ", timeout=" + timeoutMinutes + "m, haptic=" + hapticFeedback);
    }

    public static JSObject getConfigAsJson(Context ctx) {
        JSObject ret = new JSObject();
        if (ctx == null) return ret;
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        ret.put("singlePressAction", p.getString(KEY_PRESS_1, ACTION_PANIC));
        ret.put("cancelDuringCountdown", p.getBoolean(KEY_CANCEL_DURING_COUNTDOWN, true));
        ret.put("doublePressAction", p.getString(KEY_PRESS_2, ACTION_FIND_PHONE));
        ret.put("triplePressAction", p.getString(KEY_PRESS_3, ACTION_SAFETY_TIMEOUT));
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
        int timeoutMinutes = p.getInt(KEY_TIMEOUT_MINUTES, 15);

        String action = getActionForPressCount(appContext, presses);
        Log.i(TAG, "Executing Action for " + presses + " press(es): " + action);

        switch (action) {
            case ACTION_PANIC: {
                if (hapticEnabled) {
                    vibrate(appContext, new long[]{0, 350, 150, 350});
                }
                Intent intent = new Intent(appContext, PanicService.class);
                intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
                intent.putExtra("description", "iTAG Hardware Button Trigger (" + presses + " press)");
                intent.putExtra("triggeredBy", "ITAG_PHYSICAL_HARDWARE");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    appContext.startForegroundService(intent);
                } else {
                    appContext.startService(intent);
                }
                break;
            }

            case ACTION_SILENT_PANIC: {
                if (hapticEnabled) {
                    vibrate(appContext, new long[]{0, 200});
                }
                Intent intent = new Intent(appContext, PanicService.class);
                intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
                intent.putExtra("description", "iTAG Silent Hardware Panic");
                intent.putExtra("triggeredBy", "ITAG_SILENT_TRIGGER");
                intent.putExtra("directDispatch", true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    appContext.startForegroundService(intent);
                } else {
                    appContext.startService(intent);
                }
                break;
            }

            case ACTION_CANCEL: {
                if (hapticEnabled) {
                    vibrate(appContext, new long[]{0, 700});
                }
                Intent intent = new Intent(appContext, PanicService.class);
                intent.setAction(PanicService.ACTION_CANCEL_PANIC);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    appContext.startForegroundService(intent);
                } else {
                    appContext.startService(intent);
                }
                break;
            }

            case ACTION_SAFETY_TIMEOUT: {
                Log.i(TAG, "Starting Safety Walk Timeout (" + timeoutMinutes + " minutes)");
                if (hapticEnabled) {
                    // Three quick distinct pulses: tap-tap-tap
                    vibrate(appContext, new long[]{0, 100, 100, 100, 100, 100});
                }
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitSafetyTimeoutEvent(timeoutMinutes);
                }
                break;
            }

            case ACTION_FIND_PHONE: {
                Log.i(TAG, "Executing Find My Phone alarm alert");
                if (hapticEnabled) {
                    vibrate(appContext, new long[]{0, 200, 100, 200, 100, 500});
                }
                ringFindPhoneAlarm(appContext);
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitFindPhoneEvent();
                }
                break;
            }

            case ACTION_NONE:
            default:
                Log.d(TAG, "Action is NONE or disabled, ignoring.");
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
