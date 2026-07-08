package com.aistudio.safetylink.itag.utils

import android.util.Log

data class IBeaconData(
    val uuid: String,
    val major: Int,
    val minor: Int,
    val txPower: Int
)

object IBeaconParser {
    private const val TAG = "IBeaconParser"

    /**
     * Parses a raw BLE scan record payload to extract iBeacon data if available.
     * standard iBeacon structure starts at offset inside scanRecord with:
     * - byte 0: length of flags (usually 0x02)
     * - byte 1: type of flags (usually 0x01)
     * - byte 2: flag values
     * - byte 3: length of manufacture specific data (usually 0x1A)
     * - byte 4: type of manufacture specific data (always 0xFF)
     * - byte 5-6: company ID (Apple is 0x004C)
     * - byte 7: sub-type (always 0x02 for iBeacon)
     * - byte 8: length of remaining iBeacon fields (always 0x15)
     * - byte 9-24: proximity UUID
     * - byte 25-26: major
     * - byte 27-28: minor
     * - byte 29: calibrated TX power at 1 meter
     */
    fun parse(scanRecord: ByteArray?): IBeaconData? {
        if (scanRecord == null || scanRecord.size < 30) return null

        var startByte = 2
        while (startByte <= 5) {
            if ((scanRecord[startByte].toInt() and 0xff == 0x4c) && 
                (scanRecord[startByte + 1].toInt() and 0xff == 0x00) && 
                (scanRecord[startByte + 2].toInt() and 0xff == 0x02) && 
                (scanRecord[startByte + 3].toInt() and 0xff == 0x15)) {
                
                val uuidBytes = ByteArray(16)
                System.arraycopy(scanRecord, startByte + 4, uuidBytes, 0, 16)
                val uuid = bytesToUuidString(uuidBytes)
                
                val major = ((scanRecord[startByte + 20].toInt() and 0xff) shl 8) or 
                            (scanRecord[startByte + 21].toInt() and 0xff)
                            
                val minor = ((scanRecord[startByte + 22].toInt() and 0xff) shl 8) or 
                            (scanRecord[startByte + 23].toInt() and 0xff)
                            
                val txPower = scanRecord[startByte + 24].toInt()
                
                return IBeaconData(uuid, major, minor, txPower)
            }
            startByte++
        }
        return null
    }

    private fun bytesToUuidString(bytes: ByteArray): String {
        val sb = StringBuilder()
        for (i in bytes.indices) {
            if (i == 4 || i == 6 || i == 8 || i == 10) {
                sb.append("-")
            }
            sb.append(String.format("%02x", bytes[i]))
        }
        return sb.toString()
    }
}
