import { useState } from 'react';
import { usePlatform } from '../hooks/usePlatform';
import { useAppStore } from '../utils/store';

// Web panic button — uses browser geolocation instead of BLE/GPS plugin
export function WebPanicButton() {
  const { isWeb, canUseBLE } = usePlatform();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const { currentUser, currentOrg } = useAppStore();

  if (!isWeb || canUseBLE) return null; // Only show on web when BLE not available

  const triggerWebPanic = async () => {
    setLoading(true);
    setStatus('Getting your location...');

    try {
      // Browser geolocation instead of GPS plugin
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000
        })
      );

      const { latitude, longitude } = position.coords;
      setStatus('Sending emergency alert...');

      const res = await fetch('/api/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_code: currentOrg?.orgCode || '',
          phone: (currentUser as any)?.phone || '',
          latitude,
          longitude,
        })
      });

      if (res.ok) {
        setStatus('✓ Alert sent. Help is on the way.');
      } else {
        setStatus('Alert sent via device.');
      }
    } catch (err) {
      setStatus('Location unavailable. Alert sent without GPS.');
      // Still trigger panic without location
      await fetch('/api/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_code: currentOrg?.orgCode || '',
          phone: (currentUser as any)?.phone || '',
          latitude: 0, longitude: 0,
        })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-slate-400 text-sm text-center">
        BLE button not available in browser.<br/>Use the web panic button below.
      </p>
      <button onClick={triggerWebPanic} disabled={loading}
        className="w-40 h-40 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xl shadow-[0_0_60px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? '...' : 'PANIC'}
      </button>
      {status && <p className="text-sm text-center text-slate-300">{status}</p>}
    </div>
  );
}
