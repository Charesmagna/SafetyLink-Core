import React, { useEffect, useState } from 'react';
import { useAppStore } from '../utils/store';
import { translate } from '../utils/translations';

export default function SituationalAwareness() {
  const { userLocation, language } = useAppStore();
  const currentLat = userLocation?.lat;
  const currentLng = userLocation?.lng;
  const t = (key: string) => key;
  const [weather, setWeather] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!currentLat || !currentLng) return;
      setLoading(true);
      setError('');
      try {
        // Fetch reverse geocoding
        const geoRes = await fetch(`/api/ninjas/reversegeocoding?lat=${currentLat}&lon=${currentLng}`);
        if (!geoRes.ok) throw new Error('Geocoding failed');
        const geoData = await geoRes.json();
        
        let locName = 'Unknown Location';
        if (geoData && geoData.length > 0) {
          locName = geoData[0].name;
          if (geoData[0].country) locName += `, ${geoData[0].country}`;
        }
        if (mounted) setLocationName(locName);

        // Fetch Weather
        const weatherRes = await fetch(`/api/ninjas/weather?lat=${currentLat}&lon=${currentLng}`);
        if (!weatherRes.ok) throw new Error('Weather fetch failed');
        const weatherData = await weatherRes.json();
        if (mounted) setWeather(weatherData);

        // Fetch News (Local or Safety oriented)
        const newsQuery = geoData && geoData.length > 0 ? geoData[0].name : 'safety emergency';
        const newsRes = await fetch(`/api/ninjas/news?text=${encodeURIComponent(newsQuery)}`);
        if (!newsRes.ok) throw new Error('News fetch failed');
        const newsData = await newsRes.json();
        if (mounted) setNews(newsData || []);

      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load situational awareness data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [currentLat, currentLng]);

  return (
    <div className="w-full h-full flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Situational Awareness</h2>
          <p className="text-xs text-slate-400 mt-1">Live Environment Intelligence</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
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
          Fetching local intelligence...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/30 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && currentLat !== 0 && (
        <div className="flex flex-col gap-4">
          {/* Location Block */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Current Zone</div>
              <div className="font-medium text-white">{locationName || 'Acquiring...'}</div>
            </div>
          </div>

          {/* Weather Block */}
          {weather && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400">🌤️</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meteorological Conditions</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Temp / Feels</div>
                  <div className="font-bold text-white text-lg">{weather.temp}°C <span className="text-sm font-normal text-slate-500">({weather.feels_like}°C)</span></div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Conditions</div>
                  <div className="font-bold text-white text-lg">{weather.cloud_pct}% <span className="text-sm font-normal text-slate-500">Clouds</span></div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Wind</div>
                  <div className="font-bold text-white text-lg">{weather.wind_speed} <span className="text-sm font-normal text-slate-500">m/s</span></div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Humidity</div>
                  <div className="font-bold text-white text-lg">{weather.humidity}%</div>
                </div>
              </div>
              {weather.wind_speed > 10 && (
                <div className="mt-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded-lg">
                  ⚠️ High wind speeds detected in your area. Be cautious of flying debris.
                </div>
              )}
              {weather.temp > 35 && (
                <div className="mt-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg">
                  ⚠️ Extreme heat warning. Stay hydrated and avoid prolonged sun exposure.
                </div>
              )}
            </div>
          )}

          {/* News Block */}
          {news && news.length > 0 && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-cyan-400">📰</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Local Reports & News</span>
              </div>
              <div className="flex flex-col gap-3">
                {news.slice(0, 3).map((item, idx) => (
                  <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="block bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug mb-1">{item.title}</h3>
                    {item.author && <div className="text-[10px] text-slate-400">Source: {item.author}</div>}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {news && news.length === 0 && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
              No recent news events found for this zone.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
