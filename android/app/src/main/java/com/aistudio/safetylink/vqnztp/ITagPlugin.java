package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@CapacitorPlugin(
    name = "ITagPlugin",
    permissions = {
        @Permission(
            strings = { Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT },
            alias = "bluetooth"
        ),
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION },
            alias = "location"
        )
    }
)
public class ITagPlugin extends Plugin {

    private static final String TAG = "ITagPlugin";

    // Primary Service UUID for iTAG Button
    private static final UUID SERVICE_UUID = UUID.fromString("0000ffe0-0000-1000-8000-00805f9b34fb");
    // Button notification characteristic
    private static final UUID CHARACTERISTIC_UUID = UUID.fromString("0000ffe1-0000-1000-8000-00805f9b34fb");
    // Client Characteristic Configuration Descriptor UUID
    private static final UUID CLIENT_CHARACTERISTIC_CONFIG_DESCRIPTOR_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    // Immediate Alert Service UUID to make the iTAG beep on demand
    private static final UUID ALERT_SERVICE_UUID = UUID.fromString("00001802-0000-1000-8000-00805f9b34fb");
    private static final UUID ALERT_LEVEL_CHARACTERISTIC_UUID = UUID.fromString("00002a06-0000-1000-8000-00805f9b34fb");

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bluetoothLeScanner;
    private ScanCallback scanCallback;
    private boolean isScanning = false;
    private final Handler handler = new Handler(Looper.getMainLooper());

