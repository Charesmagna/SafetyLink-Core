package com.aistudio.safetylink.vqnztp;

import android.content.Context;
import android.content.SharedPreferences;

import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * The single PIN for cancelling a panic and releasing the distress screen.
 * Stored as a salted PBKDF2 hash, so the PIN itself is never kept on the phone.
 */
public final class PinManager {
    private static final String PREFS = "sl_pin";
    private static final int ITERATIONS = 120_000;
    private static final int MAX_FAILS = 5;
    private static final long LOCK_MS = 30_000L;

    private static SharedPreferences p(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    public static boolean isSet(Context c) { return p(c).contains("hash"); }

    /** Returns null if saved, or a message saying why the PIN is not strong enough. */
    public static String setPin(Context c, String pin) {
        if (pin == null || !pin.matches("\\d{4,8}")) return "The PIN must be 4 to 8 digits.";
        if (pin.chars().distinct().count() == 1) return "Do not use one repeated digit.";
        if (isSequential(pin)) return "Do not use a run of digits like 1234 or 4321.";
        if (pin.equals("0000") || pin.equals("1111") || pin.equals("2580")) return "That PIN is too common.";
        try {
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            byte[] hash = derive(pin, salt);
            p(c).edit()
                .putString("salt", toHex(salt))
                .putString("hash", toHex(hash))
                .putInt("fails", 0)
                .apply();
            return null;
        } catch (Exception e) {
            return "Could not save the PIN.";
        }
    }

    /** True if the PIN matches. Locks for 30 seconds after 5 wrong tries. */
    public static boolean verify(Context c, String pin) {
        SharedPreferences sp = p(c);
        long lockedUntil = sp.getLong("locked_until", 0L);
        if (System.currentTimeMillis() < lockedUntil) return false;
        String saltHex = sp.getString("salt", null), hashHex = sp.getString("hash", null);
        if (saltHex == null || hashHex == null || pin == null) return false;
        try {
            boolean ok = MessageDigest.isEqual(derive(pin, fromHex(saltHex)), fromHex(hashHex));
            if (ok) {
                sp.edit().putInt("fails", 0).putLong("locked_until", 0L).apply();
                return true;
            }
            int fails = sp.getInt("fails", 0) + 1;
            sp.edit().putInt("fails", fails)
                .putLong("locked_until", fails >= MAX_FAILS ? System.currentTimeMillis() + LOCK_MS : 0L)
                .apply();
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean isSequential(String pin) {
        boolean up = true, down = true;
        for (int i = 1; i < pin.length(); i++) {
            int d = pin.charAt(i) - pin.charAt(i - 1);
            if (d != 1) up = false;
            if (d != -1) down = false;
        }
        return up || down;
    }

    private static byte[] derive(String pin, byte[] salt) throws Exception {
        javax.crypto.spec.PBEKeySpec spec = new javax.crypto.spec.PBEKeySpec(pin.toCharArray(), salt, ITERATIONS, 256);
        javax.crypto.SecretKeyFactory f = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        return f.generateSecret(spec).getEncoded();
    }

    private static String toHex(byte[] b) {
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02x", x));
        return sb.toString();
    }

    private static byte[] fromHex(String s) {
        byte[] out = new byte[s.length() / 2];
        for (int i = 0; i < out.length; i++) out[i] = (byte) Integer.parseInt(s.substring(2 * i, 2 * i + 2), 16);
        return out;
    }
}
