import sys

file_path = "src/components/landing/Layout.tsx"
with open(file_path, "r") as f:
    content = f.read()

old_footer_bottom = """          <div className="border-t border-slate-800 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <span className="text-[12px] text-slate-400 font-medium">Powered by ©TM Media Solutions — Reg: 2018/500191/07</span>
              <a href="https://safetylink.online" className="text-[12px] text-[#15803d] font-semibold hover:underline">safetylink.online</a>
            </div>
            <p className="text-[12px] text-[#15803d] font-bold tracking-[0.15em] uppercase text-center">
              STAY CONNECTED. STAY PROTECTED. STAY IN CONTROL.
            </p>
            <div className="flex flex-col gap-1.5 text-center md:text-right">
              <span className="text-[12px] text-slate-400">Contact: 073 944 1222</span>
              <span className="text-[12px] text-slate-500 italic font-semibold">K'lev.c</span>
            </div>
          </div>
          <div className="text-center py-6 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">
              SafetyLink® is a registered trademark. © 2024–2026 SafetyLink. All rights reserved.
            </p>
          </div>"""
          
new_footer_bottom = """          <div className="border-t border-slate-800 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <span className="text-[12px] text-slate-400 font-medium">Powered by ©TM Media Solutions — Reg: 2018/500191/07</span>
              <a href="https://safetylink.online" className="text-[12px] text-[#15803d] font-semibold hover:underline">safetylink.online</a>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <p className="text-[12px] text-[#15803d] font-bold tracking-[0.15em] uppercase text-center">
                STAY CONNECTED. STAY PROTECTED. STAY IN CONTROL.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <a href="https://wa.me/27739441222" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#15803d] transition-colors"><i className="fa-brands fa-whatsapp text-xl"></i></a>
                <a href="#" className="text-slate-400 hover:text-blue-500 transition-colors"><i className="fa-brands fa-facebook text-xl"></i></a>
                <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors"><i className="fa-brands fa-twitter text-xl"></i></a>
                <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors"><i className="fa-brands fa-instagram text-xl"></i></a>
                <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-brands fa-linkedin text-xl"></i></a>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-center md:text-right">
              <span className="text-[12px] text-slate-400">Contact: 073 944 1222</span>
              <span className="text-[12px] text-slate-500 italic font-semibold">K'lev.c</span>
            </div>
          </div>
          <div className="text-center py-6 border-t border-slate-800 flex flex-col sm:flex-row justify-center items-center gap-4">
            <p className="text-[11px] text-slate-500">
              SafetyLink® is a registered trademark. © 2024–2026 SafetyLink. All rights reserved.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { if(onLogin) onLogin(); }} className="text-[11px] font-bold text-slate-400 hover:text-white uppercase transition-colors px-2 border-r border-slate-700">Login</button>
              <button onClick={() => { if(onRegisterUser) onRegisterUser(); }} className="text-[11px] font-bold text-slate-400 hover:text-white uppercase transition-colors px-2">Create Account</button>
            </div>
          </div>"""

content = content.replace(old_footer_bottom, new_footer_bottom)

with open(file_path, "w") as f:
    f.write(content)

