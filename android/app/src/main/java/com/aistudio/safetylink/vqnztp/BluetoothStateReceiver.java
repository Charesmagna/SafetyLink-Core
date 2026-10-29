package com.aistudio.safetylink.vqnztp;

import android.bluetooth.BluetoothAdapter;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BluetoothStateReceiver
 *
 * Listens for Bluetooth state transitions (e.g. user toggles Bluetooth ON,
 * or system finishes booting Bluetooth stack).
 * Automatically triggers background auto-reconnect to all saved iTAG devices
 * without requiring the user to open the app or perform a new scan.
 */
public class BluetoothStateReceiver extends BroadcastReceiver {
    private static final String TAG = "BluetoothStateReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
            int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
            if (state == BluetoothAdapter.STATE_ON) {
                Log.i(TAG, "Bluetooth turned ON: auto-reconnecting saved iTAG devices");
                ITagPlugin.reconnectBondedDevices(context);
                // Clear any warning
                try {
                    android.app.NotificationManager nm = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null) nm.cancel(9911);
                } catch (Exception e) {}
            } else if (state == BluetoothAdapter.STATE_OFF || state == BluetoothAdapter.STATE_TURNING_OFF) {
                if (!ITagPlugin.getBondedMacs(context).isEmpty()) {
                    Log.w(TAG, "Bluetooth turned OFF while iTAG devices are bonded! Alerting user.");
                    try {
                        android.app.NotificationManager nm = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                        if (nm != null) {
                            String channelId = "safetylink_ble_alert";
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                android.app.NotificationChannel ch = new android.app.NotificationChannel(
                                    channelId, "SafetyLink Hardware Warnings", android.app.NotificationManager.IMPORTANCE_HIGH
                                );
                                ch.setDescription("Warns when the panic button is disconnected");
                                nm.createNotificationChannel(ch);
                            }
                            android.app.PendingIntent pi = android.app.PendingIntent.getActivity(
                                context, 0, new Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS),
                                android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M ? 
                                    android.app.PendingIntent.FLAG_IMMUTABLE : 0
                            );
                            androidx.core.app.NotificationCompat.Builder b = new androidx.core.app.NotificationCompat.Builder(context, channelId)
                                .setSmallIcon(android.R.drawable.stat_notify_error)
                                .setContentTitle("⚠️ Emergency Button Disconnected!")
                                .setContentText("Bluetooth is OFF. Turn Bluetooth ON to keep your SafetyLink SOS keyfob armed.")
                                .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                                .setCategory(androidx.core.app.NotificationCompat.CATEGORY_ALARM)
                                .setContentIntent(pi)
                                .setAutoCancel(true);
                            nm.notify(9911, b.build());
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to post BLE disconnect notification: " + e.getMessage());
                    }
                }
            }
        }
    }
}
