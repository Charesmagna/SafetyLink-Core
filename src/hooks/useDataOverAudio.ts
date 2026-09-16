import { registerPlugin } from '@capacitor/core';

const DataOverAudio = registerPlugin<any>('DataOverAudio', {
  web: {
    async playChirp(options: { payload: string }) {
      console.log('[DataOverAudio Web] Mock playChirp for payload:', options.payload);
      // We could use Web Audio API to simulate this on the web
      return { success: true };
    }
  }
});

export function useDataOverAudio() {
  const playEmergencyChirp = async (payload: string) => {
    try {
      await DataOverAudio.playChirp({ payload });
      return true;
    } catch (err) {
      console.error('Failed to play data-over-audio chirp:', err);
      return false;
    }
  };

  return { playEmergencyChirp };
}
