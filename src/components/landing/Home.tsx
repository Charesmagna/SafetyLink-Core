import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { R2MediaShowcase } from './R2MediaShowcase';
import { getR2StreamUrl, R2_MEDIA } from '../../utils/r2Assets';
import {
  ArrowRight,
  BellRing,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  MapPin,
  Maximize2,
  Monitor,
  Radio,
  Shield,
  Smartphone,
  Timer,
  WifiOff,
  X,
} from 'lucide-react';

interface HomeProps {
  onLogin: () => void;
  onRegisterOrg: () => void;
  onRegisterUser: () => void;
  navigate?: (page: string) => void;
}

const TRANSLATIONS: Record<string, { h1a: string; h1b: string; sub: string }> = {
  en: {
    h1a: 'Protect What Matters Most.',
    h1b: 'Family Security, Reimagined.',
    sub: 'Seamless end-to-end emergency protection from pocket BLE key fob and smartphone to live control-room dispatch — built for South African households, estates, and security companies.',
  },
  zu: {
    h1a: 'Vikela Okukubalulekile.',
    h1b: 'Ukuphepha Komndeni Okusha.',
    sub: 'SafetyLink ixhuma izinkinobho ze-BLE, ama-SMS, ucingo, kanye nezikhungo zezokuphepha ukusiza umndeni wakho ngokushesha.',
  },
  af: {
    h1a: 'Beskerm Wat Die Meeste Saakmaak.',
    h1b: 'Gesinssekuriteit, Herontwerp.',
    sub: 'SafetyLink verbind BLE-noodknoppies, SMS, stemoproepe en beheerkamers in een betroubare Suid-Afrikaanse platform.',
  },
  xh: {
    h1a: 'Khusela Okubalulekileyo.',
    h1b: 'Ukhuseleko Losapho Olutsha.',
    sub: 'SafetyLink idibanisa amaqhosha e-BLE, ii-SMS, iminxeba kunye neenkqubo zoncedo ngexesha elinye.',
  },
  st: {
    h1a: 'Sireletsa Se Bohlokwa.',
    h1b: 'Tshireletso Ea Lelapa E Ncha.',
    sub: 'SafetyLink e hokahanya li-button tsa BLE, SMS, mehala le litsi tsa tshireletso bakeng sa karabelo e potlakileng.',
  },
  tn: {
    h1a: 'Sireletsa Se Se Botlhokwa.',
    h1b: 'Tshireletso Ya Lelwapa E Ntsha.',
    sub: 'SafetyLink e kopanya dibatene tsa BLE, SMS, megala le mafelo a tshireletso go thusa ka bonako.',
  },
};

// ── 1. DEDICATED HERO FULL-BLEED BACKGROUND SLIDES (Wide atmospheric/network backdrops — ZERO overlap with foreground card) ──
const HERO_BG_SLIDES = [
  { src: R2_MEDIA.platform.heroBackground, alt: 'SafetyLink Global Emergency Platform Backdrop' },
  { src: R2_MEDIA.platform.ambientHero, alt: 'SafetyLink Spatial Mesh Ambient Backdrop' },
  { src: R2_MEDIA.backgrounds.cyberMesh, alt: 'Emergency Cyber Mesh Network' },
  { src: R2_MEDIA.backgrounds.darkTopology, alt: 'Dark Tactical Topology Network' },
  { src: R2_MEDIA.backgrounds.telemetryRadar, alt: 'Live Responder Telemetry Radar' },
  { src: R2_MEDIA.backgrounds.neonGrid, alt: 'Connected Estate Security Grid' },
  { src: R2_MEDIA.backgrounds.satelliteConstellation, alt: 'Satellite GPS & Failover Constellation' },
  { src: R2_MEDIA.backgrounds.ambientSphere, alt: 'SafetyLink Resilient Node Sphere' },
];

