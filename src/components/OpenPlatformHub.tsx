import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { PlatformIntegration } from '../types';

export const OpenPlatformHub: React.FC = () => {
  const { 
    platformIntegrations, 
    savePlatformIntegration, 
    deployPlatformIntegration,
    removePlatformIntegration,
    addToast,
    addAuditLog 
  } = useAppStore();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformIntegration | null>(null);
  const [isDeploying, setIsDeploying] = useState<string | null>(null);

  // Form states for modal
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountSid, setAccountSid] = useState('');
  const [phoneOrLine, setPhoneOrLine] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [pcbSerial, setPcbSerial] = useState('');
  const [senderId, setSenderId] = useState('');

  const openConfigure = (platform: PlatformIntegration) => {
    setSelectedPlatform(platform);
    setApiKey(platform.apiKey || '');
    setApiSecret(platform.apiSecret || '');
    setAccountSid(platform.accountSid || '');
    setPhoneOrLine(platform.phoneOrLine || '');
    setEndpointUrl(platform.endpointUrl || '');
    setPcbSerial(platform.pcbSerial || '');
    setSenderId(platform.senderId || '');
  };

  const handleSaveAndDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setIsDeploying(selectedPlatform.id);

    // Save configuration
    const updated: PlatformIntegration = {
      ...selectedPlatform,
      apiKey: apiKey.trim() || undefined,
      apiSecret: apiSecret.trim() || undefined,
      accountSid: accountSid.trim() || undefined,
      phoneOrLine: phoneOrLine.trim() || undefined,
      endpointUrl: endpointUrl.trim() || undefined,
      pcbSerial: pcbSerial.trim() || undefined,
      senderId: senderId.trim() || undefined,
      status: 'CONFIGURED'
    };

    savePlatformIntegration(updated);
    addAuditLog('SYSTEM', 'INFO', `Configured Platform: ${selectedPlatform.name}`, 'Lodging API credentials into dispatch layer.');

    // Simulated quick handshake
    await new Promise(r => setTimeout(r, 600));

    // Auto-deploy into dispatch pipeline
    const deployRes = await deployPlatformIntegration(selectedPlatform.id);
    setIsDeploying(null);
    setSelectedPlatform(null);

    if (deployRes.success) {
      addToast(`🚀 ${selectedPlatform.name} deployed & active in dispatch chain!`, 'success');
    } else {
      addToast(`Configured ${selectedPlatform.name}.`, 'info');
    }
  };

  const getStatusBadge = (status: PlatformIntegration['status']) => {
    switch (status) {
      case 'DEPLOYED':
        return <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">● DEPLOYED & ACTIVE</span>;
      case 'CONFIGURED':
        return <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">READY TO DEPLOY</span>;
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-red-500/10 text-red-400 border border-red-500/30">ERROR</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-800 text-slate-400 border border-slate-700">STANDBY</span>;
    }
  };

  return (
    <div className="space-y-4 font-mono text-left max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-display">
            🔌 Open Platform Integrations Hub
          </h3>
          <p className="text-[9px] text-slate-500 mt-0.5">
            Self-serve gateway for external telcos, voice AI, payments, & PCB hardware lines
          </p>
        </div>
        <span className="text-[8px] font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
          AUTO-DEPLOY
        </span>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 gap-2.5">
        {platformIntegrations.map(platform => (
          <div 
            key={platform.id}
            className="p-3.5 bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all shadow-md space-y-2 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-wider">
                  {platform.name}
                </h4>
                <span className="text-[8px] text-slate-500 block">Category: {platform.category}</span>
              </div>
              {getStatusBadge(platform.status)}
            </div>

            {/* Quick telemetry details */}
            <div className="text-[8px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-850 space-y-0.5">
              <div className="flex justify-between">
                <span>LINE / IDENTITY:</span>
                <span className="text-slate-200 font-bold">{platform.phoneOrLine || platform.pcbSerial || platform.accountSid || 'Not Lodged'}</span>
              </div>
              <div className="flex justify-between">
                <span>GATEWAY HEALTH:</span>
                <span className="text-emerald-400 font-bold">{platform.lastPingStatus || 'Offline'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => openConfigure(platform)}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[8.5px] font-bold uppercase transition-all text-center"
              >
                ⚙️ Configure API
              </button>
              
              {platform.status !== 'DEPLOYED' ? (
                <button
                  onClick={() => deployPlatformIntegration(platform.id)}
                  disabled={isDeploying === platform.id}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[8.5px] font-black uppercase transition-all shadow-md"
                >
                  {isDeploying === platform.id ? 'Deploying...' : 'Deploy'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    savePlatformIntegration({ ...platform, status: 'CONFIGURED' });
                    addToast(`De-escalated ${platform.name} from active pipeline.`, 'info');
                  }}
                  className="px-3 py-1.5 bg-slate-950 text-slate-500 hover:text-slate-300 rounded-xl text-[8.5px] font-bold uppercase"
                >
                  Pause
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Modal for Platform Configuration */}
      <AnimatePresence>
        {selectedPlatform && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <div>
                  <h4 className="text-[11px] font-black text-slate-100 uppercase font-mono">
                    Lodging: {selectedPlatform.name}
                  </h4>
                  <span className="text-[8px] text-slate-500">Auto-detects credentials & activates in dispatch cascade</span>
                </div>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-slate-500 hover:text-slate-300 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAndDeploy} className="space-y-3 font-mono text-[9px]">
                {/* Platform specific inputs */}
                {selectedPlatform.platformId === 'twilio' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">Twilio Account SID</label>
                      <input
                        type="text"
                        value={accountSid}
                        onChange={e => setAccountSid(e.target.value)}
                        placeholder="AC_xxxxxxxxxxxxxxxx"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">Twilio Auth Token / Secret</label>
                      <input
                        type="password"
                        value={apiSecret}
                        onChange={e => setApiSecret(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">Twilio Sender Phone Number</label>
                      <input
                        type="text"
                        value={phoneOrLine}
                        onChange={e => setPhoneOrLine(e.target.value)}
                        placeholder="+16055695774"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {selectedPlatform.platformId === 'hardware_pcb' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">PCB Board Serial Number</label>
                      <input
                        type="text"
                        value={pcbSerial}
                        onChange={e => setPcbSerial(e.target.value)}
                        placeholder="SL-PCB-REV4-98124"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">SIM Phone Number Line (GSM Module)</label>
                      <input
                        type="text"
                        value={phoneOrLine}
                        onChange={e => setPhoneOrLine(e.target.value)}
                        placeholder="+27600987654"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">Serial COM Port / Webhook Gateway</label>
                      <input
                        type="text"
                        value={endpointUrl}
                        onChange={e => setEndpointUrl(e.target.value)}
                        placeholder="/dev/ttyUSB0 (9600 baud)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {selectedPlatform.platformId !== 'twilio' && selectedPlatform.platformId !== 'hardware_pcb' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">API Key / Token</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="Enter API Key / Token"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">Phone / Sender ID / Line</label>
                      <input
                        type="text"
                        value={phoneOrLine}
                        onChange={e => setPhoneOrLine(e.target.value)}
                        placeholder="+27... or SAFETYLINK"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold uppercase block">Custom Webhook / Base URL</label>
                      <input
                        type="text"
                        value={endpointUrl}
                        onChange={e => setEndpointUrl(e.target.value)}
                        placeholder="https://api..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="flex-1 py-2 bg-slate-900 text-slate-400 rounded-xl uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeploying !== null}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl uppercase shadow-lg shadow-blue-950/40"
                  >
                    Save & Deploy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
