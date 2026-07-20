package com.aistudio.safetylink.vqnztp;

import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DataOverAudio")
public class DataOverAudioPlugin extends Plugin {
    private static final String TAG = "DataOverAudio";
    
    private static final int SAMPLE_RATE = 44100;
    private static final double FREQ_0 = 1200.0; // Space (0)
    private static final double FREQ_1 = 2200.0; // Mark (1)
    private static final int BAUD_RATE = 300;
    private static final int SAMPLES_PER_BIT = SAMPLE_RATE / BAUD_RATE;

    private AudioTrack audioTrack;
    private boolean isPlaying = false;

    @PluginMethod
    public void playChirp(PluginCall call) {
        if (isPlaying) {
            call.reject("Already playing an audio chirp");
            return;
        }
        
        String payload = call.getString("payload");
        if (payload == null || payload.isEmpty()) {
            call.reject("Payload is required");
            return;
        }

        isPlaying = true;
        
        new Thread(() -> {
            try {
                // Generate FSK samples
                byte[] bytePayload = payload.getBytes("UTF-8");
                short[] audioBuffer = new short[bytePayload.length * 8 * SAMPLES_PER_BIT];
                
                int bufferIndex = 0;
                double phase = 0;
                
                for (byte b : bytePayload) {
                    for (int i = 0; i < 8; i++) {
                        boolean bit = ((b >> i) & 1) == 1;
                        double freq = bit ? FREQ_1 : FREQ_0;
                        double phaseIncrement = 2.0 * Math.PI * freq / SAMPLE_RATE;
                        
                        for (int j = 0; j < SAMPLES_PER_BIT; j++) {
                            audioBuffer[bufferIndex++] = (short) (Math.sin(phase) * Short.MAX_VALUE);
                            phase += phaseIncrement;
                        }
                    }
                }
                
                // Play audio over STREAM_VOICE_CALL so it goes into an active phone call
                audioTrack = new AudioTrack(
                    AudioManager.STREAM_VOICE_CALL,
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    audioBuffer.length * 2,
                    AudioTrack.MODE_STATIC
                );
                
                audioTrack.write(audioBuffer, 0, audioBuffer.length);
                audioTrack.play();
                
                // Wait for playback to complete
                int sleepMs = (int) (((double) audioBuffer.length / SAMPLE_RATE) * 1000) + 500;
                Thread.sleep(sleepMs);
                
                audioTrack.stop();
                audioTrack.release();
                audioTrack = null;
                isPlaying = false;
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to generate audio chirp", e);
                isPlaying = false;
                call.reject("Failed to play chirp: " + e.getMessage());
            }
        }).start();
    }
}
