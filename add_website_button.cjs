const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newButton = `
                  <button
                    onClick={() => { setShowLanding(true); setIsDrawerOpen(false); }}
                    className={\`w-full p-4 rounded-2xl flex items-center gap-3 transition-colors text-slate-400 hover:bg-slate-900/50 cursor-pointer\`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-black text-sm uppercase tracking-wider text-slate-200">Public Website</div>
                      <div className="text-[10px] text-slate-500">View products & pricing</div>
                    </div>
                  </button>
                  `;

code = code.replace("onClick={() => { setActiveTab('settings'); setIsDrawerOpen(false); }}", "onClick={() => { setActiveTab('settings'); setIsDrawerOpen(false); }}");

code = code.replace(
  /<button\s+onClick=\{\(\) => \{ setActiveTab\('settings'\); setIsDrawerOpen\(false\); \}\}[\s\S]*?<\/button>/,
  (match) => match + newButton
);

fs.writeFileSync('src/App.tsx', code);
