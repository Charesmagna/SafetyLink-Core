
import { BleClient } from '@capacitor-community/bluetooth-le';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { useAppStore } from '../utils/store';
import { reverseGeocode } from './sms_africas_talking';

export class EmergencyBridgeService {
  private get AURA_API_URL() {
    return useAppStore.getState().auraApiUrl || 'https://api.auraplatform.example.com/v1/panic';
  }
  private readonly DEVICE_ID = 'BEACON_MAC_ADDRESS'; // Replace with actual beacon MAC address
  private readonly SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'; // Replace with actual beacon Service UUID
  private readonly CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'; // Replace with actual Characteristic UUID
  
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('[EmergencyBridge] Native platform required — skipping init on web.');
      return;
    }
    try {
      if (!(await VoiceRecorder.requestAudioRecordingPermission()).value) {
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
        smallIcon: 'ic_launcher',
      });

      await BleClient.initialize({ androidNeverForLocation: true });
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

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const streetAddress = await reverseGeocode(lat, lng);

      const payload = {
        latitude: lat,
        longitude: lng,
        streetAddress,
        timestamp: new Date().toISOString(),
      };

      
      const success = await this.dispatchWithBackoff(payload);
      if (success) {

        console.log('Dispatch successful. Triggering haptic feedback...');
        await this.triggerHapticFeedback();
        await this.captureAndUploadAudio();
      } else { console.error("Dispatch failed after all retries."); }
    } catch (error) {
      console.error('Error during emergency trigger workflow:', error);
    }
  }


  private async dispatchWithBackoff(payload: any, maxRetries = 5): Promise<boolean> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await CapacitorHttp.post({
          url: this.AURA_API_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
          },
          data: payload,
        });

        if (response.status === 200 || response.status === 201) {
          return true;
        } else {
          console.error(`Dispatch failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Network error during dispatch attempt ${retries + 1}:`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000;
        console.log(`[Offline Dispatch Retry] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Queue to offline storage if all retries failed
    console.warn('[Offline Dispatch] All immediate retries failed. Queuing to secure local DB.');
    const { useAppStore } = await import('../utils/store');
    const store = useAppStore.getState();
    const offlineItem = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}-SA`,
      timestamp: Date.now(),
      description: 'Emergency Triggered via Hardware Button [Offline Cache]',
      lat: payload.latitude,
      lng: payload.longitude
    };
    const updatedQueue = [...store.localOfflineQueue, offlineItem];
    useAppStore.setState({ localOfflineQueue: updatedQueue });
    
    // In a real app we would persist this directly to SQLite. 
    // Here we leverage the zustand store which persists to localStorage.
    return false;
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
      await VoiceRecorder.startRecording();
      await new Promise(resolve => setTimeout(resolve, 45000));

      const result = await VoiceRecorder.stopRecording();
      const audioBase64 = (result as any).recordDataBase64; 

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
