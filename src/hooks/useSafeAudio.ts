import { useEffect, useState } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';

const SafeAudio = registerPlugin<any>('SafeAudio', {
  web: {
    async startRecording() {
      console.log('[SafeAudio Web] startRecording called');
    },
    async stopRecording() {
      console.log('[SafeAudio Web] stopRecording called');
    }
  }
});

export function useSafeAudio() {
  const { activeSOSState } = useAppStore();
  const [decibels, setDecibels] = useState<number>(0);
  const [isWhispering, setIsWhispering] = useState<boolean>(false);

    useEffect(() => {
    let listener: any;
    
    const setupListener = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          listener = await SafeAudio.addListener('onAudioMetrics', (info: any) => {
            setDecibels(info.decibels);
            setIsWhispering(info.isWhisper);
          });
        } catch (e) {
          console.warn('Failed to add SafeAudio listener', e);
        }
      }
    };
    
    setupListener();

    return () => {
      if (listener) {
        // remove is usually synchronous in Capacitor, but sometimes returns promise.
        // It's safe to just call listener.remove() for Capacitor PluginListeners.
        try { listener.remove(); } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (activeSOSState !== 'IDLE') {
      if (Capacitor.isNativePlatform()) {
        SafeAudio.startRecording().catch(console.error);
      }
    } else {
      if (Capacitor.isNativePlatform()) {
        SafeAudio.stopRecording().catch(console.error);
        setDecibels(0);
        setIsWhispering(false);
      }
    }
  }, [activeSOSState]);

  return { decibels, isWhispering };
}
