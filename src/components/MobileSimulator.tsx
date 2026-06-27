import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, LogOut, AlertOctagon, Bluetooth, MapPin, RefreshCw, 
  Wifi, ClipboardList, Trash2, Radio, Heart, User as UserIcon, 
  Smartphone, MessageSquare, ArrowLeft, AlertCircle, Plus, 
  Settings, LayoutGrid, Sliders, Play, CheckCircle2, Server 
} from "lucide-react";
import { User, MedicalProfile, HardwareDevice, Alert, AlertEvent, Organization } from "../types";

// Import modular sub-views
import DashboardView from "./MobileViews/DashboardView";
import EmergencyView from "./MobileViews/EmergencyView";
import IncidentsView from "./MobileViews/IncidentsView";
import RespondersView from "./MobileViews/RespondersView";
import EvidenceView from "./MobileViews/EvidenceView";
import ContactsView from "./MobileViews/ContactsView";
import OrganizationsView from "./MobileViews/OrganizationsView";
import SettingsView from "./MobileViews/SettingsView";
import ProfileView from "./MobileViews/ProfileView";
import HomeScreenWidget from "./MobileViews/HomeScreenWidget";
import WhatsAppView from "./MobileViews/WhatsAppView";
import ValidationHarnessView from "./MobileViews/ValidationHarnessView";
import BleScannerView from "./MobileViews/BleScannerView";

interface MobileSimulatorProps {
  currentUser: User | null;
  currentMedical: MedicalProfile | null;
  hardware: HardwareDevice[];
  alerts: Alert[];
  activeAlertEvents: AlertEvent[];
  organizations: Organization[];
  onLogin: (credentials: any) => Promise<any>;
  onRegister: (data: any) => Promise<any>;
  onTriggerSOS: (latitude: number, longitude: number) => Promise<any>;
  onResolveAlert: (alertId: string) => Promise<void>;
  onUpdateAlertStatus?: (alertId: string, status: any, message?: string) => Promise<void>;
  onUpdateMedical: (data: any) => Promise<any>;
  onUpdateProfile: (data: any) => Promise<any>;
  refreshData: () => void;
  onLogout: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  onAssignDevice: (deviceId: string, userId: string) => Promise<void>;
  onUnassignDevice: (deviceId: string) => Promise<void>;
}

// Reusable crisp sound buzzer utilizing standard Web Audio API
export function playBeep(frequency = 2000, duration = 0.1) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // moderate volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.warn("AudioContext playback blocked or unsupported:", err);
  }
}