// ── 2. DEDICATED HERO FOREGROUND PLATFORM SHOWCASE (Actual Control Room, Mobile App & GIS Screens — ZERO overlap with Hero BG) ──
const HERO_PLATFORM_SLIDES = [
  {
    src: R2_MEDIA.platform.commandDeckDark,
    thumb: R2_MEDIA.platform.commandDeckDark,
    tag: 'CONTROL ROOM',
    title: 'Live Organization Command Deck',
    caption: 'Real-time incident map, severity triage, patrol telemetry, and instant responder dispatch.',
  },
  {
    src: R2_MEDIA.platform.mobileTelemetry,
    thumb: R2_MEDIA.platform.mobileTelemetry,
    tag: 'MOBILE APP',
    title: 'Android & PWA One-Tap SOS Telemetry',
    caption: 'Native PanicService with 10-second PIN lock, silent duress code, and live GPS triangulation.',
  },
  {
    src: R2_MEDIA.platform.signalMap,
    thumb: R2_MEDIA.platform.signalMap,
    tag: 'GIS & RADAR',
    title: 'Live Incident & Signal Coverage Map',
    caption: 'Track active alerts, nearby danger zones, and patrol proximity across estates and campuses.',
  },
  {
    src: R2_MEDIA.platform.dispatchControl,
    thumb: R2_MEDIA.platform.dispatchControl,
    tag: 'DISPATCH OPS',
    title: 'Central Dispatch & Escalation Queue',
    caption: 'Automated FCM loud alarm, SMS, voice dispatch, and zero-airtime Please Call Me failover.',
  },
  {
    src: R2_MEDIA.platform.telemetryDesk,
    thumb: R2_MEDIA.platform.telemetryDesk,
    tag: 'OPERATIONS DESK',
    title: 'Multi-Tenant Security Operations Console',
    caption: 'Manage linked households, approve or suspend members, and monitor CCTV streams.',
  },
  {
    src: R2_MEDIA.platform.networkGrid,
    thumb: R2_MEDIA.platform.networkGrid,
    tag: 'INDOOR MESH',
    title: 'Spatial Beacon & Indoor Trilateration',
    caption: 'Floor-level beacon localization for malls, campuses, clinics, and high-rise offices.',
  },
];

// ── 3. DEDICATED BLE HARDWARE PHOTO POOL (Actual Hardware Only) ──
const HARDWARE_PHOTO_POOL = [
  { src: R2_MEDIA.hardware.itagFinderProduct, label: 'Multi-Color BLE iTag Keyfobs' },
  { src: R2_MEDIA.hardware.itagKeyring, label: 'Pocket Keyring Panic Mode' },
  { src: R2_MEDIA.hardware.itagMacro, label: 'Tactile Button Close-Up' },
  { src: R2_MEDIA.hardware.itagTeardown, label: 'nRF52 BLE & CR2032 Internal Architecture' },
];

