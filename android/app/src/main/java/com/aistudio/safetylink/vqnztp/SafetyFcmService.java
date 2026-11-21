package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class SafetyFcmService extends FirebaseMessagingService {
    private static final String TAG = "SafetyFcmService";
    private static final String PREFS = "safetylink_prefs";
    private static final String KEY_FCM_TOKEN = "fcm_token";
    private static Ringtone activeAlarmRingtone = null;
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static void stopActiveAlarmRingtone() {
        try {
            if (activeAlarmRingtone != null && activeAlarmRingtone.isPlaying()) {
                activeAlarmRingtone.stop();
            }
            activeAlarmRingtone = null;
        } catch (Exception ignored) {}
    }

    @Override
    public void onNewToken(String token) {
        getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_FCM_TOKEN, token).apply();
        PushRegistrar.register(this);
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        LoudAlarmChannel.create(this);

        Map<String, String> data = message.getData();
        String title = data != null && data.get("title") != null
            ? data.get("title")
            : (message.getNotification() != null && message.getNotification().getTitle() != null
                ? message.getNotification().getTitle()
                : "🚨 SafetyLink Emergency Alert");

        String body = data != null && data.get("body") != null
            ? data.get("body")
            : (message.getNotification() != null && message.getNotification().getBody() != null
                ? message.getNotification().getBody()
                : "Someone has pressed the SafetyLink panic button.");

        // Launch MainActivity directly when tapped or via full-screen alarm intent
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                launchIntent.putExtra(entry.getKey(), entry.getValue());
            }
        }
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, (int) (System.currentTimeMillis() % 100000), launchIntent, piFlags);

        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) {
            sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }

        // Play audible alarm stream ringtone directly for 15 seconds so contact phones unmistakably RING
        try {
            stopActiveAlarmRingtone();
            if (sound != null) {
                Ringtone r = RingtoneManager.getRingtone(getApplicationContext(), sound);
                if (r != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        r.setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build());
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        r.setLooping(true);
                    }
                    r.play();
                    activeAlarmRingtone = r;
                    mainHandler.postDelayed(SafetyFcmService::stopActiveAlarmRingtone, 15000);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Direct alarm ringtone playback error: " + e.getMessage());
        }

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, LoudAlarmChannel.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(sound)
            .setVibrate(new long[]{0, 800, 400, 800, 400, 800, 400, 1000})
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(true);

        Notification notification = b.build();
        notification.flags |= Notification.FLAG_INSISTENT;

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), notification);
    }
}
