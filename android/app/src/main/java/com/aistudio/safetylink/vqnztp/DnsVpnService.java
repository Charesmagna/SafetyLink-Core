package com.aistudio.safetylink.vqnztp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class DnsVpnService extends VpnService {

    private static final String TAG = "SafetyLinkDNS";
    private static final String CHANNEL_ID = "safetylink_dns_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final String DOH_ENDPOINT = "https://dns.safetylink.online/dns-query";

    private ParcelFileDescriptor vpnInterface;
    private ExecutorService executor;
    private volatile boolean running = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP".equals(intent.getAction())) {
            stopVpn();
            return START_NOT_STICKY;
        }
        if (running) return START_NOT_STICKY;
        startVpn();
        return START_STICKY;
    }

    private void startVpn() {
        running = true;
        startForeground(NOTIFICATION_ID, buildNotification());
        Builder builder = new Builder();
        builder.addAddress("10.111.222.1", 32);
        builder.addRoute("10.111.222.1", 32);
        builder.setSession("SafetyLink DNS Shield");
        try {
            vpnInterface = builder.establish();
            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface");
                stopSelf();
                return;
            }
            executor = Executors.newSingleThreadExecutor();
            executor.execute(this::runVpnLoop);
            Log.i(TAG, "SafetyLink DNS Shield VPN started — key icon should be visible");
        } catch (Exception e) {
            Log.e(TAG, "Error starting VPN", e);
            stopSelf();
        }
    }

    private void runVpnLoop() {
        FileInputStream in = new FileInputStream(vpnInterface.getFileDescriptor());
        FileOutputStream out = new FileOutputStream(vpnInterface.getFileDescriptor());
        ByteBuffer packet = ByteBuffer.allocate(32767);
        while (running && !Thread.interrupted()) {
            try {
                packet.clear();
                int length = in.read(packet.array());
                if (length <= 0) continue;
                byte[] data = packet.array();
                int ipVersion = (data[0] >> 4) & 0x0F;
                if (ipVersion == 4) {
                    int protocol = data[9] & 0xFF;
                    if (protocol == 17) {
                        int dstPort = ((data[22] & 0xFF) << 8) | (data[23] & 0xFF);
                        if (dstPort == 53) {
                            byte[] dnsQuery = extractDnsPayload(data, length);
                            byte[] dnsResponse = forwardToDoh(dnsQuery);
                            if (dnsResponse != null) {
                                byte[] responsePacket = buildResponsePacket(data, dnsResponse);
                                out.write(responsePacket);
                            }
                        }
                    }
                }
            } catch (IOException e) {
                if (running) Log.e(TAG, "Error in VPN loop", e);
                break;
            }
        }
    }

    private byte[] forwardToDoh(byte[] dnsQuery) {
        try {
            URL url = new URL(DOH_ENDPOINT);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/dns-message");
            conn.setRequestProperty("Accept", "application/dns-message");
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.getOutputStream().write(dnsQuery);
            if (conn.getResponseCode() == 200) {
                return conn.getInputStream().readAllBytes();
            } else {
                Log.e(TAG, "DoH request failed: " + conn.getResponseCode());
                return null;
            }
        } catch (Exception e) {
            Log.e(TAG, "DoH forward error", e);
            return null;
        }
    }

    private byte[] extractDnsPayload(byte[] ipPacket, int packetLength) {
        int ipHeaderLength = (ipPacket[0] & 0x0F) * 4;
        int udpHeaderLength = 8;
        int dnsOffset = ipHeaderLength + udpHeaderLength;
        int dnsLength = packetLength - dnsOffset;
        byte[] dnsData = new byte[dnsLength];
        System.arraycopy(ipPacket, dnsOffset, dnsData, 0, dnsLength);
        return dnsData;
    }

    private byte[] buildResponsePacket(byte[] originalPacket, byte[] dnsResponse) {
        int ipHeaderLength = (originalPacket[0] & 0x0F) * 4;
        int udpHeaderLength = 8;
        int totalLength = ipHeaderLength + udpHeaderLength + dnsResponse.length;
        byte[] response = new byte[totalLength];
        System.arraycopy(originalPacket, 0, response, 0, ipHeaderLength);
        System.arraycopy(originalPacket, 16, response, 12, 4);
        System.arraycopy(originalPacket, 12, response, 16, 4);
        response[2] = (byte) ((totalLength >> 8) & 0xFF);
        response[3] = (byte) (totalLength & 0xFF);
        response[10] = 0;
        response[11] = 0;
        int checksum = computeIpChecksum(response, ipHeaderLength);
        response[10] = (byte) ((checksum >> 8) & 0xFF);
        response[11] = (byte) (checksum & 0xFF);
        int srcPort = ((originalPacket[22] & 0xFF) << 8) | (originalPacket[23] & 0xFF);
        int dstPort = ((originalPacket[20] & 0xFF) << 8) | (originalPacket[21] & 0xFF);
        response[ipHeaderLength] = (byte) (dstPort >> 8);
        response[ipHeaderLength + 1] = (byte) (dstPort & 0xFF);
        response[ipHeaderLength + 2] = (byte) (srcPort >> 8);
        response[ipHeaderLength + 3] = (byte) (srcPort & 0xFF);
        int udpLength = udpHeaderLength + dnsResponse.length;
        response[ipHeaderLength + 4] = (byte) (udpLength >> 8);
        response[ipHeaderLength + 5] = (byte) (udpLength & 0xFF);
        response[ipHeaderLength + 6] = 0;
        response[ipHeaderLength + 7] = 0;
        System.arraycopy(dnsResponse, 0, response, ipHeaderLength + udpHeaderLength, dnsResponse.length);
        return response;
    }

    private int computeIpChecksum(byte[] header, int length) {
        int sum = 0;
        for (int i = 0; i < length; i += 2) {
            int word = ((header[i] & 0xFF) << 8);
            if (i + 1 < length) word |= (header[i + 1] & 0xFF);
            sum += word;
        }
        while ((sum >> 16) != 0) sum = (sum & 0xFFFF) + (sum >> 16);
        return ~sum & 0xFFFF;
    }

    private void stopVpn() {
        running = false;
        try {
            if (vpnInterface != null) {
                vpnInterface.close();
                vpnInterface = null;
            }
        } catch (IOException e) {
            Log.e(TAG, "Error closing VPN interface", e);
        }
        if (executor != null) {
            executor.shutdownNow();
            executor = null;
        }
        stopForeground(true);
        stopSelf();
        Log.i(TAG, "SafetyLink DNS Shield VPN stopped — key icon should disappear");
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    @Override
    public void onRevoke() {
        stopVpn();
        super.onRevoke();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "SafetyLink DNS Shield", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("DNS filtering is active — your DNS queries are protected");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Intent stopIntent = new Intent(this, DnsVpnService.class);
        stopIntent.setAction("STOP");
        PendingIntent stopPending = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("SafetyLink DNS Shield")
            .setContentText("DNS filtering active — ads, trackers & malware blocked")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPending)
            .build();
    }
}
