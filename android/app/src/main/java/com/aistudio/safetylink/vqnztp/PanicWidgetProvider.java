package com.aistudio.safetylink.vqnztp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

/**
 * PanicWidgetProvider
 * Exposes a direct quick-panic SOS trigger to the Android system home screen.
 */
public class PanicWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.panic_widget_layout);

            // Directly send intent to the decoupled headless PanicService
            Intent intent = new Intent(context, PanicService.class);
            intent.setAction("com.aistudio.safetylink.ACTION_TRIGGER_PANIC");

            PendingIntent pendingIntent;
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            pendingIntent = PendingIntent.getService(context, 0, intent, flags);

            views.setOnClickPendingIntent(R.id.widget_panic_btn, pendingIntent);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
