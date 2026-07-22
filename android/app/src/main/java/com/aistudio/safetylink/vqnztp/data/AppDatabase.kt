
package com.aistudio.safetylink.vqnztp.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.aistudio.safetylink.vqnztp.data.entities.*
import com.aistudio.safetylink.vqnztp.data.dao.*

@Database(entities = [Contact::class, EmergencySession::class, LocationLog::class, SmsLog::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun emergencyDao(): EmergencyDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "safety_link_db"
                )
                .fallbackToDestructiveMigration() // Note: Should use AutoMigrations for prod
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
