import React, { useState } from 'react';
import { AlertTriangle, Database, Shield, ShieldCheck, UserPlus, Radio } from 'lucide-react';

interface PortalState {
  organization: {
    id: string;
    name: string;
  };
  financialEngine: {
    iTagProvisionFee: number;
    donorMonthlySub: number;
    gatewayBaseFee: number;
    gatewayPercentage: number;
    volunteerStipendSplit: number;
    platformMaintenanceSplit: number;
  };
  watchers: Array<{ id: string, name: string, idNumber: string, beat: string, status: 'PENDING' | 'CLEARED' }>;
  abahlali: Array<{ id: string, address: string, beat: string, assignedITag: string, isActive: boolean }>;
}

const INITIAL_STATE: PortalState = {
  organization: {
    id: 'SL-LAPE-3027',
    name: 'Lenasia South Mphakati Overwatch'
  },
  financialEngine: {
    iTagProvisionFee: 145.00,
    donorMonthlySub: 55.00,
    gatewayBaseFee: 2.00,
    gatewayPercentage: 3.00,
    volunteerStipendSplit: 49.00,
    platformMaintenanceSplit: 1.00
  },
  watchers: [
    { id: 'W-001', name: 'Sipho Ndlovu', idNumber: '8501015000000', beat: 'Sector 1 - North', status: 'CLEARED' },
    { id: 'W-002', name: 'Thabo Mbeki', idNumber: '9202026000000', beat: 'Sector 2 - East', status: 'PENDING' }
  ],
  abahlali: [
    { id: 'H-001', address: '42 Protea Glen', beat: 'Sector 1 - North', assignedITag: 'AA:BB:CC:DD:EE:01', isActive: true },
    { id: 'H-002', address: '18 Mandela Ave', beat: 'Sector 2 - East', assignedITag: 'AA:BB:CC:DD:EE:02', isActive: true },
    { id: 'H-003', address: '99 Sisulu St', beat: 'Sector 1 - North', assignedITag: 'AA:BB:CC:DD:EE:03', isActive: true },
  ]
};

const SECTORS = ['Sector 1 - North', 'Sector 2 - East', 'Sector 3 - South', 'Sector 4 - West'];

