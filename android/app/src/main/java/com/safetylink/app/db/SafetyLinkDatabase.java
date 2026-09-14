package com.safetylink.app.db;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

@Database(entities = {IncidentEntity.class}, version = 1, exportSchema = false)
public abstract class SafetyLinkDatabase extends RoomDatabase {
    public abstract IncidentDao incidentDao();
    
    private static volatile SafetyLinkDatabase INSTANCE;

    public static SafetyLinkDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (SafetyLinkDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(),
                            SafetyLinkDatabase.class, "safetylink_offline_db")
                            .fallbackToDestructiveMigration()
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
