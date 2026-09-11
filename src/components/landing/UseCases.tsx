// @ts-nocheck
import React, { useState } from 'react';
import './Home.css';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

const VIDEOS = [
  { id:'myQ09slWdRBdxOPnyVvZnqShDbSmTQkw', label:'Offline-First Demo', tag:'LOAD SHEDDING', desc:'See SafetyLink dispatch an alert with zero data and zero airtime during a load-shedding blackout.' },
  { id:'1S-57V_CIqrP-A9FQkym4uzIEmBNimFtR', label:'Competitor Kill-Sheet', tag:'VS COMPETITION', desc:'How SafetyLink beats Namola, Life360, AURA and PanicSA — head to head.' },
  { id:'1y4lEJw3Qlv8W2Wy-oP0b6z9dEO4q-lLZ', label:'Field Demonstration', tag:'LIVE DEMO', desc:'Live field demonstration of the BLE iTag panic trigger and AI voice dispatch sequence.' },
];

const SECTORS = [
  { emoji:'🏘️', tag:'RESIDENTIAL', title:'Gated Estates & Complexes', desc:'Real-time panic alerts, visitor tracking, perimeter alerts and armed response dispatch. Every resident protected — even with R0 airtime.', features:['BLE keyfob panic triggers','WhatsApp + SMS dispatch','Armed response coordination','Live GIS map for security booth'] },
  { emoji:'🏢', tag:'ENTERPRISE', title:'Corporates & Campuses', desc:'Lone-worker protection, duress code activation, multi-floor responder routing and AES-256-GCM evidence capture.', features:['Silent duress code SOS','Multi-floor responder routing','Cryptographic evidence vault','API integration with HR systems'] },
  { emoji:'🏫', tag:'EDUCATION', title:'Schools & Universities', desc:'Pupil tracking, parent notification chains, lockdown protocol dispatch and dedicated security staff escalation.', features:['Learner iTag wristbands','Parent SMS + WhatsApp alerts','Lockdown mode activation','Integration with school security'] },
  { emoji:'🏥', tag:'HEALTHCARE', title:'Clinics & Hospitals', desc:'Staff duress alerts, patient elopement detection and AI voice dispatch for code-blue events in medical facilities.', features:['Clinical staff duress buttons','Patient elopement alerts','Code-blue dispatch chain','POPIA-compliant evidence logs'] },
  { emoji:'🚛', tag:'LOGISTICS', title:'Transport & Field Ops', desc:'Driver SOS with GPS coordinates, route deviation alerts, cargo protection and real-time fleet situational awareness.', features:['Driver GPS panic trigger','Route deviation detection','Fleet command dashboard','Multi-driver dispatch coordination'] },
  { emoji:'🏛️', tag:'MUNICIPAL', title:'Municipalities & SAPS', desc:'Community safety networks, neighborhood watch coordination, B-BBEE Level 1 compliance advantage for government procurement.', features:['Community mesh network','Neighborhood watch dispatch','SAPS coordination API','B-BBEE Level 1 certified'] },
];

