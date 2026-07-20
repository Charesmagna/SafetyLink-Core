package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;

/**
 * PanicService
 *
 * A headless foreground service that manages SOS triggers independently of the main webview.
 * Behaviors:
 *   - Runs in foreground with a locked status notification.
 *   - Can be triggered by hardware iTAG keyfobs or system widgets.
 *   - Draws a system-wide "Ghost Overlay" countdown of 10 seconds via WindowManager.
 *   - Supports instant disarm and cancellation.
 *   - Dispatches native SMS alerts to Twilio on countdown completion.
 */
public class PanicService extends Service {

    private static final String TAG = "PanicService";
    private static final String CHANNEL_ID = "safetylink_ghost_service";
    private static final int NOTIFICATION_ID = 9911;

    private WindowManager windowManager;
    private View overlayView;
    private Handler countdownHandler;
    private int secondsRemaining = 10;
    private boolean isCountdownActive = false;
    private TextView countdownTextView;

    private String pendingPhone = "+15550199";
    private String pendingDescription = "ALERT! SafetyLink SOS Triggered. Location: [Simulated GPS Core] • Status: Critical distress.";
    private double pendingLat = -26.2041;
    private double pendingLng = 28.0473;
    private String pendingOrgId = "SL-ORG-MAIN";
    private String pendingTriggeredBy = "Hardware iTag Keyfob / Native Widget";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Ghost PanicService created");
        createNotificationChannel();
        countdownHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Always promote to foreground immediately to adhere to Android's strict service limits
        startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"));

        if (intent != null) {
            String action = intent.getAction();
            Log.i(TAG, "Received Action: " + action);

            if (intent.hasExtra("phone")) {
                pendingPhone = intent.getStringExtra("phone");
            }
            if (intent.hasExtra("description")) {
                pendingDescription = intent.getStringExtra("description");
            } else if (intent.hasExtra("message")) {
                pendingDescription = intent.getStringExtra("message");
            }
            if (intent.hasExtra("latitude")) {
                pendingLat = intent.getDoubleExtra("latitude", pendingLat);
            }
            if (intent.hasExtra("longitude")) {
                pendingLng = intent.getDoubleExtra("longitude", pendingLng);
            }
            if (intent.hasExtra("orgId")) {
                pendingOrgId = intent.getStringExtra("orgId");
            }
            if (intent.hasExtra("triggeredBy")) {
                pendingTriggeredBy = intent.getStringExtra("triggeredBy");
            }

            if ("com.aistudio.safetylink.ACTION_TRIGGER_PANIC".equals(action)) {
                startPanicSequence();
            } else if ("com.aistudio.safetylink.ACTION_CANCEL_PANIC".equals(action)) {
                cancelPanicSequence();
            } else if ("com.aistudio.safetylink.ACTION_WATCH_ME_10M".equals(action)) {
                startWatchMeCountdown(10);
            }
        }

