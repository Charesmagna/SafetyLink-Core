// @ts-nocheck
import React, { useState, useRef } from 'react';
import './Home.css';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Platform({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [activePanel, setActivePanel] = useState<number | null>(1);
  const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTour = () => { if (tourIntervalRef.current) { clearInterval(tourIntervalRef.current); tourIntervalRef.current = null; } };
  const openPanel = (n: number) => { setActivePanel(n); stopTour(); };
  const closePanel = () => { setActivePanel(null); stopTour(); };
  const startTour = () => { stopTour(); let n = 1; tourIntervalRef.current = setInterval(() => { n = n >= 4 ? 1 : n + 1; setActivePanel(n); }, 3000); };

  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh' }}>

      {showVideoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:999999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <button onClick={() => { setShowVideoModal(false); setVideoSrc(''); }} style={{ position:'absolute', top:'20px', right:'20px', background:'transparent', border:'none', color:'white', fontSize:'28px', cursor:'pointer' }}>✕</button>
          <video src={videoSrc} controls autoPlay style={{ width:'90%', maxWidth:'1000px', borderRadius:'12px' }} />
        </div>
      )}

      {/* ── HEADER ── */}
      <section style={{ padding:'80px 40px 60px', background:'linear-gradient(135deg,#070a0f 0%,#0d1117 100%)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// HOW IT WORKS</div>
          <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:900, letterSpacing:'-.04em', lineHeight:.92, marginBottom:'20px' }}>
            11-Layer Autonomous<br/><span style={{ color:'#e8321e', fontStyle:'italic' }}>Emergency Ecosystem.</span>
          </h1>
          <p style={{ fontSize:'15px', color:'#8892a4', maxWidth:'560px', lineHeight:1.7 }}>
            Offline, on purpose. SafetyLink is engineered to survive load-shedding, zero-data scenarios, and network failures — combining BLE hardware, AI voice dispatch, and multi-tenant command dashboards into a single POPIA-compliant infrastructure.
          </p>
        </div>
      </section>

      {/* ── OFFLINE ARCHITECTURE ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// THE OPERATING PHILOSOPHY</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, marginBottom:'48px' }}>Offline, On Purpose.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {[
              { icon:'📡', title:'Zero-Data Readiness', desc:'USSD *120# and "Please Call Me" fallbacks trigger alerts with R0 airtime and 0MB data. No internet required.' },
              { icon:'🔗', title:'Encrypted Local Mesh', desc:'When towers go down during load-shedding, SafetyLink devices relay alerts peer-to-peer over BLE until a signal is found.' },
              { icon:'🔐', title:'Immutable Evidence', desc:'Incident data and audio recordings write to local AES-256-GCM encrypted storage before cloud broadcast — nothing is lost offline.' },
            ].map((f, i) => (
              <div key={i} style={{ background:'#111820', padding:'32px' }}>
                <div style={{ fontSize:'2rem', marginBottom:'16px' }}>{f.icon}</div>
                <div style={{ fontSize:'16px', fontWeight:800, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'.02em' }}>{f.title}</div>
                <div style={{ fontSize:'13px', color:'#8892a4', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLICK SEQUENCE ENGINE ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// ZERO FALSE ALARMS</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, marginBottom:'16px' }}>The 1-2-3 Click Sequence Engine.</h2>
          <p style={{ color:'#8892a4', marginBottom:'48px', fontSize:'15px', maxWidth:'560px', lineHeight:1.7 }}>
            Guarantees zero-fail distress escalation while eliminating accidental triggers. Every press is deliberate.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {[
              { label:'1 Press — Arming', color:'#f5a623', cr:'245,166,35', steps:['Crisp 120ms haptic vibration + beep','Screen turns on via FLAG_TURN_SCREEN_ON','10-second non-dismissible red overlay','SMS preparation begins in background'] },
              { label:'2 Presses — Abort', color:'#00e676', cr:'0,230,118', steps:['Instantly cancels countdown','Clears dispatch pipeline','Dismisses red overlay','Logs cancellation locally for audit'] },
              { label:'3 Presses — Critical Bypass', color:'#e8321e', cr:'232,50,30', steps:['Halts countdown immediately','800ms long haptic + 880Hz beep','Uncancellable — immediate dispatch','All channels fire simultaneously'] },
            ].map((s, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.03)', border:`1px solid rgba(${s.cr},.2)`, borderRadius:'14px', padding:'28px' }}>
                <div style={{ fontSize:'14px', fontWeight:800, color:s.color, marginBottom:'20px', letterSpacing:'.04em', textTransform:'uppercase' }}>{s.label}</div>
                <ul style={{ listStyle:'none', space:'12px' }}>
                  {s.steps.map((st, j) => (
                    <li key={j} style={{ fontSize:'12px', color:'#8892a4', marginBottom:'8px', paddingLeft:'16px', position:'relative' }}>
                      <span style={{ position:'absolute', left:0, color:s.color }}>›</span>
                      {st}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEQUENTIAL DISPATCH ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// SEQUENTIAL DISPATCH FIRING ORDER</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, marginBottom:'48px' }}>The Zero-Fail<br/>Guarantee.</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:'rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {[
              { step:'01', title:'BLE Click / Screen SOS', desc:'Trigger initiated — 1.5 second hold fires from pocket without screen unlock.', color:'#e8321e' },
              { step:'02', title:'Encrypted Local Storage Write', desc:'Incident data secured even if offline — AES-256-GCM with PBKDF2 derivation.', color:'#f5a623' },
              { step:'03', title:'CPU Wake Lock + GPS Polling', desc:'Overrides device sleep states — 10-minute PARTIAL_WAKE_LOCK tactical cycles.', color:'#0ea5e9' },
              { step:'04', title:'Cloudflare Worker + FCM Emit', desc:'Cloud mesh broadcast — sub-100ms delivery to all registered responders.', color:'#a78bfa' },
              { step:'05', title:'Twilio Voice + SMS + WhatsApp', desc:'Cellular bridge active — bypasses data congestion via native SMS layer.', color:'#25d366' },
              { step:'06', title:'VAPI AI Follow-Up + Lizzy Check-In', desc:'AI agent calls all contacts in sequence. Lizzy wellness check at 45s post-dispatch.', color:'#00e676' },
            ].map((s, i) => (
              <div key={i} style={{ background:'#111820', padding:'20px 28px', display:'flex', alignItems:'center', gap:'24px' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:s.color, fontWeight:700, flexShrink:0, width:'24px' }}>{s.step}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'4px' }}>{s.title}</div>
                  <div style={{ fontSize:'12px', color:'#8892a4' }}>{s.desc}</div>
                </div>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, flexShrink:0, boxShadow:`0 0 8px ${s.color}` }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GHOST ENGINE ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// NATIVE SURVIVAL</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, marginBottom:'16px' }}>The Ghost Engine.</h2>
          <p style={{ color:'#8892a4', marginBottom:'48px', fontSize:'15px', maxWidth:'560px', lineHeight:1.7 }}>
            SafetyLink is "Recents Swipe Immune." Our architecture overrides onTaskRemoved() and restarts PanicService.java within 2 seconds of being closed. We don't wait — we ensure the listener is immortal.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'20px' }}>
            {[
              { title:'Persistence', desc:'Binds to ACTION_BOOT_COMPLETED — service auto-recovers instantly upon device restart. Samsung and Xiaomi killer bypassed via SafetyKeepAliveWorker.' },
              { title:'16KB Page Alignment', desc:'Fully compliant with Android 15 (API 35) standards for high-performance memory management. Zero compromise on modern hardware.' },
              { title:'Zero-Config BLE', desc:'Vendor-agnostic pairing that binds to any BLE keyfob by listening for the first characteristic to fire — massive logistical flexibility for any iTag variant.' },
              { title:'Lock-Screen Dominance', desc:'Uses TYPE_APPLICATION_OVERLAY to draw the 10-second disarm countdown over the lock-screen — removing PIN friction during a real crisis.' },
            ].map((f, i) => (
              <div key={i} style={{ background:'rgba(232,50,30,.05)', border:'1px solid rgba(232,50,30,.15)', borderRadius:'14px', padding:'28px' }}>
                <div style={{ fontSize:'14px', fontWeight:800, color:'#e8321e', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'.04em' }}>{f.title}</div>
                <div style={{ fontSize:'13px', color:'#8892a4', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IoT INTEGRATION ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// GLOBAL COMMAND CENTER</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, marginBottom:'48px' }}>IoT Integration<br/>& Command.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'20px' }}>
            {[
              { emoji:'📡', title:'Wearable Telemetry', desc:'Live GIS tracking, RSSI signal strength, and battery health of deployed iTags across your entire estate or campus.' },
              { emoji:'🌡️', title:'Tuya Environmental Sensors', desc:'Real-time alerts from smart smoke detectors, gas leak monitors, and flood sensors integrated directly into the dispatch chain.' },
              { emoji:'📷', title:'Hikvision CCTV Integration', desc:'Direct API linkage triggering pan-tilt-zoom (PTZ) cameras based on localized panic coordinates. Eyes on scene within seconds.' },
              { emoji:'🚁', title:'Autonomous Drone-in-a-Box', desc:'Pre-programmed offline flight paths dispatching a 5G camera drone directly to incident GPS coordinates. Auto-return on mission complete.' },
            ].map((f, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'14px', padding:'28px', display:'flex', gap:'16px' }}>
                <span style={{ fontSize:'2rem', flexShrink:0 }}>{f.emoji}</span>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:800, marginBottom:'8px' }}>{f.title}</div>
                  <div style={{ fontSize:'13px', color:'#8892a4', lineHeight:1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.12}}`}</style>
    </div>
  );
}
