import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Activity, Users, FileText, Settings, ShieldAlert, 
  MapPin, AlertTriangle, MoreVertical, Search, Filter,
  ChevronDown, Bell, LogOut, ChevronLeft, ChevronRight, Brush
} from 'lucide-react';
import type { Session } from '../App';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1623] text-slate-300 font-sans flex overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#111c2a] border-r border-slate-700/50 flex flex-col shrink-0 h-screen overflow-y-auto">
        <div className="p-6 pb-8 border-b border-slate-700/30 flex items-center gap-3">
          <img src="/media/new_logo/New_SafetyLink_Official_Logo.svg" alt="SafetyLink" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight">SafetyLink</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Professional Security Solutions</p>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1">
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Dashboard" />
          <NavItem icon={<FileText className="w-5 h-5" />} label="Reports" hasArrow />
          
          <div className="mt-2">
            <div className="flex items-center justify-between px-4 py-3 bg-teal-500/10 text-teal-400 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span className="font-semibold text-sm">Clients & users</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
            
            <div className="mt-1 pl-12 py-2 space-y-2 relative before:absolute before:left-6 before:top-0 before:bottom-4 before:w-px before:bg-slate-700/50">
              <div className="flex items-center justify-between text-slate-200 text-sm py-1.5 cursor-pointer">
                <span>Clients</span>
                <ChevronDown className="w-4 h-4 mr-4 text-slate-500" />
              </div>
              
              <div className="pl-4 space-y-2 mt-1">
                <SubItem label="MegaCorp Office" active />
                <SubItem label="Users & Groups" />
                <SubItem label="Sites & Assets" />
                <SubItem label="Access Levels" />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
             <div className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white cursor-pointer transition-colors">City Center Apartments</div>
             <div className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white cursor-pointer transition-colors">Oakwood School</div>
             <div className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white cursor-pointer transition-colors">Innovate Tech Park</div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-700/30 flex justify-end">
          <button className="p-2 text-slate-500 hover:text-slate-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="bg-[#111c2a] border-b border-slate-700/50 flex flex-col shrink-0">
          <div className="px-8 py-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Organization Panel</h2>
            <div className="flex items-center gap-6">
              
              <button className="relative group p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Brush className="w-5 h-5 text-slate-400" />
                <div className="absolute top-full right-0 mt-2 bg-slate-800 text-xs text-white px-3 py-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Brand & Personalization Settings
                </div>
              </button>
              
              <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#111c2a]">1</span>
              </button>
              
              <div className="flex items-center gap-3 cursor-pointer pl-4 border-l border-slate-700/50">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="Admin" className="w-10 h-10 rounded-full object-cover" />
                <div className="text-sm">
                  <p className="text-slate-400 text-xs">Admin:</p>
                  <p className="font-semibold text-white">Sarah Jenkins</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />
              </div>
            </div>
          </div>
          
          <div className="flex px-8 gap-8 bg-teal-900/20 border-t border-teal-500/10">
            <Tab label="Dashboard" active />
            <Tab label="Clients" />
            <Tab label="System Health" />
            <Tab label="Alert Logs" />
            <Tab label="Reports" />
            <Tab label="Settings" />
          </div>
        </header>

        {/* DASHBOARD CONTENT SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full min-h-[700px]">
            
            {/* LEFT SECTION: ORGANIZATION OVERVIEW (Span 7) */}
            <div className="xl:col-span-7 flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                ORGANIZATION OVERVIEW
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 flex-1">
                
                {/* MAP WIDGET */}
                <div className="lg:col-span-4 bg-[#1a2636] border border-slate-700/50 rounded-xl flex flex-col overflow-hidden shadow-lg">
                  <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between bg-[#111c2a]">
                    <h4 className="font-semibold text-white text-sm">Client Sites Map</h4>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> OK</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span> Warning</div>
                    </div>
                  </div>
                  <div className="flex-1 relative bg-[#0a121d]">
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h80v80h-80z' fill='none' stroke='%233b82f6' stroke-width='0.5'/%3E%3Cpath d='M30 10v80M50 10v80M70 10v80M10 30h80M10 50h80M10 70h80' stroke='%233b82f6' stroke-width='0.2'/%3E%3C/svg%3E")`,
                      backgroundSize: '40px 40px'
                    }} />
                    
                    {/* Simulated Map Pins */}
                    <MapPinIcon top="20%" left="30%" color="emerald" />
                    <MapPinIcon top="35%" left="25%" color="emerald" />
                    <MapPinIcon top="15%" left="50%" color="emerald" />
                    <MapPinIcon top="45%" left="45%" color="orange" />
                    <MapPinIcon top="60%" left="60%" color="emerald" />
                    <MapPinIcon top="25%" left="70%" color="emerald" />
                    <MapPinIcon top="30%" left="80%" color="orange" />
                    <MapPinIcon top="70%" left="35%" color="emerald" />
                    <MapPinIcon top="80%" left="75%" color="orange" />
                  </div>
                </div>

                {/* RIGHT COLUMN OF WIDGETS */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  
                  {/* ACTIVE CLIENTS */}
                  <div className="bg-[#1a2636] border border-slate-700/50 rounded-xl flex flex-col shadow-lg">
                    <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">Active Clients</h4>
                      <button><MoreVertical className="w-4 h-4 text-slate-500" /></button>
                    </div>
                    <div className="p-2 space-y-1">
                      <ClientStatusItem name="MegaCorp Office" desc="Level 5 Office" status="OK" color="text-emerald-400" iconBg="bg-emerald-500/20" />
                      <div className="h-px bg-slate-700/30 mx-2" />
                      <ClientStatusItem name="City Center Apts" desc="Residential 1" status="OK" color="text-emerald-400" iconBg="bg-emerald-500/20" />
                      <div className="h-px bg-slate-700/30 mx-2" />
                      <ClientStatusItem name="Oakwood School" desc="Main Campus" alert="1 Warning: Sensor Offline" status="" color="text-orange-400" iconBg="bg-orange-500/20" isAlert />
                    </div>
                  </div>

                  {/* ALERT SUMMARY */}
                  <div className="bg-[#1a2636] border border-slate-700/50 rounded-xl flex flex-col flex-1 shadow-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">Alert Summary</h4>
                      <button><MoreVertical className="w-4 h-4 text-slate-500" /></button>
                    </div>
                    <div className="px-5 pt-4 pb-2 border-b border-slate-700/50">
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-red-400 border-b-2 border-red-400 pb-2">Critical (1)</span>
                        <span className="text-orange-400 border-b-2 border-orange-400 pb-2">High Priority (3)</span>
                        <span className="text-emerald-400 border-b-2 border-emerald-400 pb-2">Low Priority (0)</span>
                      </div>
                    </div>
                    <div className="p-4 pt-2 space-y-3 overflow-y-auto">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Recent Entries</p>
                      <AlertItem site="MegaCorp Office · Residential 1" time="1 Warning: 12:37 PM" status="OK" iconColor="text-red-500" />
                      <AlertItem site="Oakwood School · Main Campus" time="1 Warning: 10:30 PM" iconColor="text-orange-400" />
                      <AlertItem site="Oakwood School · Main Campus" time="1 Warning: 09:15 AM" iconColor="text-emerald-400" />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* RIGHT SECTION: CLIENT USERS (Span 5) */}
            <div className="xl:col-span-5 flex flex-col relative">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                CLIENT USERS
              </h3>
              
              <div className="bg-[#1a2636] border border-slate-700/50 rounded-xl shadow-lg flex flex-col flex-1 overflow-hidden">
                
                {/* TOOLBAR */}
                <div className="p-5 border-b border-slate-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">Organization:</span>
                      <div className="flex items-center gap-2 bg-[#111c2a] border border-slate-700 rounded-md px-3 py-1.5 cursor-pointer">
                        <span className="text-sm font-medium text-white">MegaCorp Office</span>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold text-sm px-4 py-2 rounded-md transition-colors">
                      Add New User
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full bg-[#111c2a] border border-slate-700 rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="w-32 relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <select className="w-full bg-[#111c2a] border border-slate-700 rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer">
                        <option>Filter</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="w-24 relative">
                      <select className="w-full bg-[#111c2a] border border-slate-700 rounded-md pl-4 pr-8 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer">
                        <option>All</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* TABLE */}
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#111c2a] border-b border-slate-700/50 text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Name <span className="inline-block ml-1">↑</span></th>
                        <th className="px-5 py-3 font-semibold">Role</th>
                        <th className="px-5 py-3 font-semibold">Access Level</th>
                        <th className="px-5 py-3 font-semibold">Sites Managed</th>
                        <th className="px-5 py-3 font-semibold">Last Activity</th>
                        <th className="px-5 py-3 font-semibold w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      <UserRow name="Michael Chen" role="Facility Manager" access="Full Access" sites="All Sites" status="Online" img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" />
                      <UserRow name="Jessica Adams" role="Security Officer" access="Site-Specific Access" sites="MegaCorp Office" status="Offline" img="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" />
                      <UserRow name="David Kim" role="Employee" access="Restricted Access" sites="Level 1" status="Online" img="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" />
                      <UserRow name="Decta Stahor" role="Authorized Employee" access="Restricted Access" sites="Level 1" status="Online" img="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" />
                      <UserRow name="Sesca Adom" role="Authorized Employee" access="Level 1" sites="All Sites" status="Offline" img="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
                    </tbody>
                  </table>
                </div>

              </div>

              {/* FLOATING TOAST NOTIFICATION */}
              <div className="absolute bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-3 pr-8 flex items-center gap-3 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" alt="David Kim" className="w-8 h-8 rounded-full object-cover" />
                <div className="text-sm">
                  <p className="text-white">User David Kim logged in</p>
                  <p className="text-slate-400 text-xs">(1 min ago)</p>
                </div>
                <button className="absolute top-2 right-2 text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>

            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, hasArrow }: { icon: React.ReactNode, label: string, hasArrow?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {hasArrow && <ChevronDown className="w-4 h-4 text-slate-500" />}
    </div>
  );
}

