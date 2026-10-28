package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Ignore the phone's system font/display size so the app looks the same on every phone
    @Override
    protected void attachBaseContext(android.content.Context base) {
        android.content.res.Configuration cfg = new android.content.res.Configuration(base.getResources().getConfiguration());
        cfg.fontScale = 1.0f;
        super.attachBaseContext(base.createConfigurationContext(cfg));
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EmergencyDispatchPlugin.class);
        registerPlugin(SafetyLinkBridgePlugin.class);
        registerPlugin(ITagPlugin.class);
        super.onCreate(savedInstanceState);
        LoudAlarmChannel.create(this);
        // One-time SIM choice: remember the phone's default voice SIM so panic never asks SIM 1 or SIM 2
        try {
            if (android.os.Build.VERSION.SDK_INT >= 22) {
                android.content.SharedPreferences sp = getSharedPreferences("safetylink_prefs", MODE_PRIVATE);
                if (sp.getInt("preferred_sim_sub_id", -1) < 0) {
                    int sub = android.telephony.SubscriptionManager.getDefaultVoiceSubscriptionId();
                    if (sub >= 0) sp.edit().putInt("preferred_sim_sub_id", sub).apply();
                }
            }
        } catch (Exception ignored) { }
        requestEmergencyPermissions();
        try { getBridge().getWebView().getSettings().setTextZoom(100); } catch (Exception ignored) {}
    }

    private void requestEmergencyPermissions() {
        ArrayList<String> need = new ArrayList<>();
        String[] wanted = new String[] {
            Manifest.permission.SEND_SMS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.ACCESS_FINE_LOCATION
        };
        for (String perm : wanted) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) need.add(perm);
        }
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, "android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            need.add("android.permission.POST_NOTIFICATIONS");
        }
        if (!need.isEmpty()) ActivityCompat.requestPermissions(this, need.toArray(new String[0]), 7001);
    }
}
