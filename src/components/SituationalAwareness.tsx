import React, { useEffect, useState } from 'react';
import { useAppStore } from '../utils/store';

interface GroundedLink {
  title: string;
  uri: string;
}

export default function SituationalAwareness() {
  const { userLocation } = useAppStore();
  const currentLat = userLocation?.lat;
  const currentLng = userLocation?.lng;

  const [weather, setWeather] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>('');
  const [saferAdvisory, setSaferAdvisory] = useState<string>('');
  const [safeZonesText, setSafeZonesText] = useState<string>('');
  const [searchLinks, setSearchLinks] = useState<GroundedLink[]>([]);
  const [mapsLinks, setMapsLinks] = useState<GroundedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!currentLat || !currentLng) return;
      setLoading(true);
      setError('');
      try {
        let locName = 'Current Area';
        try {
          const geoRes = await fetch(`/api/ninjas/reversegeocoding?lat=${currentLat}&lon=${currentLng}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (Array.isArray(geoData) && geoData.length > 0) {
              locName = geoData[0].name;
              if (geoData[0].country) locName += `, ${geoData[0].country}`;
            }
          }
        } catch {}
        if (mounted) setLocationName(locName);

        // Fetch Weather + Local News + Gemini Safer City Search/Maps Grounding in parallel (isolated from panic dispatch)
        const [weatherRes, newsRes, saferRes] = await Promise.allSettled([
          fetch(`/api/ninjas/weather?lat=${currentLat}&lon=${currentLng}`),
          fetch(`/api/ninjas/news?text=${encodeURIComponent(locName)}`),
          fetch('/api/gemini/safer-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locationName: locName,
              lat: currentLat,
              lng: currentLng,
            }),
          }),
        ]);

        if (mounted && weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
          setWeather(await weatherRes.value.json());
        }

        if (mounted && newsRes.status === 'fulfilled' && newsRes.value.ok) {
          const newsData = await newsRes.value.json();
          setNews(Array.isArray(newsData) ? newsData : []);
        }

        if (mounted && saferRes.status === 'fulfilled' && saferRes.value.ok) {
          const saferData = await saferRes.value.json();
          setSaferAdvisory(saferData.advisoryText || '');
          setSafeZonesText(saferData.safeZonesText || '');
          setSearchLinks(
            Array.isArray(saferData.searchChunks)
              ? saferData.searchChunks
                  .map((c: any) =>
                    c.web?.uri ? { title: c.web.title || 'Live Source', uri: c.web.uri } : null
                  )
                  .filter(Boolean)
              : []
          );
          setMapsLinks(
            Array.isArray(saferData.mapsChunks)
              ? saferData.mapsChunks
                  .map((c: any) =>
                    c.maps?.uri ? { title: c.maps.title || 'Maps Safe Zone', uri: c.maps.uri } : null
                  )
                  .filter(Boolean)
              : []
          );
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load situational awareness data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [currentLat, currentLng]);

  return (
    <div className="w-full h-full flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Safer City &amp; Situational Intelligence</h2>
          <p className="text-xs text-slate-400 mt-1">
            Non-blocking environmental, weather, Google Search CPF &amp; Google Maps safe-zone feed
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <span className="text-xl">🌐</span>
        </div>
      </div>

      {!currentLat && (
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center text-sm text-slate-400">
          Waiting for GPS coordinates...
        </div>
      )}

      {loading && currentLat && (
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center text-sm text-slate-400 animate-pulse">
          Loading local intelligence &amp; Safer City alerts...
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-900/20 rounded-xl border border-amber-500/30 text-center text-xs text-amber-300">
          {error} (SOS panic dispatch remains completely unaffected.)
        </div>
      )}

      {!loading && currentLat !== 0 && currentLat !== undefined && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Current Zone</div>
                <div className="font-medium text-white">{locationName || `${currentLat.toFixed(4)}, ${currentLng?.toFixed(4)}`}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${currentLat},${currentLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-blue-300 border border-slate-700"
              >
                Street View
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-emerald-300 border border-slate-700"
              >
                Navigate
              </a>
            </div>
          </div>

          {saferAdvisory && (
            <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Live Safer City Advisories (Google Search Grounded)
              </div>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">{saferAdvisory}</p>
              {searchLinks.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                  {searchLinks.slice(0, 4).map((l, i) => (
                    <a
                      key={i}
                      href={l.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-blue-300 underline hover:text-blue-200"
                    >
                      {l.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {safeZonesText && (
            <div className="p-4 bg-slate-900 rounded-xl border border-blue-500/30 space-y-2">
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Nearest Verified Safe Points (Google Maps Grounded)
              </div>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">{safeZonesText}</p>
              {mapsLinks.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                  {mapsLinks.slice(0, 4).map((l, i) => (
                    <a
                      key={i}
                      href={l.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-emerald-300 underline hover:text-emerald-200"
                    >
                      📍 {l.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {weather && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400">🌤️</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meteorological Conditions</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Temp / Feels</div>
                  <div className="font-bold text-white text-lg">
                    {weather.temp}°C <span className="text-sm font-normal text-slate-500">({weather.feels_like}°C)</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Conditions</div>
                  <div className="font-bold text-white text-lg">
                    {weather.cloud_pct}% <span className="text-sm font-normal text-slate-500">Clouds</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Wind</div>
                  <div className="font-bold text-white text-lg">
                    {weather.wind_speed} <span className="text-sm font-normal text-slate-500">m/s</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Humidity</div>
                  <div className="font-bold text-white text-lg">{weather.humidity}%</div>
                </div>
              </div>
            </div>
          )}

          {news && news.length > 0 && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-cyan-400">📰</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Local Reports &amp; News</span>
              </div>
              <div className="flex flex-col gap-3">
                {news.slice(0, 3).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors"
                  >
                    <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug mb-1">{item.title}</h3>
                    {item.author && <div className="text-[10px] text-slate-400">Source: {item.author}</div>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
