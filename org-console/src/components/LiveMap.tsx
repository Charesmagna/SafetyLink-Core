import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const sosIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const onlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

interface OrgUser {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  lastSeen: number;
  lat?: number;
  lng?: number;
  sosActive?: boolean;
}

function FitBounds({ members }: { members: OrgUser[] }) {
  const map = useMap();
  useEffect(() => {
    const withLocation = members.filter(m => m.lat && m.lng);
    if (withLocation.length > 0) {
      const bounds = L.latLngBounds(withLocation.map(m => [m.lat!, m.lng!]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [members, map]);
  return null;
}

export default function LiveMap({ members }: { members: OrgUser[] }) {
  const withLocation = members.filter(m => m.lat && m.lng);

  return (
    <div className="h-full min-h-[500px] rounded-xl overflow-hidden border border-sl-border">
      <MapContainer
        center={[-26.2041, 28.0473]}
        zoom={10}
        style={{ height: '100%', width: '100%', background: '#111' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds members={withLocation} />
        {withLocation.map(m => (
          <Marker
            key={m.uid}
            position={[m.lat!, m.lng!]}
            icon={m.sosActive ? sosIcon : onlineIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{m.displayName || m.email}</p>
                <p className="text-gray-500 capitalize">{m.role}</p>
                {m.sosActive && <p className="text-red-600 font-bold">⚠ SOS ACTIVE</p>}
                <p className="text-gray-400 text-xs mt-1">
                  Last seen: {m.lastSeen ? new Date(m.lastSeen).toLocaleTimeString() : 'Unknown'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {withLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-sl-dark/80 rounded-xl">
          <p className="text-slate-500 text-sm">No members with location data</p>
        </div>
      )}
    </div>
  );
}
