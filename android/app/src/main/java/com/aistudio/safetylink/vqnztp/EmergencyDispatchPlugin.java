package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.telephony.SmsManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * EmergencyDispatch
 *
 * Native bridge that lets the React/TS layer actually trigger SMS and phone
 * calls during a panic dispatch, instead of only writing an audit-log line.
 *
 * SMS via SmsManager and calls via ACTION_CALL fire immediately once the
 * relevant runtime permission is granted -- no per-message confirmation
 * dialog, which is exactly what a one-tap panic button needs. This is
 * standard, permitted Android behavior for apps that declare SEND_SMS /
 * CALL_PHONE and get user consent through the normal permission prompt.
 *
 * WhatsApp is a deliberate exception: there is no public, consent-free way
 * for a third-party app to silently send a WhatsApp message. openWhatsApp()
 * opens WhatsApp with the message pre-filled via a wa.me deep link, but the
 * user still has to tap Send themselves inside WhatsApp. Achieving a fully
 * silent WhatsApp send would require either the separate WhatsApp Business
 * Cloud API (server-side, needs a verified business number) or an
 * Accessibility Service that auto-taps WhatsApp's UI on the user's behalf --
 * that second approach is the same technique used by stalkerware to control
 * other apps without the user's knowledge, so it is intentionally not
 * implemented here.
 */
@CapacitorPlugin(
        name = "EmergencyDispatch",
        permissions = {
                @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms"),
                @Permission(strings = { Manifest.permission.CALL_PHONE }, alias = "call")
        }
)
public class EmergencyDispatchPlugin extends Plugin {

    private String pendingPhone = null;
    private String pendingMessage = null;

    @PluginMethod
    public void sendSms(PluginCall call) {
        String phone = call.getString("phone");
        String message = call.getString("message");
        if (phone == null || message == null) {
            call.reject("phone and message are required");
            return;
        }
        pendingPhone = phone;
        pendingMessage = message;
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
            return;
        }
        doSendSms(call, phone, message);
    }

    private void doSendSms(PluginCall call, String phone, String message) {
        try {
            SmsManager smsManager;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                smsManager = getContext().getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }

            if (smsManager == null) {
                JSObject ret = new JSObject();
                ret.put("sent", false);
                ret.put("error", "SmsManager not available on this device");
                call.resolve(ret);
                return;
            }

            ArrayList<String> parts = smsManager.divideMessage(message);
            final int partsCount = parts.size();
            final String SENT_ACTION = "com.aistudio.safetylink.SMS_SENT_" + java.util.UUID.randomUUID().toString();
            
            int pendingFlags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                pendingFlags |= android.app.PendingIntent.FLAG_IMMUTABLE;
            }

            ArrayList<android.app.PendingIntent> sentIntents = new ArrayList<>();
            for (int i = 0; i < partsCount; i++) {
                Intent intent = new Intent(SENT_ACTION);
                intent.putExtra("part_index", i);
                sentIntents.add(android.app.PendingIntent.getBroadcast(getContext(), i, intent, pendingFlags));
            }

            final java.util.concurrent.atomic.AtomicBoolean anyFailure = new java.util.concurrent.atomic.AtomicBoolean(false);
            final java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(partsCount);

            android.content.BroadcastReceiver receiver = new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(android.content.Context context, Intent intent) {
                    if (getResultCode() != android.app.Activity.RESULT_OK) {
                        anyFailure.set(true);
                    }
                    latch.countDown();
                }
            };

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(receiver, new android.content.IntentFilter(SENT_ACTION), android.content.Context.RECEIVER_NOT_EXPORTED);
            } else {
                getContext().registerReceiver(receiver, new android.content.IntentFilter(SENT_ACTION));
            }

            smsManager.sendMultipartTextMessage(phone, null, parts, sentIntents, null);
            
            // Wait with a 15-second timeout on a background thread so we don't freeze main thread
            new Thread(() -> {
                try {
                    boolean completed = latch.await(15, java.util.concurrent.TimeUnit.SECONDS);
                    getContext().unregisterReceiver(receiver);

                    JSObject ret = new JSObject();
                    if (!completed) {
                        ret.put("sent", false);
                        ret.put("error", "SMS send timed out");
                    } else if (anyFailure.get()) {
                        ret.put("sent", false);
                        ret.put("error", "SMS send failed (RESULT_CANCELLED or error code)");
                    } else {
                        ret.put("sent", true);
                    }
                    call.resolve(ret);
                } catch (Exception e) {
                    try {
                        getContext().unregisterReceiver(receiver);
                    } catch (Exception ex) {}
                    JSObject ret = new JSObject();
                    ret.put("sent", false);
                    ret.put("error", "Error waiting for SMS confirmation: " + e.getMessage());
                    call.resolve(ret);
                }
            }).start();

        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("sent", false);
            ret.put("error", "SMS send exception: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void placeCall(PluginCall call) {
        String phone = call.getString("phone");
        if (phone == null) {
            call.reject("phone is required");
            return;
        }
        pendingPhone = phone;
        if (getPermissionState("call") != PermissionState.GRANTED) {
            requestPermissionForAlias("call", call, "callPermsCallback");
            return;
        }
        doPlaceCall(call, phone);
    }

    private void doPlaceCall(PluginCall call, String phone) {
        try {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + phone));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("dialed", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("dialed", false);
            ret.put("error", "Call failed: " + e.getMessage());
            call.resolve(ret);
        }
    }

    /**
     * Opens WhatsApp with the message pre-filled. Requires one tap from the
     * user inside WhatsApp to actually send -- see class-level note above
     * for why this can't be made fully silent from here.
     */
    @PluginMethod
    public void openWhatsApp(PluginCall call) {
        String phone = call.getString("phone");
        String message = call.getString("message", "");
        if (phone == null) {
            call.reject("phone is required");
            return;
        }
        try {
            String cleanPhone = phone.replaceAll("[^0-9]", "");
            if (cleanPhone.startsWith("0") && cleanPhone.length() == 10) {
                cleanPhone = "27" + cleanPhone.substring(1);
            }
            Uri uri = Uri.parse("https://wa.me/" + cleanPhone + "?text=" + Uri.encode(message));
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("opened", true);
            ret.put("requiresManualSend", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("opened", false);
            ret.put("requiresManualSend", true);
            ret.put("error", "WhatsApp open failed: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            String phone = call.getString("phone");
            if (phone == null) phone = pendingPhone;
            String message = call.getString("message");
            if (message == null) message = pendingMessage;
            doSendSms(call, phone, message);
        } else {
            call.reject("SMS permission denied");
        }
    }

    @PermissionCallback
    private void callPermsCallback(PluginCall call) {
        if (getPermissionState("call") == PermissionState.GRANTED) {
            String phone = call.getString("phone");
            if (phone == null) phone = pendingPhone;
            doPlaceCall(call, phone);
        } else {
            call.reject("Call permission denied");
        }
    }
}
