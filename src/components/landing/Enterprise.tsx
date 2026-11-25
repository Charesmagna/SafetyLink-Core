import { ASSETS, ACTION_VIDEOS, vid, vidPoster } from '../../utils/cloudinary';
// @ts-nocheck
import React from 'react';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Enterprise({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh' }}>

      {/* ── HEADER WITH LIVE ENTERPRISE ACTION VIDEO & UNIVERSAL SAFETYLINK LOGO ── */}
      <section style={{ position:'relative', padding:'80px 40px 64px', background:'linear-gradient(135deg, #070a0f 0%, #0f172a 100%)', borderBottom:'1px solid rgba(255,255,255,.07)', overflow:'hidden' }}>
        <video
          src={vid(ACTION_VIDEOS.governmentDispatch)}
          poster={vidPoster(ACTION_VIDEOS.governmentDispatch)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.35, pointerEvents:'none' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(7,10,15,0.94) 0%, rgba(13,17,23,0.78) 55%, rgba(13,17,23,0.45) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'18px' }}>
            <img src={ASSETS.logo} alt="SafetyLink Logo" style={{ height:'38px', width:'auto', objectFit:'contain' }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', letterSpacing:'.18em', color:'#10b981', fontWeight:700 }}>B2B ENTERPRISE &amp; GOVERNMENT</span>
          </div>
          <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:900, letterSpacing:'-.04em', lineHeight:.92, marginBottom:'20px' }}>
            Built for Scale.<br/><span style={{ color:'#10b981', fontStyle:'italic' }}>Designed for Command.</span>
          </h1>
          <p style={{ fontSize:'15px', color:'#cbd5e1', maxWidth:'560px', lineHeight:1.7 }}>
            B-BBEE Level 1 certified. POPIA-compliant. SA-hosted. The first emergency response platform engineered for South African enterprise, estate, and government procurement.
          </p>
        </div>
      </section>

      {/* ── B-BBEE BADGE ── */}
      <section style={{ padding:'60px 40px', background:'rgba(13,17,23,0.3)', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// PROCUREMENT ADVANTAGE</div>
            <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'20px' }}>B-BBEE Level 1.<br/>135% Procurement Recognition.</h2>
            <p style={{ fontSize:'14px', color:'#8892a4', lineHeight:1.7, marginBottom:'28px' }}>
              SafetyLink holds B-BBEE Level 1 status — the highest empowerment rating achievable. Government entities, municipalities, and corporates with BEE procurement targets recognise SafetyLink spend at 135%, making it the most cost-effective safety investment for compliance-driven procurement.
            </p>
            <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
              <button onClick={onRegisterOrg} style={{ background:'#e8321e', color:'#fff', padding:'14px 28px', borderRadius:'8px', fontWeight:700, fontSize:'11px', letterSpacing:'.1em', border:'none', cursor:'pointer' }}>
                START 14-DAY TRIAL →
              </button>
              <a href="mailto:info@safetylink.online" style={{ color:'#8892a4', padding:'13px 20px', border:'1px solid rgba(255,255,255,.12)', borderRadius:'8px', fontWeight:600, fontSize:'12px', textDecoration:'none' }}>
                REQUEST QUOTATION
              </a>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { val:'Level 1', lbl:'B-BBEE Status', color:'#00e676' },
              { val:'135%', lbl:'Procurement Recognition', color:'#e8321e' },
              { val:'100%', lbl:'SA-Hosted Data', color:'#0ea5e9' },
              { val:'POPIA', lbl:'+ GDPR Compliant', color:'#a78bfa' },
            ].map((s, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'24px', textAlign:'center' }}>
                <div style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:900, color:s.color, letterSpacing:'-.03em', marginBottom:'8px' }}>{s.val}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#8892a4', letterSpacing:'.12em', textTransform:'uppercase' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE & PUBLIC SAFETY IN ACTION (VISUAL VIDEO REELS) ── */}
      <section style={{ padding:'72px 40px', background:'#0b1325', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', marginBottom:'32px' }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#10b981', marginBottom:'10px', fontWeight:700 }}>ENTERPRISE FIELD REELS</div>
              <h2 style={{ fontSize:'clamp(24px,4vw,42px)', fontWeight:900, margin:0 }}>Real-World Command Deployments.</h2>
            </div>
            <img src={ASSETS.logo} alt="SafetyLink Logo" style={{ height:'34px', width:'auto', objectFit:'contain' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px' }}>
            {[
              { id: ACTION_VIDEOS.governmentDispatch, tag: 'GOVERNMENT', title: 'Municipal & Public Safety Ops', desc: 'Coordinated regional command centers, field responder tracking, and rapid dispatch.' },
              { id: ACTION_VIDEOS.droneDispatch, tag: 'TACTICAL DRONE', title: 'Aerial Pursuit & Perimeter Verification', desc: 'Real-time autonomous drone support linking directly to security company control desks.' },
              { id: ACTION_VIDEOS.schoolsAndWorkplaces, tag: 'CAMPUS & CORP', title: 'Schools, Offices & Workplaces', desc: 'Floor-marshal muster verification, silent reception duress, and learner safety networks.' },
            ].map((item) => (
              <div key={item.id} style={{ borderRadius:'16px', overflow:'hidden', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ position:'relative', height:'205px', background:'#000' }}>
                  <video
                    src={vid(item.id)}
                    poster={vidPoster(item.id)}
                    controls
                    preload="metadata"
                    playsInline
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  />
                  <div style={{ pointerEvents:'none', position:'absolute', top:'10px', right:'10px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 8px', borderRadius:'8px', background:'rgba(2,6,23,0.78)', border:'1px solid rgba(255,255,255,0.15)' }}>
                    <img src={ASSETS.logo} alt="SafetyLink" style={{ height:'16px', width:'auto' }} />
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', fontWeight:700, color:'#34d399' }}>{item.tag}</span>
                  </div>
                </div>
                <div style={{ padding:'16px' }}>
                  <div style={{ fontSize:'15px', fontWeight:800, color:'#fff' }}>{item.title}</div>
                  <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px', lineHeight:1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE FEATURES ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// ENTERPRISE CAPABILITIES</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'48px' }}>Everything your<br/>organisation needs.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {[
              { icon:'👥', title:'Multi-Tier Org Structure', desc:'Nested organisations with role-based access — Estate Manager, Security Commander, Responder, Civilian. Unlimited members per tier.' },
              { icon:'🗺️', title:'Live Command Dashboard', desc:'Real-time GIS map with responder positions, incident heat-mapping, BLE signal strength overlay and panic event timeline.' },
              { icon:'📊', title:'Incident Analytics', desc:'Weekly and monthly incident reports, response time benchmarking, SLA tracking and audit-ready evidence chain export.' },
              { icon:'🔗', title:'API Integration', desc:'REST API and webhook endpoints for integration with existing PSIM, VMS, access control and HR systems.' },
              { icon:'🏷️', title:'White-Label Option', desc:'Fully branded deployment with your logo, colours and domain. Custom splash screen, APK name and Play Store listing.' },
              { icon:'🛡️', title:'Dedicated Infrastructure', desc:'Dedicated Cloudflare Workers, D1 database nodes and isolated tenant data. SLA-backed 99.9% uptime guarantee.' },
            ].map((f, i) => (
              <div key={i} style={{ background:'#111820', padding:'32px', cursor:'default', transition:'background .2s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(232,50,30,.04)'}
                onMouseOut={e => e.currentTarget.style.background='#111820'}>
                <div style={{ fontSize:'2rem', marginBottom:'16px' }}>{f.icon}</div>
                <div style={{ fontSize:'15px', fontWeight:800, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'.02em' }}>{f.title}</div>
                <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPLY CHAIN ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// PROCUREMENT MODEL</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'20px' }}>Enterprise Supply Chain.</h2>
          <p style={{ color:'#8892a4', marginBottom:'40px', fontSize:'15px', lineHeight:1.7, maxWidth:'560px' }}>
            SafetyLink sources hardware domestically through SARS-cleared channels. Bulk procurement for 50+ units includes white-labelled packaging, pre-paired device registration and on-site deployment support.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
            {[
              { qty:'1–4 units', price:'R149/unit', lead:'3–5 days', tag:'RETAIL' },
              { qty:'5–24 units', price:'R120/unit', lead:'5–7 days', tag:'SMALL FLEET' },
              { qty:'25–99 units', price:'R99/unit', lead:'7–10 days', tag:'ESTATE', highlight:true },
              { qty:'100+ units', price:'CUSTOM', lead:'Dedicated PM', tag:'ENTERPRISE' },
            ].map((tier, i) => (
              <div key={i} style={{ background: tier.highlight ? 'rgba(232,50,30,.08)' : 'rgba(255,255,255,.03)', border: tier.highlight ? '1px solid rgba(232,50,30,.3)' : '1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'24px', textAlign:'center' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color: tier.highlight ? '#e8321e' : '#8892a4', letterSpacing:'.14em', marginBottom:'12px', textTransform:'uppercase' }}>{tier.tag}</div>
                <div style={{ fontSize:'12px', color:'#8892a4', marginBottom:'8px' }}>{tier.qty}</div>
                <div style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color: tier.highlight ? '#e8321e' : '#f0f4f8', marginBottom:'8px' }}>{tier.price}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8892a4' }}>Lead: {tier.lead}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONBOARDING ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// DEPLOYMENT TIMELINE</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'48px' }}>Up and running<br/>in 48 hours.</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:'rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {[
              { day:'DAY 1', title:'Account Creation & Org Setup', desc:'Organisation profile, member roster upload, role assignment and custom alert routing configured.' },
              { day:'DAY 1–2', title:'Hardware Dispatch', desc:'iTAG keyfobs dispatched pre-paired to your org ID. Includes QR activation cards for each member.' },
              { day:'DAY 2', title:'Responder Briefing', desc:'45-minute virtual onboarding for security commanders and responders. SOP documentation provided.' },
              { day:'DAY 2–3', title:'Full Activation & Testing', desc:'Live panic drill with your team. Escalation chain verified. Audit log reviewed. System signed off.' },
              { day:'ONGOING', title:'Dedicated Account Manager', desc:'Monthly incident reports, SLA reviews, firmware updates pushed automatically to all deployed devices.' },
            ].map((s, i) => (
              <div key={i} style={{ background:'#111820', padding:'20px 28px', display:'flex', alignItems:'flex-start', gap:'24px' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#e8321e', fontWeight:700, flexShrink:0, width:'56px', paddingTop:'2px', letterSpacing:'.08em' }}>{s.day}</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'4px' }}>{s.title}</div>
                  <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', textAlign:'center' }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// GET STARTED</div>
        <h2 style={{ fontSize:'clamp(28px,4vw,52px)', fontWeight:900, marginBottom:'16px' }}>Deploy SafetyLink<br/>for your organisation.</h2>
        <p style={{ color:'#8892a4', marginBottom:'36px', fontSize:'15px' }}>14-day free trial. No credit card. Setup within 48 hours.</p>
        <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={onRegisterOrg} style={{ background:'#e8321e', color:'#fff', padding:'14px 32px', borderRadius:'8px', fontWeight:700, fontSize:'12px', letterSpacing:'.1em', border:'none', cursor:'pointer' }}>START FREE TRIAL →</button>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" style={{ background:'#25d366', color:'#fff', padding:'14px 24px', borderRadius:'8px', fontWeight:700, fontSize:'12px', letterSpacing:'.1em', textDecoration:'none' }}>💬 WHATSAPP US</a>
          <a href="mailto:info@safetylink.online" style={{ color:'#8892a4', padding:'13px 20px', border:'1px solid rgba(255,255,255,.12)', borderRadius:'8px', fontWeight:600, fontSize:'12px', textDecoration:'none' }}>info@safetylink.online</a>
        </div>
      </section>
    </div>
  );
}
