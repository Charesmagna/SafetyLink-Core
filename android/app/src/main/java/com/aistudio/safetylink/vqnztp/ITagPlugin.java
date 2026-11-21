package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.pm.PackageManager;
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
import java.util.List;
import java.util.Set;
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
    private static final UUID SERVICE_UUID = ITagGattManager.SERVICE_UUID;

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bluetoothLeScanner;
    private ScanCallback scanCallback;
    private boolean isScanning = false;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        super.load();
        ITagGattManager manager = ITagGattManager.getInstance(getContext());
        manager.setEventListener(new ITagGattManager.ITagEventListener() {
            @Override
            public void onConnectionStateChanged(String address, String status) {
                JSObject eventObj = new JSObject();
                eventObj.put("address", address);
                eventObj.put("status", status);
                notifyListeners("itag_connection_change", eventObj);
            }

            @Override
            public void onHardwareTriggerPressed(String address, int value) {
                JSObject eventObj = new JSObject();
                eventObj.put("address", address);
                eventObj.put("value", value);
                notifyListeners("hardware_trigger_pressed", eventObj);
            }
        });

        Log.i(TAG, "ITagPlugin loaded: delegating auto-reconnect to headless ITagGattManager");
        handler.postDelayed(() -> ITagGattManager.reconnectBondedDevices(getContext()), 1500);
    }

    @Override
    protected void handleOnDestroy() {
        ITagGattManager.getInstance(getContext()).setEventListener(null);
        super.handleOnDestroy();
    }

    public static void saveBondedMac(Context context, String address) {
        ITagGattManager.saveBondedMac(context, address);
    }

    public static void removeBondedMac(Context context, String address) {
        ITagGattManager.removeBondedMac(context, address);
    }

    public static Set<String> getBondedMacs(Context context) {
        return ITagGattManager.getBondedMacs(context);
    }

    public static void reconnectBondedDevices(Context context) {
        ITagGattManager.reconnectBondedDevices(context);
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
            ITagGattManager.reconnectBondedDevices(getContext());
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

            boolean locationServicesEnabled = true;
            android.location.LocationManager lm = (android.location.LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                boolean gpsEnabled = false;
                boolean networkEnabled = false;
                try {
                    gpsEnabled = lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER);
                } catch (Exception ignored) {}
                try {
                    networkEnabled = lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER);
                } catch (Exception ignored) {}
                locationServicesEnabled = gpsEnabled || networkEnabled;
            }

            if (!locationServicesEnabled) {
                JSObject warnObj = new JSObject();
                warnObj.put("warning", "LOCATION_SERVICES_DISABLED");
                notifyListeners("itag_warning", warnObj);
                Log.w(TAG, "Location services are turned off! BLE scanning results may be empty.");
            }

            List<ScanFilter> filters = new ArrayList<>();
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                bluetoothLeScanner.startScan(filters, settings, scanCallback);
            } else {
                call.reject("Bluetooth scan permission is missing");
                isScanning = false;
                return;
            }

            handler.postDelayed(this::stopScanInternal, 15000);
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
            } catch (Exception e) {
                Log.e(TAG, "Error stopping scan: " + e.getMessage());
            }
            isScanning = false;
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.trim().isEmpty()) {
            call.reject("address is required");
            return;
        }

        BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager == null || bluetoothManager.getAdapter() == null) {
            call.reject("Bluetooth not supported");
            return;
        }

        BluetoothDevice device;
        try {
            device = bluetoothManager.getAdapter().getRemoteDevice(address.trim());
        } catch (IllegalArgumentException e) {
            call.reject("Invalid Bluetooth address: " + address);
            return;
        }

        stopScanInternal();

        ITagGattManager mgr = ITagGattManager.getInstance(getContext());
        if (mgr.isConnected(address.trim())) {
            JSObject ret = new JSObject();
            ret.put("connected", true);
            ret.put("address", address.trim());
            call.resolve(ret);
            return;
        }

        mgr.connectDevice(device, new ITagGattManager.ConnectCallback() {
            @Override
            public void onConnected(String addr) {
                JSObject ret = new JSObject();
                ret.put("connected", true);
                ret.put("address", addr);
                call.resolve(ret);
            }

            @Override
            public void onFailed(String addr, String reason) {
                call.reject(reason != null ? reason : "GATT connection failed");
            }
        });
    }

    @PluginMethod
    public void triggerAlert(PluginCall call) {
        String address = call.getString("address");
        Integer level = call.getInt("level", 2);
        if (address == null) {
            call.reject("address is required");
            return;
        }

        boolean ok = ITagGattManager.getInstance(getContext()).triggerAlert(address, level != null ? level : 2);
        if (ok) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Failed to write Alert Level characteristic or device not connected");
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        String address = call.getString("address");
        boolean unpair = Boolean.TRUE.equals(call.getBoolean("unpair", false));
        if (address == null) {
            call.reject("address is required");
            return;
        }

        ITagGattManager.getInstance(getContext()).disconnectDevice(address, unpair);
        JSObject ret = new JSObject();
        ret.put("disconnected", true);
        if (unpair) ret.put("unpaired", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void forgetDevice(PluginCall call) {
        String address = call.getString("address");
        if (address != null) {
            ITagGattManager.getInstance(getContext()).disconnectDevice(address, true);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getSavedDevices(PluginCall call) {
        Set<String> macs = ITagGattManager.getBondedMacs(getContext());
        JSArray arr = new JSArray();
        for (String m : macs) {
            arr.put(m);
        }
        JSObject ret = new JSObject();
        ret.put("devices", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void getConnectedDevices(PluginCall call) {
        Set<String> connected = ITagGattManager.getInstance(getContext()).getConnectedAddresses();
        JSArray arr = new JSArray();
        for (String addr : connected) {
            arr.put(addr);
        }
        JSObject ret = new JSObject();
        ret.put("devices", arr);
        call.resolve(ret);
    }
}
