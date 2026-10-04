/**
 * Reverse Geocoding utility using OpenStreetMap Nominatim.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'SafetyLink-Emergency/1.0 (info@safetylink.online)' } }
    );
    if (!res.ok) throw new Error('Nominatim error');
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
      a.suburb || a.neighbourhood || a.village,
      a.city || a.town || a.county,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : data.display_name || `${lat},${lng}`;
  } catch {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
  }
}
