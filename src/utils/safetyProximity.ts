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

export function formatRelativeTime(ts: number): string {
  const diffMin = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
