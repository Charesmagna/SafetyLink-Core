import React, { useState } from "react";
import { Radio, ShieldAlert, Phone, Navigation, RefreshCw } from "lucide-react";

export default function RespondersView() {
  const [activeIntercom, setActiveIntercom] = useState<string | null>(null);

  const responders = [
    { id: "resp-1", name: "Officer Sipho Dlamini", tag: "GP-Tactical-1", type: "Armed Patrol", eta: "4 mins", dist: "1.8 km", status: "Available", phone: "+27 82 555 0192", pos: { top: "35%", left: "45%" } },
    { id: "resp-2", name: "Officer Jaco Botha", tag: "GP-Canine-4", type: "Canine Unit", eta: "6 mins", dist: "3.1 km", status: "Responding", phone: "+27 71 555 4912", pos: { top: "60%", left: "20%" } },
    { id: "resp-3", name: "Sector 4 CPF Patrol", tag: "CPF-Leader-3", type: "Community Watch", eta: "2 mins", dist: "0.7 km", status: "Available", phone: "+27 82 999 8888", pos: { top: "25%", left: "70%" } },
    { id: "resp-4", name: "Netcare 911 EMS", tag: "AMB-Netcare", type: "Medical Paramedic", eta: "9 mins", dist: "5.4 km", status: "Standby", phone: "+27 82 555 0100", pos: { top: "80%", left: "75%" } },
  ];

  const triggerIntercom = (name: string) => {
    setActiveIntercom(name);
    setTimeout(() => {
      setActiveIntercom(null);
    }, 3000);
  };

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Responder Tracking</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono">LIVE SECTOR RADAR & DIRECT COMMUNICATIONS</p>
      </div>

      {/* TACTICAL MAP SCHEMATIC SIMULATOR */}
      <div className="relative w-full h-[180px] bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
        {/* Radar concentric circular grid */}
        <div className="absolute w-[240px] h-[240px] rounded-full border border-slate-900/40"></div>
        <div className="absolute w-[160px] h-[160px] rounded-full border border-slate-900/60"></div>
        <div className="absolute w-[80px] h-[80px] rounded-full border border-slate-900/80"></div>
        
        {/* Crosshair grids */}
        <div className="absolute inset-x-0 h-[1px] bg-slate-900/50"></div>
        <div className="absolute inset-y-0 w-[1px] bg-slate-900/50"></div>
        
        {/* Radar sweeping visual overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-950/10 to-transparent animate-pulse"></div>

        {/* Home Base Center node (The caller's GPS lock-on) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
          </div>
          <span className="text-[7px] text-rose-400 font-extrabold bg-rose-950/80 border border-rose-500/20 px-1 py-0.5 rounded font-mono uppercase mt-1 leading-none shadow">
            MY LOC
          </span>
        </div>

        {/* Map Streets Visual Overlay (Schematic Style) */}
        <div className="absolute top-[10%] left-0 right-0 h-[2px] bg-slate-900/30 rotate-12"></div>
        <div className="absolute top-[45%] left-0 right-0 h-[3px] bg-slate-900/40 -rotate-6"></div>
        <div className="absolute top-[75%] left-0 right-0 h-[2px] bg-slate-900/30 rotate-3"></div>
        <div className="absolute left-[30%] top-0 bottom-0 w-[2px] bg-slate-900/30 rotate-45"></div>
        <div className="absolute left-[65%] top-0 bottom-0 w-[3px] bg-slate-900/40 -rotate-12"></div>

        {/* Dynamic Blinking Responder Nodes */}
        {responders.map((resp) => (
          <div
            key={resp.id}
            className="absolute z-10 flex flex-col items-center transition-all duration-700"
            style={{ top: resp.pos.top, left: resp.pos.left }}
          >
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${resp.id === "resp-4" ? "bg-amber-400" : "bg-blue-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${resp.id === "resp-4" ? "bg-amber-500" : "bg-blue-500"}`}></span>
            </div>
            <span className="text-[6px] text-slate-300 font-black tracking-tighter bg-slate-950/90 border border-slate-800 px-1 rounded font-mono mt-0.5 whitespace-nowrap leading-none">
              {resp.tag} ({resp.eta})
            </span>
          </div>
        ))}
        
        {/* Radar label */}
        <div className="absolute bottom-2 left-3 text-[7px] font-bold text-slate-500 font-mono flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded">
          <Navigation className="w-2.5 h-2.5" />
          LENASIA SECTOR 4 RADAR GRID • RANGE 5.0KM
        </div>
      </div>

      {/* Intercom alert feedback overlay */}
      {activeIntercom && (
        <div className="bg-blue-950/30 border border-blue-500/20 p-2.5 rounded-xl text-center flex items-center justify-center gap-2 animate-pulse">
          <Radio className="w-4 h-4 text-blue-400" />
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider font-mono">
            Establishing VoIP link to {activeIntercom}...
          </p>
        </div>
      )}

      {/* Responders Feed List */}
      <div className="space-y-2.5">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
          Nearest Active Field Operators
        </span>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {responders.map((resp) => (
            <div
              key={resp.id}
              className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/80 flex items-center justify-between"
            >
              <div className="text-left space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black tracking-widest text-blue-400 uppercase bg-blue-950/40 border border-blue-500/20 px-1.5 py-0.5 rounded leading-none">
                    {resp.tag}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">• {resp.type}</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-200">{resp.name}</h4>
                <div className="flex items-center gap-2 text-[9px] text-slate-500 font-semibold font-mono">
                  <span>ETA: <strong className="text-slate-300">{resp.eta}</strong></span>
                  <span>•</span>
                  <span>Dist: <strong className="text-slate-300">{resp.dist}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => triggerIntercom(resp.name)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-blue-400 hover:text-white border border-slate-850 cursor-pointer shadow-inner transition"
                  title="VoIP Radio Intercom Link"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </button>
                <a
                  href={`tel:${resp.phone}`}
                  className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-white border border-slate-850 cursor-pointer shadow-inner transition"
                  title="GSM Cellular Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
