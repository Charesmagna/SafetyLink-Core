package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.concurrent.TimeUnit;

/**
 * SafetyKeepAliveWorker
 *
 * Periodic WorkManager watchdog that ensures SafelinkForegroundService and
 * PanicService remain alive. Runs every 15 minutes (WorkManager minimum).
 *
 * Uses exponential backoff (starting at 30 seconds) on failure so transient
 * boot-time race conditions do not flood the scheduler.
 *
 * Enqueue via: SafetyKeepAliveWorker.schedule(context)
 */
public class SafetyKeepAliveWorker extends Worker {
    private static final String TAG = "SafetyKeepAliveWorker";
    public static final String WORK_NAME = "SafetyKeepAlive";

    // Initial backoff delay for retries (exponential, capped by WorkManager at 5 hours)
    private static final long BACKOFF_DELAY_SECONDS = 30L;

    public SafetyKeepAliveWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "KeepAlive tick — run attempt " + getRunAttemptCount());
        Context context = getApplicationContext();

        try {
            Intent serviceIntent = new Intent(context, SafelinkForegroundService.class);
            Intent panicIntent = new Intent(context, PanicService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
                context.startForegroundService(panicIntent);
            } else {
                context.startService(serviceIntent);
                context.startService(panicIntent);
            }

            Log.i(TAG, "KeepAlive completed successfully");
            return Result.success();
        } catch (Exception e) {
            int attempt = getRunAttemptCount();
            Log.e(TAG, "KeepAlive failed (attempt " + attempt + "): " + e.getMessage());
            // Retry with exponential backoff; WorkManager caps at ~5 hours
            return Result.retry();
        }
    }

    /**
     * Schedule (or replace) the periodic keep-alive worker.
     * Safe to call multiple times — uses KEEP policy to avoid duplicates.
     */
    public static void schedule(@NonNull Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiresBatteryNotLow(false) // run even on low battery — this is safety-critical
                .build();

        PeriodicWorkRequest keepAliveRequest = new PeriodicWorkRequest.Builder(
                SafetyKeepAliveWorker.class,
                15, TimeUnit.MINUTES
        )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, BACKOFF_DELAY_SECONDS, TimeUnit.SECONDS)
                .addTag(WORK_NAME)
                .build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                keepAliveRequest
        );

        Log.i(TAG, "KeepAlive worker scheduled (15 min interval, exponential backoff)");
    }

    /**
     * Cancel the keep-alive worker (e.g. user explicitly disables background service).
     */
    public static void cancel(@NonNull Context context) {
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME);
        Log.i(TAG, "KeepAlive worker cancelled");
    }
}
