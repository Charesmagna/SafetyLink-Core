import { useEffect } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';

const TacticalSensor = registerPlugin<any>('TacticalSensor', {
  web: {
    async startImpactDetection() {
      console.log('[TacticalSensor Web] startImpactDetection called');
    },
    async stopImpactDetection() {
      console.log('[TacticalSensor Web] stopImpactDetection called');
    },
    async setSosActive(options: { isActive: boolean }) {
      console.log('[TacticalSensor Web] setSosActive called with', options);
    },
    async requestDeviceAdmin() {
      console.log('[TacticalSensor Web] requestDeviceAdmin called');
    }
  }
});

export function useTacticalSensors() {
  const { activeSOSState } = useAppStore();

  useEffect(() => {
    // Keep the native layer synced with the React SOS state
    const isActive = activeSOSState !== 'IDLE';
    
    if (Capacitor.isNativePlatform()) {
      TacticalSensor.setSosActive({ isActive }).catch(console.error);
    }
  }, [activeSOSState]);

  const startSensors = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await TacticalSensor.startImpactDetection();
      } catch (err) {
        console.error('Failed to start impact detection:', err);
      }
    }
  };

  const requestStruggleLockPermissions = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await TacticalSensor.requestDeviceAdmin();
      } catch (err) {
        console.error('Failed to request device admin:', err);
      }
    }
  };

  return { startSensors, requestStruggleLockPermissions };
}
