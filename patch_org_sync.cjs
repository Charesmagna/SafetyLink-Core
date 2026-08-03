const fs = require('fs');
const path = 'src/components/OrgDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const importTarget = "import { IncidentReportingTemplates } from './IncidentReportingTemplates';";
const importRepl = "import { IncidentReportingTemplates } from './IncidentReportingTemplates';\nimport { AdvancedOfflineSyncManager } from './AdvancedOfflineSyncManager';";
content = content.replace(importTarget, importRepl);

const tabTarget = `            onClick={() => setActiveSubTab('incident-reporting')}
            className={\`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all \${
              activeSubTab === 'incident-reporting' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            📄 Incident Templates
          </button>}`;
const tabRepl = `            onClick={() => setActiveSubTab('incident-reporting')}
            className={\`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all \${
              activeSubTab === 'incident-reporting' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            📄 Incident Templates
          </button>}
          {!isResponder && <button
            onClick={() => setActiveSubTab('offline-sync')}
            className={\`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all \${
              activeSubTab === 'offline-sync' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            🔄 Offline Sync
          </button>}`;
content = content.replace(tabTarget, tabRepl);

const renderTarget = `        {activeSubTab === 'referrals' && (`;
const renderRepl = `        {activeSubTab === 'offline-sync' && (
          <AdvancedOfflineSyncManager />
        )}
        
        {activeSubTab === 'referrals' && (`;
content = content.replace(renderTarget, renderRepl);

fs.writeFileSync(path, content);
console.log('Patched OrgDashboard.tsx');
