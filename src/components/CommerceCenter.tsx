import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { 
  X, 
  ShoppingCart, 
  Calculator, 
  FileText, 
  Shield, 
  Tag, 
  CreditCard, 
  Printer, 
  Download, 
  Check, 
  Building, 
  Users, 
  Info
} from 'lucide-react';

interface HardwareProduct {
  id: string;
  name: string;
  description: string;
  priceZAR: number;
  category: 'Wearable' | 'Relay' | 'BaseStation';
  icon: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceZAR: number;
  period: 'monthly' | 'annual';
  features: string[];
  setupFee?: number;
}

const HARDWARE_CATALOG: HardwareProduct[] = [
  { id: 'prod-cam-2pack', name: '2-Pack Wireless WiFi Cameras', description: 'Dual-view system for small apartments and indoor monitoring.', priceZAR: 950, category: 'BaseStation', icon: '📹' },
  { id: 'prod-cam-4pack', name: '4-Pack Wireless WiFi Cameras', description: 'Perimeter package for full residential properties or small businesses.', priceZAR: 1650, category: 'BaseStation', icon: '📹' },
  { id: 'prod-pulse', name: 'RFD BLE Beacon (SafetyLink Pulse)', description: 'Long-range safety beacon for personal distress tracking.', priceZAR: 450, category: 'Wearable', icon: '🔘' },
  { id: 'prod-doorlock', name: 'Smart Fingerprint Door Lock', description: 'Smart access control lock with fingerprint and remote access.', priceZAR: 1150, category: 'BaseStation', icon: '🔒' },
  { id: 'prod-elderly-watch', name: 'Elderly SOS Watch GPS Tracking Wristband', description: 'GPS tracking watch with emergency SOS button.', priceZAR: 850, category: 'Wearable', icon: '⌚' },
  { id: 'prod-gps-tracker', name: 'GPS Smart Tracker Anti-Loss Device (Bluetooth)', description: 'Bluetooth anti-loss device for keys and personal items.', priceZAR: 220, category: 'Wearable', icon: '📍' },
  { id: 'prod-smart-ring', name: 'Smart Ring Set (Includes Zikr Ring & 99 Beads)', description: 'Discreet smart ring for subtle emergency triggering.', priceZAR: 150, category: 'Wearable', icon: '💍' },
  { id: 'prod-2day-cam', name: '2 Days Security Camera System Kit (4 Channel 1080p)', description: 'Complete 4-channel security camera kit.', priceZAR: 2650, category: 'BaseStation', icon: '📹' },
  { id: 'prod-hikvision', name: 'Hikvision Original CCTV Camera (Mini Bullet)', description: 'High-quality mini bullet CCTV camera by Hikvision.', priceZAR: 2950, category: 'BaseStation', icon: '📹' },
  { id: 'prod-wifi-cam', name: 'Security Wi-Fi Camera Night Vision (360° View)', description: '360° view Wi-Fi camera with night vision.', priceZAR: 380, category: 'BaseStation', icon: '📹' },
  { id: 'prod-mobile-dvr', name: 'Mobile DVR (4G, GPS, WiFi, AI)', description: 'Mobile digital video recorder with 4G and GPS capabilities.', priceZAR: 1950, category: 'BaseStation', icon: '📼' },
  { id: 'prod-dash-cam', name: 'Dash Cam X30 (GPS Video Driving Recorder)', description: 'Dash camera for driving recording and GPS tracking.', priceZAR: 1050, category: 'Wearable', icon: '🚗' },
  { id: 'prod-cam-detector', name: 'Smart Hidden Camera Detector', description: 'Detector for finding hidden cameras and listening devices.', priceZAR: 280, category: 'Wearable', icon: '🔍' },
  { id: 'prod-power-station', name: 'S81MAX Portable Power Station (120W, 30000mAh)', description: 'Portable power station for backup power.', priceZAR: 490, category: 'BaseStation', icon: '🔋' },
  { id: 'prod-remote-switch', name: 'Wireless Remote Control Switch (DC 85V-256V 30A)', description: 'Wireless remote control switch for power automation.', priceZAR: 300, category: 'BaseStation', icon: '🔌' },
  { id: 'prod-solar-alarm', name: 'Solar Motion Sensor Alarm (No Wires)', description: 'Solar-powered motion sensor alarm.', priceZAR: 320, category: 'BaseStation', icon: '☀️' },
  { id: 'prod-lamp-holder', name: 'Human Infrared Sensing Lamp Holder', description: 'Lamp holder with human infrared sensing.', priceZAR: 95, category: 'BaseStation', icon: '💡' },
  { id: 'prod-guard-tour', name: 'RFID Security Patrol Guard Tour System', description: 'RFID guard tour system for security patrols.', priceZAR: 3850, category: 'Relay', icon: '👮' },
  { id: 'prod-molle-jacket', name: 'Tactical Protective Molle Jacket', description: 'Tactical protective jacket for security personnel.', priceZAR: 2900, category: 'Wearable', icon: '🦺' },
  { id: 'prod-pepper-spray', name: 'Maximum Strength Pepper Spray (with UV Dye)', description: 'Maximum strength pepper spray with UV marking dye.', priceZAR: 110, category: 'Wearable', icon: '🌶️' },
  { id: 'prod-safes', name: 'Steel Mechanical/Digital Security Safes', description: 'Mechanical/digital security safe for valuables.', priceZAR: 650, category: 'BaseStation', icon: '🛡️' },
  { id: 'prod-drone-xj3', name: 'XJ3 Brushless Motor RC Drone (with HD Camera)', description: 'Brushless motor RC drone with HD camera.', priceZAR: 1600, category: 'Relay', icon: '🚁' },
  { id: 'prod-drone-shooting', name: 'Shooting Drone (4K Dual Camera, Optical Flow)', description: '4K dual camera drone with optical flow positioning.', priceZAR: 1350, category: 'Relay', icon: '🚁' },
  {
    id: 'prod-itag',
    name: 'SafetyLink Bluetooth iTag Smart Button',
    description: 'Ultra-lightweight micro BLE panic key. Double-press emergency binding with 12-month lithium battery.',
    priceZAR: 249,
    category: 'Wearable',
    icon: '🔘'
  },
  {
    id: 'prod-wrist',
    name: 'Tactical Distress Wristband (Waterproof)',
    description: 'Industrial-grade silicone wrist strap with embedded RF mesh and long-range BLE active distress transmitter.',
    priceZAR: 399,
    category: 'Wearable',
    icon: '⌚'
  },
  {
    id: 'prod-patrol',
    name: 'Vehicle Patrol Mesh Node Relay (SA-Power)',
    description: 'High-gain multi-hop repeater for patrol cars. Re-transmits offline panic alerts up to 800m.',
    priceZAR: 1899,
    category: 'Relay',
    icon: '📡'
  },
  {
    id: 'prod-siren',
    name: 'Strobe Alarm & High-Intensity Siren Node',
    description: 'Siren emitting 120dB distress sound. Triggers automatically on local BLE mesh SOS commands.',
    priceZAR: 1250,
    category: 'BaseStation',
    icon: '🚨'
  }
];

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pkg-2cam',
    name: '2-Camera Dual-View Package',
    description: 'Best for small apartments, single-story entryways, or indoor monitoring.',
    priceZAR: 99,
    period: 'monthly',
    setupFee: 1450,
    features: [
      '1× 2-Pack Wireless PTZ WiFi Cameras',
      'Hardware delivery + basic technician installation',
      'Cloud loop recording storage',
      'Real-time human-detection alerts'
    ]
  },
  {
    id: 'pkg-4cam',
    name: '4-Camera Perimeter Package',
    description: 'Best for full standalone residential properties or small business premises.',
    priceZAR: 149,
    period: 'monthly',
    setupFee: 2450,
    features: [
      '1× 4-Pack Wireless PTZ WiFi Cameras',
      'Hardware delivery + full multi-angle exterior installation',
      'Multi-stream cloud vault storage',
      'Advanced boundary zoning'
    ]
  },
  {
    id: 'pkg-ecosystem-res',
    name: 'The Full SafetyLink Ecosystem (Residential)',
    description: 'Fully monitored tier syncing video surveillance, smart access, and panic triggers.',
    priceZAR: 299,
    period: 'monthly',
    setupFee: 3950,
    features: [
      '1× 4-Pack Wireless WiFi Cameras',
      '1× Smart Fingerprint Door Lock',
      '2× SafetyLink Pulse BLE Panic Beacons',
      'Advanced setup & local mapping',
      'Live sensor cloud monitoring'
    ]
  },
  {
    id: 'pkg-ecosystem-com',
    name: 'The Full SafetyLink Ecosystem (Commercial)',
    description: 'Fully monitored tier syncing video surveillance, smart access, and panic triggers.',
    priceZAR: 449,
    period: 'monthly',
    setupFee: 3950,
    features: [
      '1× 4-Pack Wireless WiFi Cameras',
      '1× Smart Fingerprint Door Lock',
      '2× SafetyLink Pulse BLE Panic Beacons',
      'Advanced setup & local mapping',
      'Live sensor cloud monitoring',
      'Priority network failover'
    ]
  },
  {
    id: 'sub-indiv',
    name: 'Individual Safety Mesh',
    description: 'For active citizens, scholars, and daily commuters.',
    priceZAR: 49,
    period: 'monthly',
    features: [
      'Offline Cellular Sequential SMS',
      'Local BLE iTag Wearable Binding',
      'ThingsBoard Cloud Telemetry Sync',
      'K\'lev.ai Smart Assistant Access'
    ]
  },
  {
    id: 'sub-family',
    name: 'Family Circle Mesh (5 Users)',
    description: 'Subsidized safety network for household escalation.',
    priceZAR: 149,
    period: 'monthly',
    features: [
      'Up to 5 Family Member Accounts',
      'Shared Panic Signal Escalation Chain',
      'Geofenced Mutual Safe-Zone Alerts',
      'Offline SQLite Queue Synchronization'
    ]
  },
  {
    id: 'sub-campus',
    name: 'School & Campus Security Link',
    description: 'Enterprise integration for educational rosters.',
    priceZAR: 1250,
    period: 'monthly',
    features: [
      'Unlimited Student Profile Sync',
      'Safety Node Commander Deck Access',
      'Wits/University Control Room Integration',
      'Auto-generated Org Registration Codes'
    ]
  },
  {
    id: 'sub-patrol',
    name: 'Private Security Patrol & Armed Dispatch',
    description: 'Maximum tactical security coverage with automated calls.',
    priceZAR: 2499,
    period: 'monthly',
    features: [
      'Dedicated Twilio Gateway & Voice calls',
      'Commander Real-time GIS Patrol Map',
      'Control Room Call Trigger Automation',
      'SLA tracking and guard telemetry logs'
    ]
  }
];

