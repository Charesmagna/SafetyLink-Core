package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

/**
 * Counts iTAG presses in a short window and runs the action the user chose for that count.
 * Default: 1 press = PANIC (starts countdown), 2 presses = CANCEL, 3 presses = FIND_PHONE.
 * Users change these in Settings (stored in SharedPreferences "sl_button_map").
 */
public final class ButtonPatternDetector {
    private static final String TAG = "ButtonPattern";
    public static final String PREFS = "sl_button_map";
    private static final long WINDOW_MS = 800;   // presses this close together belong to one pattern

    public static final String ACTION_NONE = "NONE";
    public static final String ACTION_PANIC = "PANIC";
    public static final String ACTION_CANCEL = "CANCEL";
    public static final String ACTION_FIND_PHONE = "FIND_PHONE";

    private static int count = 0;
    private static final Handler handler = new Handler(Looper.getMainLooper());
    private static final Runnable fire = ButtonPatternDetector::fireNow;
    private static Context appContext;

    public static void onPress(Context ctx) {
        appContext = ctx.getApplicationContext();
        count++;
        handler.removeCallbacks(fire);
        handler.postDelayed(fire, WINDOW_MS);
    }

    /** Action for a given press count (1, 2, 3...). Counts above 3 use the "3" action. */
    public static String actionFor(Context ctx, int presses) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int key = Math.min(Math.max(presses, 1), 3);
        String def = key == 1 ? ACTION_PANIC : key == 2 ? ACTION_CANCEL : ACTION_FIND_PHONE;
        return p.getString("press_" + key, def);
    }

    public static void setActionFor(Context ctx, int presses, String action) {
        int key = Math.min(Math.max(presses, 1), 3);
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("press_" + key, action).apply();
    }

    private static void fireNow() {
        int presses = count;
        count = 0;
        if (appContext == null || presses == 0) return;
        String action = actionFor(appContext, presses);
        Log.i(TAG, presses + " press(es) -> " + action);
        switch (action) {
            case ACTION_PANIC: {
                Intent i = new Intent(appContext, PanicService.class);
                i.setAction(PanicService.ACTION_TRIGGER_PANIC);
                i.putExtra("triggeredBy", "ITAG_BUTTON");
                appContext.startForegroundService(i);
                break;
            }
            case ACTION_CANCEL: {
                Intent i = new Intent(appContext, PanicService.class);
                i.setAction(PanicService.ACTION_CANCEL_PANIC);
                appContext.startForegroundService(i);
                break;
            }
            case ACTION_FIND_PHONE:
                Log.i(TAG, "FIND_PHONE not wired in the Java build yet");
                break;
            default:
                break;
        }
    }
}
