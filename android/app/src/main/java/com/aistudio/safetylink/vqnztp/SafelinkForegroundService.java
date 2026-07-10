package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import java.util.UUID;

/**
 * SafelinkForegroundService
 *
 * A START_STICKY foreground service that keeps SafetyLink connected to BLE
 * iTAG wearables and monitors device location even when the app is in the
 * background or the screen is locked.
 *
 * Behaviour:
 *   - Starts automatically on boot (via BootReceiver).
 *   - Posts an ongoing "Device locked – SafetyLink connected" notification
 *     visible in the Android notification shade whenever the app is minimised
 *     or the screen is locked.  This notification reassures the user that BLE
 *     listening and GPS tracking are still active.
 *   - Holds a PARTIAL_WAKE_LOCK so the CPU does not sleep between BLE events.
 *   - Returns START_STICKY so Android restarts it if it is killed.
 *   - Calls onTaskRemoved() to re-schedule itself if the user swipes the app
 *     away from the Recents list.
 *   - Native GATT callback captures HST-01 0x01 panic byte even when WebView
 *     is killed by aggressive OEM battery optimisation.
 *   - Implements onTimeout (API 35) for graceful FGS termination.
 */
public class SafelinkForegroundService extends Service {
    private static final String TAG = "SafelinkFgService";

    // Notification channel IDs
    public static final String CHANNEL_ID_ONGOING  = "safetylink_channel";
    public static final String CHANNEL_ID_EMERGENCY = "safetylink_emergency_channel";

    // Stable notification IDs
    private static final int NOTIF_ID_ONGOING   = 8801;
    private static final int NOTIF_ID_EMERGENCY = 8802;

    // Wake lock tag
    private static final String WAKE_LOCK_TAG = "SafetyLink::BleWakeLock";

    // HST-01 / iTAG GATT UUIDs
    private static final UUID IMMEDIATE_ALERT_SERVICE_UUID =
            UUID.fromString("00001802-0000-1000-8000-00805f9b34fb");
    private static final UUID ALERT_LEVEL_CHAR_UUID =
            UUID.fromString("00002a06-0000-1000-8000-00805f9b34fb");
    private static final UUID CLIENT_CHARACTERISTIC_CONFIG_UUID =
            UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    private PowerManager.WakeLock wakeLock;

    // Active GATT connection – set by Capacitor BLE plugin or reconnect worker
    private BluetoothGatt mGatt;

    // -----------------------------------------------------------------------
    // Native GATT callback – survives WebView termination
    // -----------------------------------------------------------------------
    public final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.i(TAG, "iTAG connected – starting service discovery");
                gatt.discoverServices();
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.w(TAG, "iTAG disconnected – broadcasting for reconnect");
                mGatt = null;
                Intent intent = new Intent("za.co.tmmedia.safetylink.BLE_DISCONNECTED");
                sendBroadcast(intent);
            }
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                Log.e(TAG, "Service discovery failed: " + status);
                return;
            }
            BluetoothGattService service = gatt.getService(IMMEDIATE_ALERT_SERVICE_UUID);
            if (service == null) {
                Log.w(TAG, "Immediate Alert Service not found on device");
                return;
            }
            BluetoothGattCharacteristic characteristic =
                    service.getCharacteristic(ALERT_LEVEL_CHAR_UUID);
            if (characteristic == null) {
                Log.w(TAG, "Alert Level characteristic not found");
                return;
            }
            gatt.setCharacteristicNotification(characteristic, true);
            BluetoothGattDescriptor descriptor =
                    characteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_UUID);
            if (descriptor != null) {
                descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                gatt.writeDescriptor(descriptor);
            }
            Log.i(TAG, "GATT notifications enabled for Alert Level characteristic");
        }

        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt,
                                            BluetoothGattCharacteristic characteristic) {
            byte[] data = characteristic.getValue();
            if (data != null && data.length > 0 && data[0] == 0x01) {
                Log.d(TAG, "HST-01 panic byte 0x01 received – broadcasting panic event");
                broadcastPanicEvent();
            }
        }
    };

    /**
     * Attach an active GATT connection to this service so the native callback
     * handles button events even when the WebView process is killed.
     */
    public void attachGatt(BluetoothGatt gatt) {
        this.mGatt = gatt;
        Log.i(TAG, "GATT attached to foreground service");
    }

    private void broadcastPanicEvent() {
        Intent intent = new Intent("za.co.tmmedia.safetylink.PANIC_TRIGGERED");
        intent.putExtra("source", "hardware_btn");
        sendBroadcast(intent);
        Log.i(TAG, "PANIC_TRIGGERED broadcast sent");
    }

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
        Log.i(TAG, "onStartCommand – promoting to foreground");
        startForeground(NOTIF_ID_ONGOING, buildOngoingNotification(
                "🛡️ SafetyLink Active Connection",
                "Device Locked • Listening for BLE panic button • GPS tracking on"
        ));
        return START_STICKY;
    }

    /**
     * API 35 mandatory callback: final warning before OS terminates a
     * long-running foreground service that has exceeded its time limit.
     * Persist alert state and release hardware within this window.
     */
    @RequiresApi(api = 35)
    @Override
    public void onTimeout(int startId, int fgsType) {
        Log.w(TAG, "FGS timeout reached (startId=" + startId + " fgsType=" + fgsType
                + ") – persisting state and releasing hardware");
        persistIncidentState();
        releaseGatt();
        stopSelf(startId);
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
        releaseGatt();
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
    /**
     * Persist current incident state before onTimeout terminates the service.
     * Broadcasts to the JS layer so Zustand/localStorage can flush to SQLite.
     */
    private void persistIncidentState() {
        Intent intent = new Intent("za.co.tmmedia.safetylink.PERSIST_INCIDENT_STATE");
        sendBroadcast(intent);
        Log.i(TAG, "PERSIST_INCIDENT_STATE broadcast sent");
    }

    private void releaseGatt() {
        if (mGatt != null) {
            try {
                mGatt.disconnect();
                mGatt.close();
                Log.i(TAG, "GATT disconnected and closed");
            } catch (Exception e) {
                Log.e(TAG, "Error releasing GATT: " + e.getMessage());
            }
            mGatt = null;
        }
    }

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
