import React, { useState, useEffect } from "react";
import { 
  Shield, Smartphone, Activity, Layers, Database, Sparkles, RefreshCw, 
  PlusCircle, BookOpen, AlertCircle, Info, Heart
} from "lucide-react";
import { ViewTab, Organization, User, MedicalProfile, HardwareDevice, Alert, AlertEvent, SMSLog, WhatsAppLog, VoiceLog } from "./types";
import MobileSimulator from "./components/MobileSimulator";
import CommandCentre from "./components/CommandCentre";
import PlatformOwnerDashboard from "./components/PlatformOwnerDashboard";
import BleDeviceSimulator from "./components/BleDeviceSimulator";
import IntegrationLogs from "./components/IntegrationLogs";
import PermissionsCentre from "./components/PermissionsCentre";
import PushSettings from "./components/PushSettings";

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>("simulator");

  // State caches
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hardware, setHardware] = useState<HardwareDevice[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);

  // Current session client state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMedical, setCurrentMedical] = useState<MedicalProfile | null>(null);
  const [activeAlertEvents, setActiveAlertEvents] = useState<AlertEvent[]>([]);

  // Fetch latest state on startup
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resOrgs = await fetch("/api/organizations");
      const orgs = await resOrgs.json();
      setOrganizations(orgs);

      const resUsers = await fetch("/api/users");
      const u = await resUsers.json();
      setUsers(u);

      const resAlerts = await fetch("/api/alerts");
      const alt = await resAlerts.json();
      setAlerts(alt);

      const resHw = await fetch("/api/hardware");
      const hw = await resHw.json();
      setHardware(hw);

      const resSms = await fetch("/api/logs/sms");
      const sms = await resSms.json();
      setSmsLogs(sms);

      const resWa = await fetch("/api/logs/whatsapp");
      const wa = await resWa.json();
      setWhatsappLogs(wa);

      const resVoice = await fetch("/api/logs/voice");
      const voice = await resVoice.json();
      setVoiceLogs(voice);

      // If an alert is active, refresh the active events
      if (alerts.length > 0) {
        const activeAlert = alerts[0]; // Refresh first/latest alert events
        const resEvts = await fetch(`/api/alerts/${activeAlert.id}/events`);
        const evts = await resEvts.json();
        setActiveAlertEvents(evts);
      }
    } catch (err) {
      console.error("Error fetching database state cache:", err);
    }
  };

  const handleCreateOrganization = async (name: string, plan: string) => {
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subscriptionPlan: plan })
      });
      const data = await res.json();
      fetchData();
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: "approved" | "suspended" | "pending") => {
    try {
      await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (data: any) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to register account.");
    }
    const payload = await res.json();
    fetchData();
    return payload;
  };

  const handleLogin = async (data: any) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Invalid credentials.");
    }
    const payload = await res.json();
    setCurrentUser(payload.user);
    setCurrentMedical(payload.medicalProfile);
    fetchData();
    return payload;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentMedical(null);
  };

  const handleUpdateMedical = async (data: any) => {
    const res = await fetch(`/api/users/${data.userId}/medical`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const med = await res.json();
    setCurrentMedical(med);
    fetchData();
    return med;
  };

  const handleUpdateProfile = async (data: any) => {
    const res = await fetch(`/api/users/${data.id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const usr = await res.json();
    setCurrentUser(usr);
    fetchData();
    return usr;
  };

  const handleTriggerSOS = async (latitude: number, longitude: number) => {
    if (!currentUser) return;
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, latitude, longitude })
    });
    const payload = await res.json();
    fetchData();
    return payload;
  };

  const handleResolveAlert = async (alertId: string, resolvedBy: string = "Operator Control") => {
    await fetch(`/api/alerts/${alertId}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolvedBy })
    });
    fetchData();
  };

  const handleUpdateAlertStatus = async (alertId: string, status: "active" | "escalated" | "resolved", message?: string) => {
    await fetch(`/api/alerts/${alertId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, operatorMessage: message })
    });
    fetchData();
  };

  const handleTriggerAISummary = async (alertId: string) => {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId })
    });
    const payload = await res.json();
    return payload.analysis;
  };

  const handleAddHardwareDevice = async (name: string, deviceId: string) => {
    if (organizations.length === 0) return;
    await fetch("/api/hardware", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, deviceId, orgId: organizations[0].id })
    });
    fetchData();
  };

  const handleAssignDevice = async (deviceId: string, userId: string) => {
    await fetch("/api/hardware/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, userId })
    });
    fetchData();
  };

  const handleUnassignDevice = async (deviceId: string) => {
    await fetch("/api/hardware/unassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId })
    });
    fetchData();
  };

  const handleDeleteDevice = async (deviceId: string) => {
    await fetch(`/api/hardware/${deviceId}`, { method: "DELETE" });
    fetchData();
  };

  const handleTriggerHardwareSos = async (deviceId: string) => {
    const dev = hardware.find(h => h.id === deviceId);
    if (!dev || !dev.assignedUserId) return;

    // Get location coordinates (Gauteng Central/Johannesburg region with offset)
    const lat = -26.2041 + (Math.random() - 0.5) * 0.05;
    const lng = 28.0473 + (Math.random() - 0.5) * 0.05;

    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: dev.assignedUserId, latitude: lat, longitude: lng })
    });
    
    alert(`[BLE HARDWARE SOS TRIGGERED] Physical button keypress detected! Satellite SMS, Voice & Webhooks dispatched for assigned member.`);
    fetchData();
  };

  const handleTriggerVoiceState = async (id: string, status: "answered" | "no-answer" | "busy") => {
    await fetch(`/api/logs/voice/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-emerald-500 selection:text-black">
      
      {/* Upper Brand Info Banner - Dark Tactical Industrial Look */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-4 px-6 shadow-2xl shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white font-mono">
                  <svg className="w-6 h-6 inline-block shrink-0 animate-pulse" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5 L15 20 V50 C15 75 50 95 50 95 C50 95 85 75 85 50 V20 L50 5 Z" fill="#020617" stroke="#10b981" strokeWidth="5" />
                    <path d="M35 45 C35 39.5 39.5 35 45 35 C50.5 35 55 39.5 55 45 M65 55 C65 60.5 60.5 65 55 65 C49.5 65 45 60.5 45 55" stroke="#10b981" strokeWidth="8" strokeLinecap="round" />
                    <line x1="45" y1="45" x2="55" y2="55" stroke="#10b981" strokeWidth="8" strokeLinecap="round" />
                    <path d="M55 35 H65 V45" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <line x1="45" y1="55" x2="65" y2="35" stroke="#10b981" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                  SafetyLink - Intelligent Emergency Response System
                </h1>
                <span className="text-[9px] font-black tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase">
                  Powered by TM Media Solutions
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Mission-Critical Dispatches | Founded by <b>Tshilidzi Mukwevho</b> under TM Media Solutions ®
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Territory Scope</span>
              <span className="text-xs font-mono font-bold text-emerald-400">South African Clusters</span>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-950 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 px-3 py-1.5 rounded-xl transition shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Cluster
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: View switching controls */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-grow flex flex-col space-y-6">
        
        {/* Navigation Tabs bar - Tactical Slate Style */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold px-4.5 py-3 rounded-xl border transition ${
              activeTab === "simulator" 
                ? "bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            Mobile App Device
          </button>
          <button
            onClick={() => setActiveTab("command-centre")}
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold px-4.5 py-3 rounded-xl border transition ${
              activeTab === "command-centre" 
                ? "bg-slate-900 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent"
            }`}
          >
            <Activity className="w-4 h-4 text-rose-500" />
            Command Control Centre
          </button>
          <button
            onClick={() => setActiveTab("owner-dashboard")}
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold px-4.5 py-3 rounded-xl border transition ${
              activeTab === "owner-dashboard" 
                ? "bg-slate-900 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-950/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            Platform Owner Cluster
          </button>
          <button
            onClick={() => setActiveTab("ble-simulator")}
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold px-4.5 py-3 rounded-xl border transition ${
              activeTab === "ble-simulator" 
                ? "bg-slate-900 border-blue-500 text-blue-400 shadow-lg shadow-blue-950/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent"
            }`}
          >
            <PlusCircle className="w-4 h-4 text-blue-500" />
            BLE Hardware Emulator
          </button>
          <button
            onClick={() => setActiveTab("integration-logs")}
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold px-4.5 py-3 rounded-xl border transition ${
              activeTab === "integration-logs" 
                ? "bg-slate-900 border-amber-500 text-amber-400 shadow-lg shadow-amber-950/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent"
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            API Escapes & logs
          </button>
        </div>

        {/* Tab view rendering stage */}
        <div className="flex-grow">
          {activeTab === "simulator" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Instructions on the left side of the simulator */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    How to Simulation Test
                  </h3>
                  
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    <div className="flex gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                      <span className="w-6 h-6 bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0 font-mono text-xs">1</span>
                      <div>
                        <p className="font-bold text-slate-200 uppercase tracking-wider mb-0.5">Create an Organization</p>
                        <span>Navigate to the <b>Platform Owner Cluster</b> tab. Enter any custom South African security company name (e.g. <i>Cape Town Watch</i> or <i>GP Tactical Rescue</i>) and click <b>Provision Organization</b> to register a new tenant and acquire an access code.</span>
                      </div>
                    </div>
                    <div className="flex gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                      <span className="w-6 h-6 bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0 font-mono text-xs">2</span>
                      <div>
                        <p className="font-bold text-slate-200 uppercase tracking-wider mb-0.5">Provision Mobile Device</p>
                        <span>Copy your generated organization code (e.g., <i>GP-XXXX-YY</i>), return here to the <b>Mobile App Device</b> view, paste it, and click <b>PROVISION CODE</b>. This locks the hardware simulator to your security firm!</span>
                      </div>
                    </div>
                    <div className="flex gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                      <span className="w-6 h-6 bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0 font-mono text-xs">3</span>
                      <div>
                        <p className="font-bold text-slate-200 uppercase tracking-wider mb-0.5">Register & Approve Users</p>
                        <span>Click <b>Join Org</b> on the login screen inside the mobile phone. Register your custom name, South African mobile number, and password. Next, go back to the <b>Platform Owner Cluster</b> tab to approve them in the verification queue.</span>
                      </div>
                    </div>
                    <div className="flex gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                      <span className="w-6 h-6 bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0 font-mono text-xs">4</span>
                      <div>
                        <p className="font-bold text-slate-200 uppercase tracking-wider mb-0.5">Simulate & Trigger SOS</p>
                        <span>Log in, configure your medical profile, teleport coordinates across South African cities, and hold down the red <b>HOLD SOS</b> button. Watch live Twilio dispatches and automated voice cascading execute in real-time under the logs tab!</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Notice - Tactical Green Panel */}
                <div className="bg-emerald-950/20 rounded-2xl p-5 border border-emerald-900/40 text-xs text-emerald-300 flex gap-3">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-200 mb-1 uppercase tracking-widest font-mono">South African Dialing & Telemetry Staging</p>
                    <p className="leading-relaxed">All emergency dialing cascades, WhatsApp dispatches, and geographical clustering filters dynamically scale to match any location in South Africa. Profiles can be registered as standard field responders or dispatched tactical supervisors.</p>
                  </div>
                </div>

                {/* NATIVE SYSTEM CONTROLS (Phases 3 & 10) */}
                <PermissionsCentre />
                <PushSettings orgId="org-sa-tactical-01" />
              </div>

              {/* The high-fidelity mobile device mockup on the right side */}
              <div className="lg:col-span-7 flex justify-center">
                <MobileSimulator 
                  organizations={organizations}
                  currentUser={currentUser}
                  currentMedical={currentMedical}
                  hardware={hardware}
                  alerts={alerts}
                  onRegister={handleRegister}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onUpdateMedical={handleUpdateMedical}
                  onUpdateProfile={handleUpdateProfile}
                  onTriggerSOS={handleTriggerSOS}
                  onResolveAlert={handleResolveAlert}
                  activeAlertEvents={activeAlertEvents}
                  refreshData={fetchData}
                />
              </div>
            </div>
          )}

          {activeTab === "command-centre" && (
            <CommandCentre 
              alerts={alerts}
              users={users}
              onResolveAlert={handleResolveAlert}
              onUpdateAlertStatus={handleUpdateAlertStatus}
              onTriggerAISummary={handleTriggerAISummary}
              refreshData={fetchData}
            />
          )}

          {activeTab === "owner-dashboard" && (
            <PlatformOwnerDashboard 
              organizations={organizations}
              users={users}
              alerts={alerts}
              smsCount={smsLogs.length}
              waCount={whatsappLogs.length}
              voiceCount={voiceLogs.length}
              onCreateOrganization={handleCreateOrganization}
              onUpdateUserStatus={handleUpdateUserStatus}
            />
          )}

          {activeTab === "ble-simulator" && (
            <BleDeviceSimulator 
              hardware={hardware}
              users={users}
              onAddDevice={handleAddHardwareDevice}
              onAssignDevice={handleAssignDevice}
              onUnassignDevice={handleUnassignDevice}
              onDeleteDevice={handleDeleteDevice}
              onTriggerHardwareSos={handleTriggerHardwareSos}
            />
          )}

          {activeTab === "integration-logs" && (
            <IntegrationLogs 
              smsLogs={smsLogs}
              whatsappLogs={whatsappLogs}
              voiceLogs={voiceLogs}
              onTriggerVoiceState={handleTriggerVoiceState}
              refreshData={fetchData}
            />
          )}
        </div>

        {/* BOTTOM PERFORMANCE & LIFE-CYCLE TELEMETRY DASHBOARD */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 mt-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h4 className="text-xs uppercase tracking-widest font-mono font-bold text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              SafetyLink Cluster Telemetry & API Performance
            </h4>
            <span className="font-mono text-[10px] text-slate-500">v5.2.0 STABLE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">API Gateway Status</span>
              <span className="font-bold text-emerald-400 block mt-1 uppercase tracking-wider">ONLINE (OK)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">SMS Dispatcher (Twilio)</span>
              <span className="text-slate-200 block mt-1 font-bold">Ready ({smsLogs.length} Sent)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Meta WhatsApp API</span>
              <span className="text-slate-200 block mt-1 font-bold">Ready ({whatsappLogs.length} Deliv)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Voice Call Escalations</span>
              <span className="text-slate-200 block mt-1 font-bold">Ready ({voiceLogs.length} Calls)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">GATT BLE Scanning Rate</span>
              <span className="text-blue-400 block mt-1 font-bold">250 ms (Polling)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Durable Storage Sync</span>
              <span className="text-emerald-400 block mt-1 font-bold uppercase tracking-wider">IndexedDB OK</span>
            </div>
          </div>
        </div>

      </div>

      {/* TM Media Solutions Glassmorphic Footer */}
      <footer id="tm-footer" className="mt-12 bg-slate-950 border-t border-slate-800 text-slate-300 py-10 px-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          
          {/* Brand/Logo Section */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div className="flex items-center gap-3">
              {/* TM Stylized Geometric SVG Logo */}
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/10 shrink-0">
                TM
              </div>
              <div>
                <h3 className="text-base font-black tracking-wider text-white">TM MEDIA SOLUTIONS ®</h3>
                <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">COLORFUL ENTERTAINMENT</p>
              </div>
            </div>
            <p className="text-xs italic text-slate-400 font-serif">"The home of colorful entertainment"</p>
          </div>

          {/* Corporate Details Section */}
          <div className="border-y md:border-y-0 md:border-x border-slate-800 py-6 md:py-0 md:px-8 space-y-2 text-xs text-slate-400">
            <p className="font-bold text-white text-xs uppercase tracking-wider mb-2">Corporate Office</p>
            <p className="font-semibold text-slate-300">TM Media Solutions ®</p>
            <p className="text-[10px] font-mono">Reg Number: 2018/500191/07</p>
            <p className="flex justify-center md:justify-start items-center gap-1.5 mt-2">
              <span className="text-emerald-400">📍</span> 5832 Chameleon Street, Lenasia, 1829
            </p>
            <p className="flex justify-center md:justify-start items-center gap-1.5">
              <span className="text-indigo-400">📞</span> 068 007 9911
            </p>
            <p className="flex justify-center md:justify-start items-center gap-1.5">
              <span className="text-amber-400">🕒</span> Operational Hours: Closes 6 PM
            </p>
          </div>

          {/* Division Details & Copyright Section */}
          <div className="flex flex-col items-center md:items-end justify-between h-full space-y-4 md:space-y-0">
            <div className="md:text-right">
              <p className="text-xs font-semibold text-white">SAFETY-LINK DIVISION</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                Safety-Link is an emergency response platform engineered under the TM Media Solutions portfolio, founded by <b>Tshilidzi Mukwevho</b>.
              </p>
            </div>
            <div className="md:text-right text-[10px] text-slate-500">
              <p>© 2024 TM Media Solutions. All Rights Reserved.</p>
              <p className="mt-1 font-mono text-[9px]">GATT BLE / Twilio / Meta API Gateway v5.0 Stable</p>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
