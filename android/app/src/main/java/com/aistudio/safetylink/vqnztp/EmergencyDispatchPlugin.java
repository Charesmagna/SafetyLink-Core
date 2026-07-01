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

    @PluginMethod
    public void sendSms(PluginCall call) {
        String phone = call.getString("phone");
        String message = call.getString("message");
        if (phone == null || message == null) {
            call.reject("phone and message are required");
            return;
        }
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
            return;
        }
        doSendSms(call, phone, message);
    }

    private void doSendSms(PluginCall call, String phone, String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            ArrayList<String> parts = smsManager.divideMessage(message);
            smsManager.sendMultipartTextMessage(phone, null, parts, null, null);

            JSObject ret = new JSObject();
            ret.put("sent", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("SMS send failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void placeCall(PluginCall call) {
        String phone = call.getString("phone");
        if (phone == null) {
            call.reject("phone is required");
            return;
        }
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
            getActivity().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("dialed", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Call failed: " + e.getMessage());
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
            Uri uri = Uri.parse("https://wa.me/" + cleanPhone + "?text=" + Uri.encode(message));
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("opened", true);
            ret.put("requiresManualSend", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("WhatsApp open failed: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            doSendSms(call, call.getString("phone"), call.getString("message"));
        } else {
            call.reject("SMS permission denied");
        }
    }

    @PermissionCallback
    private void callPermsCallback(PluginCall call) {
        if (getPermissionState("call") == PermissionState.GRANTED) {
            doPlaceCall(call, call.getString("phone"));
        } else {
            call.reject("Call permission denied");
        }
    }
}
