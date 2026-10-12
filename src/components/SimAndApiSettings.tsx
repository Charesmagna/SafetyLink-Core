import React, { useEffect, useState } from 'react';
import { NativeDispatchService, SimCardInfo } from '../services/NativeDispatchService';
import { useAppStore } from '../utils/store';

const PROVIDERS: { platformId: 'twilio' | 'africas_talking' | 'vapi'; name: string; category: 'VOICE_SMS' | 'AI_ASSISTANT' }[] = [
  { platformId: 'twilio', name: 'Twilio', category: 'VOICE_SMS' },
  { platformId: 'africas_talking', name: "Africa's Talking", category: 'VOICE_SMS' },
  { platformId: 'vapi', name: 'Vapi', category: 'AI_ASSISTANT' },
];

export default function SimAndApiSettings() {
  const platformIntegrations = useAppStore(s => s.platformIntegrations);
  const savePlatformIntegration = useAppStore(s => s.savePlatformIntegration);
  const [sims, setSims] = useState<SimCardInfo[]>([]);
  const [preferred, setPreferred] = useState<number>(-1);
  const [simError, setSimError] = useState('');

  useEffect(() => {
    NativeDispatchService.getSimCards().then(r => {
      setSims(r.sims || []);
      setPreferred(r.preferredSubscriptionId ?? -1);
      if (r.error) setSimError(r.error);
    });
  }, []);

  const choose = async (id: number) => {
    setPreferred(id);
    await NativeDispatchService.setPreferredSim(id);
  };

  const field = (platformId: string) => platformIntegrations.find(p => p.platformId === platformId);

  const update = (prov: typeof PROVIDERS[number], patch: Record<string, string>) => {
    const existing = field(prov.platformId);
    savePlatformIntegration({
      id: existing?.id || `user-${prov.platformId}`,
      platformId: prov.platformId,
      name: prov.name,
      category: prov.category,
      status: 'CONFIGURED',
      ...existing,
      ...patch,
    } as any);
  };

  const input = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200';

  return (
    <div className="space-y-4 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">📶 SIM FOR CALLS & SMS</h4>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="radio" checked={preferred === -1} onChange={() => choose(-1)} /> Phone default (system decides)
        </label>
        {sims.map(sim => (
          <label key={sim.subscriptionId} className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="radio" checked={preferred === sim.subscriptionId} onChange={() => choose(sim.subscriptionId)} />
            SIM {sim.slot} — {sim.carrier || sim.label}
          </label>
        ))}
        {sims.length === 0 && (
          <p className="text-[10px] text-slate-500">{simError || 'No SIM list available (needs the Android app and Phone permission).'}</p>
        )}
      </div>

      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pt-2">🔑 MY OWN API KEYS</h4>
      {PROVIDERS.map(prov => {
        const f = field(prov.platformId);
        return (
          <div key={prov.platformId} className="space-y-1.5 bg-slate-900/40 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-300">{prov.name}</div>
            <input className={input} type="password" placeholder="API key / Auth token" value={f?.apiKey || ''} onChange={e => update(prov, { apiKey: e.target.value })} />
            {(prov.platformId === 'twilio' || prov.platformId === 'africas_talking') && (
              <input className={input} placeholder={prov.platformId === 'twilio' ? 'Account SID' : 'AT username'} value={f?.accountSid || ''} onChange={e => update(prov, { accountSid: e.target.value })} />
            )}
            <input className={input} placeholder={prov.platformId === 'vapi' ? 'Phone number ID' : 'Sender number / ID'} value={f?.phoneOrLine || ''} onChange={e => update(prov, { phoneOrLine: e.target.value })} />
          </div>
        );
      })}
    </div>
  );
}
