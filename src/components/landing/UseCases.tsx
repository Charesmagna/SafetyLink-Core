import React, { useState } from 'react';
import { ASSETS, vid, img } from '../../utils/cloudinary';

interface Props {
  onLogin: () => void;
  onRegisterUser: () => void;
  onRegisterOrg: () => void;
  navigate?: (p: string) => void;
}

interface VideoCardProps {
  publicId: string;
  title: string;
  description: string;
  poster?: string;
}

const VideoCard = ({ publicId, title, description, poster }: VideoCardProps) => (
  <div style={{ borderRadius:'14px', overflow:'hidden', background:'#0f172a', border:'1px solid #1e293b' }}>
    <video
      style={{ width:'100%', height:'200px', objectFit:'cover', display:'block' }}
      poster={poster ? img(poster) : undefined}
      controls
      preload="none"
      playsInline
    >
      <source
        src={vid(publicId)}
        type="video/mp4"
      />
    </video>
    <div style={{ padding:'14px' }}>
      <p style={{ fontWeight:'700', color:'#fff', fontSize:'14px' }}>{title}</p>
      <p style={{ color:'#64748b', fontSize:'12px', marginTop:'4px' }}>{description}</p>
    </div>
  </div>
);

export const USE_CASE_VIDEOS = [
  { id: 'Okay_now_for_the_next_scene',    title: 'Family Protection',        desc: 'How SafetyLink protects your household', poster: 'Gemini_Generated_Image_virgVirg99' },
  { id: 'Government_use_case_scenario',   title: 'Government Use Case',      desc: 'Municipal and public safety deployment', poster: 'Gemini_Generated_Image_59pss65p' },
  { id: 'Neighbourhood_watch_security_c', title: 'Neighbourhood Watch',      desc: 'Community security network in action', poster: 'copilot_image_178696579200' },
  { id: 'drone_dispatch_tracking_crimin', title: 'Drone Dispatch',           desc: 'Aerial response to active incidents', poster: 'Gemini_Generated_Image_chze56oh0' },
  { id: 'Show_the_uses_in_school_and_wo', title: 'Schools & Workplaces',     desc: 'Protecting learners and employees', poster: 'Gemini_Generated_Image_4keue49e' },
  { id: 'Old_people_scenario_alone_at_h', title: 'Elderly at Home',          desc: 'Watch-Me Timer proactive protection', poster: 'Gemini_Generated_Image_virgVirg99' },
  { id: 'SafetyLink_vision_when_ble_is',  title: 'BLE iTAG in Action',       desc: 'How the keyfob triggers an alert', poster: 'Polish_20260818_020279883' },
  { id: 'Now_let_s_show_how_kids_would',  title: 'Children & Schools',       desc: 'Smart school safety deployment', poster: 'Gemini_Generated_Image_59pss65p' },
  { id: 'K_s_south_Africa_so_multirac',   title: 'Multilingual SA',          desc: 'All 11 South African languages', poster: 'Gemini_Generated_Image_virgVirg99' },
  { id: 'Why',                            title: 'Why SafetyLink?',          desc: 'The story behind the platform', poster: 'copilot_image_178370354D283' },
  { id: 'Pitch_deck',                     title: 'Investor Pitch',           desc: 'SafetyLink business overview', poster: 'Gemini_Generated_Image_s8bRy8s8b' },
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
  const [activeSector, setActiveSector] = useState(0);

  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"\'Inter\',system-ui,sans-serif", minHeight:'100vh' }}>
      
      {/* ── HEADER ── */}
      <section style={{ padding:'80px 40px 60px', background:'linear-gradient(135deg,#070a0f 0%,#0d1117 100%)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"\'JetBrains Mono\',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// WHO WE PROTECT</div>
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
          <div style={{ fontFamily:"\'JetBrains Mono\',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// SEE IT IN ACTION</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'40px' }}>Watch SafetyLink Work.</h2>
          
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px' }}>
            {USE_CASE_VIDEOS.map((v) => (
              <VideoCard
                key={v.id}
                publicId={v.id}
                title={v.title}
                description={v.desc}
                poster={v.poster}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORS ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"\'JetBrains Mono\',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// DEPLOYMENT SECTORS</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,44px)', fontWeight:900, marginBottom:'40px' }}>Where We Deploy.</h2>
          
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

          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(232,50,30,.2)', borderRadius:'16px', padding:'36px', display:'grid', gridTemplateColumns:'1fr', gap:'40px', alignItems:'start' }}>
            <div>
              <div style={{ fontSize:'24px', fontWeight:900, marginBottom:'12px', color:'#fff' }}>{SECTORS[activeSector].title}</div>
              <div style={{ fontSize:'14px', color:'#94a3b8', lineHeight:1.7, marginBottom:'24px' }}>{SECTORS[activeSector].desc}</div>
              <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:'12px' }}>
                {SECTORS[activeSector].features.map((f, i) => (
                  <li key={i} style={{ display:'flex', gap:'12px', alignItems:'center', fontSize:'13px', color:'#cbd5e1' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#e8321e' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