export default function MobileSimulator({
  currentUser,
  currentMedical,
  hardware,
  alerts,
  activeAlertEvents,
  organizations,
  onLogin,
  onRegister,
  onTriggerSOS,
  onResolveAlert,
  onUpdateAlertStatus,
  onUpdateMedical,
  onUpdateProfile,
  refreshData,
  onLogout,
  showToast,
  onAssignDevice,
  onUnassignDevice,
}: MobileSimulatorProps) {
  // Device Simulation Coordinates (Soweto/Lenasia GP sectors default)
  const [gpsLatitude, setGpsLatitude] = useState(-26.3085);
  const [gpsLongitude, setGpsLongitude] = useState(27.8344);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Phone viewport controls
  const [activeScreen, setActiveScreen] = useState("screen-dashboard");
  const [phoneMode, setPhoneMode] = useState<"app" | "home" | "whatsapp" | "validation">("app");
  const [simulatedNetwork, setSimulatedNetwork] = useState<"online" | "offline">("online");
  const [pushNotification, setPushNotification] = useState<string | null>(null);

  // Simulated Battery & Power states
  const [batteryLevel, setBatteryLevel] = useState(98);
  const [isScreenOn, setIsScreenOn] = useState(true);
  const [itagAlarmActive, setItagAlarmActive] = useState(false);

  // Widget Settings configuration
  const [widgetLayout, setWidgetLayout] = useState<"compact" | "dual" | "full">("full");
  const [isWidgetAdded, setIsWidgetAdded] = useState<boolean>(() => {
    const saved = localStorage.getItem("safetylink-widget-added");
    return saved ? saved === "true" : true;
  });

  // Auth / Provision states
  const [provOrg, setProvOrg] = useState<Organization | null>(null);
  const [orgCodeInput, setOrgCodeInput] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("+27");
  const [regRole, setRegRole] = useState("Citizen");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Contacts
  const [contacts, setContacts] = useState<Array<{ name: string; relationship: string; phone: string }>>([
    { name: "Sipho Khumalo", relationship: "Neighbor", phone: "+27 82 555 0192" },
    { name: "Liezel Botha", relationship: "Spouse", phone: "+27 71 555 4912" }
  ]);

  // Offline incident queue saved in browser cache
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Simulated WhatsApp Chats
  const [waMessages, setWaMessages] = useState<Record<string, Array<{ sender: "user" | "contact"; text: string; time: string }>>>({});

  // Active Emergency Dispatch States
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStage, setDispatchStage] = useState(0);
  const [activeEmergencyType, setActiveEmergencyType] = useState<"standard" | "silent" | "medical" | "fire" | "security" | null>(null);

  // Reusable SOS Hold States (Standard App Shield Button)
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reusable Home Screen Widget Hold States
  const [isHoldingWidget, setIsHoldingWidget] = useState(false);
  const [widgetHoldProgress, setWidgetHoldProgress] = useState(0);
  const widgetHoldIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Diagnostic Test Harness States
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [activeTestScenario, setActiveTestScenario] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);

  // Load offline queue on mount
  useEffect(() => {
    const cached = localStorage.getItem("safety_offline_queue");
    if (cached) {
      try {
        setOfflineQueue(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached offline queue:", e);
      }
    }
  }, []);

  // Sync back-end values for medical and contacts
  useEffect(() => {
    if (currentMedical && currentMedical.emergencyContacts && currentMedical.emergencyContacts.length > 0) {
      setContacts(currentMedical.emergencyContacts);
    }
  }, [currentMedical]);

  // Find user's paired BLE buttons
  const myPairedHardware = hardware.filter(h => h.assignedUserId === currentUser?.id);

  // Track previous count of paired hardware
  const prevPairedCountRef = useRef(myPairedHardware.length);

  // Connection drop effect for bonded iTAG
  useEffect(() => {
    const prevCount = prevPairedCountRef.current;
    const currentCount = myPairedHardware.length;
    prevPairedCountRef.current = currentCount;

    if (currentUser) {
      if (currentCount > 0 && batteryLevel === 4) {
        if (!itagAlarmActive) {
          setItagAlarmActive(true);
          showToast("🚨 KEEP-ALIVE LINK LOST! Critical battery suspended GATT stream. iTAG beeping.", "error");
        }
      } else if (prevCount > 0 && currentCount === 0) {
        setItagAlarmActive(true);
        showToast("🚨 BONDED iTAG DISCONNECTED! Loss of keep-alive. Speaker alert active.", "error");
      }
    }
  }, [myPairedHardware.length, batteryLevel, currentUser]);

  // Play alarm buzzer beeps on interval
  useEffect(() => {
    if (!itagAlarmActive) return;

    const playAlarmBeep = () => {
      playBeep(2100, 0.12);
      setTimeout(() => playBeep(1700, 0.12), 150);
    };

    playAlarmBeep();
    const interval = setInterval(playAlarmBeep, 1500);

    return () => clearInterval(interval);
  }, [itagAlarmActive]);

  // Wake up screen on incoming emergency alert
  useEffect(() => {
    if (alerts.length > 0) {
      const latest = alerts[0];
      const ageMs = Date.now() - new Date(latest.createdAt).getTime();
      if (ageMs < 8000 && !isScreenOn) {
        setIsScreenOn(true);
        showToast("⚡ Hardware keypress detected! Screen awakened. Dispatching rescue...", "success");
        playBeep(1000, 0.08);
        setTimeout(() => playBeep(1200, 0.08), 100);
        setTimeout(() => playBeep(1500, 0.15), 200);
      }
    }
  }, [alerts]);

  // Handle active user login transitions
  useEffect(() => {
    if (currentUser) {
      setActiveScreen("screen-dashboard");
    } else {
      if (!provOrg) {
        setActiveScreen("screen-provision");
      } else {
        setActiveScreen("screen-login");
      }
    }
  }, [currentUser, provOrg]);

  // Auto-replay offline queue when cellular network recovers
  useEffect(() => {
    if (simulatedNetwork === "online" && offlineQueue.length > 0) {
      const syncItems = async () => {
        const pendingItems = offlineQueue.filter(item => item.status === "pending" || item.status === "failed");
        if (pendingItems.length === 0) return;

        setOfflineQueue(prev => prev.map(item => (item.status === "pending" || item.status === "failed") ? { ...item, status: "syncing" } : item));

        for (const item of pendingItems) {
          try {
            await onTriggerSOS(item.latitude, item.longitude);
            // On success, pop from offline cache
            setOfflineQueue(prev => {
              const filtered = prev.filter(q => q.id !== item.id);
              localStorage.setItem("safety_offline_queue", JSON.stringify(filtered));
              return filtered;
            });

            // Send WhatsApp synchronized feedback
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setWaMessages(prevChats => {
              const updated = { ...prevChats };
              contacts.forEach(contact => {
                if (!updated[contact.phone]) updated[contact.phone] = [];
                updated[contact.phone] = [
                  ...updated[contact.phone],
                  { sender: "user", text: `✓ [SYNCHRONIZED] SafetyLink offline queue successfully synchronized! Dispatcher alert confirmed. Location feed is now live. Coordinates: ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}.`, time: timeStr },
                  { sender: "contact", text: "Got the live sync update! Rest assured, communities are active and watching.", time: timeStr }
                ];
              });
              return updated;
            });
          } catch (err) {
            console.error("Failed to sync offline item:", err);
            setOfflineQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "failed" } : q));
          }
        }
        refreshData();
      };
      syncItems();
    }
  }, [simulatedNetwork, offlineQueue.length, contacts]);

  // Trigger continuous SOS Hold
  const startSosHold = () => {
    setIsHoldingSos(true);
    setHoldProgress(0);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current!);
          setIsHoldingSos(false);
          setHoldProgress(0);
          triggerEmergency("standard", "Standard circular hold-SOS panic initiated.");
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const cancelSosHold = () => {
    setIsHoldingSos(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  };

  // Trigger continuous Home Widget Hold
  const onWidgetHoldStart = () => {
    setIsHoldingWidget(true);
    setWidgetHoldProgress(0);
    if (widgetHoldIntervalRef.current) clearInterval(widgetHoldIntervalRef.current);
    widgetHoldIntervalRef.current = setInterval(() => {
      setWidgetHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(widgetHoldIntervalRef.current!);
          setIsHoldingWidget(false);
          setWidgetHoldProgress(0);
          triggerEmergency("standard", "Standard SOS triggered via home screen widget hold.");
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const onWidgetHoldEnd = () => {
    setIsHoldingWidget(false);
    setWidgetHoldProgress(0);
    if (widgetHoldIntervalRef.current) clearInterval(widgetHoldIntervalRef.current);
  };

  // Centralized Progressive Dispatch Engine
  const triggerEmergency = async (type: "standard" | "silent" | "medical" | "fire" | "security", notes?: string) => {
    if (!currentUser) return;
    setActiveEmergencyType(type);
    setIsDispatching(true);
    setDispatchStage(0);

    // Swap phone mode to App, and open Emergency progress instantly!
    setPhoneMode("app");
    setActiveScreen("screen-emergency");

    const interval = setInterval(() => {
      setDispatchStage((prev) => {
        if (simulatedNetwork === "offline" && prev >= 2) {
          // If offline, halt progress at offline cache stage (Stage 2 / idx 2)
          clearInterval(interval);
          const offlineItem = {
            id: "off-" + Math.floor(Math.random() * 1000000),
            latitude: gpsLatitude,
            longitude: gpsLongitude,
            timestamp: new Date().toISOString(),
            status: "pending" as const
          };
          setOfflineQueue((prevQueue) => {
            const updated = [...prevQueue, offlineItem];
            localStorage.setItem("safety_offline_queue", JSON.stringify(updated));
            return updated;
          });
          appendSimulatedWaAlert(true, type);
          return 3;
        }

        if (prev >= 4) {
          clearInterval(interval);
          // Complete and POST to back-end database
          onTriggerSOS(gpsLatitude, gpsLongitude).then(() => {
            appendSimulatedWaAlert(false, type);
            refreshData();
          });
          return 5;
        }
        return prev + 1;
      });
    }, 1200);
  };

  // Append SMS/WhatsApp notification triggers
  const appendSimulatedWaAlert = (isOffline: boolean, type: string) => {
    const typeLabel = type.toUpperCase();
    const mapLink = `https://maps.google.com/?q=${gpsLatitude.toFixed(6)},${gpsLongitude.toFixed(6)}`;
    const locationMsg = `⚠️ [EMERGENCY DISPATCH ALERT] SafetyLink triggered: [${typeLabel}] emergency at coordinates: ${gpsLatitude.toFixed(4)}, ${gpsLongitude.toFixed(4)}.\nLive Map Link: ${mapLink}`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setWaMessages((prev) => {
      const updated = { ...prev };
      contacts.forEach((contact) => {
        if (!updated[contact.phone]) updated[contact.phone] = [];
        updated[contact.phone] = [
          ...updated[contact.phone],
          { sender: "user", text: locationMsg, time: timeStr }
        ];

        if (!isOffline) {
          setTimeout(() => {
            setWaMessages((latest) => {
              const withReply = { ...latest };
              const replyText = contact.relationship === "Spouse"
                ? "Oh my god! I received the SafetyLink coordinate feed. Armed security company is on their way, keep your phone close!"
                : "SafetyLink panic received! I am tracking your live location on the dispatch tower now, stay safe!";
              withReply[contact.phone] = [
                ...withReply[contact.phone],
                { sender: "contact", text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              ];
              return withReply;
            });
          }, 2500);
        }
      });
      return updated;
    });
  };

  // Simulate subtle coordinate tracking adjustments (jitter)
  const handleSimulateNewGps = () => {
    setIsGpsLoading(true);
    setTimeout(() => {
      // Small offset change in Soweto bounds
      const offsetLat = (Math.random() - 0.5) * 0.003;
      const offsetLng = (Math.random() - 0.5) * 0.003;
      setGpsLatitude((prev) => prev + offsetLat);
      setGpsLongitude((prev) => prev + offsetLng);
      setIsGpsLoading(false);
    }, 800);
  };

  const getClosestSouthAfricanCity = (lat: number, lng: number) => {
    if (lat > -26.35 && lat < -26.15 && lng > 27.75 && lng < 27.95) return "Lenasia, GP (Sector HQ)";
    if (lat > -26.30 && lat < -26.20 && lng > 27.80 && lng < 27.92) return "Soweto, GP";
    if (lat > -26.15 && lat < -26.05 && lng > 28.00 && lng < 28.12) return "Sandton, GP";
    if (lat > -26.25 && lat < -26.15 && lng > 28.00 && lng < 28.10) return "Johannesburg, GP";
    if (lat > -34.10 && lat < -33.80 && lng > 18.30 && lng < 18.60) return "Cape Town, WC";
    if (lat > -34.10 && lat < -34.00 && lng > 18.50 && lng < 18.70) return "Mitchells Plain, WC";
    if (lat > -30.00 && lat < -29.70 && lng > 30.80 && lng < 31.20) return "Durban, KZN";
    return "Gauteng Central, GP";
  };

  // Submit methods for login/registration
  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = organizations.find(o => o.code.toUpperCase() === orgCodeInput.toUpperCase());
    if (found) {
      setProvOrg(found);
      setActiveScreen("screen-login");
    } else {
      alert("Invalid Organization Code. Try SL-XXXX-YY codes from the Owner dashboard.");
    }
  };

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
      setRegSuccess(res.message || "Registration completed successfully!");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setTimeout(() => {
        setActiveScreen("screen-login");
      }, 2000);
    } catch (err: any) {
      setRegError(err.message || "Registration failed.");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await onLogin({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials.");
    }
  };

  // Save changes to database
  const handleSaveMedical = async (data: any) => {
    if (!currentUser) return;
    try {
      await onUpdateMedical({
        userId: currentUser.id,
        bloodType: data.bloodType,
        allergies: data.allergies,
        medications: data.medications,
        notes: data.notes,
        emergencyContacts: contacts
      });
      alert("Medical rescue ID synchronized successfully.");
    } catch (e) {
      alert("Failed to update medical ID.");
    }
  };

  const handleSaveProfile = async (data: any) => {
    if (!currentUser) return;
    try {
      await onUpdateProfile(data);
      alert("Account credentials synchronized.");
    } catch (e) {
      alert("Failed to update account info.");
    }
  };

  // Automated diagnostic validation tests (Scenario A, B, C)
  const handleRunValidationTest = (scenario: string) => {
    setIsRunningTest(true);
    setActiveTestScenario(scenario);
    setTestLog([]);

    const log = (msg: string) => {
      setTestLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    if (scenario === "blackout") {
      log("Initializing Scenario A: Panic Mode Under Blackout...");
      setTimeout(() => log("Disconnecting device network... [SIMULATED CELLULAR BLACKOUT]"), 500);
      setTimeout(() => {
        setSimulatedNetwork("offline");
        log("Device is now OFFLINE. Initializing secure client-side storage layers.");
      }, 1000);
      setTimeout(() => log("Pressing and holding the Homescreen Panic Widget button..."), 2000);
      setTimeout(() => {
        log("Widget hold target reached: 100% complete.");
        triggerEmergency("standard", "Scenario A: Blackout Offline queue simulation.");
      }, 3000);
      setTimeout(() => {
        log("Checking local persistent cache... Found 1 queued distress record.");
        log("SUCCESS: Secure local fallback queue successfully stored emergency coordinate frames!");
        setIsRunningTest(false);
        setActiveTestScenario(null);
      }, 4500);
    } else if (scenario === "satellite") {
      log("Initializing Scenario B: Satellite Fallback Routing...");
      setTimeout(() => log("Primary GSM carrier scanning failed. Initializing failover modules."), 800);
      setTimeout(() => log("Attempting handshakes with TM Media satellite backups (Gauteng sector)..."), 1800);
      setTimeout(() => log("Establishing telemetry relay frames over secure L-band frequencies..."), 2800);
      setTimeout(() => {
        log("Handshake verified. 100% transmission of citizen coordinates to Cape Town hub confirmed.");
        log("SUCCESS: Active distress coordinates successfully routed via secure satellite gateway fallback!");
        setIsRunningTest(false);
        setActiveTestScenario(null);
      }, 4000);
    } else if (scenario === "auto-sync") {
      log("Initializing Scenario C: Auto-Sync & Replay On Network Recovery...");
      setTimeout(() => log("Ensuring device has pending items in local SQLite/IndexedDB queue..."), 500);
      setTimeout(() => {
        setOfflineQueue((prev) => {
          if (prev.length === 0) {
            return [{
              id: "off-val-test",
              latitude: -26.3085,
              longitude: 27.8344,
              timestamp: new Date().toISOString(),
              status: "pending"
            }];
          }
          return prev;
        });
        log("Persistent cache validated. Pending alert queued and ready.");
      }, 1000);
      setTimeout(() => log("Simulating cell tower reconnect... Onlining cell network state."), 2000);
      setTimeout(() => {
        setSimulatedNetwork("online");
        log("Network is back ONLINE. Replay scheduler triggered.");
      }, 2500);
      setTimeout(() => {
        log("SUCCESS: All pending local distress messages replayed to central dashboard with Meta WhatsApp confirmation logs!");
        setIsRunningTest(false);
        setActiveTestScenario(null);
      }, 4500);
    } else if (scenario === "ble_fail") {
      log("Initializing Scenario B-2: GATT Hardware Drop Handshake...");
      setTimeout(() => log("Interfacing with Nordic BLE GATT server profiles..."), 500);
      setTimeout(() => log("Simulating signal attenuation below -100dB RSSI..."), 1200);
      setTimeout(() => {
        // Trigger push notification instantly
        setPushNotification("Warning: SafetyLink Hardware Disconnected. Fallback to phone interface activated.");
        log("CRITICAL LIFE-CYCLE WARNING SENT: GATT stream disconnected.");
      }, 2000);
      setTimeout(() => {
        log("SUCCESS: Client safely fallbacked to touch screen controls and logged Keystore warning signature.");
        setIsRunningTest(false);
        setActiveTestScenario(null);
      }, 3500);
    } else if (scenario === "doze") {
      log("Initializing Scenario C-2: OS Doze Lock Preservation...");
      setTimeout(() => log("Android PowerManager entering deep standby..."), 500);
      setTimeout(() => log("Checking Foreground Service flags and WakeLock integrity..."), 1200);
      setTimeout(() => {
        log("WAKELOCK VERIFIED: Thread CPU remains awake at 200MHz. Scanning beacons in background.");
      }, 2000);
      setTimeout(() => {
        log("SUCCESS: Deep sleep bypassed. Core telemetry remains live.");
        setIsRunningTest(false);
        setActiveTestScenario(null);
      }, 3500);
    }
  };

  const handleAutoFillOrg = (code: string) => {
    setOrgCodeInput(code);
  };

  const handleAddContact = (name: string, relationship: string, phone: string) => {
    setContacts(prev => [...prev, { name, relationship, phone }]);
  };

  const handleDeleteContact = (index: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== index));
  };

  const isHighContrast = currentUser?.accessibilityHighContrast;
  const hasVisualStrobe = currentUser?.disabilityAids?.includes("visual_strobe");
  const isCurrentlyDispatchingOrActive = isDispatching || alerts.some(a => a.userId === currentUser?.id && a.status !== 'resolved');

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <style>{`
        @keyframes strobe-flash-anim {
          0%, 100% { background-color: #020617; border-color: #0f172a; }
          50% { background-color: #ef4444; border-color: #b91c1c; }
        }
        .animate-strobe-flash {
          animation: strobe-flash-anim 0.4s infinite;
        }
      `}</style>
      {/* Phone container mockup */}
      <div className={`w-[375px] h-[780px] rounded-[48px] border-[10px] shadow-2xl relative overflow-hidden flex flex-col font-sans select-none transition-all duration-300 ${
        isHighContrast 
          ? "bg-black border-yellow-500 text-yellow-400" 
          : "bg-slate-950 border-slate-900 text-white"
      } ${
        hasVisualStrobe && isCurrentlyDispatchingOrActive ? "animate-strobe-flash" : ""
      }`}>
        
        {/* Dynamic Island Header Mock */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 bg-slate-950 rounded-full absolute left-4"></div>
          <div className="w-1.5 h-1.5 bg-blue-900 rounded-full absolute right-6"></div>
        </div>

        {/* Status Bar */}
        <div className="h-11 pt-2 px-6 flex justify-between items-end text-xs font-semibold text-white/95 bg-slate-950 z-40 shrink-0 select-none">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1">
            {/* Cellular Simulation Toggle */}
            <button 
              onClick={() => {
                setSimulatedNetwork(prev => {
                  const next = prev === "online" ? "offline" : "online";
                  showToast(next === "online" ? "Cellular connection recovered." : "Cellular offline. Incidents will cache in SQL.", next === "online" ? "success" : "info");
                  playBeep(next === "online" ? 1000 : 700, 0.08);
                  return next;
                });
              }}
              className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black transition cursor-pointer ${
                simulatedNetwork === "online" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              }`}
              title="Click to toggle cellular offline simulation"
            >
              <Wifi className="w-2.5 h-2.5" />
              {simulatedNetwork.toUpperCase()}
            </button>

            {/* Screen Off Toggle */}
            <button 
              onClick={() => {
                setIsScreenOn(prev => {
                  const next = !prev;
                  playBeep(next ? 1000 : 500, 0.1);
                  return next;
                });
              }}
              className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold transition cursor-pointer ${
                isScreenOn ? "bg-slate-900 text-slate-400 hover:text-white" : "bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 animate-pulse"
              }`}
              title="Simulate putting phone screen to sleep (Screen On/Off)"
            >
              {isScreenOn ? "💡 On" : "🌙 Sleep"}
            </button>

            {/* Battery Level Cycle Toggle */}
            <button
              onClick={() => {
                setBatteryLevel((prev) => {
                  if (prev === 98) {
                    showToast("Battery level: 15% (Low Power mode activated. GATT handshake interval throttled.)", "info");
                    playBeep(800, 0.1);
                    return 15;
                  } else if (prev === 15) {
                    showToast("Battery level: 4% (Critical! GATT link suspended. iTAG beeping.)", "error");
                    // Trigger alarm beep immediately
                    setItagAlarmActive(true);
                    return 4;
                  } else {
                    showToast("Battery level: 98% (Power restored. Handshake re-secured.)", "success");
                    setItagAlarmActive(false);
                    playBeep(1200, 0.1);
                    return 98;
                  }
                });
              }}
              className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold transition cursor-pointer ${
                batteryLevel === 98 
                  ? "bg-slate-900 text-white/90 hover:bg-slate-800" 
                  : batteryLevel === 15 
                    ? "bg-amber-500/25 text-amber-400 border border-amber-500/30 animate-pulse" 
                    : "bg-rose-600/30 text-rose-400 border border-rose-500/30"
              }`}
              title="Toggle simulated battery level (98% / 15% / 4%)"
            >
              <span>{batteryLevel}%</span>
              <span>{batteryLevel === 98 ? "🔋" : batteryLevel === 15 ? "⚠️" : "🪫"}</span>
            </button>
          </div>
        </div>

        {/* Interactive Screen viewport */}
        <div className="flex-1 bg-slate-900 text-white overflow-y-auto flex flex-col relative">
          
          {/* Pitch-Black Screen Off Overlay */}
          {!isScreenOn && (
            <div 
              className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
              onClick={() => {
                setIsScreenOn(true);
                showToast("Screen awakened manually via physical interaction.", "info");
                playBeep(1000, 0.05);
              }}
            >
              <div className="space-y-4 animate-pulse flex flex-col items-center">
                <Smartphone className="w-12 h-12 text-slate-800" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold text-slate-600 uppercase tracking-widest">SCREEN IS SLEEPING</p>
                  <p className="text-[9px] text-slate-700 font-semibold max-w-[200px] leading-relaxed">
                    Tap the screen or trigger an iTAG button (BLE device simulator tab) to awaken
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active iTAG disconnected / beeping alarm visual warning block */}
          {itagAlarmActive && (
            <div className="bg-rose-950 border-b border-rose-850 px-4 py-2.5 z-40 flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-wider text-rose-400 font-mono">BONDED iTAG SPEAKER ALARM ACTIVE</p>
                  <p className="text-[9px] text-rose-200 leading-none">Tag speaker emits rapid beeps to prevent theft/loss</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setItagAlarmActive(false);
                  showToast("Safety beep alarm silenced manually.", "success");
                  playBeep(1200, 0.05);
                }}
                className="text-[9px] font-black px-2 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded cursor-pointer uppercase font-mono border border-rose-700/50"
              >
                Silence Beep
              </button>
            </div>
          )}
          
          {/* Dynamic high-priority push warning overlay */}
          {pushNotification && (
            <div className="absolute top-2 left-3 right-3 bg-rose-950 border border-rose-800 text-rose-200 rounded-2xl p-3 z-50 shadow-2xl animate-bounce">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h5 className="text-[9px] font-black uppercase tracking-wider text-rose-300">GATT FAILOVER DISPATCH</h5>
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

          {/* Top Level Phone Mode Selector Toggles */}
          {currentUser && (
            <div className="bg-slate-950 border-b border-slate-900 px-2 py-1.5 flex justify-between items-center gap-1 shrink-0 z-40">
              <button 
                onClick={() => setPhoneMode("app")}
                className={`flex-1 text-[9px] py-1.5 font-extrabold rounded uppercase tracking-wider text-center transition ${
                  phoneMode === "app" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                🛡️ App
              </button>
              <button 
                onClick={() => setPhoneMode("home")}
                className={`flex-1 text-[9px] py-1.5 font-extrabold rounded uppercase tracking-wider text-center transition ${
                  phoneMode === "home" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                🏠 Home
              </button>
              <button 
                onClick={() => setPhoneMode("whatsapp")}
                className={`flex-1 text-[9px] py-1.5 font-extrabold rounded uppercase tracking-wider text-center transition ${
                  phoneMode === "whatsapp" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                💬 WA
              </button>
              <button 
                onClick={() => setPhoneMode("validation")}
                className={`flex-1 text-[9px] py-1.5 font-extrabold rounded uppercase tracking-wider text-center transition ${
                  phoneMode === "validation" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                🧪 Harness
              </button>
            </div>
          )}

          {/* ----------------- PHONE MODES CONTENT ----------------- */}

          {/* 1. DE-PROVISION STATE OR NO USER */}
          {!currentUser ? (
            <div className="flex-grow flex flex-col p-6 items-center justify-center space-y-4">
              <div className="w-14 h-14 bg-rose-600/10 text-rose-500 rounded-3xl border border-rose-500/20 flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 animate-pulse" />
              </div>
              
              {/* Provisioning Organization Screen */}
              {activeScreen === "screen-provision" && (
                <form onSubmit={handleProvisionSubmit} className="w-full space-y-4 text-left">
                  <div className="text-center">
                    <h3 className="text-base font-extrabold uppercase tracking-wide text-white font-sans">Provision Terminal</h3>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                      Enter your neighborhood watch or security CPF validation key to secure cellular links.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Organization Code:</label>
                    <input
                      type="text"
                      value={orgCodeInput}
                      onChange={(e) => setOrgCodeInput(e.target.value)}
                      placeholder="e.g. SL-GTP-42"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-center font-mono font-bold focus:outline-none focus:border-rose-500 text-rose-400 placeholder:text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer shadow"
                  >
                    Authenticate Device Node
                  </button>
                </form>
              )}

              {/* Secure Login Screen */}
              {activeScreen === "screen-login" && (
                <form onSubmit={handleLoginSubmit} className="w-full space-y-4 text-left">
                  <div className="text-center">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">
                      NODE VALID: {provOrg?.name}
                    </span>
                    <h3 className="text-base font-extrabold uppercase text-white mt-1">Operator Gateway</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">Email:</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">Password:</label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {loginError && <p className="text-[10px] text-rose-400 font-semibold">{loginError}</p>}

                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Establish Secure Session
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveScreen("screen-register")}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold uppercase"
                    >
                      New Citizen Node? Register Here
                    </button>
                  </div>
                </form>
              )}

              {/* Secure Register Screen */}
              {activeScreen === "screen-register" && (
                <form onSubmit={handleRegisterSubmit} className="w-full space-y-3 text-left">
                  <div className="text-center">
                    <h3 className="text-sm font-black uppercase text-white">Citizen Registry</h3>
                    <p className="text-[9px] text-slate-400 mt-1 leading-none font-semibold">Join {provOrg?.name}</p>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Secure Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {regError && <p className="text-[9px] text-rose-400 font-semibold">{regError}</p>}
                  {regSuccess && <p className="text-[9px] text-emerald-400 font-semibold">{regSuccess}</p>}

                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                  >
                    Authenticate Account
                  </button>

                  <div className="text-center pt-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveScreen("screen-login")}
                      className="text-[9px] text-slate-400 hover:text-white uppercase font-bold"
                    >
                      ← Back To Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ----------------- IF USER LOGGED IN ----------------- */
            <div className="flex-grow flex flex-col relative h-full">
              
              {/* MODE A: MAIN EMERGENCY APP MODE */}
              {phoneMode === "app" && (
                <div className="flex-grow flex flex-col relative h-full">
                  <div className="flex-1 pb-16 overflow-y-auto">
                    {activeScreen === "screen-dashboard" && (
                      <DashboardView
                        currentUser={currentUser}
                        provOrg={provOrg}
                        gpsLatitude={gpsLatitude}
                        gpsLongitude={gpsLongitude}
                        getClosestSouthAfricanCity={getClosestSouthAfricanCity}
                        isGpsLoading={isGpsLoading}
                        simulateNewGps={handleSimulateNewGps}
                        myPairedHardware={myPairedHardware}
                        alerts={alerts}
                        offlineQueue={offlineQueue}
                        simulatedNetwork={simulatedNetwork}
                        onLogout={onLogout}
                        onInstantEmergency={triggerEmergency}
                        setGpsLatitude={setGpsLatitude}
                        setGpsLongitude={setGpsLongitude}
                        setActiveScreen={setActiveScreen}
                        batteryLevel={batteryLevel}
                      />
                    )}

                    {activeScreen === "screen-emergency" && (
                      <EmergencyView
                        currentUser={currentUser}
                        isHoldingSos={isHoldingSos}
                        holdProgress={holdProgress}
                        startSosHold={startSosHold}
                        cancelSosHold={cancelSosHold}
                        isDispatching={isDispatching}
                        dispatchStage={dispatchStage}
                        activeEmergencyType={activeEmergencyType}
                        simulatedNetwork={simulatedNetwork}
                        gpsLatitude={gpsLatitude}
                        gpsLongitude={gpsLongitude}
                        onInstantEmergency={triggerEmergency}
                      />
                    )}

                    {activeScreen === "screen-incidents" && (
                      <IncidentsView
                        currentUser={currentUser}
                        alerts={alerts}
                        offlineQueue={offlineQueue}
                        activeAlertEvents={activeAlertEvents}
                        getClosestSouthAfricanCity={getClosestSouthAfricanCity}
                        onResolveAlert={onResolveAlert}
                        refreshData={refreshData}
                        simulatedNetwork={simulatedNetwork}
                      />
                    )}

                    {activeScreen === "screen-responders" && <RespondersView />}

                    {activeScreen === "screen-evidence" && <EvidenceView />}

                    {activeScreen === "screen-contacts" && (
                      <ContactsView
                        contacts={contacts}
                        onAddContact={handleAddContact}
                        onDeleteContact={handleDeleteContact}
                      />
                    )}

                    {activeScreen === "screen-organizations" && (
                      <OrganizationsView
                        provOrg={provOrg}
                        organizations={organizations}
                        onAutoFillOrg={handleAutoFillOrg}
                      />
                    )}

                    {activeScreen === "screen-settings" && (
                      <SettingsView
                        widgetLayout={widgetLayout}
                        setWidgetLayout={setWidgetLayout}
                        isWidgetAdded={isWidgetAdded}
                        setIsWidgetAdded={setIsWidgetAdded}
                        currentUser={currentUser}
                        contacts={contacts}
                        onAddContact={handleAddContact}
                        onDeleteContact={handleDeleteContact}
                        showToast={showToast}
                        onSaveProfile={handleSaveProfile}
                      />
                    )}

                    {activeScreen === "screen-profile" && (
                      <ProfileView
                        currentUser={currentUser}
                        currentMedical={currentMedical}
                        onSaveProfile={handleSaveProfile}
                        onSaveMedical={handleSaveMedical}
                      />
                    )}

                    {activeScreen === "screen-ble-scanner" && currentUser && (
                      <BleScannerView
                        currentUser={currentUser}
                        hardware={hardware}
                        onAssignDevice={onAssignDevice}
                        onUnassignDevice={onUnassignDevice}
                        showToast={showToast}
                        refreshData={refreshData}
                      />
                    )}
                  </div>

                  {/* Material Design 3 Bottom Navigation bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 px-3 py-1 flex justify-around items-center z-40 shrink-0">
                    <button
                      onClick={() => {
                        setIsDispatching(false); // Stop progress view if manual navigate
                        setActiveScreen("screen-dashboard");
                      }}
                      className={`flex flex-col items-center justify-center p-1.5 transition active:scale-95 cursor-pointer ${
                        activeScreen === "screen-dashboard" ? "text-rose-500" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <LayoutGrid className="w-4.5 h-4.5" />
                      <span className="text-[7.5px] font-black uppercase mt-0.5 tracking-wider font-sans">Dash</span>
                    </button>

                    <button
                      onClick={() => setActiveScreen("screen-emergency")}
                      className={`flex flex-col items-center justify-center p-1.5 transition active:scale-95 cursor-pointer ${
                        activeScreen === "screen-emergency" ? "text-rose-500" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <AlertOctagon className="w-4.5 h-4.5" />
                      <span className="text-[7.5px] font-black uppercase mt-0.5 tracking-wider font-sans">Panic</span>
                    </button>

                    <button
                      onClick={() => setActiveScreen("screen-responders")}
                      className={`flex flex-col items-center justify-center p-1.5 transition active:scale-95 cursor-pointer ${
                        activeScreen === "screen-responders" ? "text-rose-500" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Radio className="w-4.5 h-4.5" />
                      <span className="text-[7.5px] font-black uppercase mt-0.5 tracking-wider font-sans">Radar</span>
                    </button>

                    {/* Modular Bento Launchpad Grid Hub tab */}
                    <button
                      onClick={() => {
                        // Toggle a 3x3 Bento Launcher screen replacing the central active area!
                        setActiveScreen(activeScreen === "screen-hub" ? "screen-dashboard" : "screen-hub");
                      }}
                      className={`flex flex-col items-center justify-center p-1.5 transition active:scale-95 cursor-pointer ${
                        activeScreen === "screen-hub" ? "text-rose-500" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Sliders className="w-4.5 h-4.5" />
                      <span className="text-[7.5px] font-black uppercase mt-0.5 tracking-wider font-sans">Hub</span>
                    </button>
                  </div>

                  {/* Screen Hub overlay (3x3 bento launcher with thumbnails) */}
                  {activeScreen === "screen-hub" && (
                    <div className="absolute inset-0 bg-slate-950/95 z-50 p-4 flex flex-col justify-between overflow-y-auto pb-16">
                      <div className="text-left mb-3">
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest font-mono">
                          SafetyLink Core Hub
                        </span>
                        <h4 className="text-sm font-extrabold text-white">System Applications</h4>
                      </div>

                      {/* 3x3 Grid Layout of Large Thumbnails */}
                      <div className="grid grid-cols-3 gap-2 flex-1 items-center justify-center">
                        {[
                          { id: "screen-dashboard", label: "Dashboard", desc: "Live status", icon: <LayoutGrid className="w-5 h-5 text-rose-500" /> },
                          { id: "screen-emergency", label: "Emergency", desc: "Tactical panic", icon: <AlertOctagon className="w-5 h-5 text-rose-500 animate-pulse" /> },
                          { id: "screen-incidents", label: "Incidents", desc: "Escalation logs", icon: <ClipboardList className="w-5 h-5 text-blue-400" /> },
                          { id: "screen-responders", label: "Responders", desc: "Sector map", icon: <Radio className="w-5 h-5 text-blue-500" /> },
                          { id: "screen-evidence", label: "Evidence", desc: "Encrypted vault", icon: <Shield className="w-5 h-5 text-emerald-400" /> },
                          { id: "screen-contacts", label: "Contacts", desc: "Cascade loops", icon: <Plus className="w-5 h-5 text-emerald-500" /> },
                          { id: "screen-organizations", label: "Organizations", desc: "Tenant isolation", icon: <Server className="w-5 h-5 text-amber-500" /> },
                          { id: "screen-settings", label: "Settings", desc: "Keystore lock", icon: <Settings className="w-5 h-5 text-slate-400" /> },
                          { id: "screen-profile", label: "Profile", desc: "Medical Rescue ID", icon: <Heart className="w-5 h-5 text-slate-300" /> },
                          { id: "screen-ble-scanner", label: "iTAG Scanner", desc: "BLE Pairing", icon: <Bluetooth className="w-5 h-5 text-blue-400" /> },
                        ].map((bento) => (
                          <button
                            key={bento.id}
                            onClick={() => setActiveScreen(bento.id)}
                            className="bg-slate-900 hover:bg-slate-850 p-2.5 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center transition active:scale-95 h-[76px] cursor-pointer"
                          >
                            <div className="mb-1">{bento.icon}</div>
                            <h5 className="text-[10px] font-extrabold text-slate-200 truncate leading-none w-full">
                              {bento.label}
                            </h5>
                            <span className="text-[7.5px] text-slate-500 font-semibold truncate leading-none mt-1 w-full">
                              {bento.desc}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-900 text-[8px] text-slate-500 flex justify-between font-mono">
                        <span>CERT COMPLIANT: PoPIA / ICASA</span>
                        <span>NODE VERIFIED: STABLE</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE B: HOME SCREEN PANIC WIDGET SYSTEM */}
              {phoneMode === "home" && (
                <div className="flex-1 flex flex-col p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 font-sans justify-between text-left select-none h-full">
                  <div className="space-y-4">
                    {/* Time & Area Widget */}
                    <div className="text-center py-4">
                      <span className="text-3xl font-light tracking-tight text-white/95">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mt-1 font-bold">
                        {getClosestSouthAfricanCity(gpsLatitude, gpsLongitude)}
                      </p>
                    </div>

                    {/* Integrated Configured Home Screen Widget */}
                    {isWidgetAdded ? (
                      <HomeScreenWidget
                        widgetLayout={widgetLayout}
                        isHoldingWidget={isHoldingWidget}
                        widgetHoldProgress={widgetHoldProgress}
                        onWidgetHoldStart={onWidgetHoldStart}
                        onWidgetHoldEnd={onWidgetHoldEnd}
                        onInstantTrigger={triggerEmergency}
                      />
                    ) : (
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center space-y-2">
                        <LayoutGrid className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold text-slate-300">No active widgets deployed</h4>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                          Pin the big circle panic button widget on your home screen by enabling it in Settings &gt; Android Widget API.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mock launcher dock */}
                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-3 flex justify-around items-center gap-2 shrink-0">
                    <button 
                      onClick={() => setPhoneMode("app")}
                      className="flex flex-col items-center justify-center gap-1 hover:opacity-85 cursor-pointer"
                    >
                      <div className="w-11 h-11 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg border border-rose-500/30">
                        <Shield className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 font-sans uppercase tracking-wider">SafetyLink</span>
                    </button>

                    <button 
                      onClick={() => setPhoneMode("whatsapp")}
                      className="flex flex-col items-center justify-center gap-1 hover:opacity-85 cursor-pointer"
                    >
                      <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg border border-emerald-500/30">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 font-sans uppercase tracking-wider">WhatsApp</span>
                    </button>

                    <div className="flex flex-col items-center justify-center gap-1 opacity-30">
                      <div className="w-11 h-11 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Dialer</span>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1 opacity-30">
                      <div className="w-11 h-11 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Maps</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE C: SIMULATED WHATSAPP PEER TO PEER NOTIFICATION SYSTEM */}
              {phoneMode === "whatsapp" && (
                <WhatsAppView
                  contacts={contacts}
                  waMessages={waMessages}
                  setWaMessages={setWaMessages}
                />
              )}

              {/* MODE D: TECHNICAL TEST BENCH HARNESS */}
              {phoneMode === "validation" && (
                <ValidationHarnessView
                  isRunningTest={isRunningTest}
                  activeTestScenario={activeTestScenario}
                  testLog={testLog}
                  runValidationTest={handleRunValidationTest}
                />
              )}
            </div>
          )}
        </div>

        {/* Home gesture bar simulator */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-40"></div>
      </div>
    </div>
  );
}
