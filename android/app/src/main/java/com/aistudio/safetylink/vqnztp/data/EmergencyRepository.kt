
package com.aistudio.safetylink.vqnztp.data

import com.aistudio.safetylink.vqnztp.data.dao.EmergencyDao
import com.aistudio.safetylink.vqnztp.data.entities.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class EmergencyRepository(private val dao: EmergencyDao) {
    suspend fun addContact(contact: Contact) = withContext(Dispatchers.IO) {
        dao.insertContact(contact)
    }

    suspend fun getContacts() = withContext(Dispatchers.IO) {
        dao.getAllContacts()
    }

    suspend fun logSession(session: EmergencySession) = withContext(Dispatchers.IO) {
        dao.insertSession(session)
    }

    suspend fun logLocation(log: LocationLog) = withContext(Dispatchers.IO) {
        dao.insertLocationLog(log)
    }

    suspend fun logSms(log: SmsLog) = withContext(Dispatchers.IO) {
        dao.insertSmsLog(log)
    }
}
