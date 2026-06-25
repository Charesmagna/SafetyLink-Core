export let map;
export const markers           = {};
export const responderMarkers  = {};

export function initMap() {
  map = L.map('command-map', { zoomControl: true }).setView([-26.3085, 27.8344], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom:     19,
  }).addTo(map);
}

function markerColor(alert) {
  if (alert.status === 'resolved') return '#22c55e';
  if (alert.is_drill)             return '#f59e0b';
  return '#ef4444';
}

function makeIcon(color, size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color}"></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function upsertMarker(alert) {
  if (!map) return;
  const lat = parseFloat(alert.latitude);
  const lng = parseFloat(alert.longitude);
  if (isNaN(lat) || isNaN(lng)) return;

  const icon = makeIcon(markerColor(alert));
  const popup = `
    <div style="font-family:monospace;font-size:0.7rem;min-width:160px">
      <strong>ALERT #${alert.id}</strong><br>
      Status: ${alert.status?.toUpperCase()}<br>
      ${alert.operator_name ? `Operator: ${alert.operator_name}<br>` : ''}
      Tier: ${alert.tier}<br>
      <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank">Open in Maps</a>
    </div>
  `;

  if (markers[alert.id]) {
    markers[alert.id]
      .setLatLng([lat, lng])
      .setIcon(icon)
      .setPopupContent(popup);
  } else {
    const m = L.marker([lat, lng], { icon }).addTo(map);
    m.bindPopup(popup);
    m.on('click', () => { window.showDetail(alert.id); });
    markers[alert.id] = m;
  }
  markers[alert.id]._alertData = alert;
}

export function upsertResponderMarker(loc) {
  if (!map || !loc.lat || !loc.lon) return;
  const lat   = parseFloat(loc.lat);
  const lng   = parseFloat(loc.lon);
  const phone = loc.phone || 'unknown';
  const icon  = makeIcon('#3b82f6', 12);
  const popup = `
    <div style="font-family:monospace;font-size:0.7rem">
      <strong>Responder</strong><br>
      ${loc.name || phone}<br>
      ${new Date(loc.ts).toLocaleTimeString()}
    </div>
  `;

  if (responderMarkers[phone]) {
    responderMarkers[phone].setLatLng([lat, lng]).setPopupContent(popup);
  } else {
    const m = L.marker([lat, lng], { icon }).addTo(map);
    m.bindPopup(popup);
    responderMarkers[phone] = m;
  }
}

export function removeMarker(id) {
  if (markers[id]) { markers[id].remove(); delete markers[id]; }
}

export function panTo(alert) {
  const lat = parseFloat(alert.latitude);
  const lng = parseFloat(alert.longitude);
  if (!isNaN(lat) && !isNaN(lng)) map.flyTo([lat, lng], 14);
}

export function panToCoord(lat, lng) {
  if (map) map.flyTo([lat, lng], 14);
}
