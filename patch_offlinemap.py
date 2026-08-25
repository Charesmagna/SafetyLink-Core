import sys
import re

file_path = "src/components/OfflineMap.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace imports
content = re.sub(
    r"import \{[^}]*\} from 'react-leaflet';",
    "import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';",
    content
)
content = re.sub(r"import L from 'leaflet';\n", "", content)

# Remove RecenterMap helper
content = re.sub(r"// Re-usable Helper Component.*?(?=\s*export const OfflineMap)", "", content, flags=re.DOTALL)

# Replace the MapContainer block
# Note: Since the exact text is long, let's use a regex to replace everything from <MapContainer to </MapContainer>
content = re.sub(
    r"<MapContainer.*?</MapContainer>",
    """<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <Map 
            mapId="DEMO_MAP_ID" 
            defaultZoom={13} 
            center={{ lat: activeFocusCenter[0], lng: activeFocusCenter[1] }} 
            disableDefaultUI={true} 
            gestureHandling={'greedy'} 
            mapTypeId={mapCenterMode === 'satellite' ? 'satellite' : 'roadmap'}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={{ lat: userLat, lng: userLng }}>
              <Pin background={activeSOSState !== 'IDLE' ? '#ef4444' : '#10b981'} borderColor={'#fff'} glyphColor={'#fff'} />
            </AdvancedMarker>
          </Map>
        </APIProvider>""",
    content,
    flags=re.DOTALL
)

with open(file_path, "w") as f:
    f.write(content)

