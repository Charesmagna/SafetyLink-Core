package com.aistudio.safetylink.vqnztp.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "panic_events")
data class PanicEventEntity(
    @PrimaryKey val id: String,
    val status: String,
    val timestamp: Long
)
