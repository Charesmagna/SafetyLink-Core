package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.aistudio.safetylink.vqnztp.data.OfflineSyncWorker;

/**
 * SafelinkForegroundService
 *
 * A START_STICKY foreground service that hosts the SafetyLink Notification Shade
 * Mini-App with live SOS, Watch-Me, BLE status, Offline Sync, Check-In, Sound Location,
 * and AI Lizzy voice launcher.
 */
public class SafelinkForegroundService extends Service {
    private static final String TAG = "SafelinkFgService";

    // Notification channel IDs
    public static final String CHANNEL_ID_ONGOING  = "safetylink_channel";
    public static final String CHANNEL_ID_EMERGENCY = "safetylink_emergency_channel";

    // Action constants for notification mini-app
    public static final String ACTION_MINI_SOS = "com.aistudio.safetylink.ACTION_MINI_SOS";
    public static final String ACTION_MINI_WATCH_ME = "com.aistudio.safetylink.ACTION_MINI_WATCH_ME";
    public static final String ACTION_MINI_SYNC = "com.aistudio.safetylink.ACTION_MINI_SYNC";
    public static final String ACTION_MINI_CHECKIN = "com.aistudio.safetylink.ACTION_MINI_CHECKIN";
    public static final String ACTION_MINI_SOUND_LOC = "com.aistudio.safetylink.ACTION_MINI_SOUND_LOC";
    public static final String ACTION_MINI_LIZZY = "com.aistudio.safetylink.ACTION_MINI_LIZZY";

    // Stable notification IDs
    private static final int NOTIF_ID_ONGOING   = 8801;
    private static final int NOTIF_ID_EMERGENCY = 8802;

    // Wake lock tag
    private static final String WAKE_LOCK_TAG = "SafetyLink::BleWakeLock";

    private PowerManager.WakeLock wakeLock;
    private static String currentBleLabel = "● iTAG ONLINE";

    // -----------------------------------------------------------------------
    // Service lifecycle
    // -----------------------------------------------------------------------
    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Service created");
        createNotificationChannels();
        acquireWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String act = intent.getAction();
            Log.i(TAG, "Mini-app action triggered from notification: " + act);

            switch (act) {
                case ACTION_MINI_SOS:
                    Intent panicIntent = new Intent(this, PanicService.class);
                    panicIntent.setAction(PanicService.ACTION_TRIGGER_PANIC);
                    panicIntent.putExtra("description", "SOS triggered from Notification Shade Mini-App");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(panicIntent);
                    } else {
                        startService(panicIntent);
                    }
                    break;

                case ACTION_MINI_SYNC:
                    try {
                        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(OfflineSyncWorker.class).build();
                        WorkManager.getInstance(this).enqueue(syncRequest);
                        Log.i(TAG, "Enqueued OfflineSyncWorker from notification mini-app");
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to enqueue sync: " + e.getMessage());
                    }
                    break;

                case ACTION_MINI_CHECKIN:
                    Log.i(TAG, "Safe check-in registered via notification mini-app");
                    if (SafetyLinkBridgePlugin.getInstance() != null) {
                        SafetyLinkBridgePlugin.getInstance().emitPanicEvent("NOTIFICATION_CHECKIN", 0, "CHECKED_IN");
                    }
                    break;