export function UseCases({ onLogin, onRegisterUser, onRegisterOrg, navigate }: Props) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeSector, setActiveSector] = useState(0);

  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh' }}>

      {activeVideo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.95)', zIndex:999999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <button onClick={() => setActiveVideo(null)} style={{ position:'absolute', top:'20px', right:'20px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'white', fontSize:'14px', padding:'8px 16px', borderRadius:'8px', cursor:'pointer' }}>✕ Close</button>
          <video
            src={`https://drive.google.com/uc?export=download&id=${activeVideo}`}
            controls autoPlay
            style={{ width:'90%', maxWidth:'1000px', borderRadius:'12px' }}
          />
        </div>
      )}

      {/* ── HEADER ── */}
      <section style={{ padding:'80px 40px 60px', background:'linear-gradient(135deg,#070a0f 0%,#0d1117 100%)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// WHO WE PROTECT</div>
          <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:900, letterSpacing:'-.04em', lineHeight:.92, marginBottom:'20px' }}>
            Every sector.<br/><span style={{ color:'#e8321e', fontStyle:'italic' }}>One platform.</span>
          </h1>
          <p style={{ fontSize:'15px', color:'#8892a4', maxWidth:'560px', lineHeight:1.7 }}>
            From gated estates to hospitals and municipal networks — SafetyLink adapts to every security environment in South Africa.
          </p>
        </div>
      </section>

      {/* ── VIDEOS ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// SEE IT IN ACTION</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'40px' }}>Watch SafetyLink Work.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {VIDEOS.map((v, i) => (
              <button key={i} onClick={() => setActiveVideo(v.id)}
                style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden', cursor:'pointer', textAlign:'left', transition:'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='rgba(232,50,30,.4)'; e.currentTarget.style.background='rgba(232,50,30,.05)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.07)'; e.currentTarget.style.background='rgba(255,255,255,.03)'; }}>
                {/* Thumbnail area */}
                <div style={{ aspectRatio:'16/9', background:'#111820', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'rgba(232,50,30,.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', zIndex:2 }}>▶</div>
                  <span style={{ position:'absolute', top:'12px', left:'12px', fontFamily:"'JetBrains Mono',monospace", fontSize:'8px', color:'#e8321e', background:'rgba(232,50,30,.15)', border:'1px solid rgba(232,50,30,.3)', padding:'3px 8px', borderRadius:'4px', letterSpacing:'.1em' }}>{v.tag}</span>
                </div>
                <div style={{ padding:'20px' }}>
                  <div style={{ fontSize:'14px', fontWeight:800, marginBottom:'8px', color:'#f0f4f8' }}>{v.label}</div>
                  <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.5 }}>{v.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORS ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// DEPLOYMENT SECTORS</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'40px' }}>Where We Deploy.</h2>

          {/* Sector tabs */}
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'32px' }}>
            {SECTORS.map((s, i) => (
              <button key={i} onClick={() => setActiveSector(i)}
                style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'11px', fontWeight:700, letterSpacing:'.08em', cursor:'pointer', transition:'all .2s',
                  background: activeSector === i ? '#e8321e' : 'rgba(255,255,255,.04)',
                  color: activeSector === i ? '#fff' : '#8892a4',
                  border: activeSector === i ? '1px solid #e8321e' : '1px solid rgba(255,255,255,.08)' }}>
                {s.emoji} {s.tag}
              </button>
            ))}
          </div>

          {/* Active sector detail */}
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(232,50,30,.2)', borderRadius:'16px', padding:'36px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px', alignItems:'start' }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#e8321e', letterSpacing:'.16em', marginBottom:'12px' }}>{SECTORS[activeSector].tag}</div>
              <h3 style={{ fontSize:'clamp(20px,3vw,32px)', fontWeight:900, marginBottom:'16px' }}>{SECTORS[activeSector].title}</h3>
              <p style={{ fontSize:'14px', color:'#8892a4', lineHeight:1.7, marginBottom:'24px' }}>{SECTORS[activeSector].desc}</p>
              <button onClick={onRegisterOrg} style={{ background:'#e8321e', color:'#fff', padding:'12px 24px', borderRadius:'8px', fontWeight:700, fontSize:'11px', letterSpacing:'.1em', border:'none', cursor:'pointer' }}>
                DEPLOY FOR MY SECTOR →
              </button>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#8892a4', letterSpacing:'.14em', marginBottom:'16px', textTransform:'uppercase' }}>Core Features</div>
              <ul style={{ listStyle:'none' }}>
                {SECTORS[activeSector].features.map((f, i) => (
                  <li key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:'13px', color:'#c8d0dc' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', flexShrink:0 }}/>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPETITOR MATRIX ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// COMPETITIVE POSITIONING</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'16px' }}>Why SafetyLink Wins.</h2>
          <p style={{ color:'#8892a4', marginBottom:'40px', fontSize:'15px', lineHeight:1.7 }}>
            <strong style={{ color:'#f0f4f8' }}>70% cheaper. 11× more features.</strong> The only hardware-integrated, offline-resilient safety ecosystem in South Africa.
          </p>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,.1)' }}>
                  {['Feature', 'SafetyLink®', 'Namola', 'Life360', 'Google Safety', 'PanicSA'].map((h, i) => (
                    <th key={i} style={{ padding:'12px 16px', textAlign:'left', color: i === 1 ? '#e8321e' : '#8892a4', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', fontSize:'10px', background: i === 1 ? 'rgba(232,50,30,.06)' : 'transparent' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Offline / Zero-Data Trigger', '✅ USSD + BLE Mesh', '❌ Needs Data', '❌ Needs Data', '❌ Needs Data', '❌ Needs Data'],
                  ['Physical Hardware Button', '✅ R100 iTAG', '❌ App Only', '❌ App Only', '❌ App Only', '❌ App Only'],
                  ['AI Voice Dispatch (11 langs)', '✅ VAPI + Bland.ai', '❌ Human Ops', '❌ Human Ops', '❌ Human Ops', '❌ Human Ops'],
                  ['Lock-Screen Bypass', '✅ 1.5s Hold', '❌ Unlock Required', '❌ Unlock Required', '⚠️ Power Button', '❌ Unlock Required'],
                  ['B-BBEE Level 1 Certified', '✅ 135% Recognition', '❌ Level 4', '❌ Non-SA', '❌ Non-SA', '❌ Uncertified'],
                  ['POPIA + SA-Hosted Data', '✅ 100% Local', '✅ Local', '❌ US Servers', '❌ US Servers', '✅ Local'],
                  ['Price (Individual)', '✅ R49/month', 'R99–R149/mo', 'R120–R250/mo', 'OS-included', 'R89–R120/mo'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding:'14px 16px', fontSize:'11px', background: j === 1 ? 'rgba(232,50,30,.04)' : 'transparent',
                        color: j === 0 ? '#c8d0dc' : cell.startsWith('✅') ? '#00e676' : cell.startsWith('❌') ? '#ef4444' : cell.startsWith('⚠️') ? '#f5a623' : '#8892a4' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.12}}`}</style>
    </div>
  );
}