    // Track multiple connected devices
    private final Map<String, BluetoothGatt> connectedGatts = new HashMap<>();
    private final Map<String, Boolean> isReconnecting = new HashMap<>();
    private final Map<String, Integer> reconnectAttempts = new HashMap<>();
    private android.os.PowerManager.WakeLock wakeLock = null;

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                android.os.PowerManager powerManager = (android.os.PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                if (powerManager != null) {
                    wakeLock = powerManager.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "SafetyLink::ITagBackgroundLock");
                }
            }
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire();
                Log.i(TAG, "WakeLock acquired for background lock screen listening");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error acquiring WakeLock: " + e.getMessage());
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld() && connectedGatts.isEmpty()) {
                wakeLock.release();
                Log.i(TAG, "WakeLock released as no active connections remain");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error releasing WakeLock: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkAndRequestPermissions(PluginCall call) {
        boolean needsBluetooth = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && getPermissionState("bluetooth") != PermissionState.GRANTED;
        boolean needsLocation = getPermissionState("location") != PermissionState.GRANTED;

        if (needsBluetooth || needsLocation) {
            requestAllPermissions(call, "permissionCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        boolean bluetoothGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || getPermissionState("bluetooth") == PermissionState.GRANTED;
        boolean locationGranted = getPermissionState("location") == PermissionState.GRANTED;

        boolean allGranted = bluetoothGranted && locationGranted;
        ret.put("granted", allGranted);

        if (allGranted) {
            call.resolve(ret);
        } else {
            call.reject("Both Bluetooth and Location permissions are required for BLE scanner operation.");
        }
    }

    @PluginMethod
    public void startScan(PluginCall call) {
        BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager == null) {
            call.reject("Bluetooth not supported");
            return;
        }
        bluetoothAdapter = bluetoothManager.getAdapter();
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is disabled or not supported");
            return;
        }

        bluetoothLeScanner = bluetoothAdapter.getBluetoothLeScanner();
        if (bluetoothLeScanner == null) {
            call.reject("Bluetooth LE Scanner not available");
            return;
        }

        if (isScanning) {
            call.resolve();
            return;
        }

        final List<String> foundAddresses = new ArrayList<>();

        scanCallback = new ScanCallback() {
            @Override
            public void onScanResult(int callbackType, ScanResult result) {
                BluetoothDevice device = result.getDevice();
                String name = null;
                try {
                    if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                        name = device.getName();
                    }
                } catch (SecurityException e) {
                    Log.w(TAG, "SecurityException reading device name: " + e.getMessage());
                }

                String recordName = null;
                if (result.getScanRecord() != null) {
                    recordName = result.getScanRecord().getDeviceName();
                }

                String finalName = name;
                if (finalName == null || finalName.isEmpty()) {
                    finalName = recordName;
                }

                String address = device.getAddress();
                if (foundAddresses.contains(address)) {
                    return;
                }

                boolean isItag = false;
                if (finalName != null) {
                    String lowerName = finalName.toLowerCase().trim();
                    if (lowerName.contains("itag") || lowerName.contains("tag") || lowerName.contains("key") || lowerName.contains("beacon") || lowerName.contains("mle-15") || lowerName.contains("tracker") || lowerName.contains("smart")) {
                        isItag = true;
                    }
                }

                if (result.getScanRecord() != null) {
                    List<ParcelUuid> serviceUuids = result.getScanRecord().getServiceUuids();
                    if (serviceUuids != null) {
                        for (ParcelUuid parcelUuid : serviceUuids) {
                            if (parcelUuid.getUuid().equals(SERVICE_UUID)) {
                                isItag = true;
                                break;
                            }
                        }
                    }
                }

                boolean hasName = (finalName != null && !finalName.trim().isEmpty());
                boolean hasServiceUuid = (result.getScanRecord() != null && result.getScanRecord().getServiceUuids() != null && result.getScanRecord().getServiceUuids().contains(new ParcelUuid(SERVICE_UUID)));

                if (hasName || hasServiceUuid) {
                    if (finalName == null || finalName.trim().isEmpty()) {
                        finalName = "iTAG Keyfob";
                    }
                    foundAddresses.add(address);
                    JSObject deviceObj = new JSObject();
                    deviceObj.put("name", finalName);
                    deviceObj.put("address", address);
                    deviceObj.put("rssi", result.getRssi());
                    deviceObj.put("isItag", isItag);

                    JSObject eventObj = new JSObject();
                    eventObj.put("device", deviceObj);
                    notifyListeners("itag_found", eventObj);
                }
            }

            @Override
            public void onScanFailed(int errorCode) {
                Log.e(TAG, "Scan failed with error code: " + errorCode);
            }
        };

        try {
            isScanning = true;
            ScanSettings settings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                    .build();

            // Check if Location Services (GPS) are completely disabled on versions where they're required
            boolean locationServicesEnabled = true;
            android.location.LocationManager lm = (android.location.LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                boolean gpsEnabled = false;
                boolean networkEnabled = false;
                try {
                    gpsEnabled = lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER);
                } catch (Exception ex) {}
                try {
                    networkEnabled = lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER);
                } catch (Exception ex) {}
                locationServicesEnabled = gpsEnabled || networkEnabled;
            }

            if (!locationServicesEnabled) {
                JSObject warnObj = new JSObject();
                warnObj.put("warning", "LOCATION_SERVICES_DISABLED");
                notifyListeners("itag_warning", warnObj);
                Log.w(TAG, "Location services are turned off! BLE scanning results may be empty.");
            }

            List<ScanFilter> filters = new ArrayList<>();
            // Using wide scan for robust name matching and service filtering at runtime
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                bluetoothLeScanner.startScan(filters, settings, scanCallback);
            } else {
                call.reject("Bluetooth scan permission is missing");
                isScanning = false;
                return;
            }

            // Automatically limit scanning duration to 15 seconds
            handler.postDelayed(() -> stopScanInternal(), 15000);

            call.resolve();
        } catch (Exception e) {
            isScanning = false;
            call.reject("Failed to start scan: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopScan(PluginCall call) {
        stopScanInternal();
        call.resolve();
    }

    private void stopScanInternal() {
        if (isScanning && bluetoothLeScanner != null && scanCallback != null) {
            try {
                if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                    bluetoothLeScanner.stopScan(scanCallback);
                }
            } catch (SecurityException e) {
                Log.e(TAG, "SecurityException when stopping scan: " + e.getMessage());
            } catch (Exception e) {
                Log.e(TAG, "Error when stopping scan: " + e.getMessage());
            }
            isScanning = false;
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null) {
            call.reject("address is required");
            return;
        }

        BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager == null) {
            call.reject("Bluetooth not supported");
            return;
        }
        bluetoothAdapter = bluetoothManager.getAdapter();
        if (bluetoothAdapter == null) {
            call.reject("Bluetooth not supported");
            return;
        }

        final BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
        if (device == null) {
            call.reject("Device with address " + address + " not found");
            return;
        }

        stopScanInternal();

        if (connectedGatts.containsKey(address)) {
            JSObject ret = new JSObject();
            ret.put("connected", true);
            ret.put("address", address);
            call.resolve(ret);
            return;
        }

        isReconnecting.put(address, false);
        reconnectAttempts.put(address, 0);

        connectDeviceGatt(device, call);
    }

    private void connectDeviceGatt(final BluetoothDevice device, final PluginCall pendingCall) {
        final String address = device.getAddress();

        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (pendingCall != null) {
                pendingCall.reject("Bluetooth connect permission is required.");
            }
            return;
        }

        BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
            @Override
            public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
                String devAddress = gatt.getDevice().getAddress();
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    Log.i(TAG, "Connected to GATT server on: " + devAddress);
                    connectedGatts.put(devAddress, gatt);
                    isReconnecting.put(devAddress, false);
                    reconnectAttempts.put(devAddress, 0);
                    acquireWakeLock();

                    if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                        gatt.discoverServices();
                    }

                    JSObject eventObj = new JSObject();
                    eventObj.put("address", devAddress);
                    eventObj.put("status", "connected");
                    notifyListeners("itag_connection_change", eventObj);

                    if (pendingCall != null && devAddress.equals(address)) {
                        JSObject ret = new JSObject();
                        ret.put("connected", true);
                        ret.put("address", devAddress);
                        pendingCall.resolve(ret);
                    }

                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    Log.w(TAG, "Disconnected from GATT server on: " + devAddress);
                    connectedGatts.remove(devAddress);
                    releaseWakeLock();
                    gatt.close();

                    // Alert on phone - beep immediately!
                    triggerPhoneWarningBeep();

                    JSObject eventObj = new JSObject();
                    eventObj.put("address", devAddress);
                    eventObj.put("status", "disconnected");
                    notifyListeners("itag_connection_change", eventObj);

                    if (pendingCall != null && devAddress.equals(address)) {
                        pendingCall.reject("GATT connection failed or disconnected.");
                    }

                    Boolean isReconnectingForDevice = isReconnecting.get(devAddress);
                    if (isReconnectingForDevice == null || !isReconnectingForDevice) {
                        attemptAutoReconnect(device);
                    }
                }
            }

            @Override
            public void onServicesDiscovered(BluetoothGatt gatt, int status) {
                String devAddress = gatt.getDevice().getAddress();
                if (status == BluetoothGatt.GATT_SUCCESS) {
                    Log.i(TAG, "Services discovered on: " + devAddress);
                    subscribeToButtonNotifications(gatt);
                } else {
                    Log.w(TAG, "Service discovery failed with status: " + status);
                }
            }

            @Override
            public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
                String devAddress = gatt.getDevice().getAddress();
                if (characteristic.getUuid().equals(CHARACTERISTIC_UUID)) {
                    byte[] val = characteristic.getValue();
                    int byteVal = 0;
                    if (val != null && val.length > 0) {
                        byteVal = val[0] & 0xFF;
                    }

                    Log.i(TAG, "Button pressed on: " + devAddress + ", byte value: " + byteVal);

                    JSObject eventObj = new JSObject();
                    eventObj.put("address", devAddress);
                    eventObj.put("value", byteVal);
                    notifyListeners("hardware_trigger_pressed", eventObj);
                }
            }

            @Override
            public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, byte[] value) {
                String devAddress = gatt.getDevice().getAddress();
                if (characteristic.getUuid().equals(CHARACTERISTIC_UUID)) {
                    int byteVal = 0;
                    if (value != null && value.length > 0) {
                        byteVal = value[0] & 0xFF;
                    }

                    Log.i(TAG, "Button pressed (API 33+) on: " + devAddress + ", byte value: " + byteVal);

                    JSObject eventObj = new JSObject();
                    eventObj.put("address", devAddress);
                    eventObj.put("value", byteVal);
                    notifyListeners("hardware_trigger_pressed", eventObj);
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            device.connectGatt(getContext(), false, gattCallback, BluetoothDevice.TRANSPORT_LE);
        } else {
            device.connectGatt(getContext(), false, gattCallback);
        }
    }

    private void triggerPhoneWarningBeep() {
        try {
            final ToneGenerator toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            handler.post(() -> toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 600));
        } catch (Exception e) {
            Log.e(TAG, "Error playing alarm beep on phone: " + e.getMessage());
        }
    }

    private void attemptAutoReconnect(final BluetoothDevice device) {
        final String address = device.getAddress();
        isReconnecting.put(address, true);

        Integer attemptsObj = reconnectAttempts.get(address);
        final int attempts = (attemptsObj == null) ? 0 : attemptsObj;

        if (attempts < 10) {
            reconnectAttempts.put(address, attempts + 1);
            long delay = Math.min(2000L * (attempts + 1), 15000L);

            Log.i(TAG, "Scheduling auto-reconnect to " + address + " (Attempt " + (attempts + 1) + "/10) in " + delay + "ms");

            handler.postDelayed(() -> {
                Log.i(TAG, "Executing auto-reconnect execution for: " + address);
                if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                    connectDeviceGatt(device, null);
                }
            }, delay);
        } else {
            Log.e(TAG, "Max reconnect attempts reached for " + address + ". Stopping auto-reconnect.");
            isReconnecting.put(address, false);
        }
    }

    private void subscribeToButtonNotifications(BluetoothGatt gatt) {
        BluetoothGattService service = gatt.getService(SERVICE_UUID);
        if (service == null) {
            Log.e(TAG, "iTAG Button Service not found on " + gatt.getDevice().getAddress());
            return;
        }

        BluetoothGattCharacteristic characteristic = service.getCharacteristic(CHARACTERISTIC_UUID);
        if (characteristic == null) {
            Log.e(TAG, "iTAG Button Characteristic not found on " + gatt.getDevice().getAddress());
            return;
        }

        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Log.e(TAG, "Bluetooth connect permission not granted; cannot subscribe.");
            return;
        }

        gatt.setCharacteristicNotification(characteristic, true);

        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_DESCRIPTOR_UUID);
        if (descriptor != null) {
            descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
            gatt.writeDescriptor(descriptor);
            Log.i(TAG, "Successfully written notification descriptor for: " + gatt.getDevice().getAddress());
        } else {
            Log.e(TAG, "Notification descriptor is null for characteristic on: " + gatt.getDevice().getAddress());
        }
    }

    @PluginMethod
    public void triggerAlert(PluginCall call) {
        String address = call.getString("address");
        Integer level = call.getInt("level", 2);
        if (address == null) {
            call.reject("address is required");
            return;
        }

        BluetoothGatt gatt = connectedGatts.get(address);
        if (gatt == null) {
            call.reject("Device " + address + " is not connected");
            return;
        }

        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            call.reject("Bluetooth connect permission is required.");
            return;
        }

        BluetoothGattService service = gatt.getService(ALERT_SERVICE_UUID);
        if (service == null) {
            call.reject("Immediate Alert service not found on device.");
            return;
        }

        BluetoothGattCharacteristic characteristic = service.getCharacteristic(ALERT_LEVEL_CHARACTERISTIC_UUID);
        if (characteristic == null) {
            call.reject("Alert Level characteristic not found on device.");
            return;
        }

        characteristic.setValue(new byte[] { level.byteValue() });
        boolean success = gatt.writeCharacteristic(characteristic);
        if (success) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Failed to write Alert Level characteristic");
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        String address = call.getString("address");
        if (address == null) {
            call.reject("address is required");
            return;
        }

        BluetoothGatt gatt = connectedGatts.get(address);
        if (gatt != null) {
            isReconnecting.put(address, false);
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                gatt.disconnect();
            }
            connectedGatts.remove(address);
            releaseWakeLock();
            JSObject ret = new JSObject();
            ret.put("disconnected", true);
            call.resolve(ret);
        } else {
            call.reject("Device was not connected");
        }
    }

    @PluginMethod
    public void getConnectedDevices(PluginCall call) {
        JSArray arr = new JSArray();
        for (String addr : connectedGatts.keySet()) {
            arr.put(addr);
        }
        JSObject ret = new JSObject();
        ret.put("devices", arr);
        call.resolve(ret);
    }
}
