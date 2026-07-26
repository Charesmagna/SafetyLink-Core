package com.aistudio.safetylink.vqnztp;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * SafelinkForegroundService
 *
 * A START_STICKY foreground service that keeps SafetyLink connected to BLE
 * iTAG wearables and monitors device location even when the app is in the
 * background or the screen is locked.
 *
 * Behaviour:
 *   - Starts automatically on boot (via BootReceiver).
 *   - Posts an ongoing "Device locked – SafetyLink connected" notification.
 *   - Holds a PARTIAL_WAKE_LOCK so the CPU does not sleep between BLE events.
 *   - Returns START_STICKY so Android restarts it if killed.
 *   - Dead-man's switch: schedules a repeating AlarmManager ping every
 *     5 minutes. If the ping intent is received but the service is dead,
 *     Android re-delivers START_STICKY; if AlarmManager fires with no
 *     service, the ping intent restarts it.
 */
public class SafelinkForegroundService extends Service {
    private static final String TAG = "SafelinkFgService";

    // Notification channel IDs
    public static final String CHANNEL_ID_ONGOING   = "safetylink_channel";
    public static final String CHANNEL_ID_EMERGENCY = "safetylink_emergency_channel";

    // Stable notification IDs
    private static final int NOTIF_ID_ONGOING   = 8801;
    private static final int NOTIF_ID_EMERGENCY = 8802;

    // Wake lock tag
    private static final String WAKE_LOCK_TAG = "SafetyLink::BleWakeLock";

    // Dead-man's switch: ping every 5 minutes
    private static final String ACTION_DEADMAN_PING = "com.aistudio.safetylink.ACTION_DEADMAN_PING";
    private static final int    DEADMAN_REQUEST_CODE = 9901;
    private static final long   DEADMAN_INTERVAL_MS  = 5 * 60 * 1000L; // 5 minutes

    private PowerManager.WakeLock wakeLock;
    private boolean isSurvivalMode = false;

    private final BroadcastReceiver batteryReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            float batteryPct = level * 100 / (float) scale;