// ── 4. 12 SEMANTICALLY MATCHED SECTOR, CONTROL-ROOM & FIELD OPERATIONS CARDS (Zero misplaced button photos) ──
const SHOWCASE_GALLERY = [
  {
    src: R2_MEDIA.usecases.estateCommunity,
    label: 'Residential Estates & Families',
    category: 'Estates & Homes',
    desc: 'Perimeter geo-fencing, household circles, and rapid armed-response linkage for gated estates.',
  },
  {
    src: R2_MEDIA.usecases.securityDeskOperator,
    label: 'Security Control-Room Desk',
    category: 'Control Room',
    desc: 'Live operator console for incident verification, CCTV look-in, and dispatch SLA tracking.',
  },
  {
    src: R2_MEDIA.usecases.tacticalSecurity,
    label: 'Armed Response & Tactical Teams',
    category: 'Tactical Patrol',
    desc: 'Turn-by-turn navigation to live GPS panic coordinates with instant incident escalation.',
  },
  {
    src: R2_MEDIA.usecases.nightPatrolOfficer,
    label: '24/7 Guard & Night Patrols',
    category: 'Guard Ops',
    desc: 'Lone-guard duress triggers, shift check-ins, and live supervisor visibility after dark.',
  },
  {
    src: R2_MEDIA.usecases.corporateCampus,
    label: 'Corporate Offices & Campuses',
    category: 'Enterprise',
    desc: 'Floor-marshal muster verification, desk panic nodes, and silent reception duress codes.',
  },
  {
    src: R2_MEDIA.usecases.schoolUniversity,
    label: 'Schools & Universities',
    category: 'Education',
    desc: 'Student safety rosters, campus security routing, and automated parent alert chains.',
  },
  {
    src: R2_MEDIA.usecases.hospitalHealthcare,
    label: 'Clinics & Hospitals',
    category: 'Healthcare',
    desc: 'Clinical staff duress buttons, code-blue escalation, and POPIA-compliant incident logs.',
  },
  {
    src: R2_MEDIA.usecases.transportLogistics,
    label: 'Transport, Fleet & Logistics',
    category: 'Fleet Safety',
    desc: 'Driver GPS panic triggers, route deviation monitoring, and hijacking emergency failover.',
  },
  {
    src: R2_MEDIA.usecases.loneWorkerIndustrial,
    label: 'Industrial & Lone-Worker Sites',
    category: 'Industrial',
    desc: 'Watch-Me safety timers and offline mesh beacons for mines, factories, and remote sites.',
  },
  {
    src: R2_MEDIA.usecases.municipalEmergency,
    label: 'Municipalities & Public Safety',
    category: 'Municipal',
    desc: 'Community safety loops, neighbourhood watch coordination, and municipal dispatch routing.',
  },
  {
    src: R2_MEDIA.hardware.limxDynamicsRobot,
    label: 'Autonomous Patrol Robotics',
    category: 'IoT & Robotics',
    desc: 'Mobile BLE mesh repeaters and autonomous perimeter verification linked to Command Deck.',
  },
  {
    src: R2_MEDIA.hardware.fieldBeaconAntenna,
    label: 'Fixed Industrial Mesh Beacons',
    category: 'Field Hardware',
    desc: 'Weatherproof SIM/GPS/BLE field beacons for estates, poles, and load-shedding resilience.',
  },
];