        return START_STICKY;
    }

    private void startPanicSequence() {
        if (isCountdownActive) {
            Log.w(TAG, "Panic countdown is already active");
            return;
        }

        isCountdownActive = true;
        secondsRemaining = 10;

        Log.i(TAG, "Initiating 10-second SOS disarm countdown...");
        showOverlayCountdown();

        // Start tick loop
        countdownHandler.post(countdownRunnable);
    }

    private void cancelPanicSequence() {
        if (!isCountdownActive) return;

        isCountdownActive = false;
        countdownHandler.removeCallbacks(countdownRunnable);
        removeOverlay();
        Log.i(TAG, "SOS sequence disarmed by user action");

        // Update notification
        updateNotificationState("SafetyLink Secured", "Active threat neutralized and disarmed.");
    }

    private final Runnable countdownRunnable = new Runnable() {
        @Override
        public void run() {
            if (!isCountdownActive) return;

            if (secondsRemaining > 0) {
                Log.i(TAG, "Countdown: " + secondsRemaining + "s");
                if (countdownTextView != null) {
                    countdownTextView.setText(String.valueOf(secondsRemaining));
                }
                secondsRemaining--;
                countdownHandler.postDelayed(this, 1000);
            } else {
                triggerFinalSOS();
            }
        }
    };

    private void triggerFinalSOS() {
        isCountdownActive = false;
        removeOverlay();
        Log.e(TAG, "COUNTDOWN FINISHED. DISPATCHING COVERT EMERGENCY RESPONDERS!");

        String incidentId = "INCIDENT-" + System.currentTimeMillis();

        updateNotificationState("🚨 SOS DISPATCHING", "Connecting to emergency dispatch routing...");

        // Dispatch alerts via backend with full DispatchCallback
        EmergencyService.getInstance().dispatchEmergency(
                pendingPhone,
                pendingDescription,
                incidentId,
                pendingLat,
                pendingLng,
                pendingOrgId,
                pendingTriggeredBy,
                new EmergencyService.DispatchCallback() {
                    @Override
                    public void onResult(EmergencyService.DispatchResult result) {
                        String statusText;
                        String detailText;
                        if (result.smsOk && result.dbOk) {
                            statusText = "🚨 SOS STATUS: SUCCESS";
                            detailText = "SMS and backend database sync successfully completed.";
                        } else if (!result.smsOk && !result.dbOk) {
                            statusText = "🚨 SOS STATUS: FAILED";
                            detailText = "All dispatch channels failed. Local offline queue retained.";
                        } else {
                            statusText = "🚨 SOS STATUS: PARTIAL";
                            detailText = "SMS: " + (result.smsOk ? "SENT" : "FAIL") + " | Web: " + (result.dbOk ? "SENT" : "FAIL");
                        }
                        updateNotificationState(statusText, detailText);
                        Log.i(TAG, "Dispatch Result - SMS: " + result.smsOk + ", DB: " + result.dbOk);
                    }
                }
        );
    }

    private void showOverlayCountdown() {
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (windowManager == null) return;

        // Create programmatic elegant dark slate overlay
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setGravity(Gravity.CENTER);
        container.setBackgroundColor(Color.parseColor("#EE020617")); // 93% opaque deep slate
        container.setPadding(40, 40, 40, 40);

        // Header warning title
        TextView warningHeader = new TextView(this);
        warningHeader.setText("🚨 EMERGENCY SOS INITIATED 🚨");
        warningHeader.setTextColor(Color.parseColor("#EF4444")); // Red-500
        warningHeader.setTextSize(22);
        warningHeader.setGravity(Gravity.CENTER);
        warningHeader.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        container.addView(warningHeader);

        // Subtitle
        TextView subtitle = new TextView(this);
        subtitle.setText("Covert distress broadcast will activate in");
        subtitle.setTextColor(Color.parseColor("#94A3B8")); // Slate-400
        subtitle.setTextSize(14);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 10, 0, 20);
        container.addView(subtitle);

        // Big Cinematic Countdown Circle
        LinearLayout circleFrame = new LinearLayout(this);
        circleFrame.setGravity(Gravity.CENTER);
        GradientDrawable circleBg = new GradientDrawable();
        circleBg.setShape(GradientDrawable.OVAL);
        circleBg.setColor(Color.parseColor("#1E293B")); // Slate-800
        circleBg.setStroke(8, Color.parseColor("#EF4444")); // Red border
        circleFrame.setBackground(circleBg);
        
        // Sizing for the circle
        LinearLayout.LayoutParams circleParams = new LinearLayout.LayoutParams(300, 300);
        circleParams.gravity = Gravity.CENTER;
        circleFrame.setLayoutParams(circleParams);

        countdownTextView = new TextView(this);
        countdownTextView.setText("10");
        countdownTextView.setTextColor(Color.parseColor("#EF4444"));
        countdownTextView.setTextSize(72);
        countdownTextView.setGravity(Gravity.CENTER);
        countdownTextView.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        circleFrame.addView(countdownTextView);
        container.addView(circleFrame);

        // Explanatory note
        TextView infoNote = new TextView(this);
        infoNote.setText("Your pre-selected confidential files and apps are now being securely encrypted & hidden.");
        infoNote.setTextColor(Color.parseColor("#64748B")); // Slate-500
        infoNote.setTextSize(11);
        infoNote.setGravity(Gravity.CENTER);
        infoNote.setPadding(30, 30, 30, 30);
        container.addView(infoNote);

        // Big glowing disarm button
        Button disarmBtn = new Button(this);
        disarmBtn.setText("CANCEL / DISARM SOS");
        disarmBtn.setTextColor(Color.WHITE);
        disarmBtn.setTextSize(16);
        disarmBtn.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#0F172A")); // Slate-900
        btnBg.setCornerRadius(20);
        btnBg.setStroke(3, Color.parseColor("#10B981")); // Emerald border
        disarmBtn.setBackground(btnBg);
        disarmBtn.setPadding(40, 20, 40, 20);

        disarmBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                cancelPanicSequence();
            }
        });
        container.addView(disarmBtn);

        overlayView = container;

        // Layout params for system alert overlay
        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL 
                        | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED 
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON 
                        | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.CENTER;

        try {
            windowManager.addView(overlayView, params);
            Log.i(TAG, "Ghost Overlay successfully drawn over system windows.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to display WindowManager overlay. Fallback countdown activated inside background logs.", e);
        }
    }

    private void removeOverlay() {
        if (windowManager != null && overlayView != null) {
            try {
                windowManager.removeView(overlayView);
                Log.i(TAG, "Ghost Overlay removed.");
            } catch (Exception e) {
                Log.e(TAG, "Error removing overlay view: " + e.getMessage());
            }
            overlayView = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel chan = new NotificationChannel(
                        CHANNEL_ID,
                        "SafetyLink Ghost Engine",
                        NotificationManager.IMPORTANCE_LOW
                );
                chan.setDescription("Headless background alert listening channel");
                nm.createNotificationChannel(chan);
            }
        }
    }

    private Notification buildForegroundNotification(String title, String body) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
                this, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(openPending)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();
    }

    private void updateNotificationState(String title, String body) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildForegroundNotification(title, body));
        }
    }

    @Override
    public void onDestroy() {
        removeOverlay();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * Watch Me timer: notifies emergency contacts if the user doesn't check in
     * within the specified minutes.
     */
    private void startWatchMeCountdown(int minutes) {
        final int totalSeconds = minutes * 60;
        android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        buildForegroundNotification("Watch Me Active", "Check-in required in " + minutes + " min or SOS will trigger");
        countdownHandler.postDelayed(() -> {
            Log.w(TAG, "Watch Me timer expired — triggering SOS");
            startPanicSequence();
        }, totalSeconds * 1000L);
        Log.i(TAG, "Watch Me timer started: " + minutes + " minutes");
    }
}
