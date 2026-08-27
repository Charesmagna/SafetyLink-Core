import { MapContainer, TileLayer, CircleMarker, Popup, Marker, Polyline } from 'react-leaflet';
import React, { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, LineChart, Line 
} from 'recharts';
import { useAppStore } from '../utils/store';
import { Activity, MapPin, AlertTriangle, Battery, ShieldAlert, WifiOff, Clock } from 'lucide-react';
import { motion } from 'motion/react';

// Sample mock data for analytics
const timeSeriesData: any[] = []; /* [
  { time: '00:00', incidents: 2, falseAlarms: 0 },
  { time: '04:00', incidents: 1, falseAlarms: 1 },
  { time: '08:00', incidents: 5, falseAlarms: 2 },
  { time: '12:00', incidents: 3, falseAlarms: 1 },
  { time: '16:00', incidents: 8, falseAlarms: 3 },
  { time: '20:00', incidents: 12, falseAlarms: 2 },
  { time: '23:59', incidents: 7, falseAlarms: 1 },
]; */

const riskZones: any[] = []; /* [
  { name: 'North Campus', risk: 85, color: '#ef4444', incidents: 42 },
  { name: 'East Gate', risk: 60, color: '#f59e0b', incidents: 18 },
  { name: 'Underground Parking', risk: 92, color: '#b91c1c', incidents: 56 },
  { name: 'Main Library', risk: 25, color: '#10b981', incidents: 4 },
]; */

// Mock cluster points for the map
const geoPoints: any[] = []; /* Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  lat: -26.1929 + (Math.random() - 0.5) * 0.05,
  lng: 28.0305 + (Math.random() - 0.5) * 0.05,
  intensity: Math.random(),
  type: Math.random() > 0.8 ? 'critical' : (Math.random() > 0.5 ? 'warning' : 'info')
})); */

export const GeospatialAnalytics: React.FC = () => {
  const { panicEvents, users } = useAppStore();
  const [activeMetric, setActiveMetric] = useState<'incidents' | 'battery' | 'connectivity'>('incidents');

  // Compute live metrics
  const activePanicCount = panicEvents.filter(e => e.status !== 'RESOLVED').length;
  const avgResponseTime = '3m 42s'; // In real app, calculate from resolution timestamps

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header / KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Active Distress Signals" 
          value={activePanicCount} 
          trend="+2" 
          trendDirection="up"
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          color="border-red-500/30 bg-red-950/20"
        />
        <MetricCard 
          title="Avg Response Time (SLA)" 
          value={avgResponseTime} 
          trend="-15s" 
          trendDirection="down"
          icon={<Clock className="w-5 h-5 text-emerald-400" />}
          color="border-emerald-500/30 bg-emerald-950/20"
        />
        <MetricCard 
          title="Node Mesh Connectivity" 
          value="98.2%" 
          trend="+0.4%" 
          trendDirection="up"
          icon={<Activity className="w-5 h-5 text-indigo-400" />}
          color="border-indigo-500/30 bg-indigo-950/20"
        />
        <MetricCard 
          title="Predicted False Alarms" 
          value="12.5%" 
          trend="-2.1%" 
          trendDirection="down"
          icon={<ShieldAlert className="w-5 h-5 text-amber-400" />}
          color="border-amber-500/30 bg-amber-950/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Geospatial Map */}
        <div className="lg:col-span-2 glass-panel p-4 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Live Geospatial Telemetry
            </h3>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              {(['incidents', 'battery', 'connectivity'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveMetric(tab)}
                  className={`px-3 py-1 text-[9px] font-mono uppercase rounded-md transition-all ${
                    activeMetric === tab ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative z-0">
            <MapContainer 
              center={[-26.1929, 28.0305]} 
              zoom={13} 
              style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {geoPoints.map(pt => (
                <CircleMarker
                  key={pt.id}
                  center={[pt.lat, pt.lng]}
                  radius={activeMetric === 'incidents' ? pt.intensity * 15 : 6}
                  fillColor={
                    pt.type === 'critical' ? '#ef4444' : 
                    pt.type === 'warning' ? '#f59e0b' : '#3b82f6'
                  }
                  color={pt.type === 'critical' ? '#991b1b' : 'transparent'}
                  weight={2}
                  fillOpacity={0.6}
                >
                  <Popup className="custom-popup">
                    <div className="text-xs font-mono">
                      <strong>Node ID:</strong> SL-{pt.id}<br/>
                      <strong>Status:</strong> {pt.type.toUpperCase()}<br/>
                      <strong>Intensity:</strong> {(pt.intensity * 100).toFixed(1)}%
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Sidebar Analytics */}
        <div className="space-y-6">
          {/* Risk Zones */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest mb-4">
              Predictive Risk Zones
            </h3>
            <div className="space-y-4">
              {riskZones.map((zone, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-mono text-slate-400">{zone.name}</span>
                    <span className="text-[9px] font-mono font-bold" style={{ color: zone.color }}>
                      {zone.risk}% RISK
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${zone.risk}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Battery Health */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Battery className="w-4 h-4 text-emerald-400" />
              Fleet Power Health
            </h3>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskZones} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="incidents" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Temporal Analytics */}
      <div className="glass-panel p-5">
        <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest mb-6">
          24H Temporal Incident Frequency
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFalseAlarms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" name="Verified Incidents" />
              <Area type="monotone" dataKey="falseAlarms" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorFalseAlarms)" name="False Alarms" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

// Sub-component for KPI blocks
const MetricCard = ({ title, value, trend, trendDirection, icon, color }: any) => (
  <div className={`glass-panel border p-4 flex flex-col justify-between space-y-3 ${color}`}>
    <div className="flex justify-between items-start">
      <span className="text-[9px] font-mono font-black text-slate-400 uppercase leading-tight w-2/3">{title}</span>
      <div className="p-1.5 bg-slate-900/50 rounded-lg border border-slate-800">
        {icon}
      </div>
    </div>
    <div className="flex items-end gap-3">
      <span className="text-2xl font-mono font-black text-slate-100">{value}</span>
      <span className={`text-[10px] font-mono font-bold mb-1 ${trendDirection === 'up' ? (trend.includes('+') && !trend.includes('98') ? 'text-red-400' : 'text-emerald-400') : 'text-emerald-400'}`}>
        {trend}
      </span>
    </div>
  </div>
);
