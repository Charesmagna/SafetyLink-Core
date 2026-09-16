package com.aistudio.safetylink.vqnztp;

import android.content.Intent;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.VideoView;
import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full screen, no status bar
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        VideoView videoView = new VideoView(this);
        setContentView(videoView);

        Uri videoUri = Uri.parse(
            "android.resource://" + getPackageName() + "/" + R.raw.splash_video
        );
        videoView.setVideoURI(videoUri);

        videoView.setOnCompletionListener(mp -> launchMain());

        videoView.setOnErrorListener((mp, what, extra) -> {
            launchMain();
            return true;
        });

        videoView.start();
    }

    private void launchMain() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
