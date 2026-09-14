package com.safetylink.app.db;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import java.util.List;

@Dao
public interface IncidentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(IncidentEntity incident);

    @Query("UPDATE incidents SET dispatchState = :state WHERE incidentId = :id")
    void updateDispatchState(String id, String state);

    @Query("UPDATE incidents SET syncState = :state WHERE incidentId = :id")
    void updateSyncState(String id, String state);

    @Query("SELECT * FROM incidents WHERE syncState = 'PENDING'")
    List<IncidentEntity> getUnsyncedIncidents();
}
