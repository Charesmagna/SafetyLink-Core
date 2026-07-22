package com.aistudio.safetylink.vqnztp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "SafeAudio",
    permissions = {
        @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "microphone")
    }
)
public class SafeAudioPlugin extends Plugin {
    private static final String TAG = "SafeAudio";
    private AudioRecord audioRecord;
    private boolean isRecording = false;
    private Thread recordingThread;

    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    private int bufferSize;

    @Override
    public void load() {
        bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
    }

    @PluginMethod
    public void startRecording(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestAllPermissions(call, "microphone");
            return;
        }

        if (isRecording) {
            call.reject("Already recording");
            return;
        }

        audioRecord = new AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
        );

        if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
            call.reject("AudioRecord initialization failed");
            return;
        }

        audioRecord.startRecording();
        isRecording = true;

        recordingThread = new Thread(this::processAudioStream, "SafeAudio-DSP-Thread");
        recordingThread.start();

        call.resolve();
    }

    @PluginMethod
    public void stopRecording(PluginCall call) {
        if (!isRecording) {
            call.reject("Not recording");
            return;
        }

        isRecording = false;
        if (audioRecord != null) {
            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;
        }

        recordingThread = null;
        call.resolve();
    }

    private void processAudioStream() {
        short[] audioBuffer = new short[bufferSize / 2];

        while (isRecording && audioRecord != null) {
            int result = audioRecord.read(audioBuffer, 0, audioBuffer.length);
            if (result > 0) {
                // DSP Module 2: Whisper Amplification & Compression
                double rms = 0;
                for (int i = 0; i < result; i++) {
                    short sample = audioBuffer[i];
                    
                    // Simple compression/expansion
                    double floatSample = sample / 32768.0;
                    
                    // Apply gain for low amplitude (whispers)
                    if (Math.abs(floatSample) < 0.1) {
                        floatSample *= 3.0; // Boost whispers
                    } else if (Math.abs(floatSample) > 0.8) {
                        floatSample = Math.signum(floatSample) * 0.8; // Hard limit shouts to prevent clipping
                    }
                    
                    // Reconstruct sample
                    short newSample = (short) (floatSample * 32768.0);
                    audioBuffer[i] = newSample;
                    
                    rms += newSample * newSample;
                }
                
                rms = Math.sqrt(rms / result);
                double db = 20 * Math.log10(rms > 0 ? rms : 1);
                
                // Emit volume metrics to UI
                JSObject ret = new JSObject();
                ret.put("decibels", db);
                ret.put("isWhisper", db > 0 && db < 40); // Rough estimate
                notifyListeners("onAudioMetrics", ret);
            }
        }
    }
}
