const fs = require('fs');
let code = fs.readFileSync('src/components/OrgDashboard.tsx', 'utf8');

// Add import
if (!code.includes("import { EvidenceLedger } from './EvidenceLedger';")) {
  code = code.replace("export const OrgDashboard", "import { EvidenceLedger } from './EvidenceLedger';\n\nexport const OrgDashboard");
}

// Add tab button after dispatch
const rosterTab = `          <button
            onClick={() => setActiveSubTab('roster')}`;

const evidenceTab = `          <button
            onClick={() => setActiveSubTab('evidence')}
            className={\`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all \${
              activeSubTab === 'evidence' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }\`}
          >
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-scale-balanced"></i>
              Evidence Ledger
            </div>
          </button>
`;

if (!code.includes("setActiveSubTab('evidence')")) {
  code = code.replace(rosterTab, evidenceTab + "\n" + rosterTab);
}

// Add content area before roster
const rosterContent = `        {activeSubTab === 'roster' && (`;
const evidenceContent = `        {activeSubTab === 'evidence' && (
          <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden p-2">
            <EvidenceLedger />
          </div>
        )}
`;

if (!code.includes("activeSubTab === 'evidence' &&")) {
  code = code.replace(rosterContent, evidenceContent + "\n" + rosterContent);
}

fs.writeFileSync('src/components/OrgDashboard.tsx', code);
