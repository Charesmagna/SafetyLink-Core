package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;

/**
 * PanicService
 *
 * A robust headless foreground emergency service that manages SOS countdown,
 * wake-lock preservation, and dispatches native emergency alerts independently
 * of the WebView lifecycle.
 */
public class PanicService extends Service {
    private static final String TAG = "PanicService";
    public static final String ACTION_TRIGGER_PANIC = "com.aistudio.safetylink.ACTION_TRIGGER_PANIC";
    public static final String ACTION_CANCEL_PANIC = "com.aistudio.safetylink.ACTION_CANCEL_PANIC";
    private static final String CHANNEL_ID = "safetylink_emergency_channel";
    private static final int NOTIFICATION_ID = 9911;

    private static volatile boolean activeCountdown = false;
    private static volatile int currentSeconds = 10;
    private static volatile String lastStatus = "IDLE";

    private WindowManager windowManager;
    private View overlayView;
    private Handler countdownHandler;
    private PowerManager.WakeLock wakeLock;

    private String pendingPhone = "+27816738186";
    private String pendingDescription = "Sequential Emergency SOS Trigger";
    private double pendingLat = 0.0;
    private double pendingLng = 0.0;
    private String pendingOrgId = "SL-ORG-MAIN";
    private String pendingTriggeredBy = "USER";

    public static boolean isCountdownActiveState() {
        return activeCountdown;
    }

    public static int getSecondsRemainingState() {
        return currentSeconds;
    }

    public static String getLastKnownStatus() {
        return lastStatus;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Native PanicService created");
        createNotificationChannel();
        countdownHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification("SafetyLink Core Active", "Autonomous emergency guard armed"));

