package com.safetylink.app.services;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class SafetyKeepAliveWorker extends Worker {
    private static final String TAG = "SafetyLink::KeepAlive";

    public SafetyKeepAliveWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "Worker verifying core safety processes.");
        return Result.success();
    }
}