function SubItem({ label, active }: { label: string, active?: boolean }) {
  return (
    <div className={`text-sm px-4 py-1.5 cursor-pointer border-l-2 -ml-[17px] ${active ? 'text-white border-teal-500 bg-teal-500/5' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
      {label}
    </div>
  );
}

function Tab({ label, active }: { label: string, active?: boolean }) {
  return (
    <div className={`py-4 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${active ? 'text-white border-teal-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
      {label}
    </div>
  );
}

function MapPinIcon({ top, left, color }: { top: string, left: string, color: 'emerald' | 'orange' }) {
  return (
    <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ top, left }}>
      <MapPin className={`w-6 h-6 drop-shadow-md ${color === 'emerald' ? 'text-emerald-500 fill-emerald-500/20' : 'text-orange-500 fill-orange-500/20'}`} />
      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
    </div>
  );
}

function ClientStatusItem({ name, desc, status, alert, color, iconBg, isAlert }: any) {
  return (
    <div className="flex items-start justify-between p-3 hover:bg-slate-800/30 rounded-lg cursor-pointer transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
          {isAlert ? <AlertTriangle className={`w-3.5 h-3.5 ${color}`} /> : <CheckCircle className={`w-3.5 h-3.5 ${color}`} />}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{name}</p>
          {alert ? (
            <p className="text-orange-400 text-xs mt-0.5">{alert}</p>
          ) : (
            <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
          )}
        </div>
      </div>
      {status && <span className={`text-xs font-bold ${color}`}>{status}</span>}
    </div>
  );
}

function AlertItem({ site, time, status, iconColor }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">
        <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-white text-sm font-medium">
          {site} {status && <span className="text-slate-400">({status})</span>}
        </p>
        <p className="text-slate-500 text-xs">{time}</p>
      </div>
    </div>
  );
}

function UserRow({ name, role, access, sites, status, img }: any) {
  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <img src={img} alt={name} className="w-8 h-8 rounded-full object-cover" />
          <span className="font-medium text-white">{name}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-slate-300">{role}</td>
      <td className="px-5 py-3 text-slate-300">{access}</td>
      <td className="px-5 py-3 text-slate-300">{sites}</td>
      <td className="px-5 py-3">
        <span className={status === 'Online' ? 'text-emerald-400' : 'text-slate-500'}>{status}</span>
      </td>
      <td className="px-5 py-3 text-right">
        <button><MoreVertical className="w-4 h-4 text-slate-500" /></button>
      </td>
    </tr>
  );
}

// Additional icons needed for the subcomponents
import { CheckCircle, X } from 'lucide-react';
