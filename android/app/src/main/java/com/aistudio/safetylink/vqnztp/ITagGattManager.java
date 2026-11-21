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
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import java.util.ArrayDeque;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ITagGattManager
 *
 * Headless ApplicationContext singleton managing BLE GATT connections, sequential CCCD
 * descriptor subscriptions, auto-reconnect, press debouncing, and immediate hardware panic
 * execution even when MainActivity / WebView is closed.
 */
public final class ITagGattManager {
    private static final String TAG = "ITagGattManager";
    public static final String PREFS_NAME = "safetylink_itag_prefs";
    public static final String KEY_BONDED_MACS = "bonded_itag_macs";

    // Primary Service & Characteristic UUID for standard iTAG keyfobs
    public static final UUID SERVICE_UUID = UUID.fromString("0000ffe0-0000-1000-8000-00805f9b34fb");
    public static final UUID CHARACTERISTIC_UUID = UUID.fromString("0000ffe1-0000-1000-8000-00805f9b34fb");
    public static final UUID CLIENT_CHARACTERISTIC_CONFIG_DESCRIPTOR_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    // Standard non-trigger UUIDs to exclude from automatic notify fallback
    private static final UUID BATTERY_LEVEL_UUID = UUID.fromString("00002a19-0000-1000-8000-00805f9b34fb");
    private static final UUID ALERT_SERVICE_UUID = UUID.fromString("00001802-0000-1000-8000-00805f9b34fb");
    private static final UUID ALERT_LEVEL_CHARACTERISTIC_UUID = UUID.fromString("00002a06-0000-1000-8000-00805f9b34fb");
    private static final UUID SERVICE_CHANGED_UUID = UUID.fromString("00002a05-0000-1000-8000-00805f9b34fb");

    private static volatile ITagGattManager instance;

    private final Context appContext;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Map<String, BluetoothGatt> connectedGatts = new ConcurrentHashMap<>();
    private final Map<String, Boolean> isReconnecting = new ConcurrentHashMap<>();
    private final Map<String, Integer> reconnectAttempts = new ConcurrentHashMap<>();
    private final Map<String, Queue<DescriptorWriteOp>> descriptorQueues = new ConcurrentHashMap<>();
    private final Map<String, Boolean> descriptorWriteInFlight = new ConcurrentHashMap<>();
    private final Map<String, Set<UUID>> subscribedCharacteristics = new ConcurrentHashMap<>();
    private final Map<String, Long> lastAcceptedPressMs = new ConcurrentHashMap<>();
    private final Map<String, Long> lastNonZeroPressMs = new ConcurrentHashMap<>();
    private final Map<String, Boolean> hasSeenNonZero = new ConcurrentHashMap<>();
    private final Map<String, ConnectCallback> pendingCallbacks = new ConcurrentHashMap<>();

    private PowerManager.WakeLock wakeLock;
    private volatile ITagEventListener eventListener;

    public interface ITagEventListener {
        void onConnectionStateChanged(String address, String status);
        void onHardwareTriggerPressed(String address, int value);
    }

    public interface ConnectCallback {
        void onConnected(String address);
        void onFailed(String address, String reason);
    }

    private static final class DescriptorWriteOp {
        final BluetoothGattDescriptor descriptor;
        final byte[] value;

        DescriptorWriteOp(BluetoothGattDescriptor descriptor, byte[] value) {
            this.descriptor = descriptor;
            this.value = value;
        }
    }

    private ITagGattManager(Context ctx) {
        this.appContext = ctx.getApplicationContext();
    }

    public static ITagGattManager getInstance(Context ctx) {
        if (instance == null) {
            synchronized (ITagGattManager.class) {
                if (instance == null) {
                    instance = new ITagGattManager(ctx);
                }
            }
        }
        return instance;
    }

    public void setEventListener(ITagEventListener listener) {
        this.eventListener = listener;
    }

