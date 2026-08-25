import sys
import re

def patch_file(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    if "react-leaflet" not in content:
        return

    # Replace imports
    content = re.sub(
        r"import \{[^}]*\} from 'react-leaflet';",
        "import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';",
        content
    )
    content = re.sub(r"import L from 'leaflet';\n", "", content)

    # 1. MotherboardConsole.tsx
    if "MotherboardConsole" in file_path:
        content = content.replace(
            "<MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>\n                <TileLayer\n                attribution='&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>'\n                url=\"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png\"\n                />\n                <CircleMarker center={mapCenter} radius={8} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8 }}>\n                    <Popup>Command Node</Popup>\n                </CircleMarker>\n            </MapContainer>",
            """<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                <Map mapId="DEMO_MAP_ID" defaultZoom={13} defaultCenter={{ lat: mapCenter[0], lng: mapCenter[1] }} disableDefaultUI={true} style={{ height: '100%', width: '100%' }}>
                    <AdvancedMarker position={{ lat: mapCenter[0], lng: mapCenter[1] }}>
                        <Pin background={'#ef4444'} borderColor={'#fff'} glyphColor={'#fff'} />
                    </AdvancedMarker>
                </Map>
            </APIProvider>"""
        )

    # 2. GeospatialAnalytics.tsx
    if "GeospatialAnalytics" in file_path:
        content = content.replace(
            """<MapContainer 
              center={defaultCenter} 
              zoom={14} 
              style={{ height: '100%', width: '100%', background: '#0f172a' }} 
              zoomControl={false}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">Carto</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {activeThreats.map(threat => (
                <CircleMarker 
                  key={threat.id}
                  center={[threat.lat, threat.lng]} 
                  radius={12} 
                  pathOptions={{ 
                    color: threat.severity === 'critical' ? '#ef4444' : '#f59e0b', 
                    fillColor: threat.severity === 'critical' ? '#ef4444' : '#f59e0b', 
                    fillOpacity: 0.6 
                  }}
                >
                  <Popup className="bg-slate-900 border-none">
                    <div className="font-mono text-xs">
                      <strong className={threat.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                        {threat.type.toUpperCase()}
                      </strong>
                      <p className="text-slate-300 mt-1">Confidence: {threat.confidence}%</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>""",
            """<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                <Map mapId="DEMO_MAP_ID" defaultZoom={14} defaultCenter={{ lat: defaultCenter[0], lng: defaultCenter[1] }} disableDefaultUI={true} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
                    {activeThreats.map(threat => (
                        <AdvancedMarker key={threat.id} position={{ lat: threat.lat, lng: threat.lng }}>
                            <Pin background={threat.severity === 'critical' ? '#ef4444' : '#f59e0b'} borderColor={'#fff'} glyphColor={'#fff'} />
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>"""
        )

    # 3. NodeMeshOrchestration.tsx
    if "NodeMeshOrchestration" in file_path:
        content = content.replace(
            """<MapContainer center={[baseLat, baseLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {nodes.map(node => (
                <Marker key={node.id} position={[node.lat, node.lng]}>
                  <Popup>
                    <div className="text-xs font-mono">
                      <strong>{node.id}</strong><br />
                      Status: {node.status}<br />
                      Battery: {node.battery}%
                    </div>
                  </Popup>
                </Marker>
              ))}
              <Polyline 
                positions={nodes.map(n => [n.lat, n.lng])} 
                pathOptions={{ color: '#0ea5e9', weight: 2, opacity: 0.5, dashArray: '5, 10' }} 
              />
            </MapContainer>""",
            """<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                <Map mapId="DEMO_MAP_ID" defaultZoom={15} defaultCenter={{ lat: baseLat, lng: baseLng }} disableDefaultUI={true} style={{ height: '100%', width: '100%' }}>
                    {nodes.map(node => (
                        <AdvancedMarker key={node.id} position={{ lat: node.lat, lng: node.lng }}>
                            <Pin background={node.status === 'active' ? '#10b981' : '#f59e0b'} borderColor={'#fff'} glyphColor={'#fff'} />
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>"""
        )

    with open(file_path, "w") as f:
        f.write(content)

for f in ["src/components/MotherboardConsole.tsx", "src/components/GeospatialAnalytics.tsx", "src/components/NodeMeshOrchestration.tsx"]:
    patch_file(f)