export const CommerceCenter: React.FC = () => {
  const { commerceModalOpen, setCommerceModalOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<'shop' | 'calc' | 'invoice'>('shop');
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Calculator States
  const [calcSubscribers, setCalcSubscribers] = useState(50);
  const [calcGuards, setCalcGuards] = useState(5);
  const [calcBeacons, setCalcBeacons] = useState(30);
  const [calcPlanId, setCalcPlanId] = useState('sub-campus');
  const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);

  const handleAddToCart = (id: string) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleRemoveOne = (id: string) => {
    setCart(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const clearCart = () => setCart({});

  // Calculations
  const getCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const prod = HARDWARE_CATALOG.find(p => p.id === id);
      if (prod) {
        total += prod.priceZAR * qty;
      }
    });
    return total;
  };

  const getCalculatorTotals = () => {
    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === calcPlanId) || SUBSCRIPTION_PLANS[2];
    const licenseCost = selectedPlan.priceZAR;
    const setupCost = selectedPlan.setupFee || 0;
    
    // Custom calculation rules
    const subscriberSurcharge = Math.max(0, calcSubscribers - 10) * 12; // R12 per user over 10
    const guardLicenseSurcharge = calcGuards * 150; // R150 per armed response officer/guard
    const beaconHardwareCost = calcBeacons * 249; // R249 per physical BLE button

    const subtotal = licenseCost + setupCost + subscriberSurcharge + guardLicenseSurcharge + beaconHardwareCost;
    const vat = subtotal * 0.15; // South African VAT is 15%
    const total = subtotal + vat;

    return {
      licenseCost,
      subscriberSurcharge,
      guardLicenseSurcharge,
      beaconHardwareCost,
      subtotal,
      vat,
      total
    };
  };

  const calcResults = getCalculatorTotals();
  const selectedPlanObj = SUBSCRIPTION_PLANS.find(p => p.id === calcPlanId) || SUBSCRIPTION_PLANS[2];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    setInvoiceDownloaded(true);
    setTimeout(() => setInvoiceDownloaded(false), 3000);

    const invoiceContent = `
========================================
TAX INVOICE - SAFETYLINK CORE PLATFORM
========================================
Invoice No: INV-2026-SL${Math.floor(1000 + Math.random() * 9000)}
Date: 2026-07-11
Due Date: 2026-07-25
VAT Number: 4920281048 (SafetyLink SA Pty Ltd)

CLIENT WORKSPACE SUMMARY:
- Target Subscription Plan: ${selectedPlanObj.name} (R${selectedPlanObj.priceZAR}/mo)
- Active Subscriber Licenses: ${calcSubscribers}
- Patrol Guard Terminals: ${calcGuards}
- Bound Hardware Beacon Tags: ${calcBeacons}

BILLING MATRIX (ZAR):
----------------------------------------
Base License:             R ${calcResults.licenseCost.toFixed(2)}
Subscriber Surcharges:    R ${calcResults.subscriberSurcharge.toFixed(2)}
Guard Operations License: R ${calcResults.guardLicenseSurcharge.toFixed(2)}
Hardware BLE Beacons:     R ${calcResults.beaconHardwareCost.toFixed(2)}
----------------------------------------
SUBTOTAL (Excl. VAT):     R ${calcResults.subtotal.toFixed(2)}
VAT (15%):                R ${calcResults.vat.toFixed(2)}
----------------------------------------
TOTAL AMOUNT DUE:         R ${calcResults.total.toFixed(2)}
========================================
Thank you for securing your community with SafetyLink.
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safetylink_tax_invoice_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <AnimatePresence>
        {commerceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-blue-950/20 text-slate-100 font-sans my-8"
              id="commerce-center-modal"
            >
              {/* Header Accent Bar */}
              <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              {/* Close button */}
              <button 
                onClick={() => setCommerceModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer z-10"
                id="close-commerce-modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8">
                {/* Header branding */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black tracking-widest text-blue-400 uppercase bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900">
                          PLATFORM COMMERCE CENTER
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-xs text-slate-400 font-mono">SA-Pty Ltd Authorized</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-mono font-black text-white tracking-tight mt-1">
                        SafetyLink Tactical Commerce Portal
                      </h2>
                    </div>
                  </div>

                  {/* Sub-tabs selector */}
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab('shop')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'shop' 
                          ? 'bg-blue-600 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Product Store</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('calc')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'calc' 
                          ? 'bg-blue-600 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Quote Estimator</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('invoice')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'invoice' 
                          ? 'bg-blue-600 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tax Invoice</span>
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: PRODUCT STORE */}
                {activeTab === 'shop' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Catalog */}
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
                          1. Hardware & Mesh Nodes (Once-off purchase)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {HARDWARE_CATALOG.map(prod => (
                            <div key={prod.id} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl">{prod.icon}</span>
                                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                    {prod.category}
                                  </span>
                                </div>
                                <h4 className="text-sm font-mono font-bold text-slate-200 leading-snug">{prod.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{prod.description}</p>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900/60">
                                <span className="text-sm font-mono font-black text-blue-400">R {prod.priceZAR.toLocaleString()}</span>
                                <button
                                  onClick={() => handleAddToCart(prod.id)}
                                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                                >
                                  + Add to Quote
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
                          2. Subscriber Plans (Recurring monthly)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {SUBSCRIPTION_PLANS.map(plan => (
                            <div key={plan.id} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-mono font-bold text-slate-200">{plan.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-1">{plan.description}</p>
                                <ul className="mt-3 space-y-1 text-[10px] text-slate-400 font-mono">
                                  {plan.features.slice(0, 3).map((f, i) => (
                                    <li key={i} className="flex items-center gap-1.5">
                                      <span className="text-blue-500">✓</span>
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900/60">
                                <div className="font-mono">
                                  <span className="text-sm font-black text-blue-400">R {plan.priceZAR.toLocaleString()}</span>
                                  <span className="text-[10px] text-slate-500">/mo</span>
                                </div>
                                {plan.setupFee && <div className="text-[10px] text-slate-400 mt-1">Setup: R {plan.setupFee.toLocaleString()}</div>}
                                <button
                                  onClick={() => {
                                    setActiveTab('calc');
                                    setCalcPlanId(plan.id);
                                  }}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-mono font-bold text-slate-300 transition-all cursor-pointer"
                                >
                                  Configure in Quotes
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cart / Invoice Summary Panel */}
                    <div className="p-5 bg-slate-950/60 rounded-3xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                          <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-blue-400" />
                            <span>Hardware Quotation</span>
                          </h3>
                          {Object.keys(cart).length > 0 && (
                            <button onClick={clearCart} className="text-[10px] text-red-500 font-bold hover:underline font-mono uppercase">
                              Clear
                            </button>
                          )}
                        </div>

                        {Object.keys(cart).length === 0 ? (
                          <div className="text-center py-12">
                            <span className="text-3xl block mb-2">🛒</span>
                            <p className="text-xs text-slate-500 font-mono">Hardware list is empty.</p>
                            <p className="text-[11px] text-slate-600 mt-1">Add devices from the catalog to generate a quote.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {Object.entries(cart).map(([id, qty]) => {
                              const prod = HARDWARE_CATALOG.find(p => p.id === id);
                              if (!prod) return null;
                              return (
                                <div key={id} className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-xs font-mono font-bold text-slate-200 truncate">{prod.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">R {prod.priceZAR} each</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleRemoveOne(id)}
                                      className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-mono font-bold text-slate-200 w-4 text-center">{qty}</span>
                                    <button 
                                      onClick={() => handleAddToCart(id)}
                                      className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {Object.keys(cart).length > 0 && (
                        <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
                          <div className="space-y-1.5 font-mono text-xs text-slate-400">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>R {getCartTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>VAT (15%):</span>
                              <span>R {(getCartTotal() * 0.15).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-200 font-bold border-t border-slate-900 pt-1.5 text-sm">
                              <span>Total Quote:</span>
                              <span className="text-blue-400">R {(getCartTotal() * 1.15).toFixed(2)}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              // Transfer hardware count to the main quote calculator
                              let totalBeacons = 0;
                              Object.entries(cart).forEach(([id, qty]) => {
                                if (id === 'prod-itag' || id === 'prod-wrist') {
                                  totalBeacons += qty;
                                }
                              });
                              if (totalBeacons > 0) {
                                setCalcBeacons(totalBeacons);
                              }
                              setActiveTab('calc');
                            }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-colors cursor-pointer"
                          >
                            Proceed to Quote Calculator
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: QUOTATION CALCULATOR */}
                {activeTab === 'calc' && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Input sliders */}
                    <div className="lg:col-span-3 space-y-6">
                      <div className="p-5 bg-slate-950/40 rounded-3xl border border-slate-800">
                        <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          <span>1. Select Subscription Tier</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {SUBSCRIPTION_PLANS.map(plan => (
                            <label 
                              key={plan.id}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                calcPlanId === plan.id 
                                  ? 'bg-blue-950/30 border-blue-500/80 shadow' 
                                  : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="calcPlan" 
                                checked={calcPlanId === plan.id}
                                onChange={() => setCalcPlanId(plan.id)}
                                className="mt-1"
                              />
                              <div>
                                <span className="block text-xs font-mono font-bold text-slate-200">{plan.name}</span>
                                <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">{plan.description}</span>
                                <span className="block text-xs font-mono font-extrabold text-blue-400 mt-1.5">R {plan.priceZAR} /mo {plan.setupFee && `+ R ${plan.setupFee} setup`}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* SLA Resource Scales */}
                      <div className="p-5 bg-slate-950/40 rounded-3xl border border-slate-800 space-y-5">
                        <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span>2. Service Resources & Scalability</span>
                        </h3>

                        {/* Subscribers scale */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">End-User Subscriber Accounts:</span>
                            <span className="text-blue-400 font-bold">{calcSubscribers} Licenses</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="1" 
                              max="1000" 
                              value={calcSubscribers} 
                              onChange={e => setCalcSubscribers(parseInt(e.target.value))}
                              className="flex-1 accent-blue-500"
                            />
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={calcSubscribers}
                              onChange={e => setCalcSubscribers(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 text-center font-mono"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal pl-1">R12 per user per month over the standard package baseline (10 included free).</p>
                        </div>

                        {/* Response Officers */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Patrol Guards & Armed Responders:</span>
                            <span className="text-blue-400 font-bold">{calcGuards} Officers</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="50" 
                              value={calcGuards} 
                              onChange={e => setCalcGuards(parseInt(e.target.value))}
                              className="flex-1 accent-blue-500"
                            />
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={calcGuards}
                              onChange={e => setCalcGuards(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 text-center font-mono"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal pl-1">R150 per guard terminal registration. Unlocks live GPS telemetry & GIS dispatch cards.</p>
                        </div>

                        {/* Physical Wearable Beacons */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Physical BLE iTags / Wristbands:</span>
                            <span className="text-blue-400 font-bold">{calcBeacons} Beacons</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="200" 
                              value={calcBeacons} 
                              onChange={e => setCalcBeacons(parseInt(e.target.value))}
                              className="flex-1 accent-blue-500"
                            />
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={calcBeacons}
                              onChange={e => setCalcBeacons(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 text-center font-mono"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal pl-1">Once-off payment of R249 per beacon. Bound directly to student/resident phone relays.</p>
                        </div>
                      </div>
                    </div>

                    {/* Cost breakdown & Proceed */}
                    <div className="lg:col-span-2 p-5 bg-slate-950/60 rounded-3xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <span>Estimated Cost Breakdown</span>
                        </h3>

                        <div className="space-y-3.5 font-mono text-xs">
                          <div className="flex justify-between border-b border-slate-900 pb-2">
                            <span className="text-slate-400">Base Tier ({selectedPlanObj.name}):</span>
                            <span className="text-slate-200">R {calcResults.licenseCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-2">
                            <span className="text-slate-400">User Licenses ({calcSubscribers} active):</span>
                            <span className="text-slate-200">R {calcResults.subscriberSurcharge.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-2">
                            <span className="text-slate-400">Guard Terminals ({calcGuards} active):</span>
                            <span className="text-slate-200">R {calcResults.guardLicenseSurcharge.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-2">
                            <span className="text-slate-400">BLE Beacon Hardware ({calcBeacons} units):</span>
                            <span className="text-slate-200">R {calcResults.beaconHardwareCost.toFixed(2)}</span>
                          </div>

                          <div className="space-y-1.5 pt-2 text-slate-300">
                            <div className="flex justify-between font-bold text-slate-200">
                              <span>SUBTOTAL (Excl. VAT):</span>
                              <span>R {calcResults.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>South African VAT (15%):</span>
                              <span>R {calcResults.vat.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-black text-white border-t-2 border-dashed border-slate-800 pt-3">
                              <span>GRAND TOTAL:</span>
                              <span className="text-blue-400">R {calcResults.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 mt-6">
                        <button
                          onClick={() => setActiveTab('invoice')}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Generate Tax Invoice</span>
                        </button>
                        <span className="text-[9px] text-slate-500 text-center block mt-2 font-mono">Invoice matches standard South African SARS Tax invoice formats.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: TAX INVOICE */}
                {activeTab === 'invoice' && (
                  <div className="space-y-6">
                    {/* Invoice View */}
                    <div className="p-6 md:p-8 bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-xl max-w-3xl mx-auto font-mono text-xs relative overflow-hidden" id="tax-invoice-printable">
                      
                      {/* Diagonal watermark for demo safety */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 text-slate-100 text-6xl font-black select-none pointer-events-none uppercase tracking-widest">
                        Official SafetyLink
                      </div>

                      <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-6">
                        <div>
                          <h4 className="text-xl font-black text-slate-950">SAFETYLINK CO. SECURITY</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                            Reg: 2024/091840/07<br />
                            VAT Reg No: 4920281048<br />
                            Johannesburg, South Africa<br />
                            billing@safetylink.co.za
                          </p>
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-black text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block border border-indigo-200">
                            TAX INVOICE
                          </h3>
                          <p className="text-[10px] text-slate-600 mt-2">
                            Invoice No: <span className="font-bold text-slate-900">INV-2026-SL{Math.floor(1000 + Math.random() * 9000)}</span><br />
                            Date: 2026-07-11<br />
                            Due Date: 2026-07-25 (Net 14)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Billed To:</span>
                          <p className="font-bold text-slate-900 leading-normal">
                            SafetyLink Registered Node Partner<br />
                            <span className="font-normal text-slate-600">
                              Selected Subscription: {selectedPlanObj.name}<br />
                              Subscriber Base: {calcSubscribers} Users<br />
                              Responders Bound: {calcGuards} Officers
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Payment Method:</span>
                          <p className="text-slate-800 leading-relaxed font-sans text-[11px]">
                            <strong className="font-mono text-xs">Direct EFT Transfer</strong><br />
                            Bank: First National Bank (FNB)<br />
                            Branch Code: 250655<br />
                            Account: 62901840281
                          </p>
                        </div>
                      </div>

                      <table className="w-full text-left mb-6 font-mono text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-400 text-slate-600">
                            <th className="pb-2 font-bold uppercase">Item Description</th>
                            <th className="pb-2 text-right font-bold uppercase">Qty</th>
                            <th className="pb-2 text-right font-bold uppercase">Rate (ZAR)</th>
                            <th className="pb-2 text-right font-bold uppercase">Total (ZAR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          <tr>
                            <td className="py-2.5 font-bold text-slate-900">
                              {selectedPlanObj.name} - Platform Tier License
                              <span className="block text-[9px] font-normal text-slate-500 mt-0.5">{selectedPlanObj.description}</span>
                            </td>
                            <td className="py-2.5 text-right">1</td>
                            <td className="py-2.5 text-right">R {calcResults.licenseCost.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-bold">R {calcResults.licenseCost.toFixed(2)}</td>
                          </tr>
                          {selectedPlanObj?.setupFee && (
                            <tr>
                              <td className="py-2.5">
                                Upfront Setup & Installation Fee
                                <span className="block text-[9px] text-slate-500 mt-0.5">Hardware delivery + technician installation</span>
                              </td>
                              <td className="py-2.5 text-right">1</td>
                              <td className="py-2.5 text-right">R {selectedPlanObj.setupFee.toFixed(2)}</td>
                              <td className="py-2.5 text-right font-bold">R {selectedPlanObj.setupFee.toFixed(2)}</td>
                            </tr>
                          )}
                          {calcSubscribers > 10 && (
                            <tr>
                              <td className="py-2.5">
                                End-User Active License Surcharges
                                <span className="block text-[9px] text-slate-500 mt-0.5">Charge for subscribers exceeding free baseline limit of 10 users</span>
                              </td>
                              <td className="py-2.5 text-right">{calcSubscribers - 10}</td>
                              <td className="py-2.5 text-right">R 12.00</td>
                              <td className="py-2.5 text-right font-bold">R {calcResults.subscriberSurcharge.toFixed(2)}</td>
                            </tr>
                          )}
                          {calcGuards > 0 && (
                            <tr>
                              <td className="py-2.5">
                                Patrol Responder/Guard Terminals
                                <span className="block text-[9px] text-slate-500 mt-0.5">Live GIS positioning tracking and dispatch console terminals</span>
                              </td>
                              <td className="py-2.5 text-right">{calcGuards}</td>
                              <td className="py-2.5 text-right">R 150.00</td>
                              <td className="py-2.5 text-right font-bold">R {calcResults.guardLicenseSurcharge.toFixed(2)}</td>
                            </tr>
                          )}
                          {calcBeacons > 0 && (
                            <tr>
                              <td className="py-2.5">
                                Physical BLE iTag Hardware Beacons
                                <span className="block text-[9px] text-slate-500 mt-0.5">Waterproof portable Bluetooth triggers pre-bonded to network</span>
                              </td>
                              <td className="py-2.5 text-right">{calcBeacons}</td>
                              <td className="py-2.5 text-right">R 249.00</td>
                              <td className="py-2.5 text-right font-bold">R {calcResults.beaconHardwareCost.toFixed(2)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="flex justify-between items-start border-t border-slate-300 pt-4">
                        <div className="w-1/2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                            <Info className="w-3 h-3 text-indigo-500" />
                            <span>Declarations & Terms:</span>
                          </span>
                          <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                            All values specified are subject to South African Revenue Service (SARS) regulatory guidelines. 15% VAT has been applied strictly to all lines above. Remit EFT payment within 14 days of issue to maintain telemetry operations.
                          </p>
                        </div>
                        <div className="w-1/3 text-right space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal (Ex. VAT):</span>
                            <span className="text-slate-800 font-bold">R {calcResults.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>VAT (15%):</span>
                            <span>R {calcResults.vat.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-300 pt-2">
                            <span>Total Due (ZAR):</span>
                            <span className="text-indigo-900">R {calcResults.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                      <button
                        onClick={handleDownloadInvoice}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow"
                      >
                        {invoiceDownloaded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Downloaded!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Invoice .TXT</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-slate-700"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Invoice</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('calc')}
                        className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-mono text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-slate-800"
                      >
                        Back to Quote Calculator
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
