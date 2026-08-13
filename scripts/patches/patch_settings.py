with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

# Add new UI section
settings_ui = '''
      {/* Alert & Countdown Settings */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          🚨 ALERTS & COUNTDOWN
        </h4>
        <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <span className="text-[10px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">Panic Countdown Timer</span>
              <span className="text-[9px] text-slate-500 font-sans">Grace period before dispatch</span>
            </div>
            <select 
              className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded-lg p-1.5 font-bold"
              value={sosCountdownDuration}
              onChange={(e) => setSosCountdownDuration(Number(e.target.value))}
            >
              <option value={3}>3 Seconds</option>
              <option value={5}>5 Seconds</option>
              <option value={10}>10 Seconds</option>
            </select>
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-900/50 pt-3">
            <div className="text-left">
              <span className="text-[10px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">SOS Sound Setup</span>
              <span className="text-[9px] text-slate-500 font-sans">Alarm tone during distress</span>
            </div>
            <select 
              className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded-lg p-1.5 font-bold"
              value={sosSoundSetup}
              onChange={(e) => setSosSoundSetup(e.target.value)}
            >
              <option value="Standard Siren">Standard Siren</option>
              <option value="Piercing Alarm">Piercing Alarm</option>
              <option value="Stealth Vibrate">Stealth Vibrate (Silent)</option>
            </select>
          </div>

          <div className="flex justify-between items-center border-t border-slate-900/50 pt-3">
            <div className="text-left">
              <span className="text-[10px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">Silence All Alerts</span>
              <span className="text-[9px] text-slate-500 font-sans">Mute system sounds totally</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={silenceAlerts}
                onChange={(e) => setSilenceAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-900 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>
      </div>

      {/* External Resources */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          🌐 RESOURCES
        </h4>
        <div className="bg-slate-950/40 border border-slate-900/80 rounded-2xl p-4">
          <a 
            href="https://safetylink.online" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/50 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer font-mono flex items-center justify-center gap-2"
          >
            Visit SafetyLink.Online ↗
          </a>
        </div>
      </div>
'''

content = content.replace('      {/* Platform Commerce & Quotes Section */}', settings_ui + '\n      {/* Platform Commerce & Quotes Section */}')

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)

