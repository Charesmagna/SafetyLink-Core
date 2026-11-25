import React, { useState } from 'react';
import { ASSETS, ACTION_VIDEOS, USE_CASE_VIDEOS, vid, vidPoster } from '../../utils/cloudinary';
import { R2_MEDIA } from '../../utils/r2Assets';

interface Props {
  onLogin: () => void;
  onRegisterUser: () => void;
  onRegisterOrg: () => void;
  navigate?: (p: string) => void;
}

interface VideoCardProps {
  publicId: string;
  tag: string;
  title: string;
  description: string;
}

const VideoCard = ({ publicId, tag, title, description }: VideoCardProps) => (
  <div className="group rounded-2xl overflow-hidden bg-slate-900/90 border border-white/10 hover:border-emerald-400/45 shadow-xl transition-all duration-300 flex flex-col">
    <div className="relative h-56 bg-black overflow-hidden">
      <video
        className="w-full h-full object-cover block"
        poster={vidPoster(publicId)}
        controls
        preload="metadata"
        playsInline
      >
        <source src={vid(publicId)} type="video/mp4" />
      </video>
      {/* Universal SafetyLink Logo Corner Mark */}
      <div className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/70 backdrop-blur-md border border-white/15">
        <img
          src={ASSETS.logo}
          alt="SafetyLink"
          className="h-4 w-auto object-contain"
        />
        <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-300">
          {tag}
        </span>
      </div>
    </div>
    <div className="p-4 flex-1 flex flex-col justify-between">
      <div>
        <h3 className="font-display font-bold text-white text-base leading-snug">{title}</h3>
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const SECTORS = [
  {
    tag: 'RESIDENTIAL',
    title: 'Gated Estates & Families',
    desc: 'Real-time panic alerts, visitor tracking, perimeter alerts, and armed response dispatch. Every resident protected — even with R0 airtime.',
    img: R2_MEDIA.usecases.estateCommunity,
    videoId: ACTION_VIDEOS.familyProtection,
    features: ['BLE keyfob panic triggers', 'Zero-airtime Please Call Me + FCM loud alarm', 'Armed response coordination', 'Live GIS map for security booth'],
  },
  {
    tag: 'COMMUNITY',
    title: 'Neighbourhood Watch & Patrols',
    desc: 'Coordinate street captains, community patrol vehicles, and rapid backup alerts across suburbs and residential zones.',
    img: R2_MEDIA.usecases.tacticalSecurity,
    videoId: ACTION_VIDEOS.neighbourhoodWatch,
    features: ['Instant street-level GPS pins', 'Multi-responder ETA tracking', 'Aerial drone dispatch handoff', 'Live local danger-zone feed'],
  },
  {
    tag: 'ENTERPRISE',
    title: 'Corporates & Campuses',
    desc: 'Lone-worker protection, silent duress code activation, multi-floor responder routing, and AES-256-GCM evidence capture.',
    img: R2_MEDIA.usecases.corporateCampus,
    videoId: ACTION_VIDEOS.schoolsAndWorkplaces,
    features: ['Silent duress code SOS', 'Multi-floor responder routing', 'Cryptographic evidence vault', 'Control-room Windows EXE console'],
  },
  {
    tag: 'EDUCATION',
    title: 'Schools & Universities',
    desc: 'Student safety rosters, parent notification chains, lockdown protocol dispatch, and dedicated campus security escalation.',
    img: R2_MEDIA.usecases.schoolUniversity,
    videoId: ACTION_VIDEOS.childrenAndSchools,
    features: ['Learner iTag keyfobs & wearables', 'Parent SMS + Push loud alerts', 'Campus lockdown escalation', 'Direct guard-desk alert routing'],
  },
  {
    tag: 'ELDER CARE',
    title: 'Seniors, Clinics & Home Care',
    desc: 'Proactive Watch-Me safety timers, 4G SOS watches, staff duress buttons, and automated family + medical escalation.',
    img: R2_MEDIA.usecases.hospitalHealthcare,
    videoId: ACTION_VIDEOS.elderlyAtHome,
    features: ['Watch-Me check-in timers', '4G SOS watch & pocket fobs', 'Code-blue medical dispatch chain', 'POPIA-compliant incident logs'],
  },
  {
    tag: 'MUNICIPAL',
    title: 'Government & Public Safety',
    desc: 'Municipal safety networks, public utility worker duress protection, and B-BBEE Level 1 compliant emergency infrastructure.',
    img: R2_MEDIA.usecases.municipalEmergency,
    videoId: ACTION_VIDEOS.governmentDispatch,
    features: ['Regional multi-tenant command', 'SAPS & municipal dispatch API', 'Autonomous drone pursuit integration', 'B-BBEE Level 1 certified'],
  },
];

export { USE_CASE_VIDEOS };

export function UseCases({ onRegisterUser, onRegisterOrg }: Props) {
  const [activeSector, setActiveSector] = useState(0);
  const currentSector = SECTORS[activeSector];

  return (
    <div className="bg-[#070d1a] text-slate-100 min-h-screen">
      {/* ── CINEMATIC VISUAL VIDEO HEADER WITH UNIVERSAL SAFETYLINK LOGO ── */}
      <section className="relative py-20 sm:py-24 px-4 sm:px-8 border-b border-white/10 overflow-hidden">
        <video
          key="usecases-hero-bg"
          src={vid(ACTION_VIDEOS.neighbourhoodWatch)}
          poster={vidPoster(ACTION_VIDEOS.neighbourhoodWatch)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, rgba(7,13,26,0.95) 0%, rgba(7,13,26,0.78) 55%, rgba(7,13,26,0.5) 100%)',
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <img
              src={ASSETS.logo}
              alt="SafetyLink Logo"
              className="h-10 w-auto object-contain drop-shadow-[0_4px_16px_rgba(16,185,129,0.35)]"
            />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
              Who We Protect · Live Field Scenarios
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.02] text-white mb-5">
            Every sector.
            <span className="block text-emerald-400 mt-1">One resilient platform.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed mb-7">
            Watch real SafetyLink visual scenarios across households, neighbourhood watches, drone dispatch, schools, elderly care, and government deployments.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRegisterUser}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold transition-all"
            >
              Create Free Account
            </button>
            <button
              type="button"
              onClick={onRegisterOrg}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/18 border border-white/20 text-white text-xs font-bold transition-colors"
            >
              Register Organization
            </button>
          </div>
        </div>
      </section>

      {/* ── ALL 12 VERIFIED VISUAL ACTION VIDEOS ── */}
      <section className="py-16 px-4 sm:px-8 bg-[#0b1325] border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-400 mb-2">
                See SafetyLink in Action
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                Watch Real Emergency Scenarios.
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <img src={ASSETS.logo} alt="SafetyLink" className="h-5 w-auto object-contain" />
              <span>12 Verified Visual Reels</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASE_VIDEOS.map((v) => (
              <VideoCard
                key={v.id}
                publicId={v.id}
                tag={v.tag}
                title={v.title}
                description={v.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEPLOYMENT SECTORS (LIVE VIDEO + FEATURE MATRIX) ── */}
      <section className="py-16 px-4 sm:px-8 bg-[#070d1a]">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-400 mb-2">
            Deployment Sectors
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-8">
            Where We Deploy.
          </h2>

          <div className="flex gap-2 flex-wrap mb-8">
            {SECTORS.map((s, i) => (
              <button
                key={s.tag}
                type="button"
                onClick={() => setActiveSector(i)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  activeSector === i
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                {s.tag}
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-slate-900/75 border border-emerald-500/25 p-6 sm:p-9 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <img src={ASSETS.logo} alt="SafetyLink" className="h-6 w-auto object-contain" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {currentSector.tag} PROTOCOL
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                {currentSector.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{currentSector.desc}</p>
              <ul className="space-y-2.5 pt-2">
                {currentSector.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
              <video
                key={currentSector.videoId}
                src={vid(currentSector.videoId)}
                poster={vidPoster(currentSector.videoId)}
                autoPlay
                muted
                loop
                controls
                playsInline
                preload="metadata"
                className="w-full h-72 sm:h-80 object-cover block"
              />
              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md border border-emerald-400/35">
                <img src={ASSETS.logo} alt="SafetyLink" className="h-4 w-auto object-contain" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  LIVE ACTION · {currentSector.tag}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
