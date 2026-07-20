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
import androidx.core.app.NotificationCompat;

public class FloatingWidgetService extends Service {
    private WindowManager windowManager;
    private View floatingView;

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
            .setContentText("Tap to trigger SOS")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build();
        startForeground(9922, notification);
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
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        layoutParams.gravity = Gravity.TOP | Gravity.START;
        layoutParams.x = 0;
        layoutParams.y = 200;

        final FrameLayout container = new FrameLayout(this);
        
        ImageView button = new ImageView(this);
        button.setImageResource(android.R.drawable.ic_dialog_alert);
        button.setBackgroundColor(Color.parseColor("#EF4444"));
        int padding = 30;
        button.setPadding(padding, padding, padding, padding);
        
        container.addView(button);

        button.setOnTouchListener(new View.OnTouchListener() {
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
                        if (!isMoved) {
                            Log.i("FloatingWidget", "Widget clicked! Triggering SOS...");
                            triggerSOS();
                        }
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        int diffX = (int) (event.getRawX() - initialTouchX);
                        int diffY = (int) (event.getRawY() - initialTouchY);
                        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                            isMoved = true;
                        }
                        layoutParams.x = initialX + diffX;
                        layoutParams.y = initialY + diffY;
                        windowManager.updateViewLayout(container, layoutParams);
                        return true;
                }
                return false;
            }
        });

        floatingView = container;
        try {
            windowManager.addView(floatingView, layoutParams);
        } catch (Exception e) {
            Log.e("FloatingWidget", "Failed to add floating widget", e);
        }
    }

    private void triggerSOS() {
        // We might not have PanicService in Java right now, so we will broadcast an intent to be picked up by the plugin or something, or start PanicService if it exists.
        try {
            Intent sosIntent = new Intent(this, Class.forName("com.aistudio.safetylink.vqnztp.PanicService"));
            sosIntent.setAction("START_PANIC");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(sosIntent);
            } else {
                startService(sosIntent);
            }
        } catch (ClassNotFoundException e) {
            Log.e("FloatingWidget", "PanicService not found", e);
        }
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
