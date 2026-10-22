package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class SafetyFcmService extends FirebaseMessagingService {
    private static final String PREFS = "safetylink_prefs";
    private static final String KEY_FCM_TOKEN = "fcm_token";

    @Override
    public void onNewToken(String token) {
        // Stored locally; the app sends it to the server so alerts can reach this phone.
        getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_FCM_TOKEN, token).apply();
        PushRegistrar.register(this);
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        LoudAlarmChannel.create(this);

        Map<String, String> data = message.getData();
        String title = message.getNotification() != null && message.getNotification().getTitle() != null
            ? message.getNotification().getTitle() : "SafetyLink alert";
        String body = message.getNotification() != null && message.getNotification().getBody() != null
            ? message.getNotification().getBody()
            : (data.get("body") != null ? data.get("body") : "Someone has pressed the SafetyLink button.");

        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, LoudAlarmChannel.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSound(sound)
            .setVibrate(new long[]{0, 800, 400, 800, 400, 800})
            .setAutoCancel(true);

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), b.build());
    }
}
