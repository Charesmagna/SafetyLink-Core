// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import './Home.css';

interface HomeProps {
  onLogin: () => void;
  onRegisterOrg: () => void;
  onRegisterUser: () => void;
  navigate?: (page: string) => void;
}

const TRANSLATIONS = {
  en:  { h1a:'EMERGENCY DISPATCH,', h1b:'ENGINEERED FOR THE WORST DAY.', sub:'SafetyLink routes panic alerts across WhatsApp, SMS and voice — coordinating BLE keyfobs, responder rosters and evidence trails. Built for South Africa.' },
  zu:  { h1a:'UKULAWULWA KWEZIMO', h1b:'EZIPHUTHUMAYO, YAKHIWE NGENHLOSO.', sub:'SafetyLink ithumela izexwayiso zesandisi nge-WhatsApp, i-SMS kanye nezwi — esebenzisa izinkinobho ze-BLE.' },
  af:  { h1a:'NOODREAKSIE,', h1b:'BETROUBAAR GEBOU.', sub:'SafetyLink stuur paniekseine oor WhatsApp, SMS en stem — vir Suid-Afrika gebou.' },
  xh:  { h1a:'IMPENDULO YEXESHA', h1b:'ELIBUHLUNGU, YAKHELWE INJONGO.', sub:'SafetyLink ithuma izisilumkiso zexhala nge-WhatsApp, i-SMS kunye nezwi.' },
  st:  { h1a:'KARABELO EA TŠOHANYETSO', h1b:'E HAHILOE MOLAONG.', sub:'SafetyLink e romela melaetsa ea tšohanyetso ka WhatsApp, SMS le lentsoe.' },
  tn:  { h1a:'KARABELO YA TSHOGANYETSO', h1b:'E HAILWE KA MAIKAELELO.', sub:'SafetyLink e romela melaetsa ya tshoganyetso ka WhatsApp, SMS le lentswe.' },
};

const LOG_EVENTS = [
  { t:'07:46:39', ch:'BLE',       c:'#00e676', cr:'0,230,118',  tag:'TRIGGERED', ev:'unit-A-114 — panic press registered' },
  { t:'07:46:40', ch:'GPS',       c:'#0ea5e9', cr:'14,165,233', tag:'LOCK',      ev:'-26.2041°S 28.0473°E — accuracy 3m' },
  { t:'07:46:41', ch:'WhatsApp',  c:'#25d366', cr:'37,211,102', tag:'SENT',      ev:'Contact 1 → delivered ✓' },
  { t:'07:46:44', ch:'SMS',       c:'#f5a623', cr:'245,166,35', tag:'SENT',      ev:'Africa\'s Talking → 2 recipients' },
  { t:'07:46:48', ch:'VAPI',      c:'#a78bfa', cr:'167,139,250',tag:'DIALING',   ev:'AI voice call → +2773... ringing' },
  { t:'07:47:02', ch:'ACK',       c:'#00e676', cr:'0,230,118',  tag:'RESOLVED',  ev:'Responder confirmed on scene' },
];

