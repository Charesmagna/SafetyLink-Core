package com.safetylink.app.services;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import com.safetylink.app.db.SafetyLinkDatabase;
import com.safetylink.app.db.IncidentEntity;
import java.util.List;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class SyncWorker extends Worker {
    private static final String TAG = "SafetyLink::SyncWorker";

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        SafetyLinkDatabase db = SafetyLinkDatabase.getDatabase(getApplicationContext());
        List<IncidentEntity> unsynced = db.incidentDao().getUnsyncedIncidents();

        if (unsynced == null || unsynced.isEmpty()) {
            return Result.success();
        }

        boolean allSuccess = true;
        for (IncidentEntity incident : unsynced) {
            try {
                URL url = new URL("https://safetylink.online/api/panic");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                try(OutputStream os = conn.getOutputStream()) {
                    byte[] input = incident.payload.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    db.incidentDao().updateSyncState(incident.incidentId, "SYNCED");
                    Log.d(TAG, "Successfully synced incident: " + incident.incidentId);
                } else {
                    allSuccess = false;
                    Log.e(TAG, "Failed to sync incident: " + incident.incidentId + " Code: " + code);
                }
            } catch (Exception e) {
                Log.e(TAG, "Network error syncing incident", e);
                allSuccess = false;
            }
        }

        return allSuccess ? Result.success() : Result.retry();
    }
}
