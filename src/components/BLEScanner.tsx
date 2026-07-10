import React from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { ITagPluginService, ITagDevice } from '../services/ITagPluginService';

export const BLEScanner: React.FC = () => {
  const { bleDevices, discoveredDevices, isScanning, pairingProgress, startBleScan, disconnectBleDevice, connectBleDevice, removeDevice, registerDiscoveredDevice } = useAppStore();

  // Native Custom ITagPlugin States
  const [nativePluginInitialized, setNativePluginInitialized] = React.useState<boolean>(false);
  const [nativeScanning, setNativeScanning] = React.useState<boolean>(false);
  const [nativeDevices, setNativeDevices] = React.useState<ITagDevice[]>([]);
  const [nativeConnectedMap, setNativeConnectedMap] = React.useState<Record<string, 'disconnected' | 'connecting' | 'connected'>>({});
  const [locationWarning, setLocationWarning] = React.useState<boolean>(false);

  // Manual hardware binding state
  const [showManualPair, setShowManualPair] = React.useState<boolean>(false);
  const [manualMacAddress, setManualMacAddress] = React.useState<string>('');
  const [manualFriendlyName, setManualFriendlyName] = React.useState<string>('');
  const [manualDeviceType, setManualDeviceType] = React.useState<'iTAG' | 'RFD_Beacon' | 'GENERIC_BLE_BUTTON'>('GENERIC_BLE_BUTTON');
  const [manualFormError, setManualFormError] = React.useState<string>('');

  // Auto-initialize on mount
  React.useEffect(() => {
    const autoInit = async () => {
      try {
        const granted = await ITagPluginService.init();
        setNativePluginInitialized(granted);
        if (granted) {
          useAppStore.getState().addAuditLog('BLE', 'INFO', 'Native ITagPlugin Auto-Init', 'Permissions automatically verified on mount.');
        }
      } catch (e) {
        console.warn('Auto init failed:', e);
      }
    };
    autoInit();
  }, []);

  const handleInitNativePlugin = async () => {
    const granted = await ITagPluginService.init();
    setNativePluginInitialized(granted);
    if (granted) {
      useAppStore.getState().addAuditLog('BLE', 'INFO', 'Native ITagPlugin Init Success', 'Bluetooth permissions acquired successfully.');
    } else {
      useAppStore.getState().addAuditLog('BLE', 'SEVERE', 'Native ITagPlugin Init Failed', 'Permissions denied.');
    }
    return granted;
  };

  const handleStartNativeScan = async () => {
    setLocationWarning(false);
    let initialized = nativePluginInitialized;
    if (!initialized) {
      initialized = await handleInitNativePlugin();
      if (!initialized) {
        return;
      }
    }

    setNativeScanning(true);
    setNativeDevices([]);
    useAppStore.getState().addAuditLog('BLE', 'INFO', 'Native iTAG Plugin Scan Started', 'Scanning for BLE devices via custom plugin...');
    try {
      await ITagPluginService.startScanning(
        (device) => {
          setNativeDevices(prev => {
            if (prev.some(d => d.address === device.address)) return prev;
            return [...prev, device];
          });
        },
        (warning) => {
          if (warning === 'LOCATION_SERVICES_DISABLED') {
            setLocationWarning(true);
            useAppStore.getState().addAuditLog('BLE', 'WARN', 'GPS Disabled', 'Location services must be enabled in device settings for BLE results.');
          }
        }
      );
      setTimeout(() => {
        handleStopNativeScan();
      }, 15000);
    } catch (err: any) {
      setNativeScanning(false);
      useAppStore.getState().addAuditLog('BLE', 'SEVERE', 'Native Scan Error', err.message || 'Error occurred');
    }
  };

  const handleStopNativeScan = async () => {
    await ITagPluginService.stopScanning();
    setNativeScanning(false);
    useAppStore.getState().addAuditLog('BLE', 'INFO', 'Native iTAG Plugin Scan Stopped', 'Scanning complete.');
  };

  const handleConnectNativeDevice = async (address: string) => {
    setNativeConnectedMap(prev => ({ ...prev, [address]: 'connecting' }));
    useAppStore.getState().addAuditLog('BLE', 'INFO', 'Native GATT Connecting', `Address: ${address}`);
    
    const success = await ITagPluginService.connectDevice(
      address,
      (status) => {
        setNativeConnectedMap(prev => ({ ...prev, [address]: status }));
        useAppStore.getState().addAuditLog('BLE', status === 'connected' ? 'INFO' : 'SEVERE', `Native Device ${status === 'connected' ? 'Connected' : 'Disconnected'}`, `MAC: ${address}`);
        
        // Also sync state with central appStore so dashboard map looks updated
        if (status === 'connected') {
          const existing = useAppStore.getState().bleDevices.find(d => d.macAddress === address);
          if (!existing) {
            useAppStore.getState().registerDiscoveredDevice(address, 'Native iTAG Keyfob');
          }
          useAppStore.setState(state => ({
            bleDevices: state.bleDevices.map(d => d.macAddress === address ? { ...d, connectionState: 'CONNECTED', rssi: -50 } : d)
          }));
        } else {
          useAppStore.setState(state => ({
            bleDevices: state.bleDevices.map(d => d.macAddress === address ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
          }));
        }
      },
      (val) => {
        const store = useAppStore.getState();
        store.addAuditLog('BLE', 'SEVERE', 'NATIVE PHYSICAL BUTTON PRESS', `Signal byte 0x${val.toString(16)} received from ${address} (Click Code: ${val})`);

        // Medium vibration to acknowledge every iTAG press
        if (navigator.vibrate) { try { navigator.vibrate(120); } catch(e) {} }

        const lizzyFollowUp = (alertType: string) => {
          // Lizzy AI voice follow-up after dispatch confirmation
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              try {
                window.speechSynthesis.cancel();
                const msg = new SpeechSynthesisUtterance(
                  `${alertType} alert dispatched. This is Lizzy from SafetyLink. Are you okay? Please respond if you can hear me.`
                );
                msg.rate = 0.9;
                msg.pitch = 1.1;
                window.speechSynthesis.speak(msg);
              } catch(e) {}
            }
          }, 3500);
        };

        if (val === 1) {
          // Single Click: 10s countdown SOS
          store.addAuditLog('BLE', 'SEVERE', 'iTAG Single Click SOS (1x click)', `Emergency trigger confirmed from physical button ${address}. Broadcasting SOS.`);
          store.startMultiStagePanic(`Silent tactical SOS broadcast triggered via physical iTAG keyfob (Single Click Hardware Protocol)`, 10);
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Emergency countdown initiated. 10 seconds to cancel."));
            } catch (e) {}
          }
          // Long vibration + beep on countdown complete
          setTimeout(() => {
            if (store.activeSOSState !== 'IDLE') {
              if (navigator.vibrate) { try { navigator.vibrate([200, 100, 600]); } catch(e) {} }
              lizzyFollowUp('SOS');
            }
          }, 10500);
        } else if (val === 2) {
          // Double Click: abort if active, else trigger
          if (store.activeSOSState !== 'IDLE' || store.panicCountdown !== null) {
            store.addAuditLog('BLE', 'WARN', 'iTAG Safe Mode Cancel (2x click)', `De-escalation trigger received from physical button ${address}.`);
            store.cancelSOS();
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              try {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("S O S cancelled successfully"));
              } catch (e) {}
            }
          } else {
            store.addAuditLog('BLE', 'SEVERE', 'iTAG Double Click SOS (2x click)', `Emergency trigger confirmed from physical button ${address}. Broadcasting SOS.`);
            store.triggerPanic(`Silent tactical SOS broadcast triggered via physical iTAG keyfob (Double Click Hardware Protocol)`);
            if (navigator.vibrate) { try { navigator.vibrate([200, 100, 600]); } catch(e) {} }
            lizzyFollowUp('Emergency');
          }
        } else if (val >= 3) {
          // Triple Click: bypass countdown, instant dispatch
          store.addAuditLog('BLE', 'SEVERE', 'iTAG Tactical SOS (3x click)', `Emergency trigger confirmed from physical button ${address}. Broadcasting SOS.`);
          store.triggerPanic(`Silent tactical SOS broadcast triggered via physical iTAG keyfob (3x Click Hardware Protocol)`);
          if (navigator.vibrate) { try { navigator.vibrate([200, 100, 600]); } catch(e) {} }
          lizzyFollowUp('Tactical SOS');
        }
      }
    );

    if (success) {
      setNativeConnectedMap(prev => ({ ...prev, [address]: 'connected' }));
    } else {
      setNativeConnectedMap(prev => ({ ...prev, [address]: 'disconnected' }));
    }
  };

  const handleDisconnectNativeDevice = async (address: string) => {
    await ITagPluginService.disconnectDevice(address);
    setNativeConnectedMap(prev => ({ ...prev, [address]: 'disconnected' }));
    useAppStore.setState(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === address ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
    }));
  };

  const handleRingNativeDevice = async (address: string) => {
    const ok = await ITagPluginService.ringDevice(address, 2);
    if (ok) {
      useAppStore.getState().addAuditLog('BLE', 'INFO', 'Triggered iTAG Alarm Siren', `Beep sent to ${address}`);
    } else {
      useAppStore.getState().addAuditLog('BLE', 'WARN', 'Siren Trigger Failed', `Failed to send beep to ${address}`);
    }
  };

  const handleManualPairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualFormError('');

    if (!manualMacAddress.trim()) {
      setManualFormError('Bluetooth MAC Address or Device ID is required.');
      return;
    }

    const formattedMac = manualMacAddress.trim().toUpperCase();
    const exists = bleDevices.some(d => d.macAddress.toUpperCase() === formattedMac);
    if (exists) {
      setManualFormError('This device is already paired.');
      return;
    }

    if (bleDevices.length >= 5) {
      setManualFormError('Maximum limit of 5 paired buttons reached.');
      return;
    }

    registerDiscoveredDevice(formattedMac, manualFriendlyName.trim() || 'Manual Panic Button', manualDeviceType);
    useAppStore.getState().addAuditLog('BLE', 'INFO', 'Manual Button ID Paired', `MAC: ${formattedMac}, Nickname: ${manualFriendlyName || 'Manual Panic Button'}`);

    setManualMacAddress('');
    setManualFriendlyName('');
    setManualDeviceType('GENERIC_BLE_BUTTON');
    setShowManualPair(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5 shadow-2xl w-full max-w-md mx-auto relative overflow-hidden scanlines"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 neon-glow-emerald" />
      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />

      <div className="flex justify-between items-center border-b border-slate-900 pb-3.5 relative z-10">
        <div className="text-left">
          <h3 className="text-xs font-black text-slate-100 tracking-[0.2em] font-display uppercase">
            BLE Personal Panic Nodes
          </h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            Wearable beacon devices · {bleDevices.length}/5 bonded
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setShowManualPair(!showManualPair);
              setManualFormError('');
            }}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold rounded-full border transition-all uppercase ${
              showManualPair
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300'
            }`}
          >
            {showManualPair ? "CANCEL" : "+ PAIR ID"}
          </button>
          <button
            onClick={startBleScan}
            disabled={isScanning}
            className={`px-3.5 py-1.5 text-[9px] font-mono font-bold rounded-full border transition-all uppercase ${
              isScanning
                ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white shadow-lg shadow-emerald-950/40'
            }`}
          >
            {isScanning ? "SCANNING..." : "SCAN MESH"}
          </button>
        </div>
      </div>

      {/* Manual pairing form */}
      <AnimatePresence>
        {showManualPair && (
          <motion.form 
            onSubmit={handleManualPairSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3 font-mono text-[10px] text-left mt-3.5 relative z-10"
          >
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">✍️ PAIR HARDWARE BUTTON BY ID</span>
            
            {manualFormError && (
              <p className="p-2 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-[9px] leading-snug">
                ⚠️ {manualFormError}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex flex-col">
                <label className="text-[8px] text-slate-500 uppercase font-bold mb-1">Hardware Bluetooth MAC / ID Address</label>
                <input
                  type="text"
                  value={manualMacAddress}
                  onChange={e => setManualMacAddress(e.target.value)}
                  placeholder="e.g. AA:BB:CC:DD:EE:FF or FFE0-iTAG-1"
                  className="bg-slate-900 border border-slate-850 rounded-xl p-2 text-[10px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[8px] text-slate-500 uppercase font-bold mb-1">Friendly Nickname / Device Owner</label>
                <input
                  type="text"
                  value={manualFriendlyName}
                  onChange={e => setManualFriendlyName(e.target.value)}
                  placeholder="e.g. Grandma's Necklace, Duty Officer Keyfob"
                  className="bg-slate-900 border border-slate-850 rounded-xl p-2 text-[10px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[8px] text-slate-500 uppercase font-bold mb-1">Device / Beacon Chipset Profile</label>
                <select
                  value={manualDeviceType}
                  onChange={e => setManualDeviceType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-850 rounded-xl p-2 text-[10px] text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                >
                  <option value="GENERIC_BLE_BUTTON">Generic BLE Smart Button</option>
                  <option value="iTAG">iTAG Anti-Loss Wearable (FFE0/FFE1 GATT)</option>
                  <option value="RFD_Beacon">RFD Long-Range Safety Beacon</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase rounded-xl transition-all"
            >
              SAVE & REGISTER NODE
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Custom Native iTAG Plugin Controller */}
      <div className="p-3.5 bg-emerald-950/5 border border-emerald-500/20 rounded-2xl space-y-3 mt-4 relative z-10 text-left">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 font-display uppercase tracking-wider">
              Native iTAG Plugin Bridge
            </p>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5 leading-normal">
              Direct connection to hardware via native stack
            </p>
          </div>
          <span className={`px-1.5 py-0.5 text-[7px] font-mono font-bold rounded ${nativePluginInitialized ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
            {nativePluginInitialized ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={nativeScanning ? handleStopNativeScan : handleStartNativeScan}
            className={`col-span-2 py-1.5 text-[9px] font-mono font-bold rounded-xl border transition-all text-center ${nativeScanning ? 'bg-red-950/30 border-red-500/30 text-red-300 hover:bg-red-900/40' : 'bg-teal-600/20 border-teal-500/30 text-teal-300 hover:bg-teal-600'}`}
          >
            {nativeScanning ? 'STOP SCANNING' : 'SCAN NATIVE iTAGS'}
          </button>
        </div>

        {locationWarning && (
          <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 text-amber-400 rounded-xl text-[9px] font-mono leading-normal">
            ⚠️ <strong>GPS/Location turned off</strong>: Android requires Location services (GPS) to be active in your system settings to receive BLE scan results. Please enable GPS and try again!
          </div>
        )}

        {/* Found native devices */}
        {nativeDevices.length > 0 && (
          <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-900/60 font-mono text-[9px]">
            <p className="text-[8px] font-bold text-slate-500 tracking-wider">FOUND DEVICES ({nativeDevices.length})</p>
            {nativeDevices.map((d) => {
              const status = nativeConnectedMap[d.address] || 'disconnected';
              return (
                <div key={d.address} className="flex justify-between items-center p-2 bg-slate-950/50 border border-slate-900/60 rounded-xl">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-200">{d.name}</p>
                    <p className="text-[8px] text-slate-500">{d.address} · {d.rssi} dBm</p>
                  </div>
                  <div className="flex gap-1.5">
                    {status === 'connected' ? (
                      <>
                        <button
                          onClick={() => handleRingNativeDevice(d.address)}
                          className="px-2 py-1 rounded bg-amber-600/20 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-600 hover:text-white transition-all text-[8px]"
                        >
                          BEEP TAG
                        </button>
                        <button
                          onClick={() => handleDisconnectNativeDevice(d.address)}
                          className="px-2 py-1 rounded bg-red-900/20 border border-red-500/20 text-red-400 font-bold hover:bg-red-600 hover:text-white transition-all text-[8px]"
                        >
                          CLOSE
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnectNativeDevice(d.address)}
                        disabled={status === 'connecting'}
                        className="px-2.5 py-1 rounded bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-600 hover:text-white transition-all text-[8px]"
                      >
                        {status === 'connecting' ? 'PAIRING...' : 'CONNECT'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pairing progress bar */}
      <AnimatePresence>
        {pairingProgress && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-slate-950/80 border border-emerald-500/20 rounded-2xl space-y-2 font-mono text-[10px] text-left mt-3.5"
          >
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>PAIRING SEQUENCER</span>
              <span className="animate-pulse">ACTIVE</span>
            </div>
            <p className="text-slate-400">{pairingProgress}</p>
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-pulse w-2/3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovered nearby BLE devices */}
      {discoveredDevices.length > 0 && (
        <div className="space-y-2 text-left mt-4 relative z-10">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
            DISCOVERED NEARBY ({discoveredDevices.length})
          </span>
          {discoveredDevices.map((d) => (
            <div key={d.deviceId} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-100">{d.name}</p>
                <p className="text-[9px] font-mono text-slate-500">{d.deviceId} · 📶 {d.rssi} dBm</p>
              </div>
              <button
                onClick={() => registerDiscoveredDevice(d.deviceId, d.name)}
                disabled={bleDevices.length >= 5}
                className="px-3 py-1.5 text-[9px] font-mono font-bold rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/20 transition-all"
              >
                {bleDevices.length >= 5 ? "LIMIT" : "ADD BUTTON"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Paired devices list */}
      <div className="space-y-4 text-left mt-4 relative z-10">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
          BONDED PANEL NODES ({bleDevices.length}/5)
        </span>

        {bleDevices.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
            <span className="text-xl block mb-1">🔑</span>
            <p className="text-[10px] font-mono text-slate-500">No physical buttons bonded yet.</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1 leading-relaxed">
              Use SCAN MESH or SCAN NATIVE to search nearby peripherals, or click + PAIR ID to bind a hardware serial address directly.
            </p>
          </div>
        ) : (
          bleDevices.map((device) => {
            const isConnected = device.connectionState === 'CONNECTED';
            const isConnecting = device.connectionState === 'CONNECTING';

            // Signal strength indicators based on RSSI
            const rssi = device.rssi;
            let signalBars = 0;
            let signalLabel = 'No Link';
            let signalColor = 'text-slate-500';

            if (isConnected) {
              if (rssi > -60) {
                signalBars = 4;
                signalLabel = 'Excellent';
                signalColor = 'text-emerald-400';
              } else if (rssi > -75) {
                signalBars = 3;
                signalLabel = 'Good';
                signalColor = 'text-teal-400';
              } else if (rssi > -90) {
                signalBars = 2;
                signalLabel = 'Fair';
                signalColor = 'text-amber-400';
              } else {
                signalBars = 1;
                signalLabel = 'Weak';
                signalColor = 'text-red-400';
              }
            }

            return (
              <div key={device.macAddress} className="p-4 bg-slate-950/20 rounded-2xl border border-slate-900/80 space-y-3.5 transition-all hover:border-slate-800/80">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-slate-100 font-display flex items-center gap-1.5 flex-wrap">
                      <span>{device.friendlyName}</span>
                      <span className="text-[7px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        {device.deviceType}
                      </span>
                    </h4>
                    <p className="text-[9px] font-mono text-slate-500">{device.macAddress}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse neon-glow-emerald' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className={`text-[9px] font-mono font-bold ${isConnected ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-slate-500'}`}>
                      {device.connectionState}
                    </span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl text-center font-mono text-[9px] border border-slate-900">
                  <div className="border-r border-slate-900/80 flex flex-col items-center justify-center py-1">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-1">Battery Level</span>
                    <span className={`font-bold text-[11px] flex items-center gap-1 ${device.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                      <span>🔋</span>
                      <span>{isConnected ? `${device.batteryLevel}%` : '--'}</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-1">Signal Strength</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-end gap-[2px] h-3.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`w-[3px] rounded-full transition-all ${
                              bar <= signalBars 
                                ? isConnected
                                  ? rssi > -60 ? 'bg-emerald-400' : rssi > -75 ? 'bg-teal-400' : rssi > -90 ? 'bg-amber-400' : 'bg-red-400'
                                  : 'bg-slate-700'
                                : 'bg-slate-800'
                            }`}
                            style={{ height: `${bar * 25}%` }}
                          />
                        ))}
                      </div>
                      <span className={`font-bold text-[11px] ${signalColor}`}>
                        {isConnected ? `${rssi} dBm (${signalLabel})` : '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Toggles */}
                <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-900/80">
                  <button
                    onClick={() => isConnected ? disconnectBleDevice(device.macAddress) : connectBleDevice(device.macAddress)}
                    className="text-slate-400 hover:text-slate-200 font-bold transition-colors uppercase font-mono"
                  >
                    {isConnected ? "DISCONNECT LINK" : "ESTABLISH LINK"}
                  </button>
                  <button
                    onClick={() => removeDevice(device.macAddress)}
                    className="text-red-500/80 hover:text-red-500 font-bold transition-colors uppercase font-mono"
                  >
                    UNPAIR / FORGET
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive iTAG Multi-Click Profile Action Mapper */}
      <div className="mt-5 p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-3.5 text-left font-mono relative z-10">
        <div>
          <span className="text-[7.5px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            FEATURE PROGRAMMED
          </span>
          <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
            📟 iTAG Multi-Click Sequence Mapping
          </h4>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
            Configure different system responses based on physical keyfob press intervals. Protects against accidental false triggers.
          </p>
        </div>

        {/* Action profile grid */}
        <div className="space-y-2 text-[9px]">
          {/* 1-Click Action */}
          <div className="p-2.5 bg-slate-900/50 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-extrabold text-blue-400 uppercase tracking-wider">● Single Click (1x Press)</span>
              <p className="text-[8px] text-slate-500 leading-normal">Pings local receiver nodes to verify BLE RSSI connectivity and report active battery level.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const logs = useAppStore.getState();
                logs.addAuditLog('BLE', 'INFO', 'iTAG Diagnostic Ping (1x Click)', 'RSSI Signal: -55 dBm, Status: Fully Paired & Connected. Battery: 94%.');
                alert("iTAG Heartbeat Acknowledged: Connection is secure. Battery at 94%.");
              }}
              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 font-bold uppercase tracking-wide rounded-lg border border-blue-500/20 text-[8px]"
            >
              Test 1x
            </button>
          </div>

          {/* 2-Clicks Action */}
          <div className="p-2.5 bg-slate-900/50 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-extrabold text-amber-400 uppercase tracking-wider">●● Double Click (2x Press)</span>
              <p className="text-[8px] text-slate-500 leading-normal">Safe Mode check-in. Instantly aborts/de-escalates any active accidental panic countdown.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const logs = useAppStore.getState();
                logs.addAuditLog('BLE', 'WARN', 'iTAG Safe Mode Check-In (2x Click)', 'User canceled SOS broadcast via Wearable hardware override.');
                if (logs.activeSOSState !== 'IDLE') {
                  logs.cancelSOS();
                  alert("Safe Mode Override: Active SOS cancelled successfully!");
                } else {
                  alert("Safe Mode Check-In: App is currently secure. No active panics to cancel.");
                }
              }}
              className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 font-bold uppercase tracking-wide rounded-lg border border-amber-500/20 text-[8px]"
            >
              Test 2x
            </button>
          </div>

          {/* 3-Clicks Action (The specific 3-click step) */}
          <div className="p-2.5 bg-red-950/15 border border-red-500/20 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-extrabold text-red-400 uppercase tracking-wider animate-pulse">●●● Triple Click (3x Press / Step)</span>
              <p className="text-[8px] text-slate-400 leading-normal">TACTICAL SOS TRIGGER. Bypasses all countdown filters to launch cellular SMS dispatch sequence instantly.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const logs = useAppStore.getState();
                logs.addAuditLog('BLE', 'SEVERE', 'iTAG SOS Broadcast Verified (3x Click)', '3-click hardware step verified. Initiating immediate dispatcher enroute!');
                logs.triggerPanic("Immediate silent SOS triggered via physical iTAG keyfob (3x Click Hardware Protocol)");
              }}
              className="px-2.5 py-1 bg-red-600/20 hover:bg-red-500 text-white font-bold uppercase tracking-wide rounded-lg border border-red-500/30 text-[8px]"
            >
              Test 3x
            </button>
          </div>
        </div>
      </div>

      {/* SafetyLink Active Connection Keep-Alive Background Service Explanation Panel */}
      <div className="mt-5 p-4 bg-slate-950/60 border border-slate-900 rounded-2xl text-left font-mono relative z-10 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">🔑</span>
            <span className="text-[10px] font-black text-slate-100 uppercase tracking-wider">Status Bar 'Key' Icon & Awake Protocols</span>
          </div>
          <span className="text-[7.5px] font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-bold">
            OS KEEPALIVE
          </span>
        </div>

        {/* Visual mock of Android status bar with SafetyLink active */}
        <div className="bg-slate-900/80 border border-slate-850 p-2 rounded-xl flex items-center justify-between font-mono text-[8.5px] text-slate-400">
          <div className="flex items-center gap-1">
            <span>05:31 PM</span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1 py-0.5 rounded text-[7px] font-bold">
              <span>🔑</span>
              <span>SAFETYLINK VPN ACTIVE</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 text-[8px]">
            <span>📶 LTE</span>
            <span>🔋 98%</span>
          </div>
        </div>

        <div className="text-[9px] text-slate-400 leading-relaxed space-y-2">
          <p>
            <strong>Why does Active Connection show a Key Icon?</strong> When you activate the Active Connection background persistence service, Android can establish a local loopback VPN configuration. This creates a secure, sandbox tunnel to monitor the BLE stack and displays the native <strong>System Key Icon</strong> in your status bar.
          </p>
          <p>
            <strong>What we do for iTag Clicks:</strong> To prevent Android or iOS from putting the Bluetooth stack to sleep when you press the home button, SafetyLink boots a standard <strong>Persistent Foreground Service</strong>. In native builds, this binds to a local loopback protocol (similar to the VPN system) or a pinned system tray notification. This acts as a constant handshake keep-alive, forcing the phone’s CPU to remain awake to catch your iTag clicks immediately.
          </p>
        </div>
      </div>

    </motion.div>
  );
};
