const fs = require('fs');
const path = 'src/components/OrgDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const importTarget = "import { MphakatiOverwatch } from './MphakatiOverwatch';";
const importRepl = "import { MphakatiOverwatch } from './MphakatiOverwatch';\nimport { NodeMeshOrchestration } from './NodeMeshOrchestration';\nimport { IncidentReportingTemplates } from './IncidentReportingTemplates';";
content = content.replace(importTarget, importRepl);

const tabTarget = `            onClick={() => setActiveSubTab('analytics')}`;
const tabRepl = `            onClick={() => setActiveSubTab('mesh-orchestration')}
            className={\`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all \${
              activeSubTab === 'mesh-orchestration' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            📡 Mesh Orchestration
          </button>}
          {!isResponder && <button
            onClick={() => setActiveSubTab('incident-reporting')}
            className={\`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all \${
              activeSubTab === 'incident-reporting' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            📄 Incident Templates
          </button>}
          {!isResponder && <button
            onClick={() => setActiveSubTab('analytics')}`;
content = content.replace(tabTarget, tabRepl);

const renderTarget = `        {activeSubTab === 'referrals' && (`;
const renderRepl = `        {activeSubTab === 'mesh-orchestration' && (
          <NodeMeshOrchestration />
        )}
        
        {activeSubTab === 'incident-reporting' && (
          <IncidentReportingTemplates />
        )}
        
        {activeSubTab === 'referrals' && (`;
content = content.replace(renderTarget, renderRepl);

fs.writeFileSync(path, content);
console.log('Patched OrgDashboard.tsx');