        if (intent != null) {
            String action = intent.getAction();
            Log.i(TAG, "PanicService received Action: " + action);

            if (ACTION_TRIGGER_PANIC.equals(action)) {
                if (intent.hasExtra("phone")) pendingPhone = intent.getStringExtra("phone");
                if (intent.hasExtra("description")) pendingDescription = intent.getStringExtra("description");
                if (intent.hasExtra("latitude")) pendingLat = intent.getDoubleExtra("latitude", 0.0);
                if (intent.hasExtra("longitude")) pendingLng = intent.getDoubleExtra("longitude", 0.0);
                if (intent.hasExtra("orgId")) pendingOrgId = intent.getStringExtra("orgId");
                if (intent.hasExtra("triggeredBy")) pendingTriggeredBy = intent.getStringExtra("triggeredBy");

                startPanicSequence();
            } else if (ACTION_CANCEL_PANIC.equals(action)) {
                cancelPanicSequence();
            }
        }
        return START_STICKY;
    }

    private void startPanicSequence() {
        if (activeCountdown) {
            Log.w(TAG, "Panic countdown is already active");
            return;
        }

        activeCountdown = true;
        currentSeconds = 10;
        lastStatus = "COUNTDOWN";

        acquireWakeLock();
        notifyBridgeStatus("COUNTDOWN", currentSeconds);
        showOverlayCountdown();

        countdownHandler.removeCallbacks(countdownRunnable);
        countdownHandler.post(countdownRunnable);
    }

    private void cancelPanicSequence() {
        if (!activeCountdown) return;

        activeCountdown = false;
        lastStatus = "CANCELLED";
        countdownHandler.removeCallbacks(countdownRunnable);
        removeOverlay();
        releaseWakeLock();

        notifyBridgeStatus("CANCELLED", 0);
        updateNotification("SafetyLink Secured", "Emergency alert cancelled by user");
        Log.i(TAG, "SOS sequence cleanly disarmed");
        stopSelf();
    }

    private final Runnable countdownRunnable = new Runnable() {
        @Override
        public void run() {
            if (!activeCountdown) return;

            if (currentSeconds > 0) {
                updateOverlayCountdown(currentSeconds);
                notifyBridgeStatus("COUNTDOWN", currentSeconds);
                updateNotification("🚨 SOS ACTIVATING IN " + currentSeconds + "s", "Tap cancel to disarm immediately");
                currentSeconds--;
                countdownHandler.postDelayed(this, 1000);
            } else {
                triggerFinalSOS();
            }
        }
    };

    private void triggerFinalSOS() {
        activeCountdown = false;
        lastStatus = "DISPATCHING";
        removeOverlay();

        notifyBridgeStatus("DISPATCHING", 0);
        updateNotification("🚨 EMERGENCY SOS DISPATCHING", "Sending SMS, calls, and notifying mesh responders...");

        String incidentId = "INC-" + System.currentTimeMillis();

        EmergencyService.getInstance().dispatchEmergency(
                this,
                pendingPhone,
                pendingDescription,
                incidentId,
                pendingLat,
                pendingLng,
                pendingOrgId,
                pendingTriggeredBy,
                new EmergencyService.DispatchCallback() {
                    @Override
                    public void onResult(EmergencyService.DispatchResult result) {
                        lastStatus = result.success ? "DISPATCHED" : "PARTIAL_SUCCESS";
                        notifyBridgeStatus(lastStatus, 0);

                        String title = result.success ? "🚨 SOS DISPATCH CONFIRMED" : "⚠️ SOS PARTIAL DISPATCH";
                        String msg = "SMS: " + result.smsStatus + " | Sync: " + result.backendSyncStatus;
                        updateNotification(title, msg);

                        releaseWakeLock();
                    }
                }
        );
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "SafetyLink::EmergencyWakeLock");
            }
        }
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(30000); // 30 second safety limit
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    private void notifyBridgeStatus(String status, int seconds) {
        if (SafetyLinkBridgePlugin.getInstance() != null) {
            SafetyLinkBridgePlugin.getInstance().emitPanicEvent("NATIVE_PANIC_SERVICE", seconds, status);
        }
    }

    private void showOverlayCountdown() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Log.w(TAG, "No overlay permission; using notification countdown");
            return;
        }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (windowManager == null) return;

        try {
            LinearLayout container = new LinearLayout(this);
            container.setOrientation(LinearLayout.VERTICAL);
            container.setGravity(Gravity.CENTER);
            container.setBackgroundColor(Color.parseColor("#EE020617")); // 93% opaque deep space
            container.setPadding(48, 48, 48, 48);

            TextView warningHeader = new TextView(this);
            warningHeader.setText("🚨 EMERGENCY SOS INITIATED 🚨");
            warningHeader.setTextColor(Color.parseColor("#EF4444"));
            warningHeader.setTextSize(20);
            warningHeader.setGravity(Gravity.CENTER);
            warningHeader.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            container.addView(warningHeader);

            TextView subtitle = new TextView(this);
            subtitle.setText("Emergency distress sequence will broadcast in");
            subtitle.setTextColor(Color.parseColor("#94A3B8"));
            subtitle.setTextSize(14);
            subtitle.setGravity(Gravity.CENTER);
            subtitle.setPadding(0, 8, 0, 24);
            container.addView(subtitle);

            TextView countdownView = new TextView(this);
            countdownView.setId(View.generateViewId());
            countdownView.setTag("countdown_text");
            countdownView.setText("10");
            countdownView.setTextColor(Color.parseColor("#EF4444"));
            countdownView.setTextSize(72);
            countdownView.setGravity(Gravity.CENTER);
            countdownView.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            container.addView(countdownView);

            Button cancelBtn = new Button(this);
            cancelBtn.setText("CANCEL / DISARM");
            cancelBtn.setTextColor(Color.WHITE);
            cancelBtn.setBackgroundColor(Color.parseColor("#1E293B"));
            cancelBtn.setPadding(24, 16, 24, 16);
            cancelBtn.setOnClickListener(v -> cancelPanicSequence());
            container.addView(cancelBtn);

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                            : WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                    PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.CENTER;

            overlayView = container;
            windowManager.addView(overlayView, params);
        } catch (Exception e) {
            Log.e(TAG, "Error showing system overlay countdown", e);
        }
    }

    private void updateOverlayCountdown(int seconds) {
        if (overlayView != null) {
            TextView cd = overlayView.findViewWithTag("countdown_text");
            if (cd != null) {
                cd.setText(String.valueOf(seconds));
            }
        }
    }

    private void removeOverlay() {
        if (windowManager != null && overlayView != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception e) {
                Log.e(TAG, "Error removing overlay", e);
            }
            overlayView = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SafetyLink Emergency Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Critical life safety SOS and disarm notifications");
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String title, String message) {
        Intent cancelIntent = new Intent(this, PanicService.class);
        cancelIntent.setAction(ACTION_CANCEL_PANIC);
        int pFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent cancelPending = PendingIntent.getService(this, 1, cancelIntent, pFlags);

        Intent openAppIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent openPending = openAppIntent != null
                ? PendingIntent.getActivity(this, 0, openAppIntent, pFlags)
                : null;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setOngoing(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        if (openPending != null) {
            builder.setContentIntent(openPending);
        }
        builder.addAction(android.R.drawable.ic_delete, "DISARM SOS", cancelPending);
        return builder.build();
    }

    private void updateNotification(String title, String message) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildNotification(title, message));
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
