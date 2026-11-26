package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.view.WindowManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "SafetyLinkEmergency")
public class SafetyLinkBridgePlugin extends Plugin {
    private static final String TAG = "SafetyLinkBridge";
    private static SafetyLinkBridgePlugin instance;
    private static volatile EmergencyService.DispatchResult lastDispatchResult = null;
    private TextToSpeech nativeTts;
    private volatile boolean ttsReady = false;
    private SpeechRecognizer activeRecognizer;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        super.load();
        instance = this;
        initNativeTts();
        Log.i(TAG, "SafetyLinkBridgePlugin initialized and registered");
    }

    private void initNativeTts() {
        mainHandler.post(() -> {
            try {
                if (nativeTts != null) return;
                nativeTts = new TextToSpeech(getContext().getApplicationContext(), status -> {
                    if (status == TextToSpeech.SUCCESS && nativeTts != null) {
                        int langRes = nativeTts.setLanguage(Locale.US);
                        if (langRes == TextToSpeech.LANG_MISSING_DATA || langRes == TextToSpeech.LANG_NOT_SUPPORTED) {
                            nativeTts.setLanguage(Locale.getDefault());
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            nativeTts.setAudioAttributes(new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_ASSISTANT)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build());
                        }
                        nativeTts.setSpeechRate(0.96f);
                        ttsReady = true;
                        Log.i(TAG, "Native Android TextToSpeech ready");
                    }
                });
            } catch (Exception e) {
                Log.w(TAG, "Native TTS init note: " + e.getMessage());
            }
        });
    }

    public static SafetyLinkBridgePlugin getInstance() {
        return instance;
    }

    public void recordLastResult(EmergencyService.DispatchResult result) {
        lastDispatchResult = result;
    }

    @PluginMethod
    public void trigger(PluginCall call) {
        String description = call.getString("description", "Software Emergency SOS Trigger");
        String phone = call.getString("phone", "");
        String phones = call.getString("phones", "");
        double lat = call.getDouble("latitude", 0.0);
        double lng = call.getDouble("longitude", 0.0);
        String orgId = call.getString("organizationId", "SL-ORG-DEFAULT");
        String userId = call.getString("userId", "UNKNOWN");
        boolean directDispatch = Boolean.TRUE.equals(call.getBoolean("directDispatch", false));
        android.content.SharedPreferences prefs = getContext().getSharedPreferences("safetylink_prefs", Context.MODE_PRIVATE);
        int defaultCountdown = prefs.getInt("sos_countdown_seconds", 10);
        int countdownSeconds = call.getData().has("countdownSeconds")
                ? Math.max(0, Math.min(30, call.getInt("countdownSeconds", defaultCountdown)))
                : Math.max(0, Math.min(30, defaultCountdown));
        if (countdownSeconds == 0) {
            directDispatch = true;
        }

        try {
            Intent intent = new Intent(getContext(), PanicService.class);
            intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
            intent.putExtra("description", description);
            intent.putExtra("phone", phone);
            intent.putExtra("phones", phones);
            intent.putExtra("latitude", lat);
            intent.putExtra("longitude", lng);
            intent.putExtra("orgId", orgId);
            intent.putExtra("triggeredBy", userId);
            intent.putExtra("directDispatch", directDispatch);
            intent.putExtra("countdownSeconds", countdownSeconds);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }

            JSObject ret = new JSObject();
            ret.put("status", directDispatch ? "DISPATCHING" : "TRIGGERED");
            ret.put("countdownSeconds", directDispatch ? 0 : countdownSeconds);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to trigger PanicService: " + e.getMessage(), e);
            call.reject("Failed to trigger PanicService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open accessibility settings: " + e.getMessage(), e);
            call.reject("Could not open accessibility settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName())) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                }
            }
            JSObject ret = new JSObject();
            ret.put("requested", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to request battery optimization: " + e.getMessage(), e);
            call.reject("Could not request battery optimization: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open app settings: " + e.getMessage(), e);
            call.reject("Could not open app settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), PanicService.class);
            intent.setAction(PanicService.ACTION_CANCEL_PANIC);
            getContext().startService(intent);

            JSObject ret = new JSObject();
            ret.put("status", "CANCELLED");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel PanicService: " + e.getMessage(), e);
            call.reject("Failed to cancel PanicService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getState(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isCountdownActive", PanicService.isCountdownActiveState());
        ret.put("secondsRemaining", PanicService.getSecondsRemainingState());
        ret.put("lastStatus", PanicService.getLastKnownStatus());
        call.resolve(ret);
    }

    @PluginMethod
    public void getLastResult(PluginCall call) {
        JSObject ret = new JSObject();
        EmergencyService.DispatchResult res = lastDispatchResult;
        if (res != null) {
            ret.put("hasResult", true);
            ret.put("incidentId", res.incidentId);
            ret.put("success", res.success);
            ret.put("smsStatus", res.smsStatus);
            ret.put("callStatus", res.callStatus);
            ret.put("backendSyncStatus", res.backendSyncStatus);
            ret.put("pcmStatus", res.pcmStatus);
        } else {
            ret.put("hasResult", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void savePushIdentity(PluginCall call) {
        String phone = call.getString("phone", "");
        String profileToken = call.getString("profileToken", "");
        if (phone == null || phone.trim().isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("saved", false);
            call.resolve(ret);
            return;
        }
        PushRegistrar.saveIdentity(getContext(), phone.trim(), profileToken != null ? profileToken.trim() : "");
        JSObject ret = new JSObject();
        ret.put("saved", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getFcmStatus(PluginCall call) {
        android.content.SharedPreferences p = getContext().getSharedPreferences("safetylink_prefs", android.content.Context.MODE_PRIVATE);
        String token = p.getString("fcm_token", "");
        String regPhone = p.getString("fcm_registered_phone", "");
        long regAt = p.getLong("fcm_registered_at", 0L);
        int lastHttp = p.getInt("fcm_last_http", 0);
        if (token == null || token.trim().isEmpty()) {
            PushRegistrar.fetchAndRegister(getContext());
        }
        JSObject ret = new JSObject();
        boolean hasToken = token != null && token.trim().length() > 20;
        ret.put("hasToken", hasToken);
        ret.put("tokenPrefix", hasToken ? token.trim().substring(0, Math.min(12, token.trim().length())) : "");
        ret.put("registeredPhone", regPhone != null ? regPhone : "");
        ret.put("registeredAt", regAt);
        ret.put("lastHttpStatus", lastHttp);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopEmergencyAlarm(PluginCall call) {
        SafetyFcmService.stopActiveAlarmRingtone(getContext());
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void consumePendingFcmRing(PluginCall call) {
        android.content.SharedPreferences p = getContext().getSharedPreferences("safetylink_prefs", android.content.Context.MODE_PRIVATE);
        String json = p.getString(SafetyFcmService.KEY_PENDING_RING_JSON, null);
        JSObject ret = new JSObject();
        if (json != null && !json.trim().isEmpty()) {
            p.edit().remove(SafetyFcmService.KEY_PENDING_RING_JSON).apply();
            ret.put("hasPending", true);
            ret.put("payloadJson", json);
        } else {
            ret.put("hasPending", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void enforceHardwareWake(PluginCall call) {
        try {
            if (getActivity() != null) {
                getActivity().runOnUiThread(() -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                        getActivity().setShowWhenLocked(true);
                        getActivity().setTurnScreenOn(true);
                    } else {
                        getActivity().getWindow().addFlags(
                            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        );
                    }
                    getActivity().getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    );
                });
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to enforce hardware wake: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            JSObject ret = new JSObject();
            ret.put("granted", Settings.canDrawOverlays(getContext()));
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getContext())) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        android.net.Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void getDeviceBattery(PluginCall call) {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = getContext().registerReceiver(null, ifilter);

            int level = -1;
            int scale = -1;
            int status = -1;
            boolean isCharging = false;
            float batteryPct = -1;

            if (batteryStatus != null) {
                level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                             status == BatteryManager.BATTERY_STATUS_FULL;

                if (level >= 0 && scale > 0) {
                    batteryPct = (level * 100f) / (float) scale;
                }
            }

            JSObject ret = new JSObject();
            ret.put("level", batteryPct >= 0 ? Math.round(batteryPct) : 100);
            ret.put("isCharging", isCharging);
            ret.put("status", status);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to read device battery status: " + e.getMessage(), e);
            JSObject fallback = new JSObject();
            fallback.put("level", 100);
            fallback.put("isCharging", false);
            call.resolve(fallback);
        }
    }

    @PluginMethod
    public void startBleService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), SafelinkForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start BLE sentinel service: " + e.getMessage(), e);
            call.reject("Failed to start BLE service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void toggleFloatingWidget(PluginCall call) {
        boolean enable = Boolean.TRUE.equals(call.getBoolean("enable", true));
        try {
            Intent intent = new Intent(getContext(), FloatingWidgetService.class);
            if (enable) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
                    JSObject ret = new JSObject();
                    ret.put("enabled", false);
                    ret.put("needsPermission", true);
                    call.resolve(ret);
                    return;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(intent);
                } else {
                    getContext().startService(intent);
                }
            } else {
                getContext().stopService(intent);
            }
            JSObject ret = new JSObject();
            ret.put("enabled", enable);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to toggle floating widget: " + e.getMessage(), e);
            JSObject ret = new JSObject();
            ret.put("enabled", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    public void emitPanicEvent(String source, int countdownSeconds, String status) {
        JSObject ret = new JSObject();
        ret.put("source", source);
        ret.put("countdownSeconds", countdownSeconds);
        ret.put("status", status);
        EmergencyService.DispatchResult res = lastDispatchResult;
        if (res != null && ("DISPATCHED".equals(status) || "PARTIAL_SUCCESS".equals(status) || "FAILED".equals(status))) {
            ret.put("incidentId", res.incidentId);
            ret.put("smsStatus", res.smsStatus);
            ret.put("callStatus", res.callStatus);
            ret.put("backendSyncStatus", res.backendSyncStatus);
            ret.put("pcmStatus", res.pcmStatus);
            ret.put("success", res.success);
        }
        notifyListeners("onPanicStatusChange", ret);
        notifyListeners("onPanicEvent", ret);
    }

    public void emitSafetyTimeoutEvent(int minutes) {
        JSObject ret = new JSObject();
        ret.put("action", "SAFETY_TIMEOUT");
        ret.put("minutes", minutes);
        notifyListeners("onSafetyTimeoutTriggered", ret);
    }

    public void emitFindPhoneEvent() {
        JSObject ret = new JSObject();
        ret.put("action", "FIND_PHONE");
        notifyListeners("onFindPhoneTriggered", ret);
    }

    public void emitCustomButtonAction(String action) {
        JSObject ret = new JSObject();
        ret.put("action", action);
        notifyListeners("onCustomButtonAction", ret);
    }

    @PluginMethod
    public void setButtonConfig(PluginCall call) {
        try {
            String p1 = call.getString("singlePressAction", ButtonPatternDetector.ACTION_PANIC);
            boolean cancelDuringCountdown = Boolean.TRUE.equals(call.getBoolean("cancelDuringCountdown", true));
            String p2 = call.getString("doublePressAction", ButtonPatternDetector.ACTION_FIND_PHONE);
            String p3 = call.getString("triplePressAction", ButtonPatternDetector.ACTION_SAFETY_TIMEOUT);
            String p4 = call.getString("quadPressAction", ButtonPatternDetector.ACTION_VOICE_LIZZY);
            String longPress = call.getString("longPressAction", ButtonPatternDetector.ACTION_SILENT_PANIC);
            int windowMs = call.getInt("multiPressWindowMs", 550);
            int countdownSec = call.getInt("countdownOverrideSec", 10);
            int timeoutMins = call.getInt("safetyTimeoutMinutes", 15);
            boolean haptic = Boolean.TRUE.equals(call.getBoolean("hapticFeedback", true));

            ButtonPatternDetector.saveConfig(getContext(), p1, cancelDuringCountdown, p2, p3, p4, longPress, windowMs, countdownSec, timeoutMins, haptic);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to save button config: " + e.getMessage(), e);
            call.reject("Failed to save button config: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getButtonConfig(PluginCall call) {
        try {
            JSObject ret = ButtonPatternDetector.getConfigAsJson(getContext());
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get button config: " + e.getMessage(), e);
            call.reject("Failed to get button config: " + e.getMessage());
        }
    }

    @PluginMethod
    public void speakText(PluginCall call) {
        final String text = call.getString("text", "").trim();
        if (text.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("spoken", false);
            call.resolve(ret);
            return;
        }
        mainHandler.post(() -> {
            try {
                if (nativeTts == null) {
                    initNativeTts();
                }
                Runnable doSpeak = () -> {
                    if (nativeTts == null || !ttsReady) {
                        JSObject ret = new JSObject();
                        ret.put("spoken", false);
                        ret.put("error", "TTS engine not ready");
                        call.resolve(ret);
                        return;
                    }
                    final String utteranceId = "sl-tts-" + UUID.randomUUID().toString();
                    final boolean[] resolved = new boolean[]{false};
                    Runnable fallbackResolve = () -> {
                        if (!resolved[0]) {
                            resolved[0] = true;
                            JSObject ret = new JSObject();
                            ret.put("spoken", true);
                            call.resolve(ret);
                        }
                    };
                    long watchdogMs = Math.min(12000L, Math.max(3500L, text.length() * 85L));
                    mainHandler.postDelayed(fallbackResolve, watchdogMs);
                    nativeTts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override
                        public void onStart(String id) {}

                        @Override
                        public void onDone(String id) {
                            if (utteranceId.equals(id)) {
                                mainHandler.removeCallbacks(fallbackResolve);
                                mainHandler.post(fallbackResolve);
                            }
                        }

                        @Override
                        public void onError(String id) {
                            if (utteranceId.equals(id)) {
                                mainHandler.removeCallbacks(fallbackResolve);
                                mainHandler.post(fallbackResolve);
                            }
                        }
                    });
                    nativeTts.stop();
                    nativeTts.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId);
                };
                if (ttsReady) {
                    doSpeak.run();
                } else {
                    mainHandler.postDelayed(doSpeak, 750);
                }
            } catch (Exception e) {
                Log.w(TAG, "speakText error: " + e.getMessage());
                JSObject ret = new JSObject();
                ret.put("spoken", false);
                ret.put("error", e.getMessage());
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void stopSpeaking(PluginCall call) {
        mainHandler.post(() -> {
            try {
                if (nativeTts != null) nativeTts.stop();
            } catch (Exception ignored) {}
            JSObject ret = new JSObject();
            ret.put("stopped", true);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void listenSpeech(PluginCall call) {
        final String lang = call.getString("lang", "en-US");
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("text", "");
            ret.put("error", "RECORD_AUDIO permission not granted");
            call.resolve(ret);
            return;
        }
        mainHandler.post(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    JSObject ret = new JSObject();
                    ret.put("text", "");
                    ret.put("error", "Speech recognition unavailable on device");
                    call.resolve(ret);
                    return;
                }
                if (activeRecognizer != null) {
                    try {
                        activeRecognizer.cancel();
                        activeRecognizer.destroy();
                    } catch (Exception ignored) {}
                    activeRecognizer = null;
                }
                final boolean[] settled = new boolean[]{false};
                final SpeechRecognizer recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                activeRecognizer = recognizer;

                Runnable timeoutCleanup = () -> {
                    if (!settled[0]) {
                        settled[0] = true;
                        try {
                            recognizer.cancel();
                            recognizer.destroy();
                        } catch (Exception ignored) {}
                        if (activeRecognizer == recognizer) activeRecognizer = null;
                        JSObject ret = new JSObject();
                        ret.put("text", "");
                        ret.put("timeout", true);
                        call.resolve(ret);
                    }
                };
                mainHandler.postDelayed(timeoutCleanup, 9500L);

                recognizer.setRecognitionListener(new RecognitionListener() {
                    @Override public void onReadyForSpeech(Bundle params) {}
                    @Override public void onBeginningOfSpeech() {}
                    @Override public void onRmsChanged(float rmsdB) {}
                    @Override public void onBufferReceived(byte[] buffer) {}
                    @Override public void onEndOfSpeech() {}
                    @Override public void onPartialResults(Bundle partialResults) {}
                    @Override public void onEvent(int eventType, Bundle params) {}

                    @Override
                    public void onError(int error) {
                        if (settled[0]) return;
                        settled[0] = true;
                        mainHandler.removeCallbacks(timeoutCleanup);
                        try { recognizer.destroy(); } catch (Exception ignored) {}
                        if (activeRecognizer == recognizer) activeRecognizer = null;
                        JSObject ret = new JSObject();
                        ret.put("text", "");
                        ret.put("errorCode", error);
                        call.resolve(ret);
                    }

                    @Override
                    public void onResults(Bundle results) {
                        if (settled[0]) return;
                        settled[0] = true;
                        mainHandler.removeCallbacks(timeoutCleanup);
                        ArrayList<String> matches = results != null
                                ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                                : null;
                        String best = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                        try { recognizer.destroy(); } catch (Exception ignored) {}
                        if (activeRecognizer == recognizer) activeRecognizer = null;
                        JSObject ret = new JSObject();
                        ret.put("text", best != null ? best : "");
                        ret.put("matched", best != null && !best.trim().isEmpty());
                        call.resolve(ret);
                    }
                });

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
                intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2200L);
                intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1800L);
                recognizer.startListening(intent);
            } catch (Exception e) {
                Log.w(TAG, "listenSpeech error: " + e.getMessage());
                JSObject ret = new JSObject();
                ret.put("text", "");
                ret.put("error", e.getMessage());
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        mainHandler.post(() -> {
            if (activeRecognizer != null) {
                try {
                    activeRecognizer.cancel();
                    activeRecognizer.destroy();
                } catch (Exception ignored) {}
                activeRecognizer = null;
            }
            JSObject ret = new JSObject();
            ret.put("stopped", true);
            call.resolve(ret);
        });
    }
}
