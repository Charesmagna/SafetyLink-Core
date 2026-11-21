package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.app.Dialog;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

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
        startSentinelServices();

        setupOAuthPopupSupport();
    }

    private void startSentinelServices() {
        try {
            android.content.Intent serviceIntent = new android.content.Intent(this, SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            WatchdogAlarmReceiver.scheduleWatchdog(this);
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Sentinel startup note: " + e.getMessage());
        }
    }

    private void setupOAuthPopupSupport() {
        try {
            WebView mainWebView = getBridge().getWebView();
            WebSettings mainSettings = mainWebView.getSettings();
            mainSettings.setTextZoom(100);
            mainSettings.setAllowFileAccessFromFileURLs(false);
            mainSettings.setAllowUniversalAccessFromFileURLs(false);
            mainSettings.setSupportMultipleWindows(true);
            mainSettings.setJavaScriptCanOpenWindowsAutomatically(true);

            mainWebView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                private Dialog popupDialog;
                private WebView popupWebView;

                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    if (MainActivity.this.isFinishing()) {
                        return false;
                    }

                    popupWebView = new WebView(MainActivity.this);
                    WebSettings settings = popupWebView.getSettings();
                    settings.setJavaScriptEnabled(true);
                    settings.setDomStorageEnabled(true);
                    settings.setAllowFileAccess(false);
                    settings.setAllowContentAccess(false);
                    settings.setAllowFileAccessFromFileURLs(false);
                    settings.setAllowUniversalAccessFromFileURLs(false);
                    settings.setSupportMultipleWindows(true);
                    settings.setJavaScriptCanOpenWindowsAutomatically(true);

                    // Prevent Google OAuth "403: disallowed_useragent" by removing WebView signature flags
                    String ua = settings.getUserAgentString();
                    if (ua != null) {
                        ua = ua.replace("; wv", "").replace("Version/4.0 ", "");
                        settings.setUserAgentString(ua);
                    }

                    popupDialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                    popupDialog.setContentView(popupWebView);
                    popupDialog.setOnCancelListener(dialog -> {
                        if (popupWebView != null) {
                            popupWebView.destroy();
                            popupWebView = null;
                        }
                    });
                    popupDialog.show();

                    popupWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            if (popupDialog != null && popupDialog.isShowing()) {
                                popupDialog.dismiss();
                            }
                            if (window != null) {
                                window.destroy();
                            }
                        }
                    });

                    popupWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                            String scheme = request != null && request.getUrl() != null ? request.getUrl().getScheme() : "";
                            return !"https".equalsIgnoreCase(scheme);
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, String url) {
                            return url == null || !url.toLowerCase().startsWith("https://");
                        }
                    });

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(popupWebView);
                    resultMsg.sendToTarget();
                    return true;
                }

                @Override
                public void onCloseWindow(WebView window) {
                    if (popupDialog != null && popupDialog.isShowing()) {
                        popupDialog.dismiss();
                    }
                    if (window != null) {
                        window.destroy();
                    }
                    super.onCloseWindow(window);
                }
            });
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to setup OAuth popup support", e);
        }
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
        if (Build.VERSION.SDK_INT >= 31) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.BLUETOOTH_SCAN);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.BLUETOOTH_CONNECT);
            }
        }
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, "android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            need.add("android.permission.POST_NOTIFICATIONS");
        }
        if (!need.isEmpty()) ActivityCompat.requestPermissions(this, need.toArray(new String[0]), 7001);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        ITagGattManager.reconnectBondedDevices(this);
    }
}
