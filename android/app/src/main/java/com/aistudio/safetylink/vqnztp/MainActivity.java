package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EmergencyDispatchPlugin.class);
        registerPlugin(ITagPlugin.class);
        super.onCreate(savedInstanceState);

        // Start the persistent foreground service so BLE + GPS stay alive
        startSafelinkService();
    }

    @Override
    public void onStop() {
        super.onStop();
        // App went to background / screen locked – make sure service is running
        // so the "Device Locked" notification banner appears in the shade.
        startSafelinkService();
        Log.i(TAG, "App backgrounded – foreground service ensured running");
    }

    // ------------------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------------------

    private void startSafelinkService() {
        Intent serviceIntent = new Intent(this, SafelinkForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
