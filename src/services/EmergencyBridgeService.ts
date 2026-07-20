// @ts-nocheck
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

  public async initialize(): Promise<void> {
    try {
      if ((await AudioRecorder.requestPermissions()).microphone !== 'granted') {
        throw new Error('Microphone permission is required for contextual audio.');
      }
      if ((await Geolocation.requestPermissions()).location !== 'granted') {
        throw new Error('Location permission is required for dispatch.');
      }

      await ForegroundService.startForegroundService({
        id: 911,
        title: 'SafetyLink Secure Node',
        body: 'Monitoring for emergency beacon triggers.',
        buttons: [],
      });

      await BleClient.initialize();
      await BleClient.connect(this.DEVICE_ID);

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

  private async handleEmergencyTrigger(): Promise<void> {
    console.log('Emergency trigger received. Initiating dispatch...');

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

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

      if (response.status === 200 || response.status === 201) {
        console.log('Dispatch successful. Triggering haptic feedback...');
        await this.triggerHapticFeedback();
        await this.captureAndUploadAudio();
      } else {
        console.error('Dispatch failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error during emergency trigger workflow:', error);
    }
  }

  private async triggerHapticFeedback(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  private async captureAndUploadAudio(): Promise<void> {
    console.log('Starting contextual audio capture...');

    try {
      await AudioRecorder.startRecording();
      await new Promise(resolve => setTimeout(resolve, 45000));

      const result = await AudioRecorder.stopRecording();
      const audioBase64 = result.recordDataBase64; 

      console.log('Audio recording completed. Uploading evidence...');
      
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
