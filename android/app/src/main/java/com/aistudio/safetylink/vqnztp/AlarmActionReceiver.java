package com.aistudio.safetylink.vqnztp;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/** Stops the looping emergency FCM ringtone & vibration when the contact taps "Stop Ringing". */
public class AlarmActionReceiver extends BroadcastReceiver {
    public static final String ACTION_STOP_ALARM = "com.aistudio.safetylink.ACTION_STOP_EMERGENCY_ALARM";
    public static final String EXTRA_NOTIFICATION_ID = "notification_id";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_STOP_ALARM.equals(intent.getAction())) return;
        Log.i("AlarmActionReceiver", "User dismissed incoming emergency FCM alarm");
        SafetyFcmService.stopActiveAlarmRingtone(context);
        int notifId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1);
        if (notifId != -1) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(notifId);
        }
    }
}
