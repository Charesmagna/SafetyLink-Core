const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const toggleHTML = `
              {/* Floating Widget Toggle */}
              <div className="space-y-2 text-left border-t border-slate-900 pt-4 relative z-10">
                <div className="flex items-center justify-between bg-slate-950 border border-slate-900 px-3 py-2.5 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider font-mono block">
                      🛡️ FLOATING WIDGET
                    </span>
                    <span className="text-[7.5px] text-slate-500 font-mono mt-0.5">Persistent safety toggle</span>
                  </div>
                  <button
                    onClick={() => setFloatingWidgetDeployed(!isFloatingWidgetDeployed)}
                    className={\`w-10 h-5 rounded-full relative transition-colors \${isFloatingWidgetDeployed ? 'bg-emerald-500' : 'bg-slate-700'}\`}
                  >
                    <span className={\`absolute top-0.5 bottom-0.5 w-4 bg-white rounded-full transition-all \${isFloatingWidgetDeployed ? 'right-0.5' : 'left-0.5'}\`} />
                  </button>
                </div>
              </div>
`;

content = content.replace('{/* Drawer footer with partnership info & Sign Out */}', toggleHTML + '\n              {/* Drawer footer with partnership info & Sign Out */}');

fs.writeFileSync('src/App.tsx', content);
