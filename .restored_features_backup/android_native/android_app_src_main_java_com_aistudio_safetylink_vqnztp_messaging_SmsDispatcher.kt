
package com.aistudio.safetylink.vqnztp.messaging

import android.telephony.SmsManager
import android.content.Context

class SmsDispatcher {
    fun sendMultipartSms(context: Context, phone: String, message: String) {
        val smsManager = SmsManager.getDefault()
        val parts = smsManager.divideMessage(message)
        smsManager.sendMultipartTextMessage(phone, null, parts, null, null)
    }
}
