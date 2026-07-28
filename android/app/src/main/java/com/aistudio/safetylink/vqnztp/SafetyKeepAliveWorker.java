package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class SafetyKeepAliveWorker extends Worker {
    private static final String TAG = "SafetyKeepAliveWorker";

    public SafetyKeepAliveWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "KeepAlive worker tick - Ensuring SafetyLink background services are active");
        Context context = getApplicationContext();

        try {
            // Restart SafelinkForegroundService
            Intent serviceIntent = new Intent(context, SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // Restart PanicService
            Intent panicIntent = new Intent(context, PanicService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(panicIntent);
            } else {
                context.startService(panicIntent);
            }

            Log.i(TAG, "KeepAlive completed successfully");
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error in KeepAlive worker: " + e.getMessage());
            return Result.retry();
        }
    }
}
