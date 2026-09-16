package com.aistudio.safetylink.vqnztp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BootReceiver
 *
 * Listens for BOOT_COMPLETED and QUICKBOOT_POWERON intents so that
 * SafelinkForegroundService is automatically restarted after the device
 * reboots.  This keeps BLE wearable listening and GPS tracking alive even
 * if the user never opens the app after a reboot.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            Log.i(TAG, "Boot detected – starting background services");
            Intent serviceIntent = new Intent(context, SafelinkForegroundService.class);
            Intent panicIntent = new Intent(context, PanicService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
                context.startForegroundService(panicIntent);
            } else {
                context.startService(serviceIntent);
                context.startService(panicIntent);
            }
        }
    }
}
