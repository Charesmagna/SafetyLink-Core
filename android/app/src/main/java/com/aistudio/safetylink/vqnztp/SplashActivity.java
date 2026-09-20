package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.VideoView;
import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {

    private boolean isLaunched = false;
    private Handler fallbackHandler;
    private Runnable fallbackRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immersive sticky fullscreen: hide status bar, navigation bar, remove cuts/margins
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        // FrameLayout with pure black background covering entire screen
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootLayout.setBackgroundColor(0xFF000000);

        VideoView videoView = new VideoView(this);
        FrameLayout.LayoutParams videoParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        videoView.setLayoutParams(videoParams);
        rootLayout.addView(videoView);

        setContentView(rootLayout);

        Uri videoUri = Uri.parse(
            "android.resource://" + getPackageName() + "/" + R.raw.splash_video
        );
        videoView.setVideoURI(videoUri);

        // Scale video to fit and crop edge-to-edge eliminating any gray border line or letterbox
        videoView.setOnPreparedListener(mp -> {
            try {
                mp.setVideoScalingMode(MediaPlayer.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING);
            } catch (Exception e) {
                // Ignore if device does not support scaling mode
            }
        });

        videoView.setOnCompletionListener(mp -> launchMain());

        videoView.setOnErrorListener((mp, what, extra) -> {
            launchMain();
            return true;
        });

        // Safety fallback timer: guarantees launch even if video decoder or hardware stalls
        fallbackHandler = new Handler(Looper.getMainLooper());
        fallbackRunnable = this::launchMain;
        fallbackHandler.postDelayed(fallbackRunnable, 5500);

        videoView.start();
    }

    private synchronized void launchMain() {
        if (isLaunched) return;
        isLaunched = true;
        if (fallbackHandler != null && fallbackRunnable != null) {
            fallbackHandler.removeCallbacks(fallbackRunnable);
        }
        startActivity(new Intent(this, MainActivity.class));
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (fallbackHandler != null && fallbackRunnable != null) {
            fallbackHandler.removeCallbacks(fallbackRunnable);
        }
    }
}
