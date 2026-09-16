
package com.aistudio.safetylink.vqnztp.hardware

import android.content.Context
import android.location.Location
import android.location.LocationManager

class LocationHelper(private val context: Context) {
    fun getLastKnownLocation(): Location? {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        // Dummy location fetch
        return null
    }
    
    fun generateMapsUrl(lat: Double, lng: Double): String {
        return "https://maps.google.com/?q=$lat,$lng"
    }
}
