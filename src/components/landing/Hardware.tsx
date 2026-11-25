import { R2_MEDIA } from '../../utils/r2Assets';
import { ASSETS, ACTION_VIDEOS, vid, vidPoster } from '../../utils/cloudinary';
// @ts-nocheck
import React, { useState } from 'react';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

const DEVICES = [
  { tag:'PRIMARY', name:'SafetyLink iTAG Keyfob', price:'R149', sub:'CR2032 battery · IP65 · BLE 4.0+', img: R2_MEDIA.hardware.itagFinderProduct, color:'#00e676', features:['BLE 4.0+ universal compatibility','IP65 water and dust resistance','6–12 month CR2032 battery life','38×27×8mm · 7g · wearable','Zero-config vendor-agnostic pairing','Works with SafetyLink in any pocket'] },
  { tag:'ENTERPRISE', name:'SafetyLink Field Beacon / Tracker', price:'R1,999', sub:'GSM/LTE + GPS + BLE · SIM-based', img: R2_MEDIA.hardware.fieldBeaconAntenna, color:'#e8321e', features:['Independent SIM-based operation','Two-way voice call built-in','GPS accurate to 3 metres','5-day standby battery','Deployed across SA security firms','No Android dependency required'] },
  { tag:'FIXED SITE', name:'Shelly Tactical Button (WiFi/Desk)', price:'R380', sub:'WiFi direct · Webhook · IP54', img: R2_MEDIA.hardware.hardwareAssembly, color:'#0ea5e9', features:['Direct WiFi webhook to SafetyLink','No phone pairing required','Wall or desk mountable','Long-press, double-tap, hold modes','Ideal for reception desks and offices','IP54 rated for outdoor mounting'] },
  { tag:'AUTONOMOUS', name:'LimX Dynamics Patrol & IoT Node', price:'Enterprise', sub:'Autonomous Robotic Patrol & BLE Mesh', img: R2_MEDIA.hardware.limxDynamicsRobot, color:'#f5a623', features:['Autonomous perimeter patrolling','BLE mesh repeater & locator','Dynamic responder telemetry link','Thermal & optic distress scanning','Seamless integration with Command Deck','Real-time incident verification'] },
];

const STEPS = [
  { n:'01', title:'Insert Battery', desc:'Rotate the button cap to OPEN. Insert CR2032 with + facing up. Close and rotate to LOCK. LED flashes once to confirm power.', img: R2_MEDIA.hardware.itagTeardown },
  { n:'02', title:'Pair to SafetyLink', desc:'Open SafetyLink app → DEVICES → ADD DEVICE. Press iTAG button once. Device appears as "Native iTAG Keyfob". Tap to pair. RSSI displays once connected.', img: R2_MEDIA.hardware.itagKeyring },
  { n:'03', title:'Test Your Connection', desc:'From the main SOS screen, confirm status shows CONNECTED. Press TEST 5S to verify alert chain without triggering a live response.', img: R2_MEDIA.hardware.itagMacro },
  { n:'04', title:'Configure Button Actions', desc:'Single press: locate phone. Double press: SOS trigger. Long press: emergency escalation. Recommended SOS delay: 1.5 seconds.', img: R2_MEDIA.hardware.hardwarePack },
  { n:'05', title:'Auto-Reconnect & Keepalive', desc:'If iTAG shows RECONNECT status, tap RECONNECT or press the button once. Auto-reconnect fires every 20 seconds via keepalive ping.', img: R2_MEDIA.hardware.bleTransmitter },
];

