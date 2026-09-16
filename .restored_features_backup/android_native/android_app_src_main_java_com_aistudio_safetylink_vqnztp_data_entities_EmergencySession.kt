
package com.aistudio.safetylink.vqnztp.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "emergency_sessions")
data class EmergencySession(
    @PrimaryKey val sessionId: String,
    val startTime: Long,
    val endTime: Long? = null,
    val status: String
)
