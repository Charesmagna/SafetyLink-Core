package com.aistudio.safetylink.itag.viewmodel

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aistudio.safetylink.itag.model.AlertDistance
import com.aistudio.safetylink.itag.model.ITagDevice
import com.aistudio.safetylink.itag.model.ITagEvent
import com.aistudio.safetylink.itag.repository.ITagRepository
import com.aistudio.safetylink.itag.service.ITagForegroundService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@SuppressLint("MissingPermission")
class ITagViewModel(application: Application) : AndroidViewModel(application) {

    private val context = application.applicationContext
    private val repository = ITagRepository(context)
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    val scannedDevices: StateFlow<List<ITagDevice>> = repository.scannedDevices
    val connectedDevices: StateFlow<Map<String, ITagDevice>> = repository.connectedDevices
    val events: StateFlow<List<ITagEvent>> = repository.events
    val isScanning: StateFlow<Boolean> = repository.isScanning

    private var lastKnownLocation: Location? = null

    init {
        // Start Foreground Service immediately to ensure background BLE scanning
        val intent = Intent(context, ITagForegroundService::class.java).apply {
            action = ITagForegroundService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }

        // Initialize Location tracking to register coordinates of devices
        initializeLocationTracking()
    }

    fun startScanning() {
        repository.startScanning()
    }

    fun stopScanning() {
        repository.stopScanning()
    }

    fun connectDevice(address: String) {
        viewModelScope.launch {
            repository.connectDevice(address)
            // Bind latest coordinate as last known location on connection
            lastKnownLocation?.let { loc ->
                updateDeviceLocation(address, loc.latitude, loc.longitude)
            }
        }
    }

    fun disconnectDevice(address: String) {
        repository.disconnectDevice(address)
    }

    fun triggerRingDevice(address: String, makeBeep: Boolean) {
        repository.triggerRingDevice(address, makeBeep)
    }

    fun updateSettings(address: String, alertDistance: AlertDistance, linkLost: Boolean, name: String) {
        repository.updateSettings(address, alertDistance, linkLost, name)
    }

    private fun updateDeviceLocation(address: String, lat: Double, lng: Double) {
        val connectedMap = repository.connectedDevices.value.toMutableMap()
        val dev = connectedMap[address]
        if (dev != null) {
            connectedMap[address] = dev.copy(
                lastKnownLatitude = lat,
                lastKnownLongitude = lng,
                lastSeenTimestamp = System.currentTimeMillis()
            )
        }
    }

    private fun initializeLocationTracking() {
        try {
            val gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

            val locationListener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    lastKnownLocation = location
                    // Update location for all connected devices
                    repository.connectedDevices.value.keys.forEach { address ->
                        updateDeviceLocation(address, location.latitude, location.longitude)
                    }
                }
                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            if (gpsEnabled) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    10000L,
                    5f,
                    locationListener
                )
            }
            if (networkEnabled) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    10000L,
                    5f,
                    locationListener
                )
            }
        } catch (e: Exception) {
            Log.e("ITagViewModel", "Failed to start location polling: ${e.message}")
        }
    }

    override fun onCleared() {
        repository.stopScanning()
        super.onCleared()
    }
}
