
package com.aistudio.safetylink.vqnztp.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sms_logs")
data class SmsLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val sessionId: String,
    val recipient: String,
    val message: String,
    val timestamp: Long,
    val status: String
)
