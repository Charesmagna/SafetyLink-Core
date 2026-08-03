const fs = require('fs');
const path = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const tabTarget = "type AdminTab = 'OVERVIEW' | 'USERS' | 'ORGANIZATIONS' | 'PANICS' | 'SETTINGS';";
const tabRepl = "type AdminTab = 'OVERVIEW' | 'USERS' | 'ORGANIZATIONS' | 'PANICS' | 'SETTINGS' | 'ADVANCED_ROLES';";
content = content.replace(tabTarget, tabRepl);

const navTarget = "        {(['OVERVIEW', 'USERS', 'ORGANIZATIONS', 'PANICS', 'SETTINGS'] as AdminTab[]).map((tab) => (";
const navRepl = "        {(['OVERVIEW', 'USERS', 'ORGANIZATIONS', 'PANICS', 'SETTINGS', 'ADVANCED_ROLES'] as AdminTab[]).map((tab) => (";
content = content.replace(navTarget, navRepl);

const renderTarget = `        {/* TAB: SETTINGS */}`;
const renderRepl = `        {/* TAB: ADVANCED ROLES */}
        {activeTab === 'ADVANCED_ROLES' && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold font-mono tracking-widest text-slate-100 flex items-center gap-3">
              <span>🎭 ADVANCED ROLE SIMULATION</span>
            </h2>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <p className="text-sm text-slate-400">
                Simulate different user profiles across the SafetyLink ecosystem to verify Role-Based Access Routing (RBAR).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-indigo-500/30 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-indigo-400 font-mono mb-2">SL-admin-0000</h3>
                    <p className="text-xs text-slate-500 mb-4">Super Admin Profile. Full access to SL Global Command Center, top-tier audit logs, and master user control.</p>
                  </div>
                  <button className="py-2 px-4 w-full bg-indigo-900/30 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors">
                    Impersonate
                  </button>
                </div>
                
                <div className="p-4 bg-slate-950 rounded-lg border border-emerald-500/30 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-emerald-400 font-mono mb-2">SL-ORG-XXXX</h3>
                    <p className="text-xs text-slate-500 mb-4">Organization / Entity Profile. Opens Safety Node Commander Deck specific to bound node (e.g. Security Company, School).</p>
                  </div>
                  <button className="py-2 px-4 w-full bg-emerald-900/30 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors">
                    Impersonate
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-amber-500/30 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-amber-400 font-mono mb-2">End User / Responder</h3>
                    <p className="text-xs text-slate-500 mb-4">Standard Profile. Opens Safety Hub Workspace exposing central panic trigger, BLE scanner, and GIS map.</p>
                  </div>
                  <button className="py-2 px-4 w-full bg-amber-900/30 hover:bg-amber-600 border border-amber-500/30 text-amber-300 hover:text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors">
                    Impersonate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}`;
content = content.replace(renderTarget, renderRepl);

fs.writeFileSync(path, content);
console.log('Patched AdminPanel.tsx');
