package com.safetylink.app.db;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "incidents")
public class IncidentEntity {
    @PrimaryKey
    @NonNull
    public String incidentId;
    public String payload;
    public String dispatchState; 
    public String syncState;     
    public long timestamp;
    public double latitude;
    public double longitude;

    public IncidentEntity(@NonNull String incidentId) {
        this.incidentId = incidentId;
    }
}
