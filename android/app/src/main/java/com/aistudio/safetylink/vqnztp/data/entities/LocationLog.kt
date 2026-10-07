
package com.aistudio.safetylink.vqnztp.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "location_logs")
data class LocationLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val sessionId: String,
    val latitude: Double,
    val longitude: Double,
    val timestamp: Long
)