export function Hardware({ onLogin, onRegisterUser, onRegisterOrg, navigate }: Props) {
  const [active, setActive] = useState(0);
  const [hwRotationTick, setHwRotationTick] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setHwRotationTick((t) => t + 1), 6000);
    return () => clearInterval(timer);
  }, []);

  const deviceImagePools: Record<number, string[]> = {
    0: [
      R2_MEDIA.hardware.itagFinderProduct,
      R2_MEDIA.hardware.itagKeyring,
      R2_MEDIA.hardware.itagMacro,
      R2_MEDIA.hardware.itagTeardown,
      R2_MEDIA.hardware.itagWhite,
      R2_MEDIA.hardware.itagBlack,
    ],
    1: [
      R2_MEDIA.hardware.fieldBeaconAntenna,
      R2_MEDIA.hardware.fieldDeviceClose,
      R2_MEDIA.hardware.ruggedBeacon,
    ],
    2: [
      R2_MEDIA.hardware.hardwareAssembly,
      R2_MEDIA.hardware.wearableTrigger,
      R2_MEDIA.hardware.microBeacon,
    ],
    3: [
      R2_MEDIA.hardware.limxDynamicsRobot,
      R2_MEDIA.hardware.hardwarePack,
      R2_MEDIA.hardware.deviceProfile,
    ],
  };

  const currentPool = deviceImagePools[active] || [DEVICES[active].img];
  const activeDeviceImg = currentPool[hwRotationTick % currentPool.length];

  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh' }}>

      {/* ── HEADER WITH LIVE BLE HARDWARE ACTION VIDEO & UNIVERSAL SAFETYLINK LOGO ── */}
      <section style={{ position:'relative', padding:'80px 40px 64px', background:'linear-gradient(135deg, #070a0f 0%, #0f172a 100%)', borderBottom:'1px solid rgba(255,255,255,.07)', overflow:'hidden' }}>
        <video
          src={vid(ACTION_VIDEOS.bleItagAction)}
          poster={vidPoster(ACTION_VIDEOS.bleItagAction)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.32, pointerEvents:'none' }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, rgba(7,10,15,0.94) 0%, rgba(7,10,15,0.75) 55%, rgba(7,10,15,0.45) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'18px' }}>
            <img src={ASSETS.logo} alt="SafetyLink Logo" style={{ height:'38px', width:'auto', objectFit:'contain' }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', letterSpacing:'.18em', color:'#10b981', fontWeight:700 }}>HARDWARE ECOSYSTEM</span>
          </div>
          <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:900, letterSpacing:'-.04em', lineHeight:.92, marginBottom:'20px' }}>
            Your hardware.<br/><span style={{ color:'#10b981', fontStyle:'italic' }}>Configured in minutes.</span>
          </h1>
          <p style={{ fontSize:'15px', color:'#cbd5e1', maxWidth:'560px', lineHeight:1.7 }}>
            SafetyLink works with BLE keyfobs, 4G SOS smartwatches, Hikvision panic stations, NB-IoT cellular buttons, and autonomous patrol beacons. No proprietary lock-in.
          </p>
        </div>
      </section>

      {/* ── DEVICE SELECTOR ── */}
      <section style={{ padding:'80px 40px', background:'rgba(2,6,23,0.18)', backdropFilter:'blur(3px)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// COMPATIBLE DEVICES</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'40px' }}>Pick Your Device.</h2>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'32px' }}>
            {DEVICES.map((d, i) => (
              <button key={i} onClick={() => setActive(i)}
                style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'11px', fontWeight:700, letterSpacing:'.08em', cursor:'pointer', transition:'all .2s',
                  background: active === i ? d.color : 'rgba(255,255,255,.04)',
                  color: active === i ? '#000' : '#8892a4',
                  border: active === i ? `1px solid ${d.color}` : '1px solid rgba(255,255,255,.08)' }}>
                {d.tag}
              </button>
            ))}
          </div>

          {/* Active device */}
          <div style={{ background:'rgba(255,255,255,.03)', border:`1px solid rgba(255,255,255,.07)`, borderRadius:'16px', padding:'36px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'48px', alignItems:'start' }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:DEVICES[active].color, letterSpacing:'.16em', marginBottom:'12px', textTransform:'uppercase' }}>{DEVICES[active].tag}</div>
              <h3 style={{ fontSize:'clamp(20px,3vw,32px)', fontWeight:900, marginBottom:'8px' }}>{DEVICES[active].name}</h3>
              <div style={{ fontSize:'clamp(24px,3vw,40px)', fontWeight:900, color:DEVICES[active].color, marginBottom:'8px' }}>{DEVICES[active].price}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8892a4', marginBottom:'28px' }}>{DEVICES[active].sub}</div>
              <img 
                src={activeDeviceImg} 
                alt={DEVICES[active].name} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/Polish_20260907_043403519.jpg';
                }}
                style={{ width:'100%', maxHeight:'260px', objectFit:'contain', borderRadius:'12px', background:'rgba(255,255,255,.04)', transition: 'all 0.5s ease' }} 
              />
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#8892a4', letterSpacing:'.14em', marginBottom:'16px', textTransform:'uppercase' }}>What's Included</div>
              <ul style={{ listStyle:'none' }}>
                {DEVICES[active].features.map((f, i) => (
                  <li key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:'13px', color:'#c8d0dc' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:DEVICES[active].color, flexShrink:0 }}/>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate?.('pricing')}
                style={{ marginTop:'24px', background:DEVICES[active].color, color:DEVICES[active].color === '#0ea5e9' ? '#fff' : '#000', padding:'13px 24px', borderRadius:'8px', fontWeight:700, fontSize:'11px', letterSpacing:'.1em', border:'none', cursor:'pointer', width:'100%' }}>
                ORDER THIS DEVICE →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HARDWARE VIDEO SHOWCASE (VERIFIED HIGH-ACTION USE CASE REELS) ── */}
      <section style={{ padding:'80px 40px', background:'transparent', backdropFilter:'blur(2px)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
            <img src={ASSETS.logo} alt="SafetyLink Logo" style={{ height:'26px', width:'auto', objectFit:'contain' }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#10b981', fontWeight:700 }}>FIELD DEMONSTRATIONS IN ACTION</span>
          </div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'36px' }}>Hardware in Action</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', textAlign: 'left' }}>
            {[
              {
                id: ACTION_VIDEOS.bleItagAction,
                tag: 'BLE KEYFOB TRIGGER',
                color: '#10b981',
                title: 'Real-World BLE iTAG Detection & SOS',
                desc: 'Live field demonstration showing pocket Bluetooth keyfob activation, instant GPS lock, and automated emergency relay.',
              },
              {
                id: ACTION_VIDEOS.droneDispatch,
                tag: 'AERIAL PURSUIT NODE',
                color: '#0ea5e9',
                title: 'Autonomous Drone Dispatch & Tracking',
                desc: 'See how field panic triggers immediately dispatch aerial surveillance and guide ground responders to active incidents.',
              },
              {
                id: ACTION_VIDEOS.elderlyAtHome,
                tag: 'WEARABLE & HOME CARE',
                color: '#f59e0b',
                title: 'Wearable Watch-Me & Elderly Protection',
                desc: 'One-press wearable protection and proactive check-in alerts designed for vulnerable loved ones at home.',
              },
            ].map((item) => (
              <div key={item.id} style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', height: '220px', background: '#000' }}>
                  <video
                    src={vid(item.id)}
                    poster={vidPoster(item.id)}
                    controls
                    preload="metadata"
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ pointerEvents:'none', position:'absolute', top:'10px', right:'10px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 8px', borderRadius:'8px', background:'rgba(2,6,23,0.78)', border:'1px solid rgba(255,255,255,0.15)' }}>
                    <img src={ASSETS.logo} alt="SafetyLink" style={{ height:'16px', width:'auto' }} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: item.color, fontWeight: 700 }}>{item.tag}</span>
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: item.color, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{item.tag}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SETUP STEPS ── */}
      <section style={{ padding:'80px 40px', background:'transparent', backdropFilter:'blur(2px)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'start' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// SETUP GUIDE</div>
            <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'16px' }}>Up and running<br/>in under 5 minutes.</h2>
            <p style={{ color:'#8892a4', fontSize:'14px', lineHeight:1.7 }}>
              No technical knowledge required. Any CR2032-compatible iTAG keyfob pairs automatically with SafetyLink via vendor-agnostic BLE discovery.
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:'rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background:'rgba(17,24,32,0.45)', backdropFilter:'blur(6px)', padding:'20px 24px', display:'flex', alignItems:'flex-start', gap:'20px' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#e8321e', fontWeight:700, flexShrink:0, width:'28px' }}>{s.n}</span>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, marginBottom:'4px' }}>{s.title}</div>
                  <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.5 }}>{s.desc}</div>
                  {s.img && (
                    <img 
                      src={s.img} 
                      alt={s.title} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{ marginTop:'12px', width:'100%', borderRadius:'8px', border:'1px solid rgba(255,255,255,.05)' }} 
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECS TABLE ── */}
      <section style={{ padding:'80px 40px', background:'rgba(2,6,23,0.18)', backdropFilter:'blur(3px)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// TECHNICAL SPECS</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'40px' }}>Device Comparison.</h2>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,.1)' }}>
                  {['Spec', 'iTAG Keyfob', 'Teltonika GH5200', 'Shelly Button 1', 'Tuya Smoke'].map((h, i) => (
                    <th key={i} style={{ padding:'12px 16px', textAlign:'left', color: i === 1 ? '#00e676' : '#8892a4', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', fontSize:'10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Connection', 'BLE 4.0+', 'GSM/LTE + BLE', 'WiFi 2.4GHz', 'WiFi + BLE'],
                  ['SIM Required', '❌ No', '✅ Yes', '❌ No', '❌ No'],
                  ['Battery Life', '6–12 months', '5 days (standby)', '1–2 years', '10 years (sealed)'],
                  ['IP Rating', 'IP65', 'IP67', 'IPX4', 'IP44'],
                  ['GPS', '❌ Relies on phone', '✅ 3m accuracy', '❌ No', '❌ No'],
                  ['Price', 'R149', 'R1,999', 'R380', 'R280'],
                  ['Best For', 'Daily carry', 'Lone workers', 'Fixed sites', 'IoT monitoring'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding:'14px 16px', fontSize:'11px', color: j === 0 ? '#c8d0dc' : cell.startsWith('✅') ? '#00e676' : cell.startsWith('❌') ? '#ef4444' : '#8892a4' }}>
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
    </div>
  );
}
