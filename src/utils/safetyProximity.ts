import { DangerZone } from '../types';

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface NearbyDangerMatch {
  zone: DangerZone;
  distanceKm: number;
  insidePerimeter: boolean;
}

export function findNearestDangerZone(
  userLocation: { lat: number; lng: number } | null,
  zones: DangerZone[],
  alertRadiusKm: number
): NearbyDangerMatch | null {
  if (!userLocation || !Number.isFinite(userLocation.lat) || !Number.isFinite(userLocation.lng)) {
    return null;
  }
  let closest: NearbyDangerMatch | null = null;
  for (const zone of zones) {
    const distanceKm = haversineKm(userLocation.lat, userLocation.lng, zone.lat, zone.lng);
    const insidePerimeter = distanceKm * 1000 <= zone.radiusMeters;
    if (insidePerimeter || distanceKm <= alertRadiusKm) {
      if (!closest || distanceKm < closest.distanceKm) {
        closest = { zone, distanceKm, insidePerimeter };
      }
    }
  }
  return closest;
}

export function getSafetyTipsForZone(zone: DangerZone): string[] {
  if (Array.isArray(zone.safetyTips) && zone.safetyTips.length > 0) {
    return zone.safetyTips;
  }
  if (zone.sourceType === 'WEATHER_HAZARD') {
    return [
      'Buckle up, turn on headlights, and slow down on wet or low-visibility roads.',
      'Avoid flooded low-water bridges and stay clear of downed power lines.',
    ];
  }
  return [
    'Buckle up, lock all vehicle doors, and keep windows closed at intersections.',
    'Keep phones and valuables out of sight and keep SafetyLink SOS within reach.',
  ];
}

// Gentle 2-tone caution chime (Web Audio) when entering a new Crime Hotspot — guarded by 30-min per-zone cooldown
const hotspotChimeHistory = new Map<string, number>();

export function shouldPlayHotspotChime(zoneId: string, cooldownMs: number = 30 * 60_000): boolean {
  const now = Date.now();
  const prev = hotspotChimeHistory.get(zoneId) || 0;
  if (now - prev < cooldownMs) return false;
  hotspotChimeHistory.set(zoneId, now);
  return true;
}

export function playHotspotAlertChime(isCritical: boolean = false): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = isCritical ? [784, 659.25, 880] : [659.25, 587.33];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.14 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.14);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 650);
  } catch {
    // Ignore autoplay restrictions before first user interaction
  }
}

export function formatRelativeTime(ts: number): string {
  const diffMin = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
