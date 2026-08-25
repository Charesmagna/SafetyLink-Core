const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

// 1. Add PricingCalculator component
const calcComponent = `
function PricingCalculator() {
  const [residents, setResidents] = useState(1);
  const [tags, setTags] = useState({lite: 1, active: 0, premium: 0, pack5: 0});

  const residentMonthly = residents * 49;
  
  const hardwareLite = tags.lite * 149;
  const hardwareActive = tags.active * 199;
  const hardwarePremium = tags.premium * 348;
  const hardwarePack5 = tags.pack5 * 499;
  
  const totalHardware = hardwareLite + hardwareActive + hardwarePremium + hardwarePack5;

  return (
    <div className="mt-16 bg-slate-50 rounded-2xl p-6 border border-slate-200" style={{maxWidth: '800px', margin: '40px auto 0'}}>
      <h3 className="text-xl font-bold text-slate-800 mb-6" style={{textAlign: 'center'}}>Interactive Setup Calculator</h3>
      <div className="grid md:grid-cols-2 gap-8" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px'}}>
        <div>
           <div className="mb-6" style={{marginBottom: '24px'}}>
             <label className="block text-sm font-semibold text-slate-700 mb-2" style={{display: 'block', marginBottom: '8px'}}>Number of Residents (R49/mo)</label>
             <input type="number" min="1" value={residents} onChange={e => setResidents(Math.max(1, parseInt(e.target.value)||1))} style={{width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px'}} />
           </div>
           
           <h4 className="text-sm font-semibold text-slate-700 mb-2" style={{marginBottom: '12px'}}>Hardware (Once-off)</h4>
           <div className="space-y-3" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>Lite iTAG (R149)</span>
               <input type="number" min="0" value={tags.lite} onChange={e => setTags({...tags, lite: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>Active iTAG (R199)</span>
               <input type="number" min="0" value={tags.active} onChange={e => setTags({...tags, active: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>Premium iTAG (R348)</span>
               <input type="number" min="0" value={tags.premium} onChange={e => setTags({...tags, premium: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>5-Pack iTAG (R499)</span>
               <input type="number" min="0" value={tags.pack5} onChange={e => setTags({...tags, pack5: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
           </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center" style={{background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
           <div className="mb-6" style={{marginBottom: '24px'}}>
             <div className="text-sm text-slate-500 font-medium" style={{color: '#64748b', fontSize: '14px', fontWeight: 500}}>Monthly Subscription</div>
             <div className="text-3xl font-bold text-slate-800" style={{fontSize: '30px', fontWeight: 800, color: '#1e293b'}}>R{residentMonthly.toLocaleString()} <span className="text-base font-normal text-slate-500" style={{fontSize: '16px', fontWeight: 400, color: '#64748b'}}>/mo</span></div>
           </div>
           
           <div className="mb-6" style={{marginBottom: '24px'}}>
             <div className="text-sm text-slate-500 font-medium" style={{color: '#64748b', fontSize: '14px', fontWeight: 500}}>Once-off Hardware</div>
             <div className="text-3xl font-bold text-slate-800" style={{fontSize: '30px', fontWeight: 800, color: '#1e293b'}}>R{totalHardware.toLocaleString()}</div>
           </div>
           
           <div className="pt-4 border-t border-slate-100" style={{paddingTop: '16px', borderTop: '1px solid #f1f5f9'}}>
             <div className="text-sm text-slate-500 font-medium" style={{color: '#64748b', fontSize: '14px', fontWeight: 500}}>Total First Month</div>
             <div className="text-4xl font-black text-emerald-600" style={{fontSize: '36px', fontWeight: 900, color: '#059669'}}>R{(residentMonthly + totalHardware).toLocaleString()}</div>
           </div>
        </div>
      </div>
    </div>
  )
}

`;

if (!code.includes('PricingCalculator()')) {
  code = code.replace(/export function Home/, calcComponent + 'export function Home');
}

// 2. Insert <PricingCalculator /> into the pricing section
if (!code.includes('<PricingCalculator />')) {
  code = code.replace(/<\/div>\n\s*<\/section>\n\s*\{\/\* ══ DOWNLOAD ══ \*\/\}/, `          </div>\n          <PricingCalculator />\n        </div>\n      </section>\n\n      {/* ══ DOWNLOAD ══ */}`);
}

// 3. Update the text on cards from + R149 once-off registration to From R149 once-off hardware
code = code.replace(/\+ R149 once-off registration/g, 'From R149 once-off hardware');
code = code.replace(/\+ R149 once-off per resident/g, 'From R149 once-off hardware per resident');

// 4. Update the contact info (Facebook, email)
code = code.replace(
  /<a href="https:\/\/wa.me\/27739441222" target="_blank" rel="noreferrer">Contact Us<\/a>/g,
  `<a href="https://wa.me/27739441222" target="_blank" rel="noreferrer">Contact Us</a>\n              <a href="mailto:info@safetylink.online">Email Us</a>\n              <a href="https://www.facebook.com/share/1D8xnzfY8T/" target="_blank" rel="noreferrer">Facebook</a>`
);

fs.writeFileSync('src/components/landing/Home.tsx', code);
