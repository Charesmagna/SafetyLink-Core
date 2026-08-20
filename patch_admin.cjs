const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const badgeHtml = `
            {/* CI/CD Build Status */}
            <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-emerald-500 text-xl">
                  <i className="fa-brands fa-github"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Pipeline Status: SafetyLink Core</h3>
                  <p className="text-xs text-slate-400 mt-1">Live tracking of GitHub Actions CI/CD deployment pipeline.</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <a href="https://github.com/Charesmagna/SafetyLink-Core/actions" target="_blank" rel="noreferrer">
                  <img src="https://github.com/Charesmagna/SafetyLink-Core/actions/workflows/build-apk.yml/badge.svg" alt="Build APK Status" className="h-5" />
                </a>
                <a href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest" target="_blank" rel="noreferrer" className="text-[10px] font-mono text-amber-500 hover:text-amber-400 hover:underline">
                  Download Latest Artifact →
                </a>
              </div>
            </div>
`;

code = code.replace(
  /\{\/\* Quick Stats Grid \*\/\}/,
  badgeHtml + '\n            {/* Quick Stats Grid */}'
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Patched AdminPanel');