    public static boolean hasConnectPermission(Context ctx) {
        if (ctx == null) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        return ActivityCompat.checkSelfPermission(ctx, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    public static void saveBondedMac(Context context, String address) {
        if (context == null || address == null || address.trim().isEmpty()) return;
        try {
            SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> set = new HashSet<>(prefs.getStringSet(KEY_BONDED_MACS, new HashSet<>()));
            set.add(address.trim());
            prefs.edit().putStringSet(KEY_BONDED_MACS, set).apply();
            Log.i(TAG, "Persisted bonded iTAG MAC: " + address);
        } catch (Exception e) {
            Log.e(TAG, "Error saving bonded MAC: " + e.getMessage());
        }
    }

    public static void removeBondedMac(Context context, String address) {
        if (context == null || address == null) return;
        try {
            SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> set = new HashSet<>(prefs.getStringSet(KEY_BONDED_MACS, new HashSet<>()));
            set.remove(address.trim());
            prefs.edit().putStringSet(KEY_BONDED_MACS, set).apply();
            Log.i(TAG, "Removed bonded iTAG MAC: " + address);
        } catch (Exception e) {
            Log.e(TAG, "Error removing bonded MAC: " + e.getMessage());
        }
    }

    public static Set<String> getBondedMacs(Context context) {
        if (context == null) return Collections.emptySet();
        try {
            SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return new HashSet<>(prefs.getStringSet(KEY_BONDED_MACS, Collections.emptySet()));
        } catch (Exception e) {
            return Collections.emptySet();
        }
    }

    public static void reconnectBondedDevices(Context context) {
        if (context == null) return;
        Context appCtx = context.getApplicationContext();
        Set<String> macs = getBondedMacs(appCtx);
        if (macs.isEmpty()) {
            Log.i(TAG, "No bonded iTAG MACs stored for auto-reconnect.");
            return;
        }
        if (!hasConnectPermission(appCtx)) {
            Log.w(TAG, "BLUETOOTH_CONNECT permission missing; deferring bonded iTAG reconnect.");
            return;
        }
        BluetoothManager bm = (BluetoothManager) appCtx.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bm == null) return;
        BluetoothAdapter adapter = bm.getAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            Log.w(TAG, "Bluetooth disabled; awaiting activation before reconnecting iTAGs.");
            return;
        }
        ITagGattManager mgr = getInstance(appCtx);
        for (String mac : macs) {
            if (!mgr.isConnected(mac)) {
                try {
                    BluetoothDevice dev = adapter.getRemoteDevice(mac);
                    if (dev != null) {
                        Log.i(TAG, "Headless auto-reconnecting bonded iTAG: " + mac);
                        mgr.connectDevice(dev, null);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Auto-reconnect error for " + mac + ": " + e.getMessage());
                }
            }
        }
    }

    public boolean isConnected(String address) {
        return address != null && connectedGatts.containsKey(address);
    }

    public Set<String> getConnectedAddresses() {
        return new HashSet<>(connectedGatts.keySet());
    }

    public void connectDevice(BluetoothDevice device, ConnectCallback callback) {
        if (device == null) {
            if (callback != null) callback.onFailed("", "Device is null");
            return;
        }
        final String address = device.getAddress();
        if (!hasConnectPermission(appContext)) {
            if (callback != null) callback.onFailed(address, "Bluetooth connect permission is required.");
            return;
        }
        if (connectedGatts.containsKey(address)) {
            if (callback != null) callback.onConnected(address);
            return;
        }
        isReconnecting.put(address, false);
        reconnectAttempts.put(address, 0);
        if (callback != null) {
            pendingCallbacks.put(address, callback);
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                device.connectGatt(appContext, true, createGattCallback(), BluetoothDevice.TRANSPORT_LE);
            } else {
                device.connectGatt(appContext, true, createGattCallback());
            }
        } catch (SecurityException se) {
            pendingCallbacks.remove(address);
            if (callback != null) callback.onFailed(address, se.getMessage());
        } catch (Exception e) {
            pendingCallbacks.remove(address);
            if (callback != null) callback.onFailed(address, e.getMessage());
        }
    }

