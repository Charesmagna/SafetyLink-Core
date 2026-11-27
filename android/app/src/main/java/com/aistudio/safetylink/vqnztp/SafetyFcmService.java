package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

import java.util.Map;

/**
 * Receives high-priority DATA-ONLY FCM emergency messages in ANY app state
 * (foreground, background, locked screen, Doze mode, or process killed)
 * and rings the emergency contact's phone loudly on the ALARM audio stream.
 */
public class SafetyFcmService extends FirebaseMessagingService {
    private static final String TAG = "SafetyFcmService";
    private static final String PREFS = "safetylink_prefs";
    private static final String KEY_FCM_TOKEN = "fcm_token";
    public static final String KEY_PENDING_RING_JSON = "pending_fcm_ring_json";

    private static Ringtone activeAlarmRingtone = null;
    private static MediaPlayer activeAlarmMediaPlayer = null;
    private static PowerManager.WakeLock activeWakeLock = null;
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());
    private static Runnable pendingStopRunnable = null;

    public static void stopActiveAlarmRingtone() {
        stopActiveAlarmRingtone(null);
    }

    public static void stopActiveAlarmRingtone(Context ctx) {
        try {
            if (pendingStopRunnable != null) {
                mainHandler.removeCallbacks(pendingStopRunnable);
                pendingStopRunnable = null;
            }
            if (activeAlarmRingtone != null) {
                if (activeAlarmRingtone.isPlaying()) {
                    activeAlarmRingtone.stop();
                }
                activeAlarmRingtone = null;
            }
            if (activeAlarmMediaPlayer != null) {
                try {
                    if (activeAlarmMediaPlayer.isPlaying()) {
                        activeAlarmMediaPlayer.stop();
                    }
                    activeAlarmMediaPlayer.release();
                } catch (Exception ignored) {}
                activeAlarmMediaPlayer = null;
            }
            if (ctx != null) {
                Vibrator v = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null) v.cancel();
            }
            if (activeWakeLock != null && activeWakeLock.isHeld()) {
                activeWakeLock.release();
                activeWakeLock = null;
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onNewToken(String token) {
        if (token == null || token.trim().isEmpty()) return;
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_FCM_TOKEN, token.trim())
            .apply();
        Log.i(TAG, "FCM token refreshed; registering with SafetyLink server");
        PushRegistrar.register(this);
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        LoudAlarmChannel.create(this);

        // Acquire a wake lock immediately so Doze mode does not sleep mid-alarm
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            try {
                if (activeWakeLock != null && activeWakeLock.isHeld()) {
                    activeWakeLock.release();
                }
                activeWakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "safetylink:FcmEmergencyRingWakeLock"
                );
                activeWakeLock.setReferenceCounted(false);
                activeWakeLock.acquire(50_000L);
            } catch (Exception e) {
                Log.w(TAG, "WakeLock note: " + e.getMessage());
            }
        }

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
                : "Someone you protect has triggered a SafetyLink emergency alert!");

        String callerName = data != null && data.get("callerName") != null ? data.get("callerName") : "SafetyLink Contact";
        String callerNumber = data != null && data.get("callerNumber") != null ? data.get("callerNumber") : "";
        String location = data != null && data.get("location") != null ? data.get("location") : "";
        String triggerSource = data != null && data.get("triggerSource") != null ? data.get("triggerSource") : "FCM_LOUD_ALARM";
        int ringDurationSec = 45;
        if (data != null && data.get("ringDurationSec") != null) {
            try {
                ringDurationSec = Math.max(15, Math.min(90, Integer.parseInt(data.get("ringDurationSec"))));
            } catch (Exception ignored) {}
        }

        // Persist the incoming alert so MainActivity / React UI shows the full red emergency screen upon launch
        try {
            JSONObject pending = new JSONObject();
            pending.put("type", "EMERGENCY_RING");
            pending.put("title", title);
            pending.put("body", body);
            pending.put("callerName", callerName);
            pending.put("callerNumber", callerNumber);
            pending.put("location", location);
            pending.put("source", triggerSource);
            if (data != null && data.get("lat") != null) pending.put("lat", data.get("lat"));
            if (data != null && data.get("lng") != null) pending.put("lng", data.get("lng"));
            pending.put("timestamp", System.currentTimeMillis());
            getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_PENDING_RING_JSON, pending.toString())
                .apply();
        } catch (Exception ignored) {}

        int notifId = (int) (System.currentTimeMillis() % 100000) + 1000;
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

        // Full-screen intent opens MainActivity over the lock screen
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("type", "EMERGENCY_RING");
        launchIntent.putExtra("notification_id", notifId);
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                launchIntent.putExtra(entry.getKey(), entry.getValue());
            }
        }
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, notifId, launchIntent, piFlags);

        // Action 1: Stop Ringing button
        Intent stopIntent = new Intent(this, AlarmActionReceiver.class);
        stopIntent.setAction(AlarmActionReceiver.ACTION_STOP_ALARM);
        stopIntent.putExtra(AlarmActionReceiver.EXTRA_NOTIFICATION_ID, notifId);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(this, notifId + 1, stopIntent, piFlags);

        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        // Play insistent ALARM-stream ringtone + alarm vibration directly so contact phones unmistakably RING
        final Context appCtx = getApplicationContext();
        final int durationMs = ringDurationSec * 1000;
        try {
            stopActiveAlarmRingtone(appCtx);
            // Ensure STREAM_ALARM volume is audible (>= 80% max) so emergency ring cannot be silent
            try {
                AudioManager am = (AudioManager) appCtx.getSystemService(Context.AUDIO_SERVICE);
                if (am != null) {
                    int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                    int curVol = am.getStreamVolume(AudioManager.STREAM_ALARM);
                    int targetVol = Math.max(1, (int) Math.ceil(maxVol * 0.85));
                    if (curVol < targetVol) {
                        am.setStreamVolume(AudioManager.STREAM_ALARM, targetVol, 0);
                    }
                }
            } catch (Exception volErr) {
                Log.w(TAG, "Alarm stream volume check skipped: " + volErr.getMessage());
            }

            boolean startedAudio = false;
            if (sound != null) {
                try {
                    Ringtone r = RingtoneManager.getRingtone(appCtx, sound);
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
                        startedAudio = true;
                    }
                } catch (Exception ringErr) {
                    Log.w(TAG, "Ringtone fallback to MediaPlayer: " + ringErr.getMessage());
                }

                if (!startedAudio) {
                    try {
                        MediaPlayer mp = new MediaPlayer();
                        mp.setDataSource(appCtx, sound);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            mp.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build());
                        } else {
                            mp.setAudioStreamType(AudioManager.STREAM_ALARM);
                        }
                        mp.setLooping(true);
                        mp.prepare();
                        mp.start();
                        activeAlarmMediaPlayer = mp;
                    } catch (Exception mpErr) {
                        Log.w(TAG, "MediaPlayer alarm playback error: " + mpErr.getMessage());
                    }
                }
            }
            Vibrator vibrator = (Vibrator) appCtx.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = new long[]{0, 900, 300, 900, 300, 900, 300, 1200};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    AudioAttributes vibAttrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), vibAttrs);
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
            pendingStopRunnable = () -> stopActiveAlarmRingtone(appCtx);
            mainHandler.postDelayed(pendingStopRunnable, durationMs);
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
            .setVibrate(new long[]{0, 900, 300, 900, 300, 900, 300, 1200})
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setDeleteIntent(stopPendingIntent)
            .setOngoing(false)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Ringing", stopPendingIntent);

        if (!callerNumber.isEmpty()) {
            Intent dialIntent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(callerNumber)));
            dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent dialPi = PendingIntent.getActivity(this, notifId + 2, dialIntent, piFlags);
            b.addAction(android.R.drawable.ic_menu_call, "Call Back", dialPi);
        }

        Notification notification = b.build();
        notification.flags |= Notification.FLAG_INSISTENT;

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(notifId, notification);
    }
}