            if (batteryPct <= 10.0f && !isSurvivalMode) {
                isSurvivalMode = true;
                Log.w(TAG, "BATTERY CRITICAL (<10%). ENTERING SURVIVAL MODE.");
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitSurvivalMode(true);
                }
            } else if (batteryPct > 10.0f && isSurvivalMode) {
                isSurvivalMode = false;
                Log.i(TAG, "BATTERY RECOVERED. EXITING SURVIVAL MODE.");
                if (SafetyLinkBridgePlugin.getInstance() != null) {
                    SafetyLinkBridgePlugin.getInstance().emitSurvivalMode(false);
                }
            }
        }
    };

    // -----------------------------------------------------------------------
    // Service lifecycle
    // -----------------------------------------------------------------------
    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Service created");
        createNotificationChannels();
        acquireWakeLock();
        registerReceiver(batteryReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        scheduleDeadManPing();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Handle dead-man ping — touch wake lock and reschedule
        if (intent != null && ACTION_DEADMAN_PING.equals(intent.getAction())) {
            Log.d(TAG, "Dead-man ping received — service alive, rescheduling");
            touchWakeLock(this);
            scheduleDeadManPing();
            return START_STICKY;
        }

        Log.i(TAG, "onStartCommand – promoting to foreground");
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_ONGOING)
            .setSmallIcon(R.drawable.ic_safetylink)
            .setContentTitle("SafetyLink Active")
            .setContentText("Service + Ghost Engine Running")
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText("BLE Linked: Standby
GPS: Acquiring"))
            .setOngoing(true);

        startForeground(NOTIF_ID_ONGOING, builder.build());
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.w(TAG, "Task removed – rescheduling service restart");
        Intent restartIntent = new Intent(getApplicationContext(), SafelinkForegroundService.class);
        restartIntent.setPackage(getPackageName());
        PendingIntent restartPending = PendingIntent.getService(
                getApplicationContext(),
                1,
                restartIntent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarmManager =
                (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    System.currentTimeMillis() + 2000,
                    restartPending
            );
        }
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        Log.w(TAG, "Service destroyed – releasing wake lock");
        cancelDeadManPing();
        releaseWakeLock();
        try { unregisterReceiver(batteryReceiver); } catch (Exception e) { /* ignore */ }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // -----------------------------------------------------------------------
    // Dead-man's switch
    // -----------------------------------------------------------------------

    /**
     * Schedule (or reschedule) a repeating AlarmManager ping.
     * If the service is killed without onDestroy being called (OEM force-kill),
     * the next pending alarm will restart it via START_STICKY delivery.
     */
    private void scheduleDeadManPing() {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent pingIntent = new Intent(this, SafelinkForegroundService.class);
        pingIntent.setAction(ACTION_DEADMAN_PING);
        PendingIntent pi = PendingIntent.getService(
                this,
                DEADMAN_REQUEST_CODE,
                pingIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Cancel any existing ping before rescheduling
        am.cancel(pi);

        long triggerAt = System.currentTimeMillis() + DEADMAN_INTERVAL_MS;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
        Log.d(TAG, "Dead-man ping scheduled in " + (DEADMAN_INTERVAL_MS / 1000) + "s");
    }

    private void cancelDeadManPing() {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent pingIntent = new Intent(this, SafelinkForegroundService.class);
        pingIntent.setAction(ACTION_DEADMAN_PING);
        PendingIntent pi = PendingIntent.getService(
                this,
                DEADMAN_REQUEST_CODE,
                pingIntent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        if (pi != null) {
            am.cancel(pi);
            Log.d(TAG, "Dead-man ping cancelled");
        }
    }

    // -----------------------------------------------------------------------
    // Public helpers
    // -----------------------------------------------------------------------
    public static void updateNotification(Context ctx,
                                           boolean isRunning,
                                           String locationStr,
                                           int connectedBleCount,
                                           String sosState) {
        touchWakeLock(ctx);

        NotificationManager nm =
                (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        String title;
        String body;

        if (!"IDLE".equals(sosState)) {
            title = "🚨 SafetyLink EMERGENCY ACTIVE";
            body  = "Distress signal broadcasting! Location: [" + locationStr + "] 
• GHOST ENGINE: ACTIVE 
• BLE LINK: ACTIVE 
• TX RELAY: ENGAGED";
        } else if (!isRunning) {
            title = "⚠️ SafetyLink Monitoring Suspended";
            body  = "Panic gestures & background tracking are offline. Tap to reactivate.";
        } else {
            String devicesStr = connectedBleCount > 0
                    ? connectedBleCount + " iTAG paired"
                    : "No iTAG bound";
            title = "🛡️ SafetyLink Active Connection";
            body  = "• SERVICE ACTIVE 
• GHOST ENGINE ACTIVE 
• BLE LINKED: " + devicesStr + " 
• HPE GPS LOCKED: [" + locationStr + "]";
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

            NotificationChannel ongoing = new NotificationChannel(
                    CHANNEL_ID_ONGOING,
                    "SafetyLink Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            ongoing.setDescription("Persistent status: BLE wearable listening & GPS tracking");
            ongoing.setShowBadge(false);
            nm.createNotificationChannel(ongoing);

            NotificationChannel emergency = new NotificationChannel(
                    CHANNEL_ID_EMERGENCY,
                    "SafetyLink Emergency Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            emergency.setDescription("Critical panic & distress alerts");
            nm.createNotificationChannel(emergency);
        }
    }

    private static Notification buildNotification(Context ctx,
                                                    String title,
                                                    String body,
                                                    String channelId) {
        Intent openIntent = new Intent(ctx, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
                ctx, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(ctx, channelId)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(openPending)
                .setOngoing(true)
                .setAutoCancel(false)
                .setPriority(CHANNEL_ID_EMERGENCY.equals(channelId)
                        ? NotificationCompat.PRIORITY_HIGH
                        : NotificationCompat.PRIORITY_LOW)
                .setCategory(CHANNEL_ID_EMERGENCY.equals(channelId)
                        ? NotificationCompat.CATEGORY_ALARM
                        : NotificationCompat.CATEGORY_SERVICE)
                .build();
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG);
            wakeLock.acquire(10 * 60 * 1000L);
            Log.d(TAG, "Wake lock acquired (10 min timeout)");
        }
    }

    public static void touchWakeLock(Context ctx) {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG);
                wl.acquire(5 * 60 * 1000L);
                Log.d(TAG, "Wake lock touched (5 min)");
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
