const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

if (!code.includes("import { EvidenceLedger } from './EvidenceLedger';")) {
  code = code.replace("export const AdminPanel: React.FC", "import { EvidenceLedger } from './EvidenceLedger';\n\nexport const AdminPanel: React.FC");
}

const origTabsType = `type AdminTab = 'OVERVIEW' | 'USERS' | 'ORGANIZATIONS' | 'PANICS' | 'SETTINGS' | 'ADVANCED_ROLES';`;
if (code.includes(origTabsType)) {
  code = code.replace(origTabsType, `type AdminTab = 'OVERVIEW' | 'USERS' | 'ORGANIZATIONS' | 'PANICS' | 'SETTINGS' | 'ADVANCED_ROLES' | 'EVIDENCE';`);
}

const tabButtonBefore = `          <button
            onClick={() => setActiveTab('PANICS')}`;
            
const evidenceAdminTab = `          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={\`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-colors \${
              activeTab === 'EVIDENCE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }\`}
          >
            <i className="fa-solid fa-scale-balanced"></i>
            Evidence Ledger
          </button>
`;
if (!code.includes("setActiveTab('EVIDENCE')")) {
  code = code.replace(tabButtonBefore, evidenceAdminTab + "\n" + tabButtonBefore);
}

const contentBefore = `        {activeTab === 'PANICS' && (`;
const evidenceAdminContent = `        {activeTab === 'EVIDENCE' && (
          <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden p-2">
            <EvidenceLedger />
          </div>
        )}
`;
if (!code.includes("activeTab === 'EVIDENCE' &&")) {
  code = code.replace(contentBefore, evidenceAdminContent + "\n" + contentBefore);
}

fs.writeFileSync('src/components/AdminPanel.tsx', code);
