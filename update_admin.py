import sys

file_path = "src/components/AdminPanel.tsx"
with open(file_path, "r") as f:
    content = f.read()

toggle_ui = """
            {/* Trial Settings */}
            <div className="glass-panel p-5 md:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="text-[10px]">🎟️</span> TRIAL SYSTEM
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Enable or disable the global 14-day trial banner for organizations</p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => useAppStore.getState().setTrialEnabled(!useAppStore.getState().isTrialEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${useAppStore.getState().isTrialEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${useAppStore.getState().isTrialEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className={`text-xs font-mono font-bold ${useAppStore.getState().isTrialEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
                    {useAppStore.getState().isTrialEnabled ? 'TRIAL SYSTEM ENABLED' : 'TRIAL SYSTEM DISABLED'}
                  </span>
                </div>
              </div>
            </div>
"""

content = content.replace("{/* Custom Backend Server */}", toggle_ui + "\n            {/* Custom Backend Server */}")

with open(file_path, "w") as f:
    f.write(content)
