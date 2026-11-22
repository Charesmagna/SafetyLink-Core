import React, { useState } from 'react';
import { vid } from '../../utils/cloudinary';
import { R2_MEDIA } from '../../utils/r2Assets';

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
  poster: string;
}

const VideoCard = ({ publicId, title, description, poster }: VideoCardProps) => (
  <div style={{ borderRadius: '14px', overflow: 'hidden', background: '#0f172a', border: '1px solid #1e293b' }}>
    <video
      style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', background: '#020617' }}
      poster={poster}
      controls
      preload="none"
      playsInline
    >
      <source src={vid(publicId)} type="video/mp4" />
    </video>
    <div style={{ padding: '14px' }}>
      <p style={{ fontWeight: '700', color: '#fff', fontSize: '14px', margin: 0 }}>{title}</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>{description}</p>
    </div>
  </div>
);

export const USE_CASE_VIDEOS = [
  { id: 'Okay_now_for_the_next_scene',    title: 'Family Protection',    desc: 'How SafetyLink protects your household',         poster: '/Polish_20260907_043403519.jpg' },
  { id: 'Government_use_case_scenario',   title: 'Government Use Case',  desc: 'Municipal and public safety deployment',         poster: R2_MEDIA.usecases.municipalEmergency },
  { id: 'Neighbourhood_watch_security_c', title: 'Neighbourhood Watch',  desc: 'Community security network in action',           poster: R2_MEDIA.usecases.estateCommunity },
  { id: 'drone_dispatch_tracking_crimin', title: 'Drone Dispatch',       desc: 'Aerial response to active incidents',            poster: R2_MEDIA.usecases.transportLogistics },
  { id: 'Show_the_uses_in_school_and_wo', title: 'Schools & Workplaces', desc: 'Protecting learners and employees',              poster: R2_MEDIA.usecases.corporateCampus },
  { id: 'Old_people_scenario_alone_at_h', title: 'Elderly at Home',      desc: 'Watch-Me Timer proactive protection',            poster: R2_MEDIA.usecases.hospitalHealthcare },
  { id: 'SafetyLink_vision_when_ble_is',  title: 'BLE iTAG in Action',   desc: 'How the keyfob triggers an alert',               poster: R2_MEDIA.hardware.itagMacro },
  { id: 'Now_let_s_show_how_kids_would',  title: 'Children & Schools',   desc: 'Smart school safety deployment',                 poster: R2_MEDIA.usecases.schoolUniversity },
  { id: 'K_s_south_Africa_so_multirac',   title: 'Multilingual SA',      desc: 'All 11 South African languages',                 poster: '/safetylink-shield.jpg' },
  { id: 'Why',                            title: 'Why SafetyLink?',      desc: 'The story behind the platform',                  poster: R2_MEDIA.platform.dispatchControl },
  { id: 'Pitch_deck',                     title: 'Investor Pitch',       desc: 'SafetyLink business overview',                   poster: R2_MEDIA.architecture.responseOverview },
];

