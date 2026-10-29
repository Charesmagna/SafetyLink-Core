package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.SharedPreferences;

/** User-configurable panic behaviour, stored on the phone. Defaults match the agreed plan. */
public final class PanicSettings {
    private static final String PREFS = "sl_panic_settings";

    public static final String ACTION_SAFETY_TIMER = "SAFETY_TIMER";
    public static final String ACTION_RING_PHONE = "RING_PHONE";
    public static final String ACTION_PANIC = "PANIC";
    public static final String ACTION_NONE = "NONE";

    private static SharedPreferences p(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    /** Countdown length after the first press, 0 to 30 seconds. 0 means fire straight away. */
    public static int countdownSeconds(Context c) { return clamp(p(c).getInt("countdown_s", 5), 0, 30); }
    public static void setCountdownSeconds(Context c, int s) { p(c).edit().putInt("countdown_s", clamp(s, 0, 30)).apply(); }

    /** Window in which a second press counts as a double press, in milliseconds (default 1500). */
    public static long doublePressWindowMs(Context c) { return clamp(p(c).getInt("double_window_ms", 1500), 500, 3000); }
    public static void setDoublePressWindowMs(Context c, int ms) { p(c).edit().putInt("double_window_ms", clamp(ms, 500, 3000)).apply(); }

    /** What a double press does: SAFETY_TIMER (5 minute check-in), RING_PHONE or NONE. */
    public static String doublePressAction(Context c) { return p(c).getString("double_action", ACTION_SAFETY_TIMER); }
    public static void setDoublePressAction(Context c, String a) { p(c).edit().putString("double_action", a).apply(); }

    /** Safety timer length in minutes (default 5). */
    public static int safetyTimerMinutes(Context c) { return clamp(p(c).getInt("timer_min", 5), 1, 120); }
    public static void setSafetyTimerMinutes(Context c, int m) { p(c).edit().putInt("timer_min", clamp(m, 1, 120)).apply(); }

    /** Whether the screen is forced on during a dispatch. */
    public static boolean keepScreenOn(Context c) { return p(c).getBoolean("keep_screen_on", true); }
    public static void setKeepScreenOn(Context c, boolean v) { p(c).edit().putBoolean("keep_screen_on", v).apply(); }

    /** Whether the phone makes a sound during a dispatch. */
    public static boolean soundOn(Context c) { return p(c).getBoolean("sound_on", true); }
    public static void setSoundOn(Context c, boolean v) { p(c).edit().putBoolean("sound_on", v).apply(); }

    /** The Rain SIM number that receives the Please Call Me, digits only, e.g. 0816738186. */
    public static String rainGateway(Context c) { return p(c).getString("rain_gateway", "0816738186"); }
    public static void setRainGateway(Context c, String n) { p(c).edit().putString("rain_gateway", n).apply(); }

    private static int clamp(int v, int lo, int hi) { return Math.max(lo, Math.min(hi, v)); }
}