                case ACTION_MINI_SOUND_LOC:
                    try {
                        ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
                        toneGen.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 3000);
                        Log.i(TAG, "Sound Location tone started on device");
                    } catch (Exception e) {
                        Log.e(TAG, "Error playing sound location: " + e.getMessage());
                    }
                    break;

                case ACTION_MINI_WATCH_ME:
                    Log.i(TAG, "Watch Me timer action triggered from notification mini-app");
                    if (SafetyLinkBridgePlugin.getInstance() != null) {
                        SafetyLinkBridgePlugin.getInstance().emitPanicEvent("NOTIFICATION_WATCH_ME", 1800, "WATCH_ME_ACTIVE");
                    }
                    break;

                case ACTION_MINI_LIZZY:
                    Intent lizzyIntent = new Intent(this, MainActivity.class);
                    lizzyIntent.putExtra("openLizzy", true);
                    lizzyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    startActivity(lizzyIntent);
                    break;
            }
        }

        startForeground(NOTIF_ID_ONGOING, buildOngoingNotification(
                "🛡️ SafetyLink Sentinel Active",
                "Device Protected • Listening for BLE iTAG • GPS Armed"
        ));
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // App was swiped from Recents – reschedule so we restart after a short delay
        Log.w(TAG, "Task removed – rescheduling service restart");
        Intent restartIntent = new Intent(getApplicationContext(), SafelinkForegroundService.class);
        restartIntent.setPackage(getPackageName());
        PendingIntent restartPending = PendingIntent.getService(
                getApplicationContext(),
                1,
                restartIntent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        android.app.AlarmManager alarmManager =
                (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.set(
                    android.app.AlarmManager.RTC_WAKEUP,
                    System.currentTimeMillis() + 2000,
                    restartPending
            );
        }
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        Log.w(TAG, "Service destroyed – releasing wake lock");
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // not a bound service
    }

    // -----------------------------------------------------------------------
    // Public helpers called by the Capacitor layer / JS bridge
    // -----------------------------------------------------------------------
    /**
     * Update the ongoing notification text – called from LocalNotificationService
     * when BLE / GPS / SOS state changes.
     */
    public static void updateNotification(Context ctx,
                                           boolean isRunning,
                                           String locationStr,
                                           int connectedBleCount,
                                           String sosState) {
        // Touch the wake lock on status changes to keep the CPU awake for the transition
        touchWakeLock(ctx);

        NotificationManager nm =
                (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        String title;
        String body;

        if (!"IDLE".equals(sosState)) {
            title = "🚨 SafetyLink EMERGENCY ACTIVE";
            body  = "Distress signal broadcasting! Location: [" + locationStr + "] · Contact chain alerted.";
        } else if (!isRunning) {
            title = "⚠️ SafetyLink Monitoring Suspended";
            body  = "Panic gestures & background tracking are offline. Tap to reactivate.";
        } else {
            String devicesStr = connectedBleCount > 0
                    ? connectedBleCount + " iTAG paired"
                    : "No iTAG bound";
            title = "🛡️ SafetyLink Active Connection";
            body  = "Device Locked – Listening for panic button • " + devicesStr
                    + " • Location: [" + locationStr + "]";
        }

        Notification notification = buildNotification(ctx, title, body,
                !"IDLE".equals(sosState) ? CHANNEL_ID_EMERGENCY : CHANNEL_ID_ONGOING);
        nm.notify(NOTIF_ID_ONGOING, notification);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // Ongoing / status channel – low importance, no sound
            NotificationChannel ongoing = new NotificationChannel(
                    CHANNEL_ID_ONGOING,
                    "SafetyLink Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            ongoing.setDescription("Persistent status: BLE wearable listening & GPS tracking");
            ongoing.setShowBadge(false);
            nm.createNotificationChannel(ongoing);

            // Emergency channel – high importance, sound
            NotificationChannel emergency = new NotificationChannel(
                    CHANNEL_ID_EMERGENCY,
                    "SafetyLink Emergency Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            emergency.setDescription("Critical panic & distress alerts");
            nm.createNotificationChannel(emergency);
        }
    }

    private Notification buildOngoingNotification(String title, String body) {
        return buildNotification(this, title, body, CHANNEL_ID_ONGOING);
    }

    private static Notification buildNotification(Context ctx,
                                                    String title,
                                                    String body,
                                                    String channelId) {
        // Tap opens MainActivity
        Intent openIntent = new Intent(ctx, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
                ctx, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, channelId)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(openPending)
                .setOngoing(true)
                .setAutoCancel(false)
                .setPriority(CHANNEL_ID_EMERGENCY.equals(channelId)
                        ? NotificationCompat.PRIORITY_HIGH
                        : NotificationCompat.PRIORITY_LOW)
                .setCategory(CHANNEL_ID_EMERGENCY.equals(channelId)
                        ? NotificationCompat.CATEGORY_ALARM
                        : NotificationCompat.CATEGORY_SERVICE);

        // Attach custom interactive Mini-App RemoteViews layout for ongoing sentinel notification
        try {
            RemoteViews miniAppView = new RemoteViews(ctx.getPackageName(), R.layout.notification_mini_app);
            miniAppView.setTextViewText(R.id.notif_ble_status, currentBleLabel);

            int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                    ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    : PendingIntent.FLAG_UPDATE_CURRENT;

            // 1. SOS Button -> PanicService
            Intent sosIntent = new Intent(ctx, SafelinkForegroundService.class);
            sosIntent.setAction(ACTION_MINI_SOS);
            miniAppView.setOnClickPendingIntent(R.id.notif_btn_sos, PendingIntent.getService(ctx, 101, sosIntent, piFlags));

            // 2. Watch Me Button
            Intent watchIntent = new Intent(ctx, SafelinkForegroundService.class);
            watchIntent.setAction(ACTION_MINI_WATCH_ME);
            miniAppView.setOnClickPendingIntent(R.id.notif_btn_watch_me, PendingIntent.getService(ctx, 102, watchIntent, piFlags));

            // 3. Sync Button
            Intent syncIntent = new Intent(ctx, SafelinkForegroundService.class);
            syncIntent.setAction(ACTION_MINI_SYNC);
            miniAppView.setOnClickPendingIntent(R.id.notif_btn_sync, PendingIntent.getService(ctx, 103, syncIntent, piFlags));

            // 4. Checkin Button
            Intent checkinIntent = new Intent(ctx, SafelinkForegroundService.class);
            checkinIntent.setAction(ACTION_MINI_CHECKIN);
            miniAppView.setOnClickPendingIntent(R.id.notif_btn_checkin, PendingIntent.getService(ctx, 104, checkinIntent, piFlags));

            // 5. Sound Location Button
            Intent soundIntent = new Intent(ctx, SafelinkForegroundService.class);
            soundIntent.setAction(ACTION_MINI_SOUND_LOC);
            miniAppView.setOnClickPendingIntent(R.id.notif_btn_sound_loc, PendingIntent.getService(ctx, 105, soundIntent, piFlags));

            // 6. AI Lizzy Voice Button
            Intent lizzyIntent = new Intent(ctx, SafelinkForegroundService.class);
            lizzyIntent.setAction(ACTION_MINI_LIZZY);
            miniAppView.setOnClickPendingIntent(R.id.notif_btn_lizzy, PendingIntent.getService(ctx, 106, lizzyIntent, piFlags));

            builder.setCustomContentView(miniAppView);
            builder.setCustomBigContentView(miniAppView);
            builder.setStyle(new NotificationCompat.DecoratedCustomViewStyle());
        } catch (Exception e) {
            Log.w(TAG, "Custom notification RemoteViews layout fallback: " + e.getMessage());
            builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
        }

        return builder.build();
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG);
            // Limit to 10 minutes maximum per acquisition block to prevent Samsung/Xiaomi battery drain warnings
            wakeLock.acquire(10 * 60 * 1000L); 
            Log.d(TAG, "Wake lock acquired with 10 minute timeout");
        }
    }

    public static void touchWakeLock(Context ctx) {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG);
                wl.acquire(5 * 60 * 1000L); // Hold for another 5 minutes on event/update
                Log.d(TAG, "Wake lock touched/refreshed for 5 minutes");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to touch wake lock: " + e.getMessage());
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "Wake lock released");
        }
    }
}
