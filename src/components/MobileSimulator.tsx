import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, Shield, User, Heart, Settings, Bluetooth, AlertTriangle, AlertOctagon, 
  ChevronRight, Compass, LogOut, CheckCircle, Smartphone, Wifi, Power, RefreshCw, 
  MapPin, Plus, Trash2, Edit2, Play, Users, Eye, EyeOff, ClipboardList, AlertCircle, Radio, Sliders
} from "lucide-react";
import { User as UserType, Organization, MedicalProfile, HardwareDevice, Alert, AlertEvent } from "../types";
import { getClosestSouthAfricanCity } from "../utils";

interface MobileSimulatorProps {
  organizations: Organization[];
  currentUser: UserType | null;
  currentMedical: MedicalProfile | null;
  hardware: HardwareDevice[];
  alerts: Alert[];
  onRegister: (data: any) => Promise<any>;
  onLogin: (data: any) => Promise<any>;
  onLogout: () => void;
  onUpdateMedical: (data: any) => Promise<any>;
  onUpdateProfile: (data: any) => Promise<any>;
  onTriggerSOS: (lat: number, lng: number) => Promise<any>;
  onResolveAlert: (alertId: string) => void;
  activeAlertEvents: AlertEvent[];
  refreshData: () => void;
}

export default function MobileSimulator({
  organizations,
  currentUser,
  currentMedical,
  hardware,
  alerts,
  onRegister,
  onLogin,
  onLogout,
  onUpdateMedical,
  onUpdateProfile,
  onTriggerSOS,
  onResolveAlert,
  activeAlertEvents,
  refreshData
}: MobileSimulatorProps) {
  // Mobile UI States
  const [activeScreen, setActiveScreen] = useState<string>("screen-provision");
  const [orgCodeInput, setOrgCodeInput] = useState("");
  const [provOrg, setProvOrg] = useState<Organization | null>(null);

  // Registration states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("+27 82 ");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("Member");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Panic hold state
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer state
  const [countdown, setCountdown] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Medical state
  const [bloodType, setBloodType] = useState("O+");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [medNotes, setMedNotes] = useState("");
  const [contacts, setContacts] = useState<Array<{ name: string; relationship: string; phone: string }>>([
    { name: "Sipho Khumalo", relationship: "Spouse", phone: "+27829998888" },
    { name: "Leandra Naidoo", relationship: "Sister", phone: "+27715554444" }
  ]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRel, setNewContactRel] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("+27");

  // Profile fields
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileBio, setProfileBio] = useState("");

  // Device status simulation
  const [gpsLatitude, setGpsLatitude] = useState(-26.3085);
  const [gpsLongitude, setGpsLongitude] = useState(27.8344);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [simulatedNetwork, setSimulatedNetwork] = useState<"online" | "offline">("online");

  // Setup initial values when currentUser or currentMedical changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone);
      setProfileBio(currentUser.bio || "");
      setActiveScreen("screen-dashboard");
    } else {
      if (!provOrg) {
        setActiveScreen("screen-provision");
      } else {
        setActiveScreen("screen-login");
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentMedical) {
      setBloodType(currentMedical.bloodType || "O+");
      setAllergies(currentMedical.allergies || "");
      setMedications(currentMedical.medications || "");
      setMedNotes(currentMedical.notes || "");
      if (currentMedical.emergencyContacts && currentMedical.emergencyContacts.length > 0) {
        setContacts(currentMedical.emergencyContacts);
      }
    }
  }, [currentMedical]);

  // Handle GPS location tracking simulation
  const simulateNewGps = () => {
    setIsGpsLoading(true);
    setTimeout(() => {
      // Add slight jitter around current coordinates
      const latJitter = (Math.random() - 0.5) * 0.012;
      const lngJitter = (Math.random() - 0.5) * 0.012;
      setGpsLatitude(prev => prev + latJitter);
      setGpsLongitude(prev => prev + lngJitter);
      setIsGpsLoading(false);
    }, 600);
  };

  // SOS HOLD TRIGGERS
  const startSosHold = () => {
    if (simulatedNetwork === "offline") {
      alert("Simulated Device is currently Offline. Emergency will be queued in offline local IndexedDB queue and dispatched automatically upon reconnection.");
    }
    setIsHoldingSos(true);
    setHoldProgress(0);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current!);
          triggerCountdownScreen();
          return 100;
        }
        return prev + 10;
      });
    }, 200); // 2 seconds total (10 updates * 200ms)
  };

  const cancelSosHold = () => {
    setIsHoldingSos(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
  };

  const triggerCountdownScreen = () => {
    setIsHoldingSos(false);
    setHoldProgress(0);
    setCountdown(10);
    setIsCountdownActive(true);
    setActiveScreen("screen-countdown");

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setIsCountdownActive(false);
          dispatchSosEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setIsCountdownActive(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setActiveScreen("screen-dashboard");
  };

  const dispatchSosEmergency = async () => {
    if (!currentUser) return;
    try {
      await onTriggerSOS(gpsLatitude, gpsLongitude);
      setActiveScreen("screen-intel");
    } catch (err) {
      console.error(err);
    }
  };

  // Prov Org submit
  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    const org = organizations.find(o => o.code.toUpperCase() === orgCodeInput.toUpperCase());
    if (org) {
      setProvOrg(org);
      setActiveScreen("screen-login");
    } else {
      alert("Invalid Organization Code. Please try SL-XXXX-YY formats in the Owner tab.");
    }
  };

  // Register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    if (!provOrg) return;

    try {
      const res = await onRegister({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: regRole,
        orgCode: provOrg.code
      });
      setRegSuccess(res.message || "Registration submitted!");
      // Reset
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setTimeout(() => {
        setActiveScreen("screen-login");
      }, 2500);
    } catch (err: any) {
      setRegError(err.message || "Registration failed.");
    }
  };

  // Login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await onLogin({
        email: loginEmail,
        password: loginPassword
      });
    } catch (err: any) {
      setLoginError(err.message || "Invalid login credentials.");
    }
  };

  const saveMedicalProfile = async () => {
    if (!currentUser) return;
    try {
      await onUpdateMedical({
        userId: currentUser.id,
        bloodType,
        allergies,
        medications,
        notes: medNotes,
        emergencyContacts: contacts
      });
      alert("Medical credentials and emergency contact list updated successfully.");
    } catch (err) {
      alert("Failed to update medical profile.");
    }
  };

  const saveProfileInfo = async () => {
    if (!currentUser) return;
    try {
      await onUpdateProfile({
        id: currentUser.id,
        name: profileName,
        phone: profilePhone,
        bio: profileBio
      });
      alert("Profile bio information updated.");
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  // Add emergency contact
  const addContact = () => {
    if (!newContactName || !newContactPhone) {
      alert("Please fill name and phone");
      return;
    }
    setContacts(prev => [
      ...prev,
      { name: newContactName, relationship: newContactRel || "Family", phone: newContactPhone }
    ]);
    setNewContactName("");
    setNewContactRel("");
    setNewContactPhone("+27");
  };

  // Delete contact
  const deleteContact = (idx: number) => {
    setContacts(prev => prev.filter((_, i) => i !== idx));
  };

  // Helper helper
  const autoFillOrg = (code: string) => {
    setOrgCodeInput(code);
  };

  // BLE Simulator local states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Array<{ name: string; deviceId: string; rssi: number; battery: number }>>([]);
  const [pushNotification, setPushNotification] = useState<string | null>(null);
  const [bleSearchTerm, setBleSearchTerm] = useState("");
  const [bleMinRssi, setBleMinRssi] = useState(-100);

  // Dynamic BLE scanning simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isScanning) {
      // Seed initial devices
      setScannedDevices([
        { name: "iTAG Smart Key v1.0", deviceId: "FF:E0:91:21:44:A2", rssi: -42, battery: 94 },
        { name: "SafetyLink Wearable v2.1", deviceId: "FF:E0:41:82:11:0B", rssi: -61, battery: 88 },
        { name: "SirenLink Remote v3.0", deviceId: "FF:E0:58:12:3E:91", rssi: -75, battery: 72 },
        { name: "Generic SmartBeacon", deviceId: "FF:E0:A4:CC:89:12", rssi: -88, battery: 49 },
        { name: "Tile Tag Mock", deviceId: "FF:E0:11:22:33:44", rssi: -99, battery: 10 }
      ]);

      interval = setInterval(() => {
        setScannedDevices(prev => {
          const updated = prev.map(dev => {
            // Add RSSI signal fluctuation/jitter
            const jitter = Math.floor(Math.random() * 7) - 3; // -3 to +3
            const newRssi = Math.max(-100, Math.min(-30, dev.rssi + jitter));
            return { ...dev, rssi: newRssi };
          });
          // nRF Connect style: sort from strongest (closest to 0) to weakest (closest to -100)
          return [...updated].sort((a, b) => b.rssi - a.rssi);
        });
      }, 1000);
    } else {
      setScannedDevices([]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  const handlePairScannedDevice = async (name: string, deviceId: string) => {
    if (!currentUser || !provOrg) return;
    try {
      // Ensure device is registered in backend pool for the current org
      const exists = hardware.some(h => h.deviceId === deviceId);
      if (!exists) {
        await fetch("/api/hardware", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, deviceId, orgId: provOrg.id })
        });
      }
      // Assign the device to the user
      await fetch("/api/hardware/assign", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ deviceId, userId: currentUser.id })
      });
      refreshData();
    } catch (err) {
      console.error("Error pairing scanned device:", err);
    }
  };

  const handleDeletePairedDevice = async (deviceId: string) => {
    try {
      const dev = hardware.find(h => h.deviceId === deviceId);
      if (!dev) return;
      // Unassign device on server
      await fetch("/api/hardware/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      // Delete device from pool
      await fetch(`/api/hardware/${dev.id}`, { method: "DELETE" });
      refreshData();
    } catch (err) {
      console.error("Error deleting paired device:", err);
    }
  };

  const handleTriggerGattDisconnect = async (deviceId: string) => {
    try {
      // Unassign device from the user to simulate disconnection
      await fetch("/api/hardware/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      refreshData();
      // Instantly trigger the high-priority fail-safe notification
      setPushNotification("Warning: SafetyLink Hardware Disconnected. Fallback to phone interface activated.");
    } catch (err) {
      console.error("Error triggering GATT disconnect:", err);
    }
  };

  // Find user's paired BLE buttons
  const myPairedHardware = hardware.filter(h => h.assignedUserId === currentUser?.id);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Phone container */}
      <div className="w-[375px] h-[780px] bg-slate-950 rounded-[48px] border-[10px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col font-sans select-none">
        
        {/* Dynamic Island Header Mock */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-950 rounded-full absolute left-4"></div>
          <div className="w-1.5 h-1.5 bg-blue-900 rounded-full absolute right-6"></div>
        </div>

        {/* Status Bar */}
        <div className="h-11 pt-2 px-6 flex justify-between items-end text-xs font-semibold text-white/95 bg-slate-950 z-40">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setSimulatedNetwork(prev => prev === "online" ? "offline" : "online")}
              className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] transition ${simulatedNetwork === "online" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
              title="Click to toggle offline simulation mode"
            >
              <Wifi className="w-3 h-3" />
              {simulatedNetwork.toUpperCase()}
            </button>
            <span className="text-[10px]">98% 🔋</span>
          </div>
        </div>

        {/* Interactive Screen viewport */}
        <div className="flex-1 bg-slate-900 text-white overflow-y-auto pb-16 flex flex-col relative">
          
          {/* Real-time high-priority push notification */}
          {pushNotification && (
            <div className="absolute top-2 left-3 right-3 bg-rose-950 border border-rose-800 text-rose-200 rounded-xl p-3 z-50 shadow-2xl animate-bounce">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-300">GATT Life-Cycle alert</h5>
                    <p className="text-[10px] mt-1 font-semibold leading-normal text-white">{pushNotification}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPushNotification(null)}
                  className="text-white hover:text-slate-200 font-bold text-xs px-1.5 py-0.5 bg-rose-900/60 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* 1. PROVISION SCREEN */}
          {activeScreen === "screen-provision" && (
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600/15 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <Shield className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Safety-Link</h2>
                <p className="text-xs text-slate-400 mt-2">Enterprise Multi-Tenant Mobile Client Provisioner</p>
              </div>

              <form onSubmit={handleProvision} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Enter Organization Access Code</label>
                  <input 
                    type="text" 
                    value={orgCodeInput}
                    onChange={(e) => setOrgCodeInput(e.target.value)}
                    placeholder="E.g. SL-5A93-KY"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-blue-500 uppercase"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
                >
                  Verify Organization
                </button>
              </form>

              {/* Quick helper for user testing */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2 font-medium">Available Orgs to simulation test:</p>
                {organizations.length === 0 ? (
                  <p className="text-[11px] text-amber-500 italic">No organizations exist. Create one in the "Platform Owner Dashboard" tab above first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {organizations.map(org => (
                      <button 
                        key={org.id} 
                        onClick={() => autoFillOrg(org.code)}
                        className="bg-slate-800 text-xs px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 font-mono"
                      >
                        {org.name.slice(0,10)} ({org.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. LOGIN SCREEN */}
          {activeScreen === "screen-login" && provOrg && (
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="text-center mb-6">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/20">{provOrg.name}</span>
                <h2 className="text-2xl font-bold tracking-tight mt-2">Welcome Back</h2>
                <p className="text-xs text-slate-400 mt-1">Please log in to continue to response dashboard</p>
              </div>

              {loginError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg mb-4 text-center">{loginError}</p>}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="member@domain.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition mt-2"
                >
                  Access Account
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setActiveScreen("screen-register")}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Don't have an account? <span className="text-blue-400 font-semibold">Join Org</span>
                </button>
              </div>

              {/* Preseed buttons for testers */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-xs">
                <p className="text-slate-500 mb-2">Simulate accounts inside this Org:</p>
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      setLoginEmail("sipho@lenasia.co.za");
                      setLoginPassword("123456");
                    }} 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2.5 rounded text-[11px] text-left font-mono"
                  >
                    Load preset test accounts (Auto-seeded)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. REGISTER SCREEN */}
          {activeScreen === "screen-register" && provOrg && (
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/20">{provOrg.name}</span>
                <h2 className="text-xl font-bold tracking-tight mt-1">Register Member</h2>
                <p className="text-xs text-slate-400">Account status defaults to PENDING for admin safety</p>
              </div>

              {regError && <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded mb-3 text-center">{regError}</p>}
              {regSuccess && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded mb-3 text-center">{regSuccess}</p>}

              <form onSubmit={handleRegisterSubmit} className="space-y-3 overflow-y-auto max-h-[460px]">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Full Name</label>
                  <input 
                    type="text" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Sipho Cele"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Email Address</label>
                  <input 
                    type="email" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sipho@cele.co.za"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Phone Number (ZA format)</label>
                  <input 
                    type="text" 
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Role Type</label>
                  <select 
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Member">Community Member (SOS Alarms only)</option>
                    <option value="Responder">Security Patrol Volunteer (Receives Alerts)</option>
                    <option value="Supervisor">Watch Supervisor (Command center & Approve)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Secret Password</label>
                  <input 
                    type="password" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition"
                >
                  Submit for Watch Approval
                </button>
              </form>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => setActiveScreen("screen-login")}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Already registered? <span className="text-blue-400 font-semibold">Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. DASHBOARD SCREEN */}
          {activeScreen === "screen-dashboard" && currentUser && (
            <div className="flex-grow flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 flex items-center gap-1 w-fit">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    ONLINE
                  </span>
                  <h3 className="text-base font-bold text-white mt-1 leading-tight">{currentUser.name}</h3>
                  <p className="text-[10px] text-slate-400">Sector 4 Area Patrol Group</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                  title="Disconnect and provision other code"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Main SOS stage area */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-semibold">Emergency Panic Area</p>
                <p className="text-[11px] text-slate-500 max-w-[240px] mb-8 leading-relaxed">Hold the red shield down for 2 seconds to initiate standard satellite dispatches</p>

                {/* Big hold button */}
                <div className="relative flex items-center justify-center w-56 h-56">
                  {/* Outer pulse effect when holding */}
                  {isHoldingSos && (
                    <div className="absolute inset-0 rounded-full bg-rose-600/20 animate-ping"></div>
                  )}

                  {/* Circular hold status border */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle 
                      cx="112" 
                      cy="112" 
                      r="100" 
                      stroke="#1e293b" 
                      strokeWidth="8" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="112" 
                      cy="112" 
                      r="100" 
                      stroke="#ef4444" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="628"
                      strokeDashoffset={628 - (628 * holdProgress) / 100}
                      className="transition-all duration-200"
                    />
                  </svg>

                  {/* The core button */}
                  <button
                    onMouseDown={startSosHold}
                    onMouseUp={cancelSosHold}
                    onMouseLeave={cancelSosHold}
                    onTouchStart={startSosHold}
                    onTouchEnd={cancelSosHold}
                    className="absolute w-44 h-44 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-full flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    <AlertOctagon className="w-14 h-14 text-white animate-pulse" />
                    <span className="font-bold text-lg text-white mt-2 uppercase tracking-wide">HOLD SOS</span>
                    <span className="text-[10px] text-white/70 mt-1 font-mono">{isHoldingSos ? "HOLDING..." : "2 SECONDS"}</span>
                  </button>
                </div>

                {/* Paired BLE indicator */}
                <div className="mt-8 flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Bluetooth className="w-4 h-4 text-blue-400" />
                  <span>
                    {myPairedHardware.length > 0 ? (
                      <span className="text-emerald-400 font-semibold">{myPairedHardware.length} BLE Button Connected</span>
                    ) : (
                      <span className="text-slate-400 italic">No BLE physical keys connected</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Simulated GPS details in bottom panel with South African City selector */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 mx-3 rounded-2xl mb-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800 text-emerald-400 rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Matched SA Location</span>
                      <span className="font-bold text-xs text-slate-200">
                        {getClosestSouthAfricanCity(gpsLatitude, gpsLongitude)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-slate-500">
                      {gpsLatitude.toFixed(4)}, {gpsLongitude.toFixed(4)}
                    </span>
                    <button 
                      onClick={simulateNewGps}
                      disabled={isGpsLoading}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition ml-1"
                      title="Simulate slight movement / jitter"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin text-emerald-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* South African City Selection Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-semibold shrink-0">Staging Area:</span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [latStr, lngStr] = e.target.value.split(",");
                      setGpsLatitude(parseFloat(latStr));
                      setGpsLongitude(parseFloat(lngStr));
                    }}
                    className="flex-1 bg-slate-950 text-slate-300 text-xs border border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="">-- Jump to SA City --</option>
                    <option value="-26.2041,28.0473">Johannesburg, GP (Center)</option>
                    <option value="-26.3085,27.8344">Lenasia, GP</option>
                    <option value="-26.2678,27.8585">Soweto, GP</option>
                    <option value="-26.1076,28.0567">Sandton, GP</option>
                    <option value="-25.7479,28.2293">Pretoria, GP</option>
                    <option value="-33.9249,18.4241">Cape Town, WC</option>
                    <option value="-34.0485,18.6052">Mitchells Plain, WC</option>
                    <option value="-29.8587,31.0218">Durban, KZN</option>
                    <option value="-33.9608,25.6022">Port Elizabeth, EC</option>
                    <option value="-29.1181,26.2241">Bloemfontein, FS</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. COUNTDOWN SCREEN */}
          {activeScreen === "screen-countdown" && (
            <div className="flex-1 p-6 flex flex-col justify-between items-center bg-rose-950/40">
              <div className="text-center pt-8">
                <AlertOctagon className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
                <h2 className="text-2xl font-black uppercase tracking-wider text-rose-500 mt-4">SOS INITIATED</h2>
                <p className="text-xs text-slate-300 mt-1">Satellite alarm dispatches triggered in</p>
              </div>

              <div className="text-center my-6">
                <div className="text-8xl font-black font-mono text-white animate-ping">{countdown}</div>
                <p className="text-xs text-rose-300 uppercase tracking-widest mt-6">SECONDS TO CANCEL</p>
              </div>

              <button
                onClick={cancelCountdown}
                className="w-full bg-white hover:bg-slate-100 text-rose-950 font-bold py-4 rounded-2xl text-base tracking-wide transition shadow-xl border-2 border-rose-600 uppercase"
              >
                Tap to CANCEL Alarm
              </button>
            </div>
          )}

          {/* 6. INTEL (ALERT STATUS / TIMELINE) SCREEN */}
          {activeScreen === "screen-intel" && currentUser && (
            <div className="flex-grow flex flex-col p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                <h3 className="font-bold text-lg text-white">Active Alarm Intel</h3>
                <button onClick={refreshData} className="p-1 text-slate-400 hover:text-white">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-slate-500 space-y-2">
                  <ClipboardList className="w-12 h-12 text-slate-700" />
                  <p className="text-sm">No recorded alarms in this area.</p>
                  <p className="text-xs">Your triggered panics will show up here.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[520px]">
                  {alerts.slice(0, 4).map((alert) => {
                    const isMyAlert = alert.userId === currentUser.id;
                    return (
                      <div key={alert.id} className={`p-4 rounded-xl border ${alert.status === 'resolved' ? 'bg-slate-900 border-slate-800' : isMyAlert ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900 border-amber-500/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {alert.id.slice(0,8)}</span>
                            <h4 className="font-bold text-sm text-slate-100 leading-tight mt-0.5">{alert.userName} {isMyAlert && "(You)"}</h4>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${alert.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : alert.status === 'escalated' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                            {alert.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 space-y-1 mb-3">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {getClosestSouthAfricanCity(alert.latitude, alert.longitude)} ({alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)})
                          </p>
                          <p className="text-[10px] text-slate-500">Triggered: {new Date(alert.createdAt).toLocaleTimeString()}</p>
                        </div>

                        {/* Event list */}
                        {isMyAlert && activeAlertEvents.length > 0 && (
                          <div className="bg-slate-950/50 rounded-lg p-2.5 space-y-2 mb-3 border border-slate-800">
                            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Dynamic Escalation Logs</p>
                            <div className="space-y-1 max-h-[110px] overflow-y-auto">
                              {activeAlertEvents.map(e => (
                                <p key={e.id} className="text-[9px] text-slate-300 border-l border-slate-700 pl-1.5 py-0.5">
                                  {e.message}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {alert.status !== 'resolved' && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => onResolveAlert(alert.id)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 rounded-lg transition"
                            >
                              Resolve Alarm
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 7. HARDWARE BLE SCREEN */}
          {activeScreen === "screen-hardware" && currentUser && (
            <div className="flex-grow flex flex-col p-4 space-y-4">
              <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Bluetooth className="w-5 h-5 text-blue-500 animate-pulse" />
                    BLE Core Manager
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Capacitor GATT Service Gateway</p>
                </div>
                <button
                  onClick={() => setIsScanning(prev => !prev)}
                  className={`text-xs font-bold font-mono px-3 py-1.5 rounded-lg border transition ${
                    isScanning 
                      ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse" 
                      : "bg-blue-950 border-blue-800 text-blue-400 hover:border-blue-500"
                  }`}
                >
                  {isScanning ? "STOP SCAN" : "SCAN BLE"}
                </button>
              </div>

              {/* Connected keys */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Handshakes ({myPairedHardware.length})
                </p>
                {myPairedHardware.length === 0 ? (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-center text-slate-500 text-xs italic">
                    No physical hardware keys bound. Try scanning for surrounding signals below.
                  </div>
                ) : (
                  myPairedHardware.map(dev => (
                    <div key={dev.id} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex flex-col space-y-3 shadow-inner">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-slate-200">{dev.name}</h4>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{dev.deviceId}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-black tracking-wider text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                              Connected
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              Map: {dev.mappedAction}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] text-slate-400 block font-semibold">{dev.batteryLevel}% 🔋</span>
                          <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
                            {dev.rssi} dBm
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic GATT controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <button
                          onClick={() => handleTriggerGattDisconnect(dev.deviceId)}
                          className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-mono font-bold transition"
                          title="Simulate sudden GATT connection loss (status code 0)"
                        >
                          Simulate Disconnect (GATT 0)
                        </button>
                        <button
                          onClick={() => handleDeletePairedDevice(dev.deviceId)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 transition"
                          title="Unpair and Delete Key Node"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dynamic Scanner (nRF Connect Style) */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Dynamic Signal Scan (nRF Connect)</span>
                  {isScanning && <span className="text-blue-400 animate-pulse text-[9px]">Analyzing 2.4GHz spectrum...</span>}
                </p>

                {isScanning && (
                  <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-2.5 shadow-inner">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1 font-mono">
                        Manual Filter / Device Finder
                      </label>
                      <input 
                        type="text" 
                        placeholder="🔍 Enter BLE Name or MAC (e.g. iTAG, Wearable)"
                        value={bleSearchTerm}
                        onChange={(e) => setBleSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500 tracking-wider font-mono">
                        <span>Min RSSI Threshold (Signal strength)</span>
                        <span className="text-blue-400 font-bold font-mono">{bleMinRssi} dBm</span>
                      </div>
                      <input 
                        type="range"
                        min="-100"
                        max="-30"
                        value={bleMinRssi}
                        onChange={(e) => setBleMinRssi(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 accent-blue-500 rounded cursor-pointer mt-1"
                      />
                      <div className="flex justify-between text-[7px] text-slate-600 font-mono mt-0.5">
                        <span>-100 dBm (Weakest)</span>
                        <span>-30 dBm (Strongest)</span>
                      </div>
                    </div>
                  </div>
                )}

                {!isScanning ? (
                  <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-xl py-8 px-4 text-center space-y-2">
                    <Radio className="w-8 h-8 text-slate-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">Spectrum Analyzer Idle</p>
                    <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto">Click the SCAN BLE button at the top to discover local iTAG devices sorted by dynamic RSSI signal strength.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {scannedDevices
                      .filter(dev => {
                        const matchesSearch = dev.name.toLowerCase().includes(bleSearchTerm.toLowerCase()) || 
                                              dev.deviceId.toLowerCase().includes(bleSearchTerm.toLowerCase());
                        const matchesRssi = dev.rssi >= bleMinRssi;
                        return matchesSearch && matchesRssi;
                      })
                      .map(dev => {
                        const isPaired = myPairedHardware.some(h => h.deviceId === dev.deviceId);
                        const isStrong = dev.rssi >= -60;
                        const isMedium = dev.rssi >= -80;

                        return (
                          <div key={dev.deviceId} className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-300 leading-none">{dev.name}</span>
                                <span className="font-mono text-[8px] text-slate-500 leading-none">{dev.deviceId}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${isStrong ? "bg-emerald-500" : isMedium ? "bg-blue-500" : "bg-amber-500"}`} 
                                    style={{ width: `${Math.max(10, 100 + dev.rssi)}%` }}
                                  ></div>
                                </div>
                                <span className={`font-mono text-[9px] font-semibold ${isStrong ? "text-emerald-400" : isMedium ? "text-blue-400" : "text-amber-400"}`}>
                                  {dev.rssi} dBm
                                </span>
                              </div>
                            </div>
                            
                            <button
                              disabled={isPaired}
                              onClick={() => handlePairScannedDevice(dev.name, dev.deviceId)}
                              className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md border transition ${
                                isPaired 
                                  ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-500 cursor-default" 
                                  : "bg-blue-600 hover:bg-blue-700 border-blue-500 text-white"
                              }`}
                            >
                              {isPaired ? "PAIRED" : "PAIR"}
                            </button>
                          </div>
                        );
                      })}
                    {scannedDevices.filter(dev => {
                      const matchesSearch = dev.name.toLowerCase().includes(bleSearchTerm.toLowerCase()) || 
                                            dev.deviceId.toLowerCase().includes(bleSearchTerm.toLowerCase());
                      const matchesRssi = dev.rssi >= bleMinRssi;
                      return matchesSearch && matchesRssi;
                    }).length === 0 && (
                      <p className="text-[10px] text-slate-500 italic text-center py-4 font-mono">No surrounding signals match your manual filters.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. MEDICAL PROFILE SCREEN */}
          {activeScreen === "screen-medical" && currentUser && (
            <div className="flex-grow flex flex-col p-4 space-y-4">
              <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">Emergency Medicals</h3>
                  <p className="text-[10px] text-rose-400">Critical profile logs for EMS & Patrol teams</p>
                </div>
                <button 
                  onClick={saveMedicalProfile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {/* Blood type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Group</label>
                  <select 
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="Unknown">I am not sure</option>
                  </select>
                </div>

                {/* Chronic Allergies */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Severe Allergies</label>
                  <input 
                    type="text" 
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Penicillin, Bee stings, Peanuts"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-200"
                  />
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Chronic Medications</label>
                  <input 
                    type="text" 
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="Insulin, Warfarin, Asthmapent"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-200"
                  />
                </div>

                {/* Chronic Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Important Medical Notes</label>
                  <textarea 
                    value={medNotes}
                    onChange={(e) => setMedNotes(e.target.value)}
                    placeholder="E.g. Wear a pacemaker. Diabetic."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-200 h-14 resize-none"
                  />
                </div>

                {/* Emergency contact list */}
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Emergency Contacts (Max 5)</h4>
                  
                  {contacts.length === 0 ? (
                    <p className="text-xs text-rose-400 italic">No emergency contacts saved yet. Add at least 1 for voice cascade.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {contacts.map((c, idx) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-slate-200">{c.name} ({c.relationship})</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{c.phone}</p>
                          </div>
                          <button 
                            onClick={() => deleteContact(idx)}
                            className="p-1 hover:bg-slate-800 rounded text-rose-500"
                            title="Remove contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add contact mini form */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Add New Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Contact Name"
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                      <input 
                        type="text" 
                        value={newContactRel}
                        onChange={(e) => setNewContactRel(e.target.value)}
                        placeholder="Relationship"
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                      <button 
                        onClick={addContact}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1 px-3 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. GENERAL PROFILE EDIT SCREEN */}
          {activeScreen === "screen-profile" && currentUser && (
            <div className="flex-grow flex flex-col p-4 space-y-4">
              <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">General Account</h3>
                <button 
                  onClick={saveProfileInfo}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition"
                >
                  Save Settings
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white mb-2 shadow-inner border-2 border-slate-800">
                    {profileName.slice(0,2).toUpperCase() || "ME"}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {currentUser.id.slice(0,12)}</span>
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 mt-1.5">{currentUser.role}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Primary Mobile (South Africa)</label>
                  <input 
                    type="text" 
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Bio / Display status</label>
                  <input 
                    type="text" 
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Let responders know where you reside, e.g. House 4, Sector 12"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Tab Navigation bar */}
        {currentUser && (
          <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-950 border-t border-slate-800 px-3 flex justify-between items-center z-40 text-slate-400">
            <button 
              onClick={() => setActiveScreen("screen-dashboard")}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${activeScreen === "screen-dashboard" ? "text-blue-500 font-semibold" : "hover:text-slate-200"}`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-[9px] mt-1">SOS Panic</span>
            </button>

            <button 
              onClick={() => setActiveScreen("screen-intel")}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${activeScreen === "screen-intel" ? "text-blue-500 font-semibold" : "hover:text-slate-200"}`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-[9px] mt-1">Active Intel</span>
            </button>

            <button 
              onClick={() => setActiveScreen("screen-hardware")}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${activeScreen === "screen-hardware" ? "text-blue-500 font-semibold" : "hover:text-slate-200"}`}
            >
              <Bluetooth className="w-5 h-5" />
              <span className="text-[9px] mt-1">iTAG BLE</span>
            </button>

            <button 
              onClick={() => setActiveScreen("screen-medical")}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${activeScreen === "screen-medical" ? "text-blue-500 font-semibold" : "hover:text-slate-200"}`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-[9px] mt-1">Medicals</span>
            </button>

            <button 
              onClick={() => setActiveScreen("screen-profile")}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${activeScreen === "screen-profile" ? "text-blue-500 font-semibold" : "hover:text-slate-200"}`}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] mt-1">Account</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
