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
import android.graphics.PorterDuff;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;

public class FloatingWidgetService extends Service {
    private WindowManager windowManager;
    private View floatingView;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.w("FloatingWidget", "Task removed - rescheduling widget service restart");
        Intent restartIntent = new Intent(getApplicationContext(), FloatingWidgetService.class);
        restartIntent.setPackage(getPackageName());
        PendingIntent restartPending = PendingIntent.getService(
                getApplicationContext(),
                2,
                restartIntent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        android.app.AlarmManager alarmManager =
                (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.set(
                    android.app.AlarmManager.RTC_WAKEUP,
                    System.currentTimeMillis() + 2000,
                    restartPending
            );
        }
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, "floating_widget_channel")
            .setContentTitle("SafetyLink Widget Active")
            .setContentText("Emergency controls overlay is active")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(9922, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } catch (Exception e) {
                startForeground(9922, notification);
            }
        } else {
            startForeground(9922, notification);
        }

        showFloatingWidget();
    }

    private void showFloatingWidget() {
        if (floatingView != null) return;
        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        final WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
            PixelFormat.TRANSLUCENT
        );

        layoutParams.gravity = Gravity.TOP | Gravity.START;
        layoutParams.x = 0;
        layoutParams.y = 300;

        floatingView = LayoutInflater.from(this).inflate(R.layout.floating_widget_modern, null);

        ImageView iconWifi = floatingView.findViewById(R.id.icon_wifi);
        ImageView iconBluetooth = floatingView.findViewById(R.id.icon_bluetooth);
        ImageView iconRefresh = floatingView.findViewById(R.id.icon_refresh);
        FrameLayout btnSos = floatingView.findViewById(R.id.btn_sos);

        iconWifi.setColorFilter(Color.parseColor("#34D399"), PorterDuff.Mode.SRC_IN);
        iconBluetooth.setColorFilter(Color.parseColor("#60A5FA"), PorterDuff.Mode.SRC_IN);
        iconRefresh.setColorFilter(Color.parseColor("#CBD5E1"), PorterDuff.Mode.SRC_IN);

        floatingView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX = 0;
            private int initialY = 0;
            private float initialTouchX = 0f;
            private float initialTouchY = 0f;
            private boolean isMoved = false;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = layoutParams.x;
                        initialY = layoutParams.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isMoved = false;
                        return true;
                    case MotionEvent.ACTION_UP:
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        int diffX = (int) (event.getRawX() - initialTouchX);
                        int diffY = (int) (event.getRawY() - initialTouchY);
                        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                            isMoved = true;
                        }
                        layoutParams.x = initialX + diffX;
                        layoutParams.y = initialY + diffY;
                        windowManager.updateViewLayout(floatingView, layoutParams);
                        return true;
                }
                return false;
            }
        });

        iconRefresh.setOnClickListener(v -> {
            Log.i("FloatingWidget", "Refresh Clicked! Starting BLE Service...");
            Intent serviceIntent = new Intent(this, SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        });

        btnSos.setOnClickListener(v -> {
            Log.i("FloatingWidget", "SOS Button Clicked!");
            triggerSOS();
        });

        try {
            windowManager.addView(floatingView, layoutParams);
        } catch (Exception e) {
            Log.e("FloatingWidget", "Failed to add floating widget", e);
        }
    }

    private void triggerSOS() {
        try {
            Intent sosIntent = new Intent(this, Class.forName("com.aistudio.safetylink.vqnztp.PanicService"));
            sosIntent.setAction("com.aistudio.safetylink.ACTION_TRIGGER_PANIC");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(sosIntent);
            } else {
                startService(sosIntent);
            }
        } catch (ClassNotFoundException e) {
            Log.e("FloatingWidget", "PanicService not found", e);
        }
        
        // Also wake up MainActivity to show SOS overlay immediately
        Intent wakeIntent = new Intent(this, MainActivity.class);
        wakeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        wakeIntent.putExtra("sos_triggered", true);
        startActivity(wakeIntent);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingView != null) {
            windowManager.removeView(floatingView);
            floatingView = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "floating_widget_channel",
                "SafetyLink Floating Widget",
                NotificationManager.IMPORTANCE_MIN
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
