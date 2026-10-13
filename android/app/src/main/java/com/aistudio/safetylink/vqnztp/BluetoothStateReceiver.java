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
            }
        }
    }
}
