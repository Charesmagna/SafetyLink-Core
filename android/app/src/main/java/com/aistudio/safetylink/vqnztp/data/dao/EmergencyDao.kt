
package com.aistudio.safetylink.vqnztp.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.aistudio.safetylink.vqnztp.data.entities.*

@Dao
interface EmergencyDao {
    @Insert
    suspend fun insertContact(contact: Contact)
    
    @Query("SELECT * FROM contacts")
    suspend fun getAllContacts(): List<Contact>

    @Insert
    suspend fun insertSession(session: EmergencySession)

    @Insert
    suspend fun insertLocationLog(log: LocationLog)

    @Insert
    suspend fun insertSmsLog(log: SmsLog)
}