export function Home({ onLogin, onRegisterOrg, onRegisterUser, navigate }: HomeProps) {
  const [language, setLanguage] = useState('en');
  const [bgIdx, setBgIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [hwIdx, setHwIdx] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [lightboxItem, setLightboxItem] = useState<(typeof SHOWCASE_GALLERY)[number] | null>(null);
  const v2ApkUrl = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk';
  const v1ApkUrl = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk';
  const [exeDownloadUrl, setExeDownloadUrl] = useState('https://github.com/Charesmagna/SafetyLink-Core/releases/latest');
  const [releaseVersion, setReleaseVersion] = useState('v2.0 Signed');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const hardwareSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hwScroll } = useScroll({
    target: hardwareSectionRef,
    offset: ['start end', 'end start'],
  });
  const hardwareY = useTransform(hwScroll, [0, 1], [28, -28]);
  const hardwareRotate = useTransform(hwScroll, [0, 0.5, 1], [-4, 0, 4]);
  const hardwareScale = useTransform(hwScroll, [0, 0.5, 1], [0.94, 1.04, 0.98]);

  // Preload initial Hero background & foreground platform slides smoothly
  useEffect(() => {
    HERO_BG_SLIDES.slice(0, 3).forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
    HERO_PLATFORM_SLIDES.slice(0, 3).forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, []);

  // Independent timers so Hero background & Hero platform frame never mirror or duplicate each other
  useEffect(() => {
    const bgTimer = window.setInterval(() => {
      setBgIdx((prev) => (prev + 1) % HERO_BG_SLIDES.length);
    }, 6200);
    const slideTimer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_PLATFORM_SLIDES.length);
    }, 4500);
    const hwTimer = window.setInterval(() => {
      setHwIdx((prev) => (prev + 1) % HARDWARE_PHOTO_POOL.length);
    }, 4000);
    return () => {
      window.clearInterval(bgTimer);
      window.clearInterval(slideTimer);
      window.clearInterval(hwTimer);
    };
  }, []);

  useEffect(() => {
    fetch('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/latest')
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (info?.version) setReleaseVersion(`v2 (${info.version})`);
      })
      .catch(() => {});

    fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=10', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (!Array.isArray(list)) return;
        for (const rel of list) {
          if (!Array.isArray(rel?.assets)) continue;
          const exe = rel.assets.find((a: { name?: string; browser_download_url?: string }) => a.name?.endsWith('.exe'));
          if (exe?.browser_download_url) {
            setExeDownloadUrl(exe.browser_download_url);
            break;
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentBg = HERO_BG_SLIDES[bgIdx];
  const currentSlide = HERO_PLATFORM_SLIDES[slideIdx];
  const currentHw = HARDWARE_PHOTO_POOL[hwIdx];

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 9, ry: x * 9 });
  };

  return (
    <div className="bg-transparent text-slate-900 dark:text-slate-100">
      {/* ── PROMINENT FULL-BLEED CHANGING HERO SECTION (Video background stays active across rest of page) ── */}
      <section className="relative min-h-[560px] lg:min-h-[620px] py-14 sm:py-18 lg:py-22 px-4 sm:px-6 overflow-hidden flex items-center border-b border-emerald-500/20">
        {/* Prominent Full-Bleed Changing R2 Backdrop (Dedicated atmospheric scenes — distinct from foreground showcase) */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          <AnimatePresence mode="sync">
            <motion.img
              key={`hero-bg-${currentBg.src}`}
              src={currentBg.src}
              alt={currentBg.alt}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 0.72, scale: 1.01 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/Polish_20260907_043403519.jpg';
              }}
              className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
            />
          </AnimatePresence>
          {/* Directional Cinematic Readability Scrim — crisp text on left, vivid platform backdrop on right */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(100deg, rgba(4, 12, 28, 0.90) 0%, rgba(4, 12, 28, 0.68) 48%, rgba(4, 12, 28, 0.30) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent pointer-events-none" />
        </div>

        {/* Subtle Luminous Ambient Accent Glow */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-400/18 blur-3xl pointer-events-none animate-float-slow z-[1]" />

        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Hero Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 drop-shadow">
                South African Emergency Network · POPIA Compliant
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Hero language selector"
                className="bg-slate-950/70 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
              >
                <option value="en" className="text-slate-900">English</option>
                <option value="zu" className="text-slate-900">isiZulu</option>
                <option value="af" className="text-slate-900">Afrikaans</option>
                <option value="xh" className="text-slate-900">isiXhosa</option>
                <option value="st" className="text-slate-900">Sesotho</option>
                <option value="tn" className="text-slate-900">Setswana</option>
              </select>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.05] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
              {t.h1a}
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent mt-1">
                {t.h1b}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-100/90 leading-relaxed max-w-xl drop-shadow">
              {t.sub}
            </p>

            {/* Clean Primary Account Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onRegisterUser}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-extrabold shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Create Free Account</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onRegisterOrg}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/14 hover:bg-white/22 backdrop-blur-xl border border-white/25 text-white text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Building2 size={16} className="text-emerald-300" />
                <span>Register Organization</span>
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center px-4 py-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-100 hover:border-emerald-400/60 text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          {/* Right: Synchronized Interactive 3D Frosted-Glass Large Platform Showcase */}
          <div className="lg:col-span-6 sl-perspective">
            <motion.div
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
              animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="rounded-3xl overflow-hidden bg-slate-950/55 backdrop-blur-2xl border border-white/20 shadow-[0_32px_70px_rgba(0,0,0,0.55)] p-2.5 sm:p-3"
            >
              {/* Active Slide Viewport */}
              <div className="relative h-72 sm:h-[360px] rounded-2xl overflow-hidden bg-slate-900">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.src}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={currentSlide.src}
                      alt={currentSlide.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/Polish_20260907_043403519.jpg';
                      }}
                      className="w-full h-full object-cover block"
                    />
                  </motion.div>
                </AnimatePresence>

                <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md border border-emerald-400/35 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  {currentSlide.tag}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent text-white z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display text-sm sm:text-base font-extrabold">{currentSlide.title}</div>
                      <div className="text-xs text-slate-200 mt-0.5">{currentSlide.caption}</div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-300 shrink-0 tabular-nums">
                      0{slideIdx + 1} / 0{HERO_PLATFORM_SLIDES.length}
                    </span>
                  </div>
                  {/* Animated Slide Timer Bar */}
                  <div className="mt-3 h-1 w-full rounded-full bg-white/20 overflow-hidden">
                    <motion.div
                      key={slideIdx}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 4.5, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSlideIdx((slideIdx - 1 + HERO_PLATFORM_SLIDES.length) % HERO_PLATFORM_SLIDES.length)}
                  aria-label="Previous platform view"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/20 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setSlideIdx((slideIdx + 1) % HERO_PLATFORM_SLIDES.length)}
                  aria-label="Next platform view"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/20 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              {/* Interactive 6-Slide Platform Interface Strip (Distinct from Hero Background) */}
              <div className="mt-2.5 grid grid-cols-6 gap-1.5 sm:gap-2">
                {HERO_PLATFORM_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => setSlideIdx(idx)}
                    className={`relative h-12 sm:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === slideIdx
                        ? 'border-emerald-400 ring-2 ring-emerald-400/35 scale-[1.03]'
                        : 'border-white/10 opacity-65 hover:opacity-100'
                    }`}
                    title={slide.title}
                  >
                    <img
                      src={slide.thumb}
                      alt={slide.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/Polish_20260907_043403519.jpg';
                      }}
                      className="w-full h-full object-cover block"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: 3-STEP GLASS PIPELINE (Scroll-Reactive 3D Reveal) ── */}
      <section className="py-14 px-4 sm:px-6 border-y border-slate-200/70 dark:border-slate-800/70 bg-white/45 dark:bg-[#050d1c]/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                How It Works
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Three steps from distress trigger to live response
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate?.('platform')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline self-start sm:self-auto"
            >
              Explore Full Architecture →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sl-perspective">
            {[
              {
                step: '01',
                icon: Radio,
                img: R2_MEDIA.hardware.wearableTrigger,
                title: 'Wearable & App Alerts',
                desc: 'Trigger SOS from the 3D SafetyLink app, a pocket BLE iTag key fob, home widget, or quick tile — with a configurable 10-second PIN disarm window.',
              },
              {
                step: '02',
                icon: BellRing,
                img: R2_MEDIA.architecture.meshPlatformOverview,
                title: 'Automated Response',
                desc: 'Native Android PanicService locks GPS coordinates, queues offline storage, and fires backend FCM loud alerts, SMS, voice call, and zero-airtime Please Call Me fallback.',
              },
              {
                step: '03',
                icon: MapPin,
                img: R2_MEDIA.platform.darkInterface,
                title: 'Control Room Dispatch',
                desc: 'Your family contacts and linked security control room receive live coordinates, incident severity, and one-tap navigation to your exact location.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 28, rotateX: 8 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="rounded-2xl overflow-hidden sl-glass-card flex flex-col"
                >
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md font-mono text-xs font-bold text-emerald-300">
                      STEP {item.step}
                    </span>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SCROLL-REACTIVE 3D HARDWARE LINEUP + FOR SECURITY COMPANIES (REAL CONTROL ROOM IMAGE) ── */}
      <section ref={hardwareSectionRef} className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Hardware Showcase with Scroll-Reactive 3D Float (Real Hardware Photos Only) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="lg:col-span-6 p-6 sm:p-8 rounded-3xl sl-glass-card flex flex-col justify-between gap-6 overflow-hidden"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                Hardware
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                BLE iTag Panic Buttons
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Compact Bluetooth key fobs in five colors with customizable single, double, triple, or long-press emergency profiles.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#0d1b34]/85 border border-slate-200/80 dark:border-white/10 p-5 flex flex-col items-center justify-center gap-4 sl-perspective">
              <motion.img
                key={currentHw.src}
                src={currentHw.src}
                alt={currentHw.label}
                style={{ y: hardwareY, rotate: hardwareRotate, scale: hardwareScale }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/Polish_20260907_043403519.jpg';
                }}
                className="max-h-48 w-auto object-contain rounded-xl drop-shadow-[0_18px_24px_rgba(2,6,23,0.22)]"
              />
              <div className="grid grid-cols-4 gap-2 w-full">
                {[
                  { src: R2_MEDIA.hardware.itagWhite, label: 'White iTag' },
                  { src: R2_MEDIA.hardware.itagBlack, label: 'Black iTag' },
                  { src: R2_MEDIA.hardware.hardwarePack, label: 'Hardware Pack' },
                  { src: R2_MEDIA.hardware.bleTransmitter, label: 'BLE Transmitter' },
                ].map((hw) => (
                  <div
                    key={hw.label}
                    className="h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-white/10"
                    title={hw.label}
                  >
                    <img src={hw.src} alt={hw.label} loading="lazy" className="w-full h-full object-cover block" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">iTag Hardware Onboarding</div>
                <div className="font-display text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  From R49<span className="text-xs font-medium text-slate-500">/mo</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate?.('hardware')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Explore Hardware →
              </button>
            </div>
          </motion.div>

          {/* For Security Companies & Estates Glass Banner WITH REAL CONTROL-ROOM IMAGE */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-800/95 via-emerald-900/95 to-[#062b26]/95 backdrop-blur-xl border border-emerald-400/25 shadow-2xl text-white flex flex-col justify-between gap-5 relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
            <div className="space-y-2.5 relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                For Security Companies &amp; Estates
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
                Get Your Own Control-Room Dashboard &amp; Server Network
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Run a dedicated live incident map, approve or suspend linked residents, monitor Hikvision CCTV feeds, and coordinate patrol vehicles from web or Windows desktop.
              </p>
            </div>

            {/* Real Control-Room Command Preview Visual */}
            <div className="relative z-10 rounded-2xl overflow-hidden border border-emerald-300/25 bg-slate-950/60 h-44 sm:h-48 group">
              <img
                src={R2_MEDIA.usecases.securityDeskOperator}
                alt="SafetyLink Control-Room Operations Console"
                loading="lazy"
                className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  Live Control-Room Dispatch Console
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-[10px] font-bold text-emerald-200">
                  WEB + WIN EXE
                </span>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-emerald-50 relative z-10">
              {[
                'Full-screen Live Incident Map with severity & time filters',
                'Member approval window — approve, suspend, or disconnect anytime',
                '14-day free organization trial with custom SL-ORG code & branding',
                'Windows Command Console EXE + mobile responder workspace',
              ].map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-300 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-1 relative z-10">
              <button
                type="button"
                onClick={onRegisterOrg}
                className="px-5 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Start 14-Day Organization Trial
              </button>
              <button
                type="button"
                onClick={() => navigate?.('enterprise')}
                className="px-5 py-3 rounded-xl border border-emerald-300/35 bg-white/10 backdrop-blur-md text-white hover:bg-white/15 text-xs font-bold transition-colors"
              >
                View Enterprise Features
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 12-CARD SEMANTIC SECTOR, CONTROL ROOM & FIELD OPERATIONS 3D GALLERY ── */}
      <section className="py-16 px-4 sm:px-6 border-y border-slate-200/70 dark:border-slate-800/70 bg-white/45 dark:bg-[#050d1c]/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                Every Environment Covered
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Estates, Control Rooms, Patrols &amp; Field Hardware
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate?.('usecases')}
              className="px-4 py-2 rounded-xl sl-glass-card text-xs font-bold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto"
            >
              Explore All Industry Solutions →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sl-perspective">
            {SHOWCASE_GALLERY.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 28, rotateX: 8 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: (idx % 4) * 0.06 }}
                whileHover={{ y: -6, rotateX: 2, rotateY: idx % 2 === 0 ? 2 : -2 }}
                onClick={() => setLightboxItem(item)}
                className="rounded-2xl overflow-hidden sl-glass-card group cursor-pointer"
              >
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/Polish_20260907_043403519.jpg';
                    }}
                    className="w-full h-full object-cover block transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/70 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                    {item.category}
                  </span>
                  <span className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-950/65 backdrop-blur-md border border-white/15 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={13} />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fullscreen Lightbox for Gallery Platform Images */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full rounded-3xl overflow-hidden bg-slate-900 border border-white/15 shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {lightboxItem.category}
                </span>
                <h3 className="font-display text-base font-extrabold text-white">{lightboxItem.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Close image preview"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={lightboxItem.src}
                alt={lightboxItem.label}
                className="w-full max-h-[75vh] object-contain"
              />
            </div>
            <div className="px-5 py-3 text-xs text-slate-300">{lightboxItem.desc}</div>
          </div>
        </div>
      )}

      {/* ── TRANSPARENT PLANS (Frosted Glass Pricing Cards) ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              Our Plans
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
              Affordable Security Solutions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Free for private individuals and families. Transparent pricing for iTag hardware and organization control rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Free */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="p-7 rounded-3xl sl-glass-card flex flex-col justify-between gap-6"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Personal &amp; Family</h3>
                <div className="mt-3 flex items-baseline gap-1 tabular-nums">
                  <span className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">R0</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Free forever — no trial expiry</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  {[
                    'One-tap 3D mobile SOS & 10s PIN lock',
                    'Emergency contacts, SMS & voice dispatch',
                    'Local Safety Feed & danger-zone warnings',
                    'Encrypted password & document vault',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onRegisterUser}
                className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-emerald-600 text-slate-900 dark:text-white text-xs font-bold transition-colors"
              >
                Create Free Account
              </button>
            </motion.div>

            {/* Household + iTag */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.08 }}
              className="p-7 rounded-3xl sl-glass-card border-2 border-emerald-500/70 dark:border-emerald-400/60 flex flex-col justify-between gap-6"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">iTag Connected Protection</h3>
                <div className="mt-3 flex items-baseline gap-1 tabular-nums">
                  <span className="font-display text-4xl font-extrabold text-emerald-700 dark:text-emerald-400">R49</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hardware panic trigger &amp; relay</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  {[
                    'BLE iTag pocket panic fob pairing',
                    'Zero-airtime Please Call Me relay (Rain SIM)',
                    'Priority FCM loud push alarm to contacts',
                    'Link to any registered estate or patrol org',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onRegisterUser}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
              >
                Get Started
              </button>
            </motion.div>

            {/* Organization Control Room */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.16 }}
              className="p-7 rounded-3xl sl-glass-card flex flex-col justify-between gap-6"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Organization Control Room</h3>
                <div className="mt-3 flex items-baseline gap-1 tabular-nums">
                  <span className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">R149</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">once-off setup</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">Includes 14-day free trial</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  {[
                    'Live Incident Map & Operations Board',
                    'Member join approval & suspension controls',
                    'Hikvision CCTV + Windows Control Desk EXE',
                    'Custom SL-ORG code, SLA & white-label logo',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onRegisterOrg}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold transition-opacity"
              >
                Register Organization
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── KEY PLATFORM CAPABILITIES ── */}
      <section className="py-16 px-4 sm:px-6 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/45 dark:bg-[#050d1c]/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              Engineered for Reliability
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              One unified emergency engine across every device
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Built to deliver alerts even when airtime is empty, data drops out, or the screen is locked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: WifiOff,
                title: 'Zero-Airtime Please Call Me Relay',
                desc: 'Send a free USSD Please Call Me with R0 airtime to 081 673 8186 — automatically relaying your GPS emergency alert with 5-minute deduplication.',
              },
              {
                icon: Timer,
                title: '10-Second Single Countdown',
                desc: 'Prevents accidental alerts while protecting against coerced cancellation using your Safety PIN, biometrics, or silent duress PIN.',
              },
              {
                icon: MapPin,
                title: 'Local Safety Feed & Danger Zones',
                desc: 'Community incident alerts and proximity warnings when approaching high-risk intersections or active disruptions.',
              },
              {
                icon: Radio,
                title: 'Configurable BLE iTag Triggers',
                desc: 'Native GATT scanning with auto-reconnect and flexible click mapping for pocket panic, silent check-in, or instant siren.',
              },
              {
                icon: Shield,
                title: 'Screen-Fit & Accessibility Controls',
                desc: 'Automatic viewport scaling for all Android screen sizes plus manual Light/Deep-Navy glass theme, text scale, and one-handed reach.',
              },
              {
                icon: Lock,
                title: 'Encrypted Password & Evidence Vault',
                desc: 'On-device AES-256 encrypted credential & evidence storage designed for South African POPIA compliance.',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: (idx % 3) * 0.06 }}
                  className="p-6 rounded-2xl sl-glass-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Icon size={19} />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1.5">{card.title}</h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">{card.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CLOUDFLARE R2 MEDIA SHOWCASE (Theme-Aware & Local Verified Previews) ── */}
      <R2MediaShowcase />

      {/* ── DOWNLOAD CHANNELS SECTION ── */}
      <section className="py-16 px-4 sm:px-6 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/45 dark:bg-[#050d1c]/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                Download
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Install SafetyLink on Android, Windows, or Web
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate?.('download')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline self-start sm:self-auto"
            >
              Open Full Download Hub →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl sl-glass-card border-2 border-emerald-500/60 flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Smartphone size={20} />
                </div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  SafetyLink Legacy v1 APK
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Full-featured Android build containing every latest SafetyLink feature, BLE iTag, camera, vault, and USSD relay.
                </p>
              </div>
              <a
                href={v1ApkUrl}
                download="SafetyLink-Legacy-v1-Full.apk"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold text-center no-underline transition-all"
              >
                Download Legacy v1 APK
              </a>
            </div>

            <div className="p-6 rounded-2xl sl-glass-card flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center mb-3">
                  <Shield size={20} />
                </div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  SafetyLink v2 ({releaseVersion})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Signed Android APK channel with native foreground keepalive, SMS/voice dispatch, and POPIA telemetry.
                </p>
              </div>
              <a
                href={v2ApkUrl}
                download="SafetyLink-v2.apk"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold text-center no-underline transition-opacity"
              >
                Download v2 APK
              </a>
            </div>

            <div className="p-6 rounded-2xl sl-glass-card flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                  <Monitor size={20} />
                </div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Windows Control Desk EXE
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Desktop control-room console for security companies, estate gates, and dispatch supervisors.
                </p>
              </div>
              <a
                href={exeDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold text-center no-underline transition-colors"
              >
                Download Windows EXE
              </a>
            </div>

            <div className="p-6 rounded-2xl sl-glass-card flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Globe size={20} />
                </div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Web App &amp; PWA
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Run immediately on iOS Safari, Android Chrome, or Desktop without an app store download.
                </p>
              </div>
              <button
                type="button"
                onClick={onLogin}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-emerald-600 text-slate-900 dark:text-white text-xs font-bold transition-colors"
              >
                Launch Web App
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOUTH AFRICA HEADQUARTERS & SUPPORT BAND ── */}
      <section className="py-14 px-4 sm:px-6 border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 rounded-3xl sl-glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              South Africa Headquarters &amp; Support
            </p>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
              TM Media Solutions (Pty) Ltd
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Reg: 2018/500191/07 · Johannesburg, Gauteng, South Africa · Voice Dispatch:{' '}
              <strong className="text-slate-900 dark:text-white">081 673 8186</strong> · WhatsApp:{' '}
              <strong className="text-slate-900 dark:text-white">+27 68 007 9911</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold no-underline transition-all shadow-md"
            >
              Chat on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => navigate?.('privacy')}
              className="px-5 py-2.5 rounded-xl bg-white/75 dark:bg-[#071124]/75 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors"
            >
              POPIA Privacy Policy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
