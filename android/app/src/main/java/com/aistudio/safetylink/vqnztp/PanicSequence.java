package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

/**
 * Single entry point for every panic press (iTAG, volume keys, widget, screen button).
 *
 *  - Presses closer than 200 ms apart are one press (debounce).
 *  - One press starts the countdown (user setting, 0 to 30 s). Nothing is sent during it.
 *  - A press after the double-press window, while counting down, cancels it.
 *  - A quick second press (inside the double-press window) runs the user's double-press action.
 *  - Five presses inside 3 seconds dispatch immediately, overriding everything.
 *  - When the countdown reaches zero, DispatchRunner sends the steps in order.
 */
public final class PanicSequence {
    private static final String TAG = "PanicSequence";
    private static final long DEBOUNCE_MS = 200L;
    private static final long FIVE_WINDOW_MS = 3000L;

    public enum State { IDLE, COUNTDOWN, DISPATCHING }

    private static final Handler main = new Handler(Looper.getMainLooper());
    private static State state = State.IDLE;
    private static long lastPressMs = 0L;
    private static long firstPressInBurstMs = 0L;
    private static int burstCount = 0;
    private static int secondsLeft = 0;
    private static Context appCtx;

    private static final Runnable tick = new Runnable() {
        @Override public void run() {
            if (state != State.COUNTDOWN) return;
            secondsLeft--;
            if (secondsLeft <= 0) {
                beginDispatch();
            } else {
                main.postDelayed(this, 1000L);
            }
        }
    };

    private PanicSequence() {}

    public static synchronized State state() { return state; }

    /** Call on every press from any source. */
    public static synchronized void onPress(Context ctx, String source) {
        appCtx = ctx.getApplicationContext();
        long now = System.currentTimeMillis();

        // Debounce: presses within 200 ms are one press
        if (now - lastPressMs < DEBOUNCE_MS) return;
        lastPressMs = now;

        // Five-press burst: dispatch immediately, whatever the state
        if (burstCount == 0 || now - firstPressInBurstMs > FIVE_WINDOW_MS) {
            firstPressInBurstMs = now;
            burstCount = 0;
        }
        burstCount++;
        if (burstCount >= 5) {
            Log.i(TAG, "Five presses from " + source + ": immediate dispatch");
            burstCount = 0;
            cancelCountdownTimer();
            beginDispatch();
            return;
        }

        if (state == State.DISPATCHING) {
            Log.i(TAG, "Press ignored: dispatch already running");
            return;
        }

        // A quick second press inside the double-press window: run the double-press action
        if (state == State.COUNTDOWN && now - firstPressInBurstMs <= PanicSettings.doublePressWindowMs(appCtx)) {
            Log.i(TAG, "Double press: running configured action");
            cancelCountdownTimer();
            state = State.IDLE;
            runDoublePressAction();
            return;
        }

        if (state == State.COUNTDOWN) {
            Log.i(TAG, "Press during countdown: cancelled");
            cancelCountdownTimer();
            state = State.IDLE;
            return;
        }

        // First press while idle: start the countdown
        int seconds = PanicSettings.countdownSeconds(appCtx);
        if (seconds <= 0) {
            beginDispatch();
            return;
        }
        state = State.COUNTDOWN;
        secondsLeft = seconds;
        Log.i(TAG, "Countdown started: " + seconds + " s");
        main.postDelayed(tick, 1000L);
    }

    /** Called when the user confirms they are safe with the PIN. Resets everything. */
    public static synchronized boolean releaseWithPin(Context ctx, String pin) {
        if (!PinManager.verify(ctx, pin)) return false;
        cancelCountdownTimer();
        state = State.IDLE;
        burstCount = 0;
        return true;
    }

    private static void cancelCountdownTimer() {
        main.removeCallbacks(tick);
    }

    private static void beginDispatch() {
        cancelCountdownTimer();
        state = State.DISPATCHING;
        final Context ctx = appCtx;
        new Thread(() -> {
            try {
                DispatchRunner.run(ctx);
            } finally {
                synchronized (PanicSequence.class) {
                    state = State.IDLE;
                }
            }
        }, "panic-dispatch").start();
    }

    private static void runDoublePressAction() {
        String action = PanicSettings.doublePressAction(appCtx);
        if (PanicSettings.ACTION_RING_PHONE.equals(action)) {
            try {
                android.media.Ringtone r = android.media.RingtoneManager.getRingtone(appCtx,
                    android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM));
                if (r != null) r.play();
            } catch (Exception e) { Log.w(TAG, "ring failed: " + e.getMessage()); }
        } else if (PanicSettings.ACTION_SAFETY_TIMER.equals(action)) {
            long ms = PanicSettings.safetyTimerMinutes(appCtx) * 60_000L;
            main.postDelayed(() -> beginDispatch(), ms);
            Log.i(TAG, "Safety timer set for " + (ms / 60000) + " min; dispatch if not cancelled");
        }
    }
}