export function MphakatiOverwatch() {
  const [state, setState] = useState<PortalState>(INITIAL_STATE);
  
  // New Watcher Form State
  const [newWatcherName, setNewWatcherName] = useState('');
  const [newWatcherId, setNewWatcherId] = useState('');
  const [newWatcherBeat, setNewWatcherBeat] = useState(SECTORS[0]);

  // New Abahlali Form State
  const [newAbahlaliAddress, setNewAbahlaliAddress] = useState('');
  const [newAbahlaliBeat, setNewAbahlaliBeat] = useState(SECTORS[0]);
  const [newAbahlaliMac, setNewAbahlaliMac] = useState('');

  // Math Engine
  const activeAbahlali = state.abahlali.filter(a => a.isActive).length;
  const { donorMonthlySub, gatewayBaseFee, gatewayPercentage, volunteerStipendSplit, platformMaintenanceSplit } = state.financialEngine;

  const grossRevenue = donorMonthlySub * activeAbahlali;
  const gatewayAttrition = ((donorMonthlySub * (gatewayPercentage / 100)) + gatewayBaseFee) * activeAbahlali;
  const netOperationalPool = grossRevenue - gatewayAttrition;
  const totalWatcherStipends = activeAbahlali * volunteerStipendSplit;
  const platformOverhead = activeAbahlali * platformMaintenanceSplit;

  const isCodeRed = netOperationalPool < (totalWatcherStipends + platformOverhead);

  // Handlers
  const handleUpdateSub = (val: number) => {
    setState(s => ({
      ...s,
      financialEngine: { ...s.financialEngine, donorMonthlySub: val }
    }));
  };

  const toggleWatcherStatus = (id: string) => {
    setState(s => ({
      ...s,
      watchers: s.watchers.map(w => w.id === id ? { ...w, status: w.status === 'CLEARED' ? 'PENDING' : 'CLEARED' } : w)
    }));
  };

  const handleAddWatcher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatcherName || !newWatcherId) return;
    const newWatcher = {
      id: `W-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newWatcherName,
      idNumber: newWatcherId,
      beat: newWatcherBeat,
      status: 'PENDING' as const
    };
    setState(s => ({ ...s, watchers: [...s.watchers, newWatcher] }));
    setNewWatcherName('');
    setNewWatcherId('');
  };

  const handleAddAbahlali = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAbahlaliAddress || !newAbahlaliMac) return;
    const newAba = {
      id: `H-${Math.floor(1000 + Math.random() * 9000)}`,
      address: newAbahlaliAddress,
      beat: newAbahlaliBeat,
      assignedITag: newAbahlaliMac,
      isActive: true
    };
    setState(s => ({ ...s, abahlali: [...s.abahlali, newAba] }));
    setNewAbahlaliAddress('');
    setNewAbahlaliMac('');
  };

  return (
    <div className="bg-black min-h-screen text-slate-300 font-mono p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-500" />
              {state.organization.name}
            </h1>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
              Sector Induna Control Room • Terminal ID: {state.organization.id}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4 text-xs font-bold bg-slate-900 px-4 py-2 rounded-sm border border-slate-800">
            <span className="text-slate-400">STATUS:</span>
            <span className="text-emerald-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE</span>
          </div>
        </header>

        {/* MODULE A: Tactical Operations Math */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">
            Module A: Tactical Operations Math (Stipend Drop)
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm">
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block mb-2">Adjust Donor Monthly Sub (ZAR)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="20" max="200" step="5"
                    value={donorMonthlySub} 
                    onChange={e => handleUpdateSub(parseFloat(e.target.value))}
                    className="w-full max-w-md accent-emerald-500"
                  />
                  <span className="text-emerald-400 font-bold text-lg border-b border-emerald-900 px-2">
                    R {donorMonthlySub.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-slate-950 px-4 py-2 border border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-500 mb-1">Active Abahlali</div>
                <div className="text-2xl font-black text-white">{activeAbahlali}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-4">
              <div className="bg-slate-950 p-3 border border-slate-800">
                <div className="text-[9px] uppercase text-slate-500 mb-1">Gross Revenue</div>
                <div className="text-emerald-500 font-bold">R {grossRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3 border border-slate-800">
                <div className="text-[9px] uppercase text-slate-500 mb-1">Gateway Attrition</div>
                <div className="text-rose-500 font-bold">R {gatewayAttrition.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3 border border-slate-800">
                <div className="text-[9px] uppercase text-slate-500 mb-1">Net Ops Pool</div>
                <div className="text-cyan-400 font-bold">R {netOperationalPool.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3 border border-slate-800">
                <div className="text-[9px] uppercase text-slate-500 mb-1">Total Stipends</div>
                <div className="text-amber-400 font-bold">R {totalWatcherStipends.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3 border border-slate-800">
                <div className="text-[9px] uppercase text-slate-500 mb-1">Platform Overhead</div>
                <div className="text-slate-300 font-bold">R {platformOverhead.toFixed(2)}</div>
              </div>
            </div>

            {isCodeRed && (
              <div className="bg-rose-950/40 border border-rose-500/50 p-3 flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-rose-500 uppercase">CODE RED: GATEWAY ATTRITION EXCEEDS STIPEND TARGETS</div>
                  <div className="text-[10px] text-rose-400 uppercase mt-1">Adjust Subscription Tier to ensure Ivolontiya receive full compensation.</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* MODULE B: Block Watcher Vetting Matrix */}
          <section className="space-y-4">
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest border-l-4 border-amber-500 pl-2">
              Module B: Ivolontiya Matrix
            </h2>
            
            <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800 bg-slate-950">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
                  <UserPlus className="w-3 h-3" /> Enlist New Block Watcher
                </h3>
                <form onSubmit={handleAddWatcher} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" placeholder="Full Name" value={newWatcherName} onChange={e => setNewWatcherName(e.target.value)} required className="bg-black border border-slate-800 p-2 text-xs text-white outline-none focus:border-amber-500" />
                  <input type="text" placeholder="ID Number" value={newWatcherId} onChange={e => setNewWatcherId(e.target.value)} required className="bg-black border border-slate-800 p-2 text-xs text-white outline-none focus:border-amber-500" />
                  <select value={newWatcherBeat} onChange={e => setNewWatcherBeat(e.target.value)} className="bg-black border border-slate-800 p-2 text-xs text-white outline-none focus:border-amber-500">
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-[10px] p-2 transition-colors">Enlist</button>
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-[9px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Watcher Name</th>
                      <th className="p-3">ID Number</th>
                      <th className="p-3">Beat</th>
                      <th className="p-3 text-right">Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {state.watchers.map(w => (
                      <tr key={w.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3 font-bold text-slate-200">{w.name}</td>
                        <td className="p-3 text-slate-400">{w.idNumber}</td>
                        <td className="p-3 text-slate-400">{w.beat}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => toggleWatcherStatus(w.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[9px] uppercase font-bold border rounded-sm transition-colors ${
                              w.status === 'CLEARED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {w.status === 'CLEARED' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {w.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* MODULE C: iTag Provisioning */}
          <section className="space-y-4">
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest border-l-4 border-cyan-500 pl-2">
              Module C: ITag Provisioning
            </h2>
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 mb-4">
                <Radio className="w-3 h-3" /> Provision ITag to Abahlali
              </h3>
              
              <form onSubmit={handleAddAbahlali} className="space-y-4">
                <div>
                  <label className="text-[9px] uppercase text-slate-500 block mb-1">Street Address</label>
                  <input type="text" placeholder="e.g. 102 Vilikazi St" value={newAbahlaliAddress} onChange={e => setNewAbahlaliAddress(e.target.value)} required className="w-full bg-black border border-slate-800 p-2 text-xs text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-slate-500 block mb-1">Assigned Beat</label>
                  <select value={newAbahlaliBeat} onChange={e => setNewAbahlaliBeat(e.target.value)} className="w-full bg-black border border-slate-800 p-2 text-xs text-white outline-none focus:border-cyan-500">
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-800">
                  <label className="text-[9px] uppercase text-cyan-500 font-bold block mb-1">Scan/Enter iTag BLE MAC</label>
                  <input type="text" placeholder="AA:BB:CC:DD:EE:FF" value={newAbahlaliMac} onChange={e => setNewAbahlaliMac(e.target.value.toUpperCase())} required className="w-full bg-black border border-slate-800 p-2 text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500" />
                  <div className="text-[9px] text-slate-500 mt-2 uppercase tracking-wider text-right">
                    Provisioning Fee: <span className="text-cyan-400">R {state.financialEngine.iTagProvisionFee.toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase text-[10px] p-3 transition-colors flex justify-center items-center gap-2">
                  <Database className="w-4 h-4" /> Commit to Ledger
                </button>
              </form>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm max-h-[250px] overflow-y-auto">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Abahlali Ledger</h3>
              <div className="space-y-2">
                {state.abahlali.map(a => (
                  <div key={a.id} className="flex justify-between items-center text-[10px] bg-slate-950 p-2 border border-slate-800/50">
                    <div>
                      <div className="text-slate-300 font-bold">{a.address}</div>
                      <div className="text-slate-500">{a.beat}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-500 font-mono">{a.assignedITag}</div>
                      <div className="text-emerald-500 uppercase">Active</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}
