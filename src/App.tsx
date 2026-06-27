import React, { useState, useEffect } from "react";
import { 
  Shield, Smartphone, Activity, Layers, Database, Sparkles, RefreshCw, 
  PlusCircle, BookOpen, AlertCircle, Info, Heart, Lock, Send, MessageSquare, HelpCircle, X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ViewTab, Organization, User, MedicalProfile, HardwareDevice, Alert, AlertEvent, SMSLog, WhatsAppLog, VoiceLog } from "./types";
import MobileSimulator from "./components/MobileSimulator";
import CommandCentre from "./components/CommandCentre";
import PlatformOwnerDashboard from "./components/PlatformOwnerDashboard";
import BleDeviceSimulator from "./components/BleDeviceSimulator";
import IntegrationLogs from "./components/IntegrationLogs";
import PermissionsCentre from "./components/PermissionsCentre";
import PushSettings from "./components/PushSettings";
import Logo from "./components/Logo";

const getInitialTab = (): ViewTab => {
  const path = window.location.pathname;
  if (path === "/command-centre") return "command-centre";
  if (path === "/owner-dashboard") return "owner-dashboard";
  if (path === "/ble-simulator") return "ble-simulator";
  if (path === "/integration-logs") return "integration-logs";
  if (path === "/hardening-protocols") return "hardening-protocols";
  return "simulator";
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>(getInitialTab());

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    const path = tab === "simulator" ? "/" : `/${tab}`;
    window.history.pushState(null, "", path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Global toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // --- ROLE-BASED ACCESS CONTROL (RBAC) POLICY ---
  const hasTabAccess = (tab: ViewTab, user: User | null): boolean => {
    if (tab === "simulator") return true;
    if (!user) return false;
    
    const role = user.role;
    if (role === "Platform Owner" || role === "Admin") return true;
    
    if (role === "Supervisor") {
      return ["command-centre", "ble-simulator", "integration-logs"].includes(tab);
    }
    
    if (role === "Responder") {
      return ["command-centre", "ble-simulator"].includes(tab);
    }
    
    // Member (standard clients/citizens) have no access to administrative modules
    return false;
  };

  // --- INTERACTIVE TOUR TUTORIAL STATE ---
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    return localStorage.getItem("safetylink-tutorial-dismissed") !== "true";
  });
  const [activeStep, setActiveStep] = useState<number>(0);

  // --- SIDEBAR AI INTEL ADVISOR CHATBOT STATE ---
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiHistory, setAiHistory] = useState<Array<{ role: "user" | "model"; text: string }>>([
    { role: "model", text: "Greetings. I am your SafetyLink Operations AI Advisor. Query me about sector boundaries, cascading alarms, iTAG setups, or South African security structures." }
  ]);
  const [aiIsLoading, setAiIsLoading] = useState<boolean>(false);
  const [isAiChatExpanded, setIsAiChatExpanded] = useState<boolean>(false);

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiIsLoading) return;

    const userMsg = aiQuery.trim();
    setAiQuery("");
    setAiHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setAiIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      if (!res.ok) throw new Error("Gateway timeout.");
      const data = await res.json();
      setAiHistory(prev => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setAiHistory(prev => [...prev, { role: "model", text: "⚠️ Uplink interrupted. Please make sure the SafetyLink server is listening on port 3000." }]);
    } finally {
      setAiIsLoading(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // State caches
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hardware, setHardware] = useState<HardwareDevice[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);

  // Current session client state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("safetylink-current-user");
    if (saved) {
      if (saved === "logged_out") return null;
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });
  const [currentMedical, setCurrentMedical] = useState<MedicalProfile | null>(() => {
    const saved = localStorage.getItem("safetylink-current-medical");
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });
  const [activeAlertEvents, setActiveAlertEvents] = useState<AlertEvent[]>([]);

  // Interactive profile/organization onboarding wizard states
  const [obName, setObName] = useState("Tshilidzi Mukwevho");
  const [obEmail, setObEmail] = useState("tshilidzi.mukwevho54@gmail.com");
  const [obPhone, setObPhone] = useState("+27 82 999 8888");
  const [obOrgName, setObOrgName] = useState("Gauteng Tactical Patrols");
  const [obRole, setObRole] = useState("Platform Owner");
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

  const handleQuickOnboard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOnboardingLoading(true);
    try {
      const res = await fetch("/api/auth/quick-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: obName,
          email: obEmail,
          phone: obPhone,
          orgName: obOrgName,
          role: obRole
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to onboard profile.");
      }
      const data = await res.json();
      setCurrentUser(data.user);
      setCurrentMedical(data.medicalProfile);
      localStorage.setItem("safetylink-current-user", JSON.stringify(data.user));
      if (data.medicalProfile) {
        localStorage.setItem("safetylink-current-medical", JSON.stringify(data.medicalProfile));
      }
      fetchData();
      showToast(`Welcome ${data.user.name}! Profile & Organization securely provisioned.`, "success");
    } catch (err: any) {
      showToast(err.message || "Onboarding failed.", "error");
    } finally {
      setIsOnboardingLoading(false);
    }
  };

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
      if (!res.ok) {
        throw new Error("Failed to provision organization node.");
      }
      const data = await res.json();
      fetchData();
      showToast(`Provisioned organization: ${name}`, "success");
      return data;
    } catch (err: any) {
      showToast(err.message || "Failed to create organization.", "error");
      console.error(err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: "approved" | "suspended" | "pending") => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        throw new Error("Could not update authorization status.");
      }
      fetchData();
      showToast(`User status updated to ${status}.`, "info");
    } catch (err: any) {
      showToast(err.message || "Failed to update user authorization status.", "error");
      console.error(err);
    }
  };

  const handleRegister = async (data: any) => {
    try {
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
      showToast("Citizen registration successful!", "success");
      return payload;
    } catch (err: any) {
      showToast(err.message || "Device registration failed.", "error");
      throw err;
    }
  };

  const handleLogin = async (data: any) => {
    try {
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
      localStorage.setItem("safetylink-current-user", JSON.stringify(payload.user));
      if (payload.medicalProfile) {
        localStorage.setItem("safetylink-current-medical", JSON.stringify(payload.medicalProfile));
      } else {
        localStorage.removeItem("safetylink-current-medical");
      }
      fetchData();
      showToast("Access granted: Establishing secure terminal.", "success");
      return payload;
    } catch (err: any) {
      showToast(err.message || "Invalid email or master passcode.", "error");
      throw err;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentMedical(null);
    localStorage.setItem("safetylink-current-user", "logged_out");
    localStorage.removeItem("safetylink-current-medical");
    showToast("Session closed. Device de-authorized.", "info");
  };

  const handleUpdateMedical = async (data: any) => {
    try {
      const res = await fetch(`/api/users/${data.userId}/medical`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error("Unable to synchronize medical records.");
      }
      const med = await res.json();
      setCurrentMedical(med);
      fetchData();
      showToast("Medical ID record successfully synchronized.", "success");
      return med;
    } catch (err: any) {
      showToast(err.message || "Failed to synchronize medical ID.", "error");
      throw err;
    }
  };

  const handleUpdateProfile = async (data: any) => {
    try {
      const res = await fetch(`/api/users/${data.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw new Error("Failed to write profile updates.");
      }
      const usr = await res.json();
      setCurrentUser(usr);
      fetchData();
      showToast("Profile settings synchronized.", "success");
      return usr;
    } catch (err: any) {
      showToast(err.message || "Failed to update profile settings.", "error");
      throw err;
    }
  };

  const handleTriggerSOS = async (latitude: number, longitude: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, latitude, longitude })
      });
      if (!res.ok) {
        throw new Error("Network timeout: emergency dispatch gateway unreachable.");
      }
      const payload = await res.json();
      fetchData();
      showToast("SOS DISPATCH DISPATCHED SUCCESSFULLY!", "success");
      return payload;
    } catch (err: any) {
      showToast(err.message || "SOS trigger failed. Enqueuing offline.", "error");
      throw err;
    }
  };

  const handleResolveAlert = async (alertId: string, resolvedBy: string = "Operator Control") => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy })
      });
      if (!res.ok) {
        throw new Error("Could not resolve alert status.");
      }
      fetchData();
      showToast("Emergency incident resolved.", "success");
    } catch (err: any) {
      showToast(err.message || "Incident resolution failed.", "error");
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, status: "active" | "escalated" | "resolved", message?: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, operatorMessage: message })
      });
      if (!res.ok) {
        throw new Error("Failed to change incident severity level.");
      }
      fetchData();
      showToast(`Alert status updated to ${status}.`, "info");
    } catch (err: any) {
      showToast(err.message || "Failed to change alert status.", "error");
    }
  };

  const handleTriggerAISummary = async (alertId: string) => {
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId })
      });
      if (!res.ok) {
        throw new Error("Gemini AI API connection timeout.");
      }
      const payload = await res.json();
      showToast("Gemini synthesis completed.", "success");
      return payload.analysis;
    } catch (err: any) {
      showToast(err.message || "Gemini synthesis failed.", "error");
    }
  };

  const handleAddHardwareDevice = async (name: string, deviceId: string) => {
    if (organizations.length === 0) return;
    try {
      const res = await fetch("/api/hardware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, deviceId, orgId: organizations[0].id })
      });
      if (!res.ok) {
        throw new Error("MAC address registration conflict.");
      }
      fetchData();
      showToast("Virtual BLE device registered.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to register BLE device.", "error");
    }
  };

  const handleAssignDevice = async (deviceId: string, userId: string) => {
    try {
      const res = await fetch("/api/hardware/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, userId })
      });
      if (!res.ok) {
        throw new Error("Validation mismatch or user already paired.");
      }
      fetchData();
      showToast("iTAG hardware device bonded successfully.", "success");
    } catch (err: any) {
      showToast(err.message || "Device assignment failed.", "error");
    }
  };

  const handleUnassignDevice = async (deviceId: string) => {
    try {
      const res = await fetch("/api/hardware/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      if (!res.ok) {
        throw new Error("Failed to complete GATT unbond.");
      }
      fetchData();
      showToast("iTAG hardware unbonded from user.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to unassign device.", "error");
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/hardware/${deviceId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Database deletion block constraint.");
      }
      fetchData();
      showToast("Device deleted from database.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to delete device.", "error");
    }
  };

  const handleTriggerHardwareSos = async (deviceId: string) => {
    const dev = hardware.find(h => h.id === deviceId);
    if (!dev || !dev.assignedUserId) return;

    const lat = -26.2041 + (Math.random() - 0.5) * 0.05;
    const lng = 28.0473 + (Math.random() - 0.5) * 0.05;

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dev.assignedUserId, latitude: lat, longitude: lng })
      });
      if (!res.ok) {
        throw new Error("Physical link SOS broadcast failed.");
      }
      showToast(`[iTAG KEYPRESS] Physical SOS broadcast successful!`, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Physical SOS button trigger failed.", "error");
    }
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
            <Logo size={46} />
            <div className="border-l border-slate-850 pl-4 py-1">
              <p className="text-[10px] font-black tracking-widest text-emerald-400 font-mono uppercase">Intelligent Emergency Response System</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Mission-Critical Dispatches | Created under <b>TM Media Solutions</b>
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

      {/* Main Grid: Enterprise Sidebar + Content Workspace */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-4 flex-grow flex flex-col lg:flex-row gap-8">
        
        {currentUser === null ? (
          <div className="max-w-2xl mx-auto w-full py-12 flex-grow flex flex-col justify-center">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden" id="onboarding-profile-card">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-500" />
              
              <div className="text-center space-y-3">
                <Logo size={68} className="mx-auto" />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/50 border border-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                    NODE PROVISIONING UTILITY
                  </span>
                  <h3 className="text-xl font-black text-white font-sans tracking-tight uppercase">
                    Initialize Your SafetyLink Profile
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Welcome to SafetyLink. To begin operating, please create your user profile and register your secure organization node.
                  </p>
                </div>
              </div>

              {/* Visual Tabs for Role Identification */}
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-850 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setObRole("Platform Owner");
                    setObOrgName("Gauteng Tactical Patrols");
                  }}
                  className={`py-3 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    obRole === "Platform Owner"
                      ? "bg-slate-900 border border-emerald-500/30 text-emerald-400 font-extrabold shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm">👑</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Platform Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setObRole("Responder");
                    setObOrgName("Gauteng Tactical Patrols");
                  }}
                  className={`py-3 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    obRole === "Responder"
                      ? "bg-slate-900 border border-emerald-500/30 text-emerald-400 font-extrabold shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm">🛡️</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Responder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setObRole("Member");
                    setObOrgName("South African Citizens Group");
                  }}
                  className={`py-3 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    obRole === "Member"
                      ? "bg-slate-900 border border-emerald-500/30 text-emerald-400 font-extrabold shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm">📱</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Standard User</span>
                </button>
              </div>

              {/* Description of current role choice */}
              <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-850/60 text-[11px] text-slate-400 font-sans leading-relaxed">
                {obRole === "Platform Owner" && (
                  <p>
                    🌟 <strong>Platform Owner / Admin Role:</strong> Provides complete administrative access to all systems. You can manage organizations, assign field responders, oversee geo-clustering parameters, and review system-wide dispatches.
                  </p>
                )}
                {obRole === "Responder" && (
                  <p>
                    🚨 <strong>Field Responder Role:</strong> Authorizes access to the active Control Tower monitor and BLE scanning systems. Designed for security patrols, neighborhood watch officers, and tactical supervisors on active shifts.
                  </p>
                )}
                {obRole === "Member" && (
                  <p>
                    👤 <strong>Standard User Role:</strong> Configures a standard emergency notification profile. Authorized to trigger wearable iTAG buttons, manage emergency contacts, and test lockscreen widgets in the Device Terminal.
                  </p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleQuickOnboard} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Full Name</label>
                    <input
                      type="text"
                      value={obName}
                      onChange={(e) => setObName(e.target.value)}
                      placeholder="e.g. Tshilidzi Mukwevho"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
                    <input
                      type="email"
                      value={obEmail}
                      onChange={(e) => setObEmail(e.target.value)}
                      placeholder="e.g. tshilidzi.mukwevho54@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Phone Number</label>
                    <input
                      type="text"
                      value={obPhone}
                      onChange={(e) => setObPhone(e.target.value)}
                      placeholder="e.g. +27 82 999 8888"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Organization Node</label>
                    <input
                      type="text"
                      value={obOrgName}
                      onChange={(e) => setObOrgName(e.target.value)}
                      placeholder="e.g. Gauteng Tactical Patrols"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOnboardingLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isOnboardingLoading ? "Initializing Node..." : "🚀 Initialize SafetyLink Node"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Modern Sidebar Menu Panel */}
            <aside className="lg:w-72 shrink-0 flex flex-col gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono flex justify-between items-center">
              <span>WORKSPACE MODULES</span>
              <span className="text-[8px] bg-slate-950 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-900 font-bold">RBAC ACTIVE</span>
            </p>
            <nav className="flex flex-col gap-1.5 font-sans">
              <button
                onClick={() => handleTabChange("simulator")}
                className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold px-4 py-3 rounded-xl border transition text-left cursor-pointer ${
                  activeTab === "simulator" 
                    ? "bg-slate-950 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Device Terminal</span>
                </div>
              </button>
              
              <button
                onClick={() => handleTabChange("command-centre")}
                className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold px-4 py-3 rounded-xl border transition text-left cursor-pointer ${
                  activeTab === "command-centre" 
                    ? "bg-slate-950 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>Control Tower</span>
                </div>
                {!hasTabAccess("command-centre", currentUser) && (
                  <Lock className="w-3 h-3 text-rose-500/80 shrink-0" />
                )}
              </button>

              <button
                onClick={() => handleTabChange("owner-dashboard")}
                className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold px-4 py-3 rounded-xl border transition text-left cursor-pointer ${
                  activeTab === "owner-dashboard" 
                    ? "bg-slate-950 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-950/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Platform Directory</span>
                </div>
                {!hasTabAccess("owner-dashboard", currentUser) && (
                  <Lock className="w-3 h-3 text-indigo-500/80 shrink-0" />
                )}
              </button>

              <button
                onClick={() => handleTabChange("ble-simulator")}
                className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold px-4 py-3 rounded-xl border transition text-left cursor-pointer ${
                  activeTab === "ble-simulator" 
                    ? "bg-slate-950 border-blue-500 text-blue-400 shadow-lg shadow-blue-950/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                  <span>iTAG Beacon Mesh</span>
                </div>
                {!hasTabAccess("ble-simulator", currentUser) && (
                  <Lock className="w-3 h-3 text-blue-500/80 shrink-0" />
                )}
              </button>

              <button
                onClick={() => handleTabChange("integration-logs")}
                className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold px-4 py-3 rounded-xl border transition text-left cursor-pointer ${
                  activeTab === "integration-logs" 
                    ? "bg-slate-950 border-amber-500 text-amber-400 shadow-lg shadow-amber-950/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>Gateway Telemetry</span>
                </div>
                {!hasTabAccess("integration-logs", currentUser) && (
                  <Lock className="w-3 h-3 text-amber-500/80 shrink-0" />
                )}
              </button>

              <button
                onClick={() => handleTabChange("hardening-protocols")}
                className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold px-4 py-3 rounded-xl border transition text-left cursor-pointer ${
                  activeTab === "hardening-protocols" 
                    ? "bg-slate-950 border-purple-500 text-purple-400 shadow-lg shadow-purple-950/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-950 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-purple-500" />
                  <span>Hardening Protocols</span>
                </div>
                {!hasTabAccess("hardening-protocols", currentUser) && (
                  <Lock className="w-3 h-3 text-purple-500/80 shrink-0" />
                )}
              </button>
            </nav>
          </div>
        </aside>

        {/* Right Content Workspace Stage */}
        <div className="flex-grow flex flex-col space-y-6">
          {!hasTabAccess(activeTab, currentUser) ? (
            <div className="bg-slate-950 border border-red-500/30 rounded-3xl p-6 py-10 text-center max-w-2xl mx-auto my-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-red-500 animate-[pulse_1.5s_infinite]" />
              
              <div className="mx-auto w-12 h-12 bg-red-950/40 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center animate-pulse">
                <Lock className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black text-red-500 bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                  SECURE PLATFORM CORE ACCESS REJECTED
                </span>
                <h3 className="text-lg font-extrabold text-white font-mono uppercase tracking-wider">
                  Tactical Firewall Active
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  The workspace sector <b>{activeTab.replace("-", " ").toUpperCase()}</b> is classified for administrative control rooms and system operations. Your session is restricted from bypassing this gate.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-left space-y-2 max-w-md mx-auto font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">SESSION IDENTIFIER:</span>
                  <span className="text-slate-300 font-bold">{currentUser?.name || "Unauthenticated Guest"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AUTHENTICATED ROLE:</span>
                  <span className="text-red-400 font-black uppercase">{currentUser?.role || "GUEST"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GATEWAY CLUSTER:</span>
                  <span className="text-slate-300">Gauteng Sec. Watch</span>
                </div>
              </div>



              <div className="pt-2">
                <button
                  onClick={() => handleTabChange("simulator")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Return to Device Terminal
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "simulator" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Instructions or Interactive Tutorial on the left side of the simulator */}
                  <div className="lg:col-span-5 space-y-5">
                    
                    {showTutorial ? (
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4 relative overflow-hidden">
                        {/* Interactive glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <span>Interactive Staged Tour</span>
                          </h3>
                          <button
                            onClick={() => {
                              localStorage.setItem("safetylink-tutorial-dismissed", "true");
                              setShowTutorial(false);
                              showToast("Training tour dismissed. Re-enable anytime.", "info");
                            }}
                            className="text-slate-500 hover:text-rose-400 transition p-1 hover:bg-slate-950 rounded-lg cursor-pointer"
                            title="Never Show Again"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Staged Indicator dots */}
                        <div className="flex gap-1.5 items-center justify-between">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveStep(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  idx === activeStep ? "w-6 bg-emerald-400" : "w-1.5 bg-slate-800 hover:bg-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                            STEP {activeStep + 1} OF 4
                          </span>
                        </div>

                        {/* Dynamic Step Content */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-sans min-h-[140px] flex flex-col justify-between">
                          {activeStep === 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-emerald-400 uppercase font-black tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
                                PHASE 1: ORG PROVISIONING
                              </span>
                              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">1. Create your Security Group</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Go to the <b className="text-indigo-400">Platform Directory</b> tab first. Enter a name (e.g. <i>Cape Town Watch</i> or <i>Lenasia Patrol</i>) and click <b className="text-indigo-400">Provision Organization</b> to generate a unique license code.
                              </p>
                            </div>
                          )}
                          {activeStep === 1 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-blue-400 uppercase font-black tracking-widest bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded">
                                PHASE 2: TERMINAL BINDING
                              </span>
                              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">2. Provision Mobile Device</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Copy the generated organization code, return here to this <b className="text-emerald-400">Device Terminal</b>, paste it inside the phone screen, and click <b className="text-emerald-400">PROVISION CODE</b>. This locks the phone hardware to your firm!
                              </p>
                            </div>
                          )}
                          {activeStep === 2 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-amber-400 uppercase font-black tracking-widest bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 rounded">
                                PHASE 3: USER QUEUE
                              </span>
                              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">3. Register & Approve Citizens</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Click <b className="text-slate-300">Join Org</b> on the login screen inside the mobile simulator. Register details, then return to the <b className="text-indigo-400">Platform Directory</b> tab to approve them in the verification queue.
                              </p>
                            </div>
                          )}
                          {activeStep === 3 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-rose-400 uppercase font-black tracking-widest bg-rose-950/40 border border-rose-900/30 px-2 py-0.5 rounded">
                                PHASE 4: EMERGENCY SIMULATION
                              </span>
                              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">4. Simulate & Trigger SOS Alert</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Log in on the phone screen. Adjust GPS coordinates, hold the red <b className="text-rose-500 animate-pulse">HOLD SOS</b> button, and watch live Twilio alerts, WhatsApp triggers, and voice dial sequences propagate!
                              </p>
                            </div>
                          )}

                          {/* Navigation buttons */}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                            <button
                              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                              disabled={activeStep === 0}
                              className="text-[10px] text-slate-400 font-mono disabled:opacity-30 cursor-pointer"
                            >
                              ← PREV
                            </button>
                            <button
                              onClick={() => {
                                if (activeStep < 3) {
                                  setActiveStep(prev => prev + 1);
                                } else {
                                  localStorage.setItem("safetylink-tutorial-dismissed", "true");
                                  setShowTutorial(false);
                                  showToast("Training tour completed! System unlocked.", "success");
                                }
                              }}
                              className="text-[10px] text-emerald-400 font-mono font-bold cursor-pointer"
                            >
                              {activeStep === 3 ? "FINISH TOUR ✓" : "NEXT STEP →"}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Guided by TM Media Solutions</span>
                          <button
                            onClick={() => {
                              localStorage.setItem("safetylink-tutorial-dismissed", "true");
                              setShowTutorial(false);
                              showToast("Training tour dismissed. Re-enable anytime.", "info");
                            }}
                            className="hover:text-rose-400 transition underline cursor-pointer"
                          >
                            Never show again (X)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex justify-between items-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-xl flex items-center justify-center font-bold font-mono text-xs">🎓</div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Training Tour Dismissed</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Need step-by-step guidance?</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowTutorial(true)}
                          className="text-[10px] bg-slate-950 hover:bg-slate-850 border border-slate-800 text-emerald-400 font-mono font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          LAUNCH TOUR
                        </button>
                      </div>
                    )}
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
                      showToast={showToast}
                      onAssignDevice={handleAssignDevice}
                      onUnassignDevice={handleUnassignDevice}
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

          {activeTab === "hardening-protocols" && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-400" />
                    Mission-Critical Hardening & Dependency Lockdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Deterministic Android & Capacitor safety-critical orchestration rules
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full font-bold uppercase tracking-widest">
                  Level 1 Compliance
                </span>
              </div>

              {/* Hardening Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Dependency strategy */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-600/15 rounded-lg flex items-center justify-center border border-purple-500/20 shrink-0">
                      <Layers className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Deterministic Build Locking</h4>
                      <p className="text-[10px] text-slate-500 font-mono">GRADLE & PACMAN SECURITY</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Safety-critical applications are strictly barred from utilizing dynamic ranges (e.g., <code className="text-rose-400 font-mono">^</code> or <code className="text-rose-400 font-mono">~</code>) to prevent unexpected compiler mutations.
                  </p>
                  <div className="bg-black/40 border border-slate-850 p-3 rounded-lg space-y-1.5 font-mono text-[10px] text-slate-400">
                    <p className="text-emerald-400 font-bold">// package.json Enforcement</p>
                    <p>"@capacitor/core": "5.7.0",</p>
                    <p>"@capacitor/android": "5.7.0",</p>
                    <p className="text-emerald-400 font-bold mt-2">// gradle.lockfile Integrity Check</p>
                    <p>org.jetbrains.kotlin:kotlin-stdlib:1.9.10=SHA256...</p>
                  </div>
                </div>

                {/* 2. Foreground service */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-600/15 rounded-lg flex items-center justify-center border border-purple-500/20 shrink-0">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Continuous Foreground Service</h4>
                      <p className="text-[10px] text-slate-500 font-mono">ANDROID KEEP-ALIVE SYSTEM</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    By binding high-priority alarms to an Android foreground service, the kernel is prevented from throttling background telemetry, keeping the websocket/GATT stream alive.
                  </p>
                  <div className="bg-black/40 border border-slate-850 p-3 rounded-lg space-y-1.5 font-mono text-[10px] text-slate-400">
                    <p className="text-blue-400 font-bold">// AndroidManifest.xml Registry</p>
                    <p>&lt;service android:name=".SosForegroundService"</p>
                    <p className="pl-3">android:foregroundServiceType="location|microphone"</p>
                    <p className="pl-3">android:exported="false" /&gt;</p>
                  </div>
                </div>

                {/* 3. Doze Mode Bypass */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-600/15 rounded-lg flex items-center justify-center border border-purple-500/20 shrink-0">
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">OS Doze WakeLock Handshake</h4>
                      <p className="text-[10px] text-slate-500 font-mono">BATTERY OPTIMIZATION OVERRIDE</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Guarantees high-precision coordinate polling by acquiring a partial WakeLock during an active distress state. Automatically requests whitelist registration to completely bypass Android battery saver restrictions.
                  </p>
                  <div className="bg-black/40 border border-slate-850 p-3 rounded-lg space-y-1.5 font-mono text-[10px] text-slate-400">
                    <p className="text-amber-400 font-bold">// Native PowerManager Integration</p>
                    <p>PowerManager pm = (PowerManager) getSystemService();</p>
                    <p>wakeLock = pm.newWakeLock(PARTIAL_WAKE_LOCK, "SafetyLink::SOS");</p>
                    <p>wakeLock.acquire(10*60*1000L); // 10 Min Max Timeout</p>
                  </div>
                </div>

                {/* 4. Encrypted local storage */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-600/15 rounded-lg flex items-center justify-center border border-purple-500/20 shrink-0">
                      <Database className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Encrypted SQLite DB</h4>
                      <p className="text-[10px] text-slate-500 font-mono">SQLCIPHER DATA PROTECTION</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Ensures offline coordinate logs, citizen bio files, and security org keys stored inside SQLite/Room are encrypted using AES-256 with key hashes derived securely via PBKDF2 in memory.
                  </p>
                  <div className="bg-black/40 border border-slate-850 p-3 rounded-lg space-y-1.5 font-mono text-[10px] text-slate-400">
                    <p className="text-purple-400 font-bold">// Encrypted Database Boilerplate</p>
                    <p>SupportFactory factory = new SupportFactory(passphrase);</p>
                    <p>Room.databaseBuilder(context, AppDatabase.class, "safetylink.db")</p>
                    <p className="pl-2">.openHelperFactory(factory)</p>
                    <p className="pl-2">.build();</p>
                  </div>
                </div>

              </div>

              {/* Compliance checklist */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Emergency Escalation Priority Hierarchy</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center gap-2.5 font-sans">
                    <span className="w-5 h-5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">01</span>
                    <div>
                      <span className="font-bold text-slate-100 block">LOCAL QUEUE</span>
                      <span className="text-[9px] text-slate-400 font-mono">IndexedDB Persistent Caching</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center gap-2.5 font-sans">
                    <span className="w-5 h-5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">02</span>
                    <div>
                      <span className="font-bold text-slate-100 block">OFFLINE SMS FALLBACK</span>
                      <span className="text-[9px] text-slate-400 font-mono">Direct GSM/Satellite Relays</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center gap-2.5 font-sans">
                    <span className="w-5 h-5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">03</span>
                    <div>
                      <span className="font-bold text-slate-100 block">GATEWAY SYNCHRONISATION</span>
                      <span className="text-[9px] text-slate-400 font-mono">Automatic TLS Replay on Online</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>)}
      </div>
    </>)}

        {/* BOTTOM OPERATIONS SUITE (TELEMETRY, AI INTEL, STAGING & TERRITORY) */}
        <div className="space-y-6 mt-8">
          
          {/* SafetyLink Cluster Telemetry & API Performance */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 font-sans">
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

          {/* AI Intel & Staging Staging Notice Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* AI Intel Advisor Chatbot - Takes 7 cols */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 font-mono">
                    SafetyLink AI Intel Advisor
                  </h4>
                </div>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded border border-emerald-900/40 font-mono font-bold">
                  GEMINI 1.5 PRO CORE
                </span>
              </div>

              <div className="space-y-4">
                <div className="max-h-56 overflow-y-auto space-y-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 text-xs leading-relaxed font-mono">
                  {aiHistory.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-4 font-sans">No active briefing logs. Query the AI module below to generate tactical dispatches.</p>
                  ) : (
                    aiHistory.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border ${
                          item.role === "user"
                            ? "bg-slate-900 border-slate-800 text-slate-300 text-right ml-6"
                            : "bg-slate-900/40 border-emerald-950/30 text-emerald-300/90 text-left mr-6"
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest block mb-1 text-slate-500">
                          {item.role === "user" ? "Citizen" : "SafetyLink AI"}
                        </span>
                        <p className="whitespace-pre-line font-sans leading-relaxed text-slate-200">{item.text}</p>
                      </div>
                    ))
                  )}
                  {aiIsLoading && (
                    <div className="p-3 rounded-xl bg-slate-900/20 border border-slate-850 text-slate-400 animate-pulse flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="font-sans text-xs">Drafting response...</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendAiMessage} className="flex gap-2.5">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask about iTAG UUIDs, VoIP cascades, South African security structures..."
                    className="flex-grow bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none"
                    disabled={aiIsLoading}
                  />
                  <button
                    type="submit"
                    disabled={aiIsLoading || !aiQuery.trim()}
                    className="px-4 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-extrabold hidden sm:inline font-sans">Ask AI</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right side: Staging Notice & API Territory - Takes 5 cols */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* South African Dialing & Telemetry Staging Notice */}
              <div className="bg-emerald-950/20 rounded-2xl p-5 border border-emerald-900/40 text-xs text-emerald-300 flex gap-3.5 shadow-xl font-sans">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-200 mb-1.5 uppercase tracking-widest font-mono">
                    South African Dialing & Telemetry Staging
                  </p>
                  <p className="leading-relaxed text-[11px] text-slate-300">
                    All emergency dialing cascades, WhatsApp dispatches, and geographical clustering filters dynamically scale to match any location in South Africa. Profiles can be registered as standard field responders or dispatched tactical supervisors.
                  </p>
                </div>
              </div>

              {/* API Territory Status Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl font-sans">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-white font-extrabold block uppercase font-mono tracking-wider text-xs">
                    API Territory Scope
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Active cluster scanning is currently mapping the Johannesburg and Gauteng sectors. Real-time TWILIO VoIP, satellite backhauls, and Meta WhatsApp coordinate dispatches are active and fully persistent across nodes.
                </p>
              </div>

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

      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl border ${
              toast.type === "success" 
                ? "bg-emerald-950 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20"
                : toast.type === "error"
                  ? "bg-rose-950 border-rose-500/30 text-rose-300 shadow-rose-950/20"
                  : "bg-indigo-950 border-indigo-500/30 text-indigo-300 shadow-indigo-950/20"
            }`}
          >
            {toast.type === "success" && <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {toast.type === "error" && <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            {toast.type === "info" && <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            <div className="text-xs font-bold leading-none tracking-normal uppercase">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-white/40 hover:text-white font-bold ml-2 text-xs cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
