const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const themeSection = `
      {/* App Preferences */}
      <div className="space-y-3 text-left mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          🎨 APP PREFERENCES
        </h4>
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200">Global Theme</div>
            <div className="text-[10px] text-slate-500">Switch to Light Mode for high-contrast outdoors</div>
          </div>
          <button 
            onClick={() => useAppStore.getState().setGlobalTheme(useAppStore.getState().globalTheme === 'dark' ? 'light' : 'dark')}
            className={\`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors \${useAppStore.getState().globalTheme === 'light' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}\`}
          >
            {useAppStore.getState().globalTheme === 'light' ? 'LIGHT (ENABLED)' : 'TACTICAL DARK'}
          </button>
        </div>
      </div>
`;

code = code.replace('{/* Diagnostics Quick Panel */}', themeSection + '\n      {/* Diagnostics Quick Panel */}');

fs.writeFileSync('src/components/Settings.tsx', code);
console.log('Patched Settings.tsx');
