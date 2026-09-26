import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { useAppStore } from '../utils/store';

interface AppTourProps {
  onClose: (neverShowAgain: boolean) => void;
}

interface TourStep {
  title: string | React.ReactNode;
  badge: string;
  emoji: string;
  description: string;
}

export const AppTour: React.FC<AppTourProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  // Hook into the live application store to make this an active setup wizard!
  const { 
    drillMode, 
    toggleDrillMode, 
    contacts, 
    updateContact, 
    addToast,
    registerDiscoveredDevice
  } = useAppStore();

  // Local states for interactive wizard prompts
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [botAnswer, setBotAnswer] = useState<string | null>(null);
  const [botLoading, setBotLoading] = useState(false);
  const [fobsDiscovered, setFobsDiscovered] = useState<boolean>(false);
  const [fobPaired, setFobPaired] = useState<boolean>(false);
  const [countdownDelay, setCountdownDelay] = useState<number>(10);

  // Sync initial phone from store contact ID '1' (Tactical Voice Dispatch)
  useEffect(() => {
    const primaryContact = contacts.find(c => c.id === '1');
    if (primaryContact) {
      setPrimaryPhone(primaryContact.phone);
    }
  }, [contacts]);

  // Sync countdown delay from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem('sl_widget_countdown_delay');
    if (saved) {
      setCountdownDelay(parseInt(saved, 10));
    }
  }, []);

  const handlePhoneChange = (newVal: string) => {
    setPrimaryPhone(newVal);
    updateContact('1', { phone: newVal });
  };

  const handleCountdownSelect = (sec: number) => {
    setCountdownDelay(sec);
    localStorage.setItem('sl_widget_countdown_delay', sec.toString());
    addToast(`SOS countdown set to ${sec}s for widgets`, 'success');
  };

  const handlePairFobSim = () => {
    setFobPaired(true);
    // Register to store so they can see it in their main app state
    registerDiscoveredDevice('00:1A:7D:DA:71:11', 'iTAG Distress Fob (Tour Demo)', 'iTAG');
    addToast('Simulated BLE Keyfob successfully paired!', 'success');
  };

  const handleBotQuery = (queryType: string) => {
    setBotLoading(true);
    setBotAnswer(null);
    setTimeout(() => {
      setBotLoading(false);
      if (queryType === 'STATUS') {
        setBotAnswer("🤖 K'leva: SafetyLink is operating securely in " + (drillMode ? "DRILL SIMULATION" : "LIVE SATELLITE DISPATCH") + " mode. Location is locked.");
      } else if (queryType === 'GPS') {
        setBotAnswer("🤖 K'leva: Your current coordinates translate to Wits Campus Sector, Johannesburg. Cellular mast signal is optimal.");
      } else if (queryType === 'DISARM') {
        setBotAnswer("🤖 K'leva: To disarm a running SOS panic sequence, double-tap the main red trigger button or click 'CANCEL BROADCAST' in the dashboard.");
      }
    }, 1200);
  };

  const steps: TourStep[] = [
    {
      emoji: '🛡️',
      badge: 'Step 1: Network Configuration',
      title: 'Active Operating Mode',
      description: 'Choose your desired operating profile. In Drill Mode, emergency dispatch is fully simulated safely. Live Mode connects to physical cellular gateways.',
    },
    {
      emoji: '📞',
      badge: 'Step 2: Emergency Routing',
      title: 'Configure Main Dispatch Channel',
      description: 'Your primary sequential dispatcher is enqueued first. Ensure your distress contact phone is valid for direct voice/SMS dispatch routing.',
    },
    {
      emoji: '🤖',
      badge: 'Step 3: AI Assistant Sandbox',
      title: "Interactive K'leva.info Bot",
      description: 'Experience South Africa’s local safety copilot. Test a fast query to see how immediate situational advice is delivered in distressing situations.',
    },
    {
      emoji: '📡',
      badge: 'Step 4: Wearable Setup',
      title: 'Register BLE Hardware Keyfob',
      description: 'Scan and bind inexpensive physical Bluetooth alert keyfobs. Our customized background GATT scanner reads signal presses instantly.',
    },
    {
      emoji: '📲',
      badge: 'Step 5: Android Ergonomics',
      title: 'Launcher Widget Countdown',
      description: 'SafetyLink provides high-impact Android widgets with dynamic safety windows. Configure your desired visual countdown delay below.',
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(neverShowAgain);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md carbon-panel rounded-3xl p-6.5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px] lens-flare-overlay my-auto animate-fade-in"
        >
          {/* Top glowing indicators */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500 opacity-80" />

          {/* Header branding */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
            <div className="scale-75 origin-left">
              <SafetyLinkLogo size={32} showText={false} />
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[8.5px] font-black tracking-widest text-slate-500 uppercase">
              <span>Setup Wizard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>{currentStep + 1} of {steps.length}</span>
            </div>
          </div>

          {/* Interactive Core Step Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-2">
            <motion.div
              key={`emoji-${currentStep}`}
              initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              className="w-18 h-18 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center text-3xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-2xl animate-pulse" />
              {step.emoji}
            </motion.div>

            <div className="space-y-1">
              {step.badge && (
                <span className="text-[8.5px] font-black font-mono bg-blue-950/40 border border-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {step.badge}
                </span>
              )}
              <h3 className="text-base font-black tracking-tight text-slate-100 font-mono pt-1.5">
                {step.title}
              </h3>
            </div>

            <p className="text-[11.5px] text-slate-400 leading-relaxed max-w-sm px-2">
              {step.description}
            </p>

            {/* DYNAMIC PROMPT INPUTS ACCORDING TO CURRENT STEP */}
            <div className="w-full pt-2 px-1 relative z-10">
              
              {/* STEP 0: Active Operating Mode selection */}
              {currentStep === 0 && (
                <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-900 rounded-2xl">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    ACTIVE OPERATIONAL PROFILE
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (!drillMode) toggleDrillMode();
                        addToast('Drill (Simulated) Mode enabled', 'info');
                      }}
                      className={`py-2 px-3 rounded-xl text-[10px] font-mono font-bold border transition-all flex flex-col items-center gap-1 ${
                        drillMode 
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-xs">🛡️ DRILL MODE</span>
                      <span className="text-[7.5px] opacity-80 uppercase font-black">Simulated Alerts</span>
                    </button>
                    <button
                      onClick={() => {
                        if (drillMode) toggleDrillMode();
                        addToast('LIVE GATEWAY DISPATCH ENFORCED', 'warn');
                      }}
                      className={`py-2 px-3 rounded-xl text-[10px] font-mono font-bold border transition-all flex flex-col items-center gap-1 ${
                        !drillMode 
                          ? 'bg-red-950/30 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]' 
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-xs">🚨 LIVE MODE</span>
                      <span className="text-[7.5px] opacity-80 uppercase font-black">Real Voice/SMS</span>
                    </button>
                  </div>
                  <p className="text-[7.5px] text-slate-500 leading-normal font-mono">
                    *We strongly recommend starting in <span className="text-emerald-400 font-bold">DRILL MODE</span> for offline sandbox walkthroughs.
                  </p>
                </div>
              )}

              {/* STEP 1: Main Call routing input */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-900 rounded-2xl text-left">
                  <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-0.5">
                    1st Priority Voice Dispatch Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={primaryPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+27..."
                      className="flex-1 bg-slate-950 border border-slate-850 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-700 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        addToast('Primary Contact successfully saved!', 'success');
                      }}
                      className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-mono font-bold uppercase transition-colors"
                    >
                      SAVE
                    </button>
                  </div>
                  <p className="text-[7.5px] text-slate-500 leading-normal font-mono">
                    *South African emergency dispatch standards prefer numbers utilizing +27 prefix layout.
                  </p>
                </div>
              )}

              {/* STEP 2: Intelligent Bot Query Sandbox */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Fast Sandbox AI Test Triggers
                  </span>
                  
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      onClick={() => handleBotQuery('STATUS')}
                      disabled={botLoading}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[8.5px] font-mono rounded"
                    >
                      📡 Check Security Status
                    </button>
                    <button
                      onClick={() => handleBotQuery('GPS')}
                      disabled={botLoading}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[8.5px] font-mono rounded"
                    >
                      📍 Translate GPS Location
                    </button>
                    <button
                      onClick={() => handleBotQuery('DISARM')}
                      disabled={botLoading}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[8.5px] font-mono rounded"
                    >
                      🛑 SOS Disarm Guide
                    </button>
                  </div>

                  {/* Simulated chatbot response panel */}
                  <div className="min-h-[50px] bg-slate-950/90 border border-slate-900/60 rounded-xl p-2.5 mt-1 font-mono text-[9px] flex items-center justify-center">
                    {botLoading ? (
                      <div className="flex items-center gap-1.5 text-slate-500 uppercase tracking-wider animate-pulse font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                        Analyzing situation...
                      </div>
                    ) : botAnswer ? (
                      <div className="text-slate-300 leading-normal">{botAnswer}</div>
                    ) : (
                      <span className="text-slate-600 uppercase text-center text-[8.5px]">Select a fast sandbox query above</span>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: BLE Discovery & Pairing Trigger */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-900 rounded-2xl">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest text-left block">
                    GATT Beacon Discovery
                  </span>
                  
                  {!fobsDiscovered && !fobPaired && (
                    <button
                      onClick={() => {
                        setBotLoading(true);
                        setTimeout(() => {
                          setBotLoading(false);
                          setFobsDiscovered(true);
                        }, 1200);
                      }}
                      className="w-full py-2 bg-blue-950/20 hover:bg-blue-950/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 text-[10px] font-mono font-bold rounded-xl uppercase transition-all tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {botLoading ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                          ARMING GATT SCANNER...
                        </>
                      ) : (
                        '🔍 ARM BLE DISCOVERY SCANNER'
                      )}
                    </button>
                  )}

                  {fobsDiscovered && !fobPaired && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-left animate-pulse">
                      <div className="flex flex-col">
                        <span className="text-slate-200 text-[10px] font-bold">Distress Fob 01 (iTAG)</span>
                        <span className="text-[8px] text-slate-500 font-mono">MAC: 00:1A:7D:DA:71:11 · -58dBm</span>
                      </div>
                      <button
                        onClick={handlePairFobSim}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-mono font-bold uppercase transition-colors"
                      >
                        PAIR DEVICE
                      </button>
                    </div>
                  )}

                  {fobPaired && (
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-center text-[10px] font-mono font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      ✓ ITAG BEACON BONDED SUCCESSFULLY
                    </div>
                  )}

                  <p className="text-[7.5px] text-slate-500 leading-normal text-left font-mono">
                    *Successfully paired keyfobs will appear in the main BleScanner board dashboard.
                  </p>
                </div>
              )}

              {/* STEP 4: Launcher Countdown configuration */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-2 p-3 bg-slate-950/80 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Launcher Widget Countdown Timer
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                    {[5, 10, 15].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleCountdownSelect(sec)}
                        className={`py-2 px-1 rounded-xl text-center font-mono transition-all border ${
                          countdownDelay === sec
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block text-xs font-black">{sec}s</span>
                        <span className="block text-[6.5px] uppercase opacity-75">Delay</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[7.5px] text-slate-500 leading-normal font-mono">
                    *Gives you exactly {countdownDelay} seconds to abort or disarm a trigger sequence before automatic sequentially broadcasts are fired.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Footer Controls & Persistence */}
          <div className="mt-6 border-t border-slate-900 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              {/* Skip / Never Show Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={neverShowAgain}
                  onChange={(e) => setNeverShowAgain(e.target.checked)}
                  className="rounded border-slate-900 bg-slate-950 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wide font-bold hover:text-slate-200">
                  Never show again
                </span>
              </label>

              {/* Progress Dots */}
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              {currentStep > 0 ? (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 text-xs font-mono font-bold rounded-xl uppercase transition-colors"
                >
                  Previous
                </button>
              ) : (
                <button
                  onClick={() => onClose(neverShowAgain)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-500 text-xs font-mono font-bold rounded-xl uppercase transition-colors"
                >
                  Skip Tour
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex-1 py-2.5 bg-blue-650 hover:bg-blue-650/90 text-white text-xs font-mono font-extrabold rounded-xl uppercase transition-all tracking-wide shadow-lg shadow-blue-950/40"
              >
                {currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
