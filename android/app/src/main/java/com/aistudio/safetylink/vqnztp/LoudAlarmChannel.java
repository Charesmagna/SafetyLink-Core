package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

public final class LoudAlarmChannel {
    public static final String CHANNEL_ID = "loud_alarm_channel";

    /** Call once at app start and before posting any incoming FCM emergency alarm. */
    public static void create(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID, "SafetyLink Emergency Alarm", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Critical high-priority emergency ringtone channel for SafetyLink contacts");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 900, 300, 900, 300, 900, 300, 1200});
        channel.enableLights(true);
        channel.setBypassDnd(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) {
            sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build();
        channel.setSound(sound, attrs);

        nm.createNotificationChannel(channel);
    }
}