const SECTORS = [
  { tag: 'RESIDENTIAL', title: 'Gated Estates & Complexes', desc: 'Real-time panic alerts, visitor tracking, perimeter alerts and armed response dispatch. Every resident protected — even with R0 airtime.', img: R2_MEDIA.usecases.estateCommunity, fallback: '/Polish_20260907_043403519.jpg', features: ['BLE keyfob panic triggers', 'WhatsApp + SMS dispatch', 'Armed response coordination', 'Live GIS map for security booth'] },
  { tag: 'ENTERPRISE',  title: 'Corporates & Campuses',     desc: 'Lone-worker protection, duress code activation, multi-floor responder routing and AES-256-GCM evidence capture.', img: R2_MEDIA.usecases.corporateCampus, fallback: '/safetylink-shield.jpg', features: ['Silent duress code SOS', 'Multi-floor responder routing', 'Cryptographic evidence vault', 'API integration with HR systems'] },
  { tag: 'EDUCATION',   title: 'Schools & Universities',    desc: 'Pupil tracking, parent notification chains, lockdown protocol dispatch and dedicated security staff escalation.', img: R2_MEDIA.usecases.schoolUniversity, fallback: '/safetylink-shield.jpg', features: ['Learner iTag wristbands', 'Parent SMS + WhatsApp alerts', 'Lockdown mode activation', 'Integration with school security'] },
  { tag: 'HEALTHCARE',  title: 'Clinics & Hospitals',       desc: 'Staff duress alerts, patient elopement detection and AI voice dispatch for code-blue events in medical facilities.', img: R2_MEDIA.usecases.hospitalHealthcare, fallback: '/Polish_20260907_043403519.jpg', features: ['Clinical staff duress buttons', 'Patient elopement alerts', 'Code-blue dispatch chain', 'POPIA-compliant evidence logs'] },
  { tag: 'LOGISTICS',   title: 'Transport & Field Ops',     desc: 'Driver SOS with GPS coordinates, route deviation alerts, cargo protection and real-time fleet situational awareness.', img: R2_MEDIA.usecases.transportLogistics, fallback: '/Polish_20260907_043403519.jpg', features: ['Driver GPS panic trigger', 'Route deviation detection', 'Fleet command dashboard', 'Multi-driver dispatch coordination'] },
  { tag: 'MUNICIPAL',   title: 'Municipalities & SAPS',     desc: 'Community safety networks, neighborhood watch coordination, B-BBEE Level 1 compliance advantage for government procurement.', img: R2_MEDIA.usecases.municipalEmergency, fallback: '/safetylink-shield.jpg', features: ['Community mesh network', 'Neighborhood watch dispatch', 'SAPS coordination API', 'B-BBEE Level 1 certified'] },
];

export function UseCases(_props: Props) {
  const [activeSector, setActiveSector] = useState(0);

  return (
    <div style={{ background: '#070a0f', color: '#f0f4f8', fontFamily: "'Inter',system-ui,sans-serif", minHeight: '100vh' }}>
      {/* HEADER */}
      <section style={{ padding: '72px 24px 56px', background: 'linear-gradient(135deg,#070a0f 0%,#0d1117 100%)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', letterSpacing: '.16em', color: '#10b981', marginBottom: '14px', textTransform: 'uppercase' }}>
            Who We Protect
          </div>
          <h1 style={{ fontSize: 'clamp(34px,5.5vw,64px)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 0.96, marginBottom: '18px' }}>
            Every sector.<br /><span style={{ color: '#e8321e', fontStyle: 'italic' }}>One platform.</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '560px', lineHeight: 1.7 }}>
            From gated estates to hospitals and municipal networks — SafetyLink adapts to every security environment in South Africa.
          </p>
        </div>
      </section>

      {/* VIDEOS */}
      <section style={{ padding: '64px 24px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', letterSpacing: '.16em', color: '#10b981', marginBottom: '12px', textTransform: 'uppercase' }}>
            See It In Action
          </div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 900, marginBottom: '36px' }}>Watch SafetyLink Work.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
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

      {/* SECTORS */}
      <section style={{ padding: '64px 24px', background: '#070a0f', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', letterSpacing: '.16em', color: '#10b981', marginBottom: '12px', textTransform: 'uppercase' }}>
            Deployment Sectors
          </div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 900, marginBottom: '32px' }}>Where We Deploy.</h2>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {SECTORS.map((s, i) => (
              <button
                key={s.tag}
                type="button"
                onClick={() => setActiveSector(i)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  letterSpacing: '.08em',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  background: activeSector === i ? '#059669' : 'rgba(255,255,255,.04)',
                  color: activeSector === i ? '#fff' : '#94a3b8',
                  border: activeSector === i ? '1px solid #10b981' : '1px solid rgba(255,255,255,.1)',
                }}
              >
                {s.tag}
              </button>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(16,185,129,.22)', borderRadius: '16px', padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.1em', marginBottom: '12px' }}>
                {SECTORS[activeSector].tag} PROTOCOL
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: '#fff' }}>{SECTORS[activeSector].title}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>{SECTORS[activeSector].desc}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SECTORS[activeSector].features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: '#cbd5e1' }}>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#020617', maxHeight: '340px' }}>
              <img
                src={SECTORS[activeSector].img}
                alt={SECTORS[activeSector].title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SECTORS[activeSector].fallback;
                }}
                style={{ width: '100%', height: '340px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(2,6,23,0.95) 0%, transparent 100%)', padding: '16px 20px' }}>
                <span style={{ fontSize: '11px', color: '#10b981', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  TACTICAL DISPATCH REFERENCE · {SECTORS[activeSector].tag}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