export function Home({ onLogin, onRegisterOrg, onRegisterUser, navigate }: HomeProps) {
  const [language, setLanguage] = useState('en');
  const [logRows, setLogRows] = useState<typeof LOG_EVENTS>([]);
  const [tick, setTick] = useState(0);
  const logRef = useRef(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Live log animation
  useEffect(() => {
    let i = 0;
    const add = () => {
      setLogRows(prev => {
        const next = [...prev, LOG_EVENTS[i % LOG_EVENTS.length]];
        return next.slice(-7);
      });
      i++;
    };
    const iv = setInterval(add, 1800);
    add();
    return () => clearInterval(iv);
  }, []);

  // Counter tick
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', paddingTop:'80px', overflow:'hidden', background:'linear-gradient(135deg,#070a0f 0%,#0d1117 100%)' }}>
        {/* Scanline */}
        <div style={{ position:'absolute', inset:0, opacity:0.03, pointerEvents:'none', overflow:'hidden', zIndex:1 }}>
          <div style={{ position:'absolute', left:0, right:0, height:'2px', background:'linear-gradient(transparent,rgba(232,50,30,.8),transparent)', animation:'scanline 8s linear infinite' }}/>
        </div>

        {/* Counter bar */}
        <div style={{ position:'absolute', top:'70px', left:0, right:0, display:'flex', justifyContent:'space-between', padding:'0 40px', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'rgba(136,146,164,.3)', letterSpacing:'.1em', zIndex:2, pointerEvents:'none' }}>
          <span>{String(tick).padStart(8,'0')}</span>
          <span style={{ color:'rgba(232,50,30,.5)' }}>SAFETYLINK CORE</span>
          <span>00:00:{String(tick%60).padStart(2,'0')}.00</span>
        </div>

        <div style={{ position:'relative', zIndex:3, width:'100%', maxWidth:'1160px', margin:'0 auto', padding:'0 40px', display:'grid', gridTemplateColumns:'1fr 340px', gap:'64px', alignItems:'center' }}>
          {/* Left */}
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', letterSpacing:'.18em', color:'#ff3b2f', marginBottom:'20px', padding:'5px 12px', border:'1px solid rgba(232,50,30,.3)', borderRadius:'3px', background:'rgba(232,50,30,.06)' }}>
              ◆ MISSION-CRITICAL &nbsp;//&nbsp; MULTI-TENANT &nbsp;//&nbsp; OFFLINE-FIRST
            </div>

            {/* Language selector */}
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'6px', padding:'6px 12px', fontSize:'11px', fontWeight:700, color:'#f0f4f8', cursor:'pointer', outline:'none', marginBottom:'20px', fontFamily:'inherit' }}>
              {[['en','🌐 ENGLISH'],['zu','🌐 ZULU'],['af','🌐 AFRIKAANS'],['xh','🌐 XHOSA'],['st','🌐 SESOTHO'],['tn','🌐 SETSWANA'],['ts','🌐 TSONGA'],['ss','🌐 SWATI'],['ve','🌐 VENDA'],['nr','🌐 NDEBELE'],['nso','🌐 SEPEDI']].map(([v,l]) => (
                <option key={v} value={v} style={{ background:'#0d1117' }}>{l}</option>
              ))}
            </select>

            <h1 style={{ fontSize:'clamp(42px,7vw,80px)', fontWeight:900, letterSpacing:'-.04em', lineHeight:.95, marginBottom:'28px' }}>
              {t.h1a}<br/>
              <span style={{ color:'#e8321e', fontStyle:'italic' }}>{t.h1b}</span>
            </h1>
            <p style={{ fontSize:'15px', lineHeight:1.7, color:'#8892a4', maxWidth:'460px', marginBottom:'36px' }}>{t.sub}</p>

            <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
              <button onClick={onRegisterUser}
                style={{ background:'#e8321e', color:'#fff', fontSize:'11px', fontWeight:700, letterSpacing:'.1em', padding:'14px 28px', borderRadius:'8px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' }}>
                GET PROTECTED →
              </button>
              <button onClick={onRegisterOrg}
                style={{ fontSize:'12px', fontWeight:600, color:'#8892a4', padding:'13px 20px', border:'1px solid rgba(255,255,255,.12)', borderRadius:'8px', background:'transparent', cursor:'pointer' }}>
                DEPLOY FOR MY ORGANISATION
              </button>
              <button onClick={onLogin}
                style={{ fontSize:'11px', fontWeight:600, color:'#8892a4', background:'transparent', border:'none', cursor:'pointer', letterSpacing:'.08em' }}>
                SIGN IN →
              </button>
            </div>
          </div>

          {/* Live feed log */}
          <div style={{ background:'rgba(7,10,15,.75)', border:'1px solid rgba(232,50,30,.25)', borderRadius:'14px', overflow:'hidden', backdropFilter:'blur(24px)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,.07)', background:'rgba(0,0,0,.3)' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9.5px', color:'#8892a4', letterSpacing:'.1em' }}>LIVE_DISPATCH.LOG</span>
              <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#00e676', display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', display:'inline-block', animation:'blink 1.2s infinite' }}/>ACTIVE
              </span>
            </div>
            <div style={{ padding:'6px 0', minHeight:'200px' }}>
              {logRows.map((row, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'68px 1fr', gap:'8px', padding:'5px 14px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10.5px', borderBottom:'1px solid rgba(255,255,255,.025)' }}>
                  <span style={{ color:'rgba(136,146,164,.5)' }}>{row.t}</span>
                  <span>
                    <span style={{ color:row.c, fontWeight:700, marginRight:'5px' }}>{row.ch.toUpperCase()} ›</span>
                    <span style={{ color:'#c8d0dc' }}>{row.ev}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OPERATIONAL STATUS TICKER ──────────────────────────── */}
      <div style={{ background:'#0d1117', borderTop:'1px solid rgba(255,255,255,.07)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'16px 40px', display:'flex', alignItems:'center', gap:'32px', overflow:'hidden' }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', letterSpacing:'.16em', color:'#e8321e', flexShrink:0, display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', animation:'blink 1.2s infinite', display:'inline-block' }}/>OPERATIONAL STATUS
        </span>
        <div style={{ display:'flex', gap:'48px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8892a4', whiteSpace:'nowrap', animation:'marquee 24s linear infinite' }}>
          {['BLE GATEWAY ● LIVE','WHATSAPP RELAY ● LIVE','SMS GATEWAY ● LIVE','VAPI VOICE ● LIVE','USSD CALLBACK ● LIVE','AUDIT CHAIN ● SEALED','TENANTS ACTIVE ● 14','INCIDENTS TODAY ● 3',
            'BLE GATEWAY ● LIVE','WHATSAPP RELAY ● LIVE','SMS GATEWAY ● LIVE','VAPI VOICE ● LIVE'].map((item, i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ color: item.includes('3') ? '#f5a623' : '#00e676' }}>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ARMOURING COMMUNITIES ──────────────────────────────── */}
      <section style={{ padding:'100px 40px', background:'#070a0f', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// SOUTH AFRICAN PLATFORM</div>
            <h2 style={{ fontSize:'clamp(52px,10vw,112px)', fontWeight:900, letterSpacing:'-.05em', lineHeight:.88, textTransform:'uppercase', marginBottom:'28px' }}>
              ARMOURING<br/>COMMUNITIES.
            </h2>
            <p style={{ fontSize:'15px', lineHeight:1.7, color:'#8892a4', maxWidth:'440px', marginBottom:'32px' }}>
              Emergency response platform designed for mission-critical safety in South Africa. From 2-second panic alerts to advanced AI dispatch, we secure your community.
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <button onClick={onRegisterUser} style={{ background:'#e8321e', color:'#fff', padding:'14px 28px', borderRadius:'8px', fontWeight:700, fontSize:'11px', letterSpacing:'.1em', border:'none', cursor:'pointer' }}>START PROTECTION →</button>
              <button onClick={() => navigate?.('platform')} style={{ color:'#8892a4', padding:'13px 20px', border:'1px solid rgba(255,255,255,.12)', borderRadius:'8px', background:'transparent', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>LEARN MORE</button>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {[
              { icon:'⚡', title:'2-Second Hold Panic', desc:'Instantly trigger emergency alerts via BLE keyfob, on-screen SOS, or duress code.' },
              { icon:'📡', title:'Multi-Channel Dispatch', desc:'Sequential WhatsApp → SMS → Voice → USSD. Every step logged with cryptographic chain-of-custody.' },
              { icon:'🧠', title:'VAPI AI Voice Follow-Up', desc:'AI voice agent calls every contact in sequence until live acknowledgement is received.' },
              { icon:'🔒', title:'AES-256-GCM Encryption', desc:'Every data point secured end-to-end. ZK Evidence Vault with Cloudinary-backed storage.' },
            ].map((f, i) => (
              <div key={i} style={{ padding:'18px 0', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'flex-start', gap:'16px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'8px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', background:'rgba(232,50,30,.1)' }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'4px' }}>{f.title}</div>
                  <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.55 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <section style={{ borderTop:'1px solid rgba(255,255,255,.07)', borderBottom:'1px solid rgba(255,255,255,.07)', background:'#111820' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {[
            { val:'< 3s', lbl:'Dispatch Latency' },
            { val:'4×',   lbl:'Fallback Channels' },
            { val:'IP65', lbl:'BLE Keyfob Rating' },
            { val:'POPIA',lbl:'+ GDPR Compliant' },
          ].map((s, i) => (
            <div key={i} style={{ padding:'44px 40px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
              <div style={{ fontSize:'clamp(36px,5vw,56px)', fontWeight:900, letterSpacing:'-.04em', color:'#e8321e', lineHeight:1, marginBottom:'10px' }}>{s.val}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9.5px', letterSpacing:'.14em', color:'#8892a4', textTransform:'uppercase' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ESCALATION CHAIN ───────────────────────────────────── */}
      <section style={{ padding:'88px 40px', background:'#0d1117' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// 03 OFFLINE-FIRST</div>
          <h2 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, letterSpacing:'-.03em', lineHeight:1, marginBottom:'20px' }}>Queue locally.<br/>Fire on reconnect.</h2>
          <p style={{ fontSize:'15px', lineHeight:1.7, color:'#8892a4', maxWidth:'560px', marginBottom:'48px' }}>Every SOS survives blackouts, load-shedding and zero-data scenarios. Encrypted local queue drains automatically when signal returns.</p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'56px', alignItems:'start' }}>
            <div>
              {[
                { icon:'📡', label:'BLE Trigger', desc:'No airtime, no data — fires locally from wearable. < 200ms.', step:'STEP_1', c:'#00e676' },
                { icon:'💬', label:'WhatsApp (Twilio)', desc:'Rich message with GPS link + map. 30s delivery-receipt window before advance.', step:'STEP_2', c:'#25d366' },
                { icon:'📱', label:'SMS via Africa\'s Talking', desc:'BCC to estate admin and control-room supervisor. USSD callback registered.', step:'STEP_3', c:'#f5a623' },
                { icon:'📞', label:'VAPI AI Voice Dial', desc:'Dials each responder in sequence until live acknowledgement.', step:'STEP_4', c:'#a78bfa' },
                { icon:'📟', label:'USSD + Please Call Me', desc:'Zero-airtime fallback for uncontacted residents. Africa\'s Talking USSD.', step:'STEP_5', c:'#e8321e' },
                { icon:'✅', label:'Incident Resolved', desc:'Audit trail sealed. Evidence uploaded to Cloudinary. Tenant report generated.', step:'STEP_6', c:'#8892a4' },
              ].map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'16px', padding:'16px 0', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'8px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', background:`rgba(${s.c === '#00e676' ? '0,230,118' : s.c === '#f5a623' ? '245,166,35' : s.c === '#e8321e' ? '232,50,30' : '167,139,250'},.1)` }}>{s.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, marginBottom:'3px' }}>{s.label}</div>
                    <div style={{ fontSize:'11px', color:'#8892a4', lineHeight:1.5 }}>{s.desc}</div>
                  </div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'8.5px', color:s.c, letterSpacing:'.1em', flexShrink:0 }}>{s.step}</span>
                </div>
              ))}
            </div>

            {/* Live audit log */}
            <div style={{ background:'rgba(0,0,0,.2)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,.07)', background:'rgba(0,0,0,.25)' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', display:'inline-block', animation:'blink 1.2s infinite' }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#8892a4', letterSpacing:'.1em' }}>INCIDENT AUDIT LOG</span>
                <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#00e676' }}>ACTIVE</span>
              </div>
              <div style={{ padding:'4px 0', minHeight:'220px' }}>
                {logRows.map((row, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'68px 72px 108px 1fr', gap:'8px', padding:'6px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', borderBottom:'1px solid rgba(255,255,255,.025)' }}>
                    <span style={{ color:'rgba(136,146,164,.5)' }}>{row.t}</span>
                    <span style={{ color:row.c, fontWeight:700, fontSize:'9.5px' }}>{row.ch}</span>
                    <span style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.08em', padding:'1px 6px', borderRadius:'3px', background:`rgba(${row.cr},.1)`, color:row.c, border:`1px solid rgba(${row.cr},.3)` }}>{row.tag}</span>
                    <span style={{ color:'#8892a4', fontSize:'9.5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTORS ────────────────────────────────────────────── */}
      <section style={{ padding:'88px 40px', background:'#070a0f', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// WHO WE PROTECT</div>
          <h2 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, letterSpacing:'-.03em', lineHeight:1, marginBottom:'48px' }}>Every sector.<br/>One platform.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {[
              { tag:'RESIDENTIAL', title:'ESTATES & COMPLEXES', desc:'Real-time panic alerts, visitor tracking, perimeter alerts and armed response dispatch for gated communities.' },
              { tag:'ENTERPRISE', title:'CORPORATES & CAMPUSES', desc:'Lone-worker protection, duress code activation, multi-floor responder routing and evidence capture.' },
              { tag:'MUNICIPAL', title:'MUNICIPALITIES', desc:'Community safety networks, neighborhood watch coordination and integration with SAPS dispatch protocols.' },
              { tag:'EDUCATION', title:'SCHOOLS & CAMPUSES', desc:'Pupil tracking, parent notification, lockdown protocols and dedicated support staff escalation chains.' },
              { tag:'HEALTHCARE', title:'CLINICS & HOSPITALS', desc:'Staff duress alerts, patient elopement detection and code-blue dispatch for healthcare facilities.' },
              { tag:'LOGISTICS', title:'TRANSPORT & FIELD OPS', desc:'Driver SOS, route deviation alerts, cargo protection and real-time fleet situational awareness.' },
            ].map((s, i) => (
              <div key={i} style={{ background:'#0d1117', padding:'28px', cursor:'default', transition:'background .2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(232,50,30,.05)'}
                onMouseOut={e => e.currentTarget.style.background = '#0d1117'}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'8.5px', letterSpacing:'.16em', color:'#8892a4', marginBottom:'10px', textTransform:'uppercase' }}>{s.tag}</div>
                <div style={{ fontSize:'16px', fontWeight:800, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'.02em' }}>{s.title}</div>
                <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK NAV CARDS ────────────────────────────────────── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// EXPLORE MORE</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, marginBottom:'48px' }}>Everything you need to know</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'16px' }}>
            {[
              { emoji:'📱', label:'Platform', sub:'How it works', page:'platform' },
              { emoji:'📡', label:'Hardware', sub:'BLE & devices', page:'hardware' },
              { emoji:'🎯', label:'Use Cases', sub:'Who needs it', page:'usecases' },
              { emoji:'💎', label:'Pricing', sub:'Plans & costs', page:'pricing' },
              { emoji:'🏢', label:'Enterprise', sub:'For organisations', page:'enterprise' },
            ].map(c => (
              <button key={c.page} onClick={() => navigate?.(c.page)}
                style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'16px', padding:'24px 16px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', transition:'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.background='rgba(232,50,30,.06)'; e.currentTarget.style.borderColor='rgba(232,50,30,.3)'; }}
                onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)'; }}>
                <span style={{ fontSize:'2rem' }}>{c.emoji}</span>
                <span style={{ fontWeight:800, fontSize:'13px', color:'#f0f4f8', textTransform:'uppercase', letterSpacing:'.05em' }}>{c.label}</span>
                <span style={{ fontSize:'11px', color:'#8892a4' }}>{c.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD ────────────────────────────────────────────── */}
      <section style={{ padding:'88px 40px', background:'#070a0f', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// GET SAFETYLINK</div>
          <h2 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, letterSpacing:'-.03em', lineHeight:1, marginBottom:'20px' }}>Available on every<br/>platform.</h2>
          <p style={{ fontSize:'15px', lineHeight:1.7, color:'#8892a4', maxWidth:'560px', marginBottom:'48px' }}>Android APK, Windows Command Deck, and Progressive Web App. One account, all devices.</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {[
              { icon:'📱', label:'Android APK', sub:'Minimum Android 8.0. BLE required.', href:'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink-Signed.apk', btn:'Download APK', c:'#00e676', cr:'0,230,118' },
              { icon:'💻', label:'Windows EXE', sub:'SafetyLink Command Deck. Requires SL-ORG code.', href:'https://wa.me/27739441222?text=SafetyLink+Windows+EXE+download', btn:'Request Installer', c:'#0ea5e9', cr:'14,165,233' },
              { icon:'🌐', label:'Web App (PWA)', sub:'Open in browser. Tap Add to Home Screen.', href:'https://safetylink.online', btn:'Open Web App', c:'#a78bfa', cr:'167,139,250' },
            ].map((d, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'14px', padding:'32px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'2.5rem' }}>{d.icon}</div>
                <div style={{ fontSize:'16px', fontWeight:800, textTransform:'uppercase', letterSpacing:'.02em' }}>{d.label}</div>
                <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.55, flex:1 }}>{d.sub}</div>
                <a href={d.href} target="_blank" rel="noreferrer"
                  style={{ display:'block', textAlign:'center', padding:'13px', borderRadius:'8px', fontSize:'11px', fontWeight:700, letterSpacing:'.1em', background:`rgba(${d.cr},.1)`, color:d.c, border:`1px solid rgba(${d.cr},.3)`, textDecoration:'none', transition:'all .2s' }}>
                  {d.btn}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ────────────────────────────────────────────── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderTop:'1px solid rgba(255,255,255,.07)', textAlign:'center' }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// GET STARTED</div>
        <h2 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, marginBottom:'16px' }}>Ready to protect<br/>your community?</h2>
        <p style={{ color:'#8892a4', marginBottom:'36px', fontSize:'15px' }}>Message us on WhatsApp — your estate or complex set up within 48 hours.</p>
        <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer"
            style={{ background:'#25d366', color:'#fff', padding:'14px 28px', borderRadius:'8px', fontWeight:700, fontSize:'12px', letterSpacing:'.1em', textDecoration:'none', display:'flex', alignItems:'center', gap:'8px' }}>
            💬 WHATSAPP US
          </a>
          <button onClick={onRegisterOrg}
            style={{ background:'#e8321e', color:'#fff', padding:'14px 28px', borderRadius:'8px', fontWeight:700, fontSize:'12px', letterSpacing:'.1em', border:'none', cursor:'pointer' }}>
            START 14-DAY FREE TRIAL →
          </button>
          <a href="mailto:support@safetylink.online"
            style={{ color:'#8892a4', padding:'14px 20px', border:'1px solid rgba(255,255,255,.12)', borderRadius:'8px', fontWeight:600, fontSize:'12px', textDecoration:'none' }}>
            support@safetylink.online
          </a>
        </div>
      </section>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.12} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @media(max-width:960px){
          section > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
