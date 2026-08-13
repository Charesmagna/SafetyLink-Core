with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

bad_str = '''
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

content = content.replace(bad_str, '')

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)
