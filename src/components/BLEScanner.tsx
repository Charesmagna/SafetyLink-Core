import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { BleDevice } from '../types';

// Hardcoded Master Key details matching the provided device images
const DEMO_TAG_MAC_ADDRESS = 'FF:FF:10:E4:9C:15';
const DEMO_TAG_COMPANY = 'Ubiquitous Computing Technology Corporation (0x01D5)';
const DEMO_TAG_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const DEMO_TAG_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

type BondingMethod = 'NONE' | 'MANUAL' | 'QR' | 'NFC' | 'DISCOVERY' | 'PRESS';

export const BLEScanner: React.FC = () => {
  const { 
    bleDevices, 
    pairingProgress, 
    disconnectBleDevice, 
    connectBleDevice, 
    removeDevice, 
    addBleDevice, 
    setPairingProgress 
  } = useAppStore();

  const [activeMethod, setActiveMethod] = useState<BondingMethod>('NONE');
  const [manualMac, setManualMac] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('iTAG');

  // Scanning simulation states
  const [qrScanning, setQrScanning] = useState(false);
  const [nfcTapping, setNfcTapping] = useState(false);
  const [radarScanning, setRadarScanning] = useState(false);
  const [pressListening, setPressListening] = useState(false);
  const [discoveredItems, setDiscoveredItems] = useState<any[]>([]);

  // Simulation handlers
  const handleSimulateClick = (mac: string, clickType: string) => {
    useAppStore.getState().addAuditLog('BLE', 'WARN', `Simulated [${clickType}] Click`, `MAC: ${mac}`);
    if (clickType === 'SINGLE' || clickType === 'TRIPLE') {
      useAppStore.getState().triggerPanic(`Silent alert triggered via wearable button ${clickType} press on device [${mac}].`);
    } else if (clickType === 'DOUBLE') {
      useAppStore.getState().cancelSOS();
    } else if (clickType === 'FALL') {
      useAppStore.getState().triggerPanic(`CRITICAL: Fall Impact detected by internal inertial G-Sensor on [${mac}].`);
    }
  };

  // Showcase Mode (Master Key Broadcast)
  const triggerShowcaseMasterKey = () => {
    useAppStore.getState().addAuditLog(
      'BLE', 
      'SEVERE', 
      'Showcase Master Key GATT Broadcast Intercepted', 
      `MAC: ${DEMO_TAG_MAC_ADDRESS} | Service: ${DEMO_TAG_SERVICE_UUID} | Characteristic: ${DEMO_TAG_CHAR_UUID} | Keypress: 0x01 | Company: ${DEMO_TAG_COMPANY}`
    );
    useAppStore.getState().triggerPanic(`SHOWCASE MASTER KEY: Remote SOS Broadcast active from iTAG Keyfob [${DEMO_TAG_MAC_ADDRESS}].`);
  };

  // 1. Manual Entry Handler
  const handleManualBond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMac) return;

    // Validate MAC Address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(manualMac)) {
      alert('Please enter a valid 12-character MAC Address format (e.g. FF:FF:10:E4:9C:15)');
      return;
    }

    const newDevice: BleDevice = {
      macAddress: manualMac.toUpperCase(),
      friendlyName: manualName || `Wearable ${manualType}`,
      deviceType: manualType as 'iTAG' | 'RFD_Beacon',
      batteryLevel: 100,
      rssi: -45,
      connectionState: 'CONNECTED',
      lastSeen: Date.now()
    };

    addBleDevice(newDevice);
    setManualMac('');
    setManualName('');
    setActiveMethod('NONE');
  };

  // 2. QR Code Simulated Scan Handler
  const startQrScannerSimulation = () => {
    setQrScanning(true);
    setPairingProgress('Initializing optical tracking matrix...');
    setTimeout(() => {
      setPairingProgress('Viewfinder focused. Searching for matrix code...');
    }, 1000);
    setTimeout(() => {
      setPairingProgress('Decoded UID: TAG-FF-FF-10-E4-9C-15. Resolving hardware profile...');
    }, 2500);
    setTimeout(() => {
      const newDevice: BleDevice = {
        macAddress: 'FF:FF:10:E4:9C:15',
        friendlyName: 'iTAG QR Bonded Keyfob',
        deviceType: 'iTAG',
        batteryLevel: 98,
        rssi: -48,
        connectionState: 'CONNECTED',
        lastSeen: Date.now()
      };
      addBleDevice(newDevice);
      setQrScanning(false);
      setPairingProgress(null);
      setActiveMethod('NONE');
    }, 4000);
  };

  // 3. NFC Tap-to-Pair Simulation Handler
  const startNfcTapSimulation = () => {
    setNfcTapping(true);
    setPairingProgress('Ready for NFC proximity trigger...');
    setTimeout(() => {
      setPairingProgress('Coupling electromagnetic payload. Reading NDEF sectors...');
    }, 1500);
    setTimeout(() => {
      const newDevice: BleDevice = {
        macAddress: '00:1A:7D:F1:C9:8A',
        friendlyName: 'NFC Secured SmartTag',
        deviceType: 'iTAG',
        batteryLevel: 100,
        rssi: -38,
        connectionState: 'CONNECTED',
        lastSeen: Date.now()
      };
      addBleDevice(newDevice);
      setNfcTapping(false);
      setPairingProgress(null);
      setActiveMethod('NONE');
    }, 3500);
  };

  // 4. Discovery Mode Simulation Handler
  const startDiscoverySimulation = () => {
    setRadarScanning(true);
    setDiscoveredItems([]);
    
    // Staggered discovery of nearby beacons
    setTimeout(() => {
      setDiscoveredItems(prev => [
        ...prev,
        { mac: '00:1A:7D:88:22:1F', name: 'iTAG Smart Button', rssi: -72, strength: 'Weak' }
      ]);
    }, 1000);

    setTimeout(() => {
      setDiscoveredItems(prev => [
        ...prev,
        { mac: 'FF:FF:10:E4:9C:15', name: 'iTAG Primary Core', rssi: -42, strength: 'Excellent (> -60dBm)' } // Prominent signal!
      ]);
    }, 2200);

    setTimeout(() => {
      setDiscoveredItems(prev => [
        ...prev,
        { mac: '00:1A:7D:6E:9A:8B', name: 'Generic SOS keyfob', rssi: -58, strength: 'Good (> -60dBm)' }
      ]);
    }, 3200);
  };

  const handleDiscoveryBond = (mac: string, name: string) => {
    const newDevice: BleDevice = {
      macAddress: mac,
      friendlyName: name,
      deviceType: 'iTAG',
      batteryLevel: 94,
      rssi: -45,
      connectionState: 'CONNECTED',
      lastSeen: Date.now()
    };
    addBleDevice(newDevice);
    setActiveMethod('NONE');
    setRadarScanning(false);
    setDiscoveredItems([]);
  };

  // 5. Press-to-Pair Simulation Handler
  const startPressToPairSimulation = () => {
    setPressListening(true);
    setPairingProgress('Awaiting keyfob FFE1 GATT notification packet...');
  };

  const simulatePhysicalPressButton = () => {
    setPairingProgress('HANDSHAKE COMPLETED: Received GATT 0xFFE1 [value: 01] click notification!');
    setTimeout(() => {
      const newDevice: BleDevice = {
        macAddress: 'FF:FF:10:E4:9C:15',
        friendlyName: 'Physical Paired Keyfob',
        deviceType: 'iTAG',
        batteryLevel: 91,
        rssi: -54,
        connectionState: 'CONNECTED',
        lastSeen: Date.now()
      };
      addBleDevice(newDevice);
      setPressListening(false);
      setPairingProgress(null);
      setActiveMethod('NONE');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 border border-slate-900/60 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />

      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-100 tracking-tight font-mono">
            WEARABLE BEACONS
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-mono">
            HST-01 Trackers & BLE Keyfobs
          </p>
        </div>
      </div>

      {/* SHOWCASE MODE (Master Key Broadcast) */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/80 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-4 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 border-l border-b border-indigo-500/20 text-[9px] font-mono px-2 py-0.5 rounded-bl font-black tracking-widest uppercase">
          Master Key
        </div>
        <h4 className="text-xs font-black text-indigo-300 font-mono tracking-tight uppercase flex items-center gap-1.5">
          👑 SYSTEM SHOWCASE MODULE
        </h4>
        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
          The Master Key is configured with device parameters from the hardware specifications, bypassing normal bonding to trigger alerts on any linked terminal.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-indigo-950 text-[9px] font-mono">
          <div><span className="text-slate-500">MAC:</span> <span className="text-indigo-400">{DEMO_TAG_MAC_ADDRESS}</span></div>
          <div><span className="text-slate-500">Service:</span> <span className="text-slate-300">0xFFE0</span></div>
          <div className="col-span-2 truncate"><span className="text-slate-500">Manufacturer:</span> <span className="text-slate-300">Ubiquitous Computing</span></div>
        </div>

        <button
          onClick={triggerShowcaseMasterKey}
          className="w-full mt-3 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 text-white text-[10px] font-mono font-black rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-950/40 transition-all flex items-center justify-center gap-1.5"
        >
          ⚡ SIMULATE MASTER KEY BROADCAST
        </button>
      </div>

      {/* BONDING METHOD SELECTOR */}
      <div className="space-y-2 text-left">
        <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">
          Initiate Dual-Priority Bonding
        </span>
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] font-bold">
          <button
            onClick={() => { setActiveMethod('MANUAL'); setRadarScanning(false); }}
            className={`py-2 px-1 border rounded-xl transition-all ${activeMethod === 'MANUAL' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            1. MANUAL MAC
          </button>
          <button
            onClick={() => { setActiveMethod('QR'); setRadarScanning(false); startQrScannerSimulation(); }}
            className={`py-2 px-1 border rounded-xl transition-all ${activeMethod === 'QR' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            2. QR MATRIX
          </button>
          <button
            onClick={() => { setActiveMethod('NFC'); setRadarScanning(false); startNfcTapSimulation(); }}
            className={`py-2 px-1 border rounded-xl transition-all ${activeMethod === 'NFC' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            3. NFC TAP
          </button>
          <button
            onClick={() => { setActiveMethod('DISCOVERY'); startDiscoverySimulation(); }}
            className={`py-2 px-1 border rounded-xl transition-all ${activeMethod === 'DISCOVERY' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            4. RSSI SCAN
          </button>
          <button
            onClick={() => { setActiveMethod('PRESS'); setRadarScanning(false); startPressToPairSimulation(); }}
            className={`py-2 px-1 border rounded-xl transition-all ${activeMethod === 'PRESS' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            5. PRESS GATT
          </button>
          <button
            onClick={() => { setActiveMethod('NONE'); setRadarScanning(false); }}
            className="py-2 px-1 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-400"
          >
            ❌ CANCEL
          </button>
        </div>
      </div>

      {/* PAIRING SEQUENCER PROGRESS & SIMULATORS */}
      {pairingProgress && (
        <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-2xl space-y-3 font-mono text-[10px] text-left animate-fadeIn">
          <div className="flex justify-between text-emerald-400 font-bold tracking-wider">
            <span>📡 BONDING SEQUENCER</span>
            <span className="animate-pulse">COUPLED</span>
          </div>
          <p className="text-slate-200 text-[11px] leading-relaxed">{pairingProgress}</p>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-4/5" />
          </div>
        </div>
      )}

      {/* METHOD UI 1: MANUAL ENTRY */}
      {activeMethod === 'MANUAL' && (
        <form onSubmit={handleManualBond} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-3.5 animate-fadeIn">
          <div className="border-b border-slate-900 pb-1.5">
            <h4 className="text-[11px] font-black font-mono text-slate-200 uppercase tracking-wide">Manual MAC Registration</h4>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Register hardware credentials manually.</p>
          </div>
          <div className="space-y-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">MAC Address</label>
              <input
                type="text"
                value={manualMac}
                onChange={e => setManualMac(e.target.value)}
                placeholder="e.g. FF:FF:10:E4:9C:15"
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Friendly Identifier</label>
              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="e.g. TactKey Resident A"
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Device Profile Class</label>
              <select
                value={manualType}
                onChange={e => setManualType(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="iTAG">Ubiquitous iTAG Keyfob (0x01D5)</option>
                <option value="RFD_Beacon">RFD_Beacon Master Node</option>
                <option value="SmartBand">Smart Wristband G-Sensor</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 text-white text-[10px] font-mono font-bold rounded-xl uppercase tracking-wider transition-all shadow"
          >
            🔒 Validate & Bond Device
          </button>
        </form>
      )}

      {/* METHOD UI 2: QR CAMERA SCAN SIMULATION */}
      {activeMethod === 'QR' && qrScanning && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-4 animate-fadeIn">
          <div className="text-left border-b border-slate-900 pb-1.5">
            <h4 className="text-[11px] font-black font-mono text-slate-200 uppercase tracking-wide">Optical QR Link</h4>
          </div>
          
          <div className="relative w-44 h-44 mx-auto border-2 border-dashed border-emerald-500/40 rounded-2xl bg-slate-900/60 overflow-hidden flex items-center justify-center">
            {/* Viewfinder brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
            
            {/* Simulated green laser line scan */}
            <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
            
            {/* Mock QR matrix image */}
            <div className="w-24 h-24 bg-slate-950 border border-slate-800 p-2 flex flex-col justify-around rounded opacity-60">
              <div className="grid grid-cols-4 gap-1 w-full h-full">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`rounded-sm ${(i * 3 + 1) % 4 === 0 || i === 0 || i === 3 || i === 12 ? 'bg-slate-300' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Camera alignment: Locked</span>
        </div>
      )}

      {/* METHOD UI 3: NFC TAP-TO-PAIR SIMULATION */}
      {activeMethod === 'NFC' && nfcTapping && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-5 animate-fadeIn">
          <div className="text-left border-b border-slate-900 pb-1.5">
            <h4 className="text-[11px] font-black font-mono text-slate-200 uppercase tracking-wide">NFC Induction Interface</h4>
          </div>

          <div className="relative w-28 h-28 mx-auto flex items-center justify-center bg-emerald-950/10 border border-emerald-500/20 rounded-full animate-pulse">
            <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <span className="text-3xl animate-bounce">📳</span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wide">Hold Keyfob Against Device Antenna</p>
            <p className="text-[9px] text-slate-500 font-mono">Simulating near-field magnetic secure pairing induction...</p>
          </div>
        </div>
      )}

      {/* METHOD UI 4: DISCOVERY MODE (RSSI SIGNAL SCANNING) */}
      {activeMethod === 'DISCOVERY' && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
            <div>
              <h4 className="text-[11px] font-black font-mono text-slate-200 uppercase tracking-wide">RSSI Proximity Scan</h4>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Filtering devices with signal &gt; -60dBm</p>
            </div>
            {radarScanning && (
              <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-black animate-pulse">ACTIVE RADAR</span>
            )}
          </div>

          {radarScanning && discoveredItems.length === 0 && (
            <div className="py-6 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/40 border-t-transparent animate-spin mx-auto" />
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sweeping RF channels...</p>
            </div>
          )}

          {discoveredItems.length > 0 && (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {discoveredItems.map((item) => {
                const isStrongEnough = item.rssi >= -60;
                return (
                  <div key={item.mac} className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl flex justify-between items-center text-[10px] font-mono">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-100">{item.name}</span>
                        {isStrongEnough && (
                          <span className="text-[7px] bg-green-500/10 text-green-400 border border-green-500/20 px-1 rounded uppercase font-black">Proximate</span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500">{item.mac}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isStrongEnough ? 'text-emerald-400' : 'text-slate-500'}`}>
                        📶 {item.rssi} dBm
                      </span>
                      <button
                        onClick={() => handleDiscoveryBond(item.mac, item.name)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase transition-colors"
                      >
                        BOND
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* METHOD UI 5: PRESS-TO-PAIR WAITING */}
      {activeMethod === 'PRESS' && pressListening && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-4 animate-fadeIn">
          <div className="text-left border-b border-slate-900 pb-1.5">
            <h4 className="text-[11px] font-black font-mono text-slate-200 uppercase tracking-wide">Press-to-Pair Monitor</h4>
          </div>

          <div className="py-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl mx-auto animate-bounce">
              🔘
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wide">Press Physical Button On iTAG Now</p>
              <p className="text-[9px] text-slate-500 font-mono">App is sniffing GATT notification channels for click packets...</p>
            </div>
          </div>

          {/* SIMULATOR BUTTON to let the user fire the GATT click physically in the software */}
          <button
            onClick={simulatePhysicalPressButton}
            className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold rounded-xl uppercase transition-all"
          >
            🖱️ SIMULATE PHYSICAL KEYFOB BUTTON PRESS
          </button>
        </div>
      )}

      {/* PAIRED / BONDED DEVICES LIST */}
      <div className="space-y-3.5 text-left">
        <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1.5">
          User-Bonded Devices (Tier 2 Profiles)
        </span>
        
        {bleDevices.length === 0 ? (
          <div className="py-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-850">
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">No Bonded Keyfobs Found</p>
            <p className="text-[9px] text-slate-600 mt-1 max-w-[200px] mx-auto leading-normal">Use the sequencer triggers above to bond a physical safety beacon.</p>
          </div>
        ) : (
          bleDevices.map((device) => {
            const isConnected = device.connectionState === 'CONNECTED';

            return (
              <div key={device.macAddress} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 space-y-4 relative overflow-hidden transition-all hover:border-slate-800">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-slate-100">{device.friendlyName}</h4>
                    <p className="text-[9px] font-mono text-slate-500">{device.macAddress}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {device.connectionState}
                    </span>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-2.5 rounded-xl text-center font-mono text-[10px] border border-slate-800/40">
                  <div className="border-r border-slate-800">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold mb-0.5">Battery</span>
                    <span className={`font-bold text-xs ${device.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                      🔋 {device.batteryLevel}%
                    </span>
                  </div>
                  <div className="border-r border-slate-800">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold mb-0.5">Signal</span>
                    <span className="text-slate-200 font-bold text-xs">📶 {device.rssi} dBm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase font-bold mb-0.5">Type</span>
                    <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wide bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-500/10 inline-block mt-0.5">{device.deviceType}</span>
                  </div>
                </div>

                {/* Simulated Actions Triggers */}
                {isConnected && (
                  <div className="space-y-2 border-t border-slate-900/80 pt-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                      Simulate Wearable Hardware Click
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px] font-bold">
                      <button
                        onClick={() => handleSimulateClick(device.macAddress, 'SINGLE')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl py-2 px-1 text-slate-300 transition-colors"
                      >
                        1x CLICK
                      </button>
                      <button
                        onClick={() => handleSimulateClick(device.macAddress, 'DOUBLE')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl py-2 px-1 text-slate-300 transition-colors"
                      >
                        2x CLICK
                      </button>
                      <button
                        onClick={() => handleSimulateClick(device.macAddress, 'TRIPLE')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl py-2 px-1 text-slate-300 transition-colors"
                      >
                        3x CLICK
                      </button>
                      <button
                        onClick={() => handleSimulateClick(device.macAddress, 'FALL')}
                        className="bg-red-950 hover:bg-red-900 border border-red-500/20 rounded-xl py-2 px-1 text-red-400 transition-colors"
                      >
                        FALL DET
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Toggles */}
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <button
                    onClick={() => isConnected ? disconnectBleDevice(device.macAddress) : connectBleDevice(device.macAddress)}
                    className="text-slate-400 hover:text-slate-200 font-bold transition-colors"
                  >
                    {isConnected ? "DISCONNECT LINK" : "RE-ESTABLISH LINK"}
                  </button>
                  <button
                    onClick={() => removeDevice(device.macAddress)}
                    className="text-red-500 hover:text-red-400 font-bold transition-colors"
                  >
                    UNPAIR / FORGET
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
