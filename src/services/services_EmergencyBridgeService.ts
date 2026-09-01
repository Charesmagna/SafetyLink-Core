import { BleClient } from '@capacitor-community/bluetooth-le';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorHttp } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AudioRecorder } from '@capawesome-team/capacitor-audio-recorder';

export class EmergencyBridgeService {
  private readonly AURA_API_URL = 'https://api.auraplatform.example.com/v1/panic';
  private readonly DEVICE_ID = 'BEACON_MAC_ADDRESS'; // Replace with actual beacon MAC address
  private readonly SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'; // Replace with actual beacon Service UUID
  private readonly CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'; // Replace with actual Characteristic UUID
  
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  /**
   * Initializes the emergency bridge workflow.
   * Prompts for permissions, starts the foreground service, and begins BLE monitoring.
   */
  public async initialize(): Promise<void> {
    try {
      // 1. Request necessary hardware permissions
      if ((await AudioRecorder.requestPermissions()).microphone !== 'granted') {
        throw new Error('Microphone permission is required for contextual audio.');
      }
      if ((await Geolocation.requestPermissions()).location !== 'granted') {
        throw new Error('Location permission is required for dispatch.');
      }

      // 2. Start Foreground Service to keep app alive
      // Note: In Android 14, foreground service types are enforced (connectedDevice, microphone, location)
      await ForegroundService.startForegroundService({
        id: 911,
        title: 'SafetyLink Secure Node',
        body: 'Monitoring for emergency beacon triggers.',
        buttons: [],
      });

      // 3. Initialize BLE and connect to beacon
      await BleClient.initialize();
      await BleClient.connect(this.DEVICE_ID);

      // 4. Listen for characteristic changes (The Trigger)
      await BleClient.startNotifications(
        this.DEVICE_ID,
        this.SERVICE_UUID,
        this.CHARACTERISTIC_UUID,
        async (value) => {
          const isTriggered = value.getUint8(0) === 1; // Assuming 0x01 means trigger
          if (isTriggered) {
            await this.handleEmergencyTrigger();
          }
        }
      );

      console.log('SafetyLink Emergency Bridge initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize Emergency Bridge:', error);
    }
  }

  /**
   * Handles the emergency trigger workflow (Dispatch, Feedback, Evidence)
   */
  private async handleEmergencyTrigger(): Promise<void> {
    console.log('Emergency trigger received. Initiating dispatch...');

    try {
      // 1. Fetch high-accuracy GPS coordinates
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      // 2. Make authenticated POST request to AURA API
      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      const response = await CapacitorHttp.post({
        url: this.AURA_API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        data: payload,
      });

      // 3. Check response and trigger Haptic Verification
      if (response.status === 200 || response.status === 201) {
        console.log('Dispatch successful. Triggering haptic feedback...');
        await this.triggerHapticFeedback();

        // 4. Start Contextual Audio Capture
        await this.captureAndUploadAudio();
      } else {
        console.error('Dispatch failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error during emergency trigger workflow:', error);
    }
  }

  /**
   * Triggers a silent haptic vibration pattern (3 short, distinct pulses).
   */
  private async triggerHapticFeedback(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  /**
   * Captures environmental audio for 45 seconds and uploads it to the backend.
   */
  private async captureAndUploadAudio(): Promise<void> {
    console.log('Starting contextual audio capture...');

    try {
      // Start recording
      await AudioRecorder.startRecording();

      // Record for 45 seconds
      await new Promise(resolve => setTimeout(resolve, 45000));

      const result = await AudioRecorder.stopRecording();
      const audioBase64 = result.recordDataBase64; 

      console.log('Audio recording completed. Uploading evidence...');
      
      // Upload the encoded audio file to the backend
      await CapacitorHttp.post({
        url: `${this.AURA_API_URL}/evidence`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        data: {
          audioData: audioBase64,
          timestamp: new Date().toISOString(),
        },
      });

      console.log('Audio evidence uploaded successfully.');
    } catch (error) {
      console.error('Error during audio capture/upload:', error);
    }
  }

  /**
   * Cleans up the service and stops background monitoring.
   */
  public async terminate(): Promise<void> {
    try {
      await BleClient.stopNotifications(this.DEVICE_ID, this.SERVICE_UUID, this.CHARACTERISTIC_UUID);
      await BleClient.disconnect(this.DEVICE_ID);
      await ForegroundService.stopForegroundService();
    } catch (e) {
      console.error('Error terminating bridge:', e);
    }
  }
}
