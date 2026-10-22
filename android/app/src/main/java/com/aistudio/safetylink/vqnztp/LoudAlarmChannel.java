package com.aistudio.safetylink.vqnztp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

public final class LoudAlarmChannel {
    public static final String CHANNEL_ID = "loud_alarm_channel";

    /** Call once at app start. Creates a high-importance channel that rings loudly. */
    public static void create(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID, "Safety Alerts", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("High-importance safety alarm channel");
        channel.enableVibration(true);
        channel.setBypassDnd(true); // rings through Do Not Disturb where the user allows it

        // Uses the phone's alarm sound. To use a custom sound, add res/raw/alarm_sound.mp3
        // and replace this URI with: Uri.parse("android.resource://" + context.getPackageName() + "/raw/alarm_sound")
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build();
        channel.setSound(sound, attrs);

        nm.createNotificationChannel(channel);
    }
}