    public void disconnectDevice(String address, boolean unpair) {
        if (address == null) return;
        if (unpair) {
            removeBondedMac(appContext, address);
        }
        isReconnecting.put(address, true); // suppress auto-reconnect loop after explicit disconnect
        BluetoothGatt gatt = connectedGatts.remove(address);
        descriptorQueues.remove(address);
        descriptorWriteInFlight.remove(address);
        subscribedCharacteristics.remove(address);
        if (gatt != null) {
            try {
                if (hasConnectPermission(appContext)) {
                    gatt.disconnect();
                    gatt.close();
                }
            } catch (Exception ignored) {}
        }
        releaseWakeLock();
    }

    public boolean triggerAlert(String address, int level) {
        BluetoothGatt gatt = connectedGatts.get(address);
        if (gatt == null || !hasConnectPermission(appContext)) return false;
        BluetoothGattService service = gatt.getService(ALERT_SERVICE_UUID);
        if (service == null) return false;
        BluetoothGattCharacteristic characteristic = service.getCharacteristic(ALERT_LEVEL_CHARACTERISTIC_UUID);
        if (characteristic == null) return false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                int code = gatt.writeCharacteristic(characteristic, new byte[]{ (byte) level }, BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE);
                return code == android.bluetooth.BluetoothStatusCodes.SUCCESS;
            } else {
                characteristic.setValue(new byte[]{ (byte) level });
                return gatt.writeCharacteristic(characteristic);
            }
        } catch (Exception e) {
            Log.e(TAG, "triggerAlert write error: " + e.getMessage());
            return false;
        }
    }

    private BluetoothGattCallback createGattCallback() {
        return new BluetoothGattCallback() {
            @Override
            public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
                BluetoothDevice dev = gatt.getDevice();
                if (dev == null) return;
                String devAddress = dev.getAddress();

                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    Log.i(TAG, "Headless GATT connected: " + devAddress);
                    connectedGatts.put(devAddress, gatt);
                    isReconnecting.put(devAddress, false);
                    reconnectAttempts.put(devAddress, 0);
                    acquireWakeLock();
                    saveBondedMac(appContext, devAddress);

                    if (hasConnectPermission(appContext)) {
                        try {
                            gatt.requestConnectionPriority(BluetoothGatt.CONNECTION_PRIORITY_HIGH);
                            gatt.discoverServices();
                        } catch (SecurityException se) {
                            Log.w(TAG, "SecurityException discovering services: " + se.getMessage());
                        }
                    }

                    if (eventListener != null) {
                        eventListener.onConnectionStateChanged(devAddress, "connected");
                    }
                    ConnectCallback cb = pendingCallbacks.remove(devAddress);
                    if (cb != null) cb.onConnected(devAddress);
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    Log.w(TAG, "Headless GATT disconnected: " + devAddress + " (status=" + status + ")");
                    boolean wasExplicit = Boolean.TRUE.equals(isReconnecting.get(devAddress));
                    connectedGatts.remove(devAddress);
                    descriptorQueues.remove(devAddress);
                    descriptorWriteInFlight.remove(devAddress);
                    subscribedCharacteristics.remove(devAddress);
                    releaseWakeLock();

                    try {
                        if (hasConnectPermission(appContext)) gatt.close();
                    } catch (Exception ignored) {}

                    if (!wasExplicit) {
                        triggerPhoneWarningBeep();
                    }

                    if (eventListener != null) {
                        eventListener.onConnectionStateChanged(devAddress, "disconnected");
                    }
                    ConnectCallback cb = pendingCallbacks.remove(devAddress);
                    if (cb != null) cb.onFailed(devAddress, "GATT connection failed or disconnected.");

                    if (!wasExplicit && getBondedMacs(appContext).contains(devAddress)) {
                        attemptAutoReconnect(dev);
                    }
                }
            }

            @Override
            public void onServicesDiscovered(BluetoothGatt gatt, int status) {
                String devAddress = gatt.getDevice().getAddress();
                if (status == BluetoothGatt.GATT_SUCCESS) {
                    Log.i(TAG, "Services discovered on " + devAddress + " — queueing button notifications");
                    enqueueAllButtonSubscriptions(gatt);
                } else {
                    Log.w(TAG, "Service discovery failed for " + devAddress + " status=" + status);
                }
            }

            @Override
            public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
                String devAddress = gatt.getDevice().getAddress();
                Log.d(TAG, "Descriptor written on " + devAddress + " status=" + status);
                descriptorWriteInFlight.put(devAddress, false);
                writeNextDescriptor(gatt);
            }

            @Override
            @SuppressWarnings("deprecation")
            public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
                byte[] val = characteristic.getValue();
                handleButtonNotification(gatt, characteristic, val);
            }

            @Override
            public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, byte[] value) {
                handleButtonNotification(gatt, characteristic, value);
            }
        };
    }

    @SuppressWarnings("deprecation")
    private void enqueueAllButtonSubscriptions(BluetoothGatt gatt) {
        if (!hasConnectPermission(appContext)) return;
        String devAddress = gatt.getDevice().getAddress();
        Queue<DescriptorWriteOp> queue = new ArrayDeque<>();
        Set<UUID> subUuids = Collections.synchronizedSet(new HashSet<>());
        Set<UUID> seenUuids = new HashSet<>();

        // 1. Prioritize standard iTAG FFE0/FFE1
        BluetoothGattService primaryService = gatt.getService(SERVICE_UUID);
        if (primaryService != null) {
            BluetoothGattCharacteristic primaryChar = primaryService.getCharacteristic(CHARACTERISTIC_UUID);
            if (primaryChar != null) {
                addSubscriptionOp(gatt, primaryChar, queue, subUuids, seenUuids);
            }
        }

        // 2. Fallback: enqueue every other custom NOTIFY / INDICATE button characteristic
        for (BluetoothGattService svc : gatt.getServices()) {
            for (BluetoothGattCharacteristic ch : svc.getCharacteristics()) {
                UUID uuid = ch.getUuid();
                if (seenUuids.contains(uuid)) continue;
                if (BATTERY_LEVEL_UUID.equals(uuid) || ALERT_LEVEL_CHARACTERISTIC_UUID.equals(uuid) || SERVICE_CHANGED_UUID.equals(uuid)) {
                    continue;
                }
                int props = ch.getProperties();
                boolean hasNotify = (props & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0;
                boolean hasIndicate = (props & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0;
                if (hasNotify || hasIndicate) {
                    addSubscriptionOp(gatt, ch, queue, subUuids, seenUuids);
                }
            }
        }

        subscribedCharacteristics.put(devAddress, subUuids);
        descriptorQueues.put(devAddress, queue);
        descriptorWriteInFlight.put(devAddress, false);
        writeNextDescriptor(gatt);
    }

    private void addSubscriptionOp(
            BluetoothGatt gatt,
            BluetoothGattCharacteristic ch,
            Queue<DescriptorWriteOp> queue,
            Set<UUID> subUuids,
            Set<UUID> seenUuids
    ) {
        try {
            seenUuids.add(ch.getUuid());
            subUuids.add(ch.getUuid());
            gatt.setCharacteristicNotification(ch, true);
            BluetoothGattDescriptor desc = ch.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_DESCRIPTOR_UUID);
            if (desc != null) {
                int props = ch.getProperties();
                boolean hasNotify = (props & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0;
                byte[] val = hasNotify
                        ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                        : BluetoothGattDescriptor.ENABLE_INDICATION_VALUE;
                queue.add(new DescriptorWriteOp(desc, val));
            }
        } catch (SecurityException se) {
            Log.w(TAG, "SecurityException enabling notification on " + ch.getUuid() + ": " + se.getMessage());
        }
    }

    @SuppressWarnings("deprecation")
    private synchronized void writeNextDescriptor(BluetoothGatt gatt) {
        String devAddress = gatt.getDevice().getAddress();
        if (Boolean.TRUE.equals(descriptorWriteInFlight.get(devAddress))) return;
        Queue<DescriptorWriteOp> queue = descriptorQueues.get(devAddress);
        if (queue == null || queue.isEmpty()) return;
        if (!hasConnectPermission(appContext)) return;

        DescriptorWriteOp op = queue.poll();
        if (op == null) return;
        descriptorWriteInFlight.put(devAddress, true);
        try {
            boolean ok;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                int code = gatt.writeDescriptor(op.descriptor, op.value);
                ok = (code == android.bluetooth.BluetoothStatusCodes.SUCCESS);
            } else {
                op.descriptor.setValue(op.value);
                ok = gatt.writeDescriptor(op.descriptor);
            }
            if (!ok) {
                descriptorWriteInFlight.put(devAddress, false);
                handler.postDelayed(() -> writeNextDescriptor(gatt), 120);
            }
        } catch (Exception e) {
            Log.w(TAG, "Descriptor write failed on " + devAddress + ": " + e.getMessage());
            descriptorWriteInFlight.put(devAddress, false);
            handler.postDelayed(() -> writeNextDescriptor(gatt), 120);
        }
    }

    private void handleButtonNotification(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, byte[] value) {
        String devAddress = gatt.getDevice().getAddress();
        UUID charUuid = characteristic.getUuid();
        Set<UUID> subs = subscribedCharacteristics.get(devAddress);
        if (subs != null && !subs.contains(charUuid) && !CHARACTERISTIC_UUID.equals(charUuid)) {
            return;
        }

        int byteVal = (value != null && value.length > 0) ? (value[0] & 0xFF) : 0;
        String key = devAddress + ":" + charUuid;
        long now = System.currentTimeMillis();

        // Filter release packet (0x00) immediately following non-zero button press packet
        if (byteVal != 0) {
            hasSeenNonZero.put(key, true);
            lastNonZeroPressMs.put(key, now);
        } else if (Boolean.TRUE.equals(hasSeenNonZero.get(key))) {
            Long lastNz = lastNonZeroPressMs.get(key);
            if (lastNz != null && (now - lastNz) < 600L) {
                Log.d(TAG, "Filtered iTAG release packet (0x00) within " + (now - lastNz) + "ms on " + devAddress);
                return;
            }
        }

        // Filter physical key switch bounce (< 250ms between accepted presses)
        Long prevAccepted = lastAcceptedPressMs.get(key);
        if (prevAccepted != null && (now - prevAccepted) < 250L) {
            Log.d(TAG, "Filtered switch bounce within " + (now - prevAccepted) + "ms on " + devAddress);
            return;
        }
        lastAcceptedPressMs.put(key, now);

        Log.i(TAG, "Accepted iTAG press on " + devAddress + " char=" + charUuid + " byte=" + byteVal);
        acquireWakeLock();

        // Execute canonical native pattern detection & PanicService pipeline directly
        ButtonPatternDetector.onPress(appContext, devAddress);

        if (eventListener != null) {
            eventListener.onHardwareTriggerPressed(devAddress, byteVal);
        }
    }

    private void attemptAutoReconnect(final BluetoothDevice device) {
        final String address = device.getAddress();
        isReconnecting.put(address, true);

        Integer attemptsObj = reconnectAttempts.get(address);
        final int attempts = (attemptsObj == null) ? 0 : attemptsObj;
        reconnectAttempts.put(address, attempts + 1);

        long delay = Math.min(2000L * Math.min(attempts + 1, 12), 25000L);
        Log.i(TAG, "Scheduling headless auto-reconnect to " + address + " (attempt " + (attempts + 1) + ") in " + delay + "ms");

        handler.postDelayed(() -> {
            isReconnecting.put(address, false);
            BluetoothManager bm = (BluetoothManager) appContext.getSystemService(Context.BLUETOOTH_SERVICE);
            if (bm == null || bm.getAdapter() == null || !bm.getAdapter().isEnabled()) {
                Log.w(TAG, "Bluetooth off; awaiting STATE_ON receiver before reconnecting " + address);
                return;
            }
            if (!getBondedMacs(appContext).contains(address)) {
                return;
            }
            if (hasConnectPermission(appContext)) {
                connectDevice(device, null);
            }
        }, delay);
    }

    private void triggerPhoneWarningBeep() {
        try {
            handler.post(() -> {
                try {
                    ToneGenerator toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
                    toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 600);
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) appContext.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SafetyLink::ITagBackgroundLock");
                }
            }
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(10 * 60 * 1000L);
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock acquire note: " + e.getMessage());
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld() && connectedGatts.isEmpty()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {}
    }
}
