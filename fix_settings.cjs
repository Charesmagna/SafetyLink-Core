const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const badBlock = `<input type="text" value={twilioFromNumber} onChange={e =>

                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
 setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />`;

const goodBlock = `<input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>`;

content = content.split(badBlock).join(goodBlock);
fs.writeFileSync('src/components/Settings.tsx', content);
