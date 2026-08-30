package com.aistudio.safetylink.vqnztp;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class DnsVpnActivity extends Activity {

    private static final int VPN_REQUEST_CODE = 100;
    private boolean isVpnActive = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        TextView status = new TextView(this);
        status.setText("SafetyLink DNS Shield\n\nTap to enable DNS filtering.\nA key icon will appear in your status bar when active.");
        status.setPadding(48, 48, 48, 48);
        status.setTextSize(16);

        Button toggleButton = new Button(this);
        toggleButton.setText("Enable DNS Shield");
        toggleButton.setOnClickListener(v -> {
            if (!isVpnActive) {
                requestVpnPermission();
            } else {
                stopVpn();
                toggleButton.setText("Enable DNS Shield");
                status.setText("SafetyLink DNS Shield\n\nDNS filtering is OFF.\nTap to enable DNS filtering.");
                isVpnActive = false;
            }
        });

        TextView privateDnsInfo = new TextView(this);
        privateDnsInfo.setText("\n\n--- Alternative: Native Private DNS ---\n\n" +
            "You can also go to:\n" +
            "Settings -> Network & Internet -> Private DNS\n" +
            "Enter: dns.safetylink.online\n\n" +
            "This uses Android's built-in DNS-over-TLS (requires DoT server on port 853).");
        privateDnsInfo.setPadding(48, 16, 48, 48);
        privateDnsInfo.setTextSize(14);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(32, 32, 32, 32);
        layout.addView(status);
        layout.addView(toggleButton);
        layout.addView(privateDnsInfo);

        setContentView(layout);
    }

    private void requestVpnPermission() {
        Intent intent = VpnService.prepare(this);
        if (intent != null) {
            startActivityForResult(intent, VPN_REQUEST_CODE);
        } else {
            startVpn();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == VPN_REQUEST_CODE) {
            if (resultCode == RESULT_OK) {
                startVpn();
            } else {
                Toast.makeText(this, "VPN permission denied — DNS Shield cannot start", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void startVpn() {
        Intent intent = new Intent(this, DnsVpnService.class);
        startService(intent);
        isVpnActive = true;
        Toast.makeText(this, "SafetyLink DNS Shield active — key icon should be visible", Toast.LENGTH_LONG).show();
    }

    private void stopVpn() {
        Intent intent = new Intent(this, DnsVpnService.class);
        intent.setAction("STOP");
        startService(intent);
    }
}
