import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { R2MediaShowcase } from './R2MediaShowcase';
import { R2_MEDIA } from '../../utils/r2Assets';
import { ACTION_VIDEOS, ASSETS, vid, vidPoster } from '../../utils/cloudinary';
import { useEditorialStore } from '../../utils/editorialStore';
import { SceneErrorBoundary } from '../three/SceneErrorBoundary';
import { useReleaseChannels } from '../../hooks/useReleaseChannels';

const HardwareTag3DScene = lazy(() => import('../three/HardwareTag3DScene'));
import {
  ArrowRight,
  BellRing,
  Building2,
  Check,
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

// ── 1. FULL-BLEED HERO USE-CASE VIDEO REEL (All 10 live SafetyLink action videos rotating continuously) ──
type HeroBgSlide = {
  src: string;
  poster: string;
  label: string;
};

const HERO_BG_SLIDES: HeroBgSlide[] = [
  { src: vid(ACTION_VIDEOS.neighbourhoodWatch), poster: vidPoster(ACTION_VIDEOS.neighbourhoodWatch), label: 'Neighbourhood Watch & Estate Patrols' },
  { src: vid(ACTION_VIDEOS.familyProtection), poster: vidPoster(ACTION_VIDEOS.familyProtection), label: 'Household & Family Protection' },
  { src: vid(ACTION_VIDEOS.droneDispatch), poster: vidPoster(ACTION_VIDEOS.droneDispatch), label: 'Autonomous Aerial Drone Dispatch' },
  { src: vid(ACTION_VIDEOS.governmentDispatch), poster: vidPoster(ACTION_VIDEOS.governmentDispatch), label: 'Municipal & Public Safety Response' },
  { src: vid(ACTION_VIDEOS.schoolsAndWorkplaces), poster: vidPoster(ACTION_VIDEOS.schoolsAndWorkplaces), label: 'Schools & Workplace Security' },
  { src: vid(ACTION_VIDEOS.bleItagAction), poster: vidPoster(ACTION_VIDEOS.bleItagAction), label: 'Pocket BLE iTAG Hardware Trigger' },
  { src: vid(ACTION_VIDEOS.elderlyAtHome), poster: vidPoster(ACTION_VIDEOS.elderlyAtHome), label: 'Elderly & Lone-Worker Welfare Care' },
  { src: vid(ACTION_VIDEOS.childrenAndSchools), poster: vidPoster(ACTION_VIDEOS.childrenAndSchools), label: 'Campus & Student Safety Mesh' },
  { src: vid(ACTION_VIDEOS.liveActionShowcase), poster: vidPoster(ACTION_VIDEOS.liveActionShowcase), label: 'End-to-End SafetyLink Dispatch' },
  { src: vid(ACTION_VIDEOS.fieldTacticalReel), poster: vidPoster(ACTION_VIDEOS.fieldTacticalReel), label: 'Tactical Field Telemetry & Response' },
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
  const [hwIdx, setHwIdx] = useState(0);
  const [lightboxItem, setLightboxItem] = useState<(typeof SHOWCASE_GALLERY)[number] | null>(null);
  const channels = useReleaseChannels();
  const betaApkUrl = channels.testing.apkUrl;
  const v1ApkUrl = channels.stable.apkUrl;
  const [exeDownloadUrl, setExeDownloadUrl] = useState(channels.desktopExe.url);
  const [hwViewMode, setHwViewMode] = useState<'3d' | 'photos'>('3d');
  const [hw3dFullscreen, setHw3dFullscreen] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const stableTag = channels.stable.version;
  const stableBuildLabel = channels.stable.buildNumber ? `Build #${channels.stable.buildNumber}` : 'main';
  const testingTag = channels.testing.version;
  const testingBuildLabel = channels.testing.buildNumber ? `Build #${channels.testing.buildNumber}` : 'beta';

  const hardwareSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hwScroll } = useScroll({
    target: hardwareSectionRef,
    offset: ['start end', 'end start'],
  });
  const hardwareY = useTransform(hwScroll, [0, 1], [28, -28]);
  const hardwareRotate = useTransform(hwScroll, [0, 0.5, 1], [-4, 0, 4]);
  const hardwareScale = useTransform(hwScroll, [0, 0.5, 1], [0.94, 1.04, 0.98]);

  const advanceHeroVideo = () => {
    setBgIdx((prev) => (prev + 1) % HERO_BG_SLIDES.length);
  };

  // Preload upcoming Hero video posters so crossfades between use-case videos stay instant
  useEffect(() => {
    HERO_BG_SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.poster;
    });
  }, []);

  // Rotate Hero use-case videos every 9s (also advances immediately onEnded when a short clip finishes)
  useEffect(() => {
    const bgTimer = window.setTimeout(() => {
      setBgIdx((prev) => (prev + 1) % HERO_BG_SLIDES.length);
    }, 9000);
    return () => window.clearTimeout(bgTimer);
  }, [bgIdx]);

  useEffect(() => {
    const hwTimer = window.setInterval(() => {
      setHwIdx((prev) => (prev + 1) % HARDWARE_PHOTO_POOL.length);
    }, 4500);
    return () => window.clearInterval(hwTimer);
  }, []);

  useEffect(() => {
    if (channels.desktopExe.url) {
      setExeDownloadUrl(channels.desktopExe.url);
    }
  }, [channels.desktopExe.url]);

  const currentBg = HERO_BG_SLIDES[bgIdx];
  const currentHw = HARDWARE_PHOTO_POOL[hwIdx];
  const editorialWeb = useEditorialStore((s) => s.web);
  const webSections = useEditorialStore((s) => s.sections.web);
  const isSectionVisible = (id: string) => {
    const found = webSections.find((s) => s.id === id);
    return found ? found.visible : true;
  };
  const heroTitle1 = language === 'en' && editorialWeb.heroTitle1 ? editorialWeb.heroTitle1 : t.h1a;
  const heroTitle2 = language === 'en' && editorialWeb.heroTitle2 ? editorialWeb.heroTitle2 : t.h1b;
  const heroSub = language === 'en' && editorialWeb.heroSubtitle ? editorialWeb.heroSubtitle : t.sub;
  const heroBadgeText = editorialWeb.heroBadge || 'South African Emergency Network · POPIA Compliant';
  const primaryCtaText = editorialWeb.heroCtaPrimary || 'Create Free Account';
  const secondaryCtaText = editorialWeb.heroCtaSecondary || 'Register Organization';
  const accentColor = /^#[0-9a-f]{3,8}$/i.test(editorialWeb.primaryColor || '') ? editorialWeb.primaryColor : '#10b981';

  return (
    <div className="bg-transparent text-slate-900 dark:text-slate-100">
      {/* ── FULL-BLEED ROTATING USE-CASE VIDEO HERO (Clean background only — no secondary overlay frame) ── */}
      <section className="relative min-h-[560px] lg:min-h-[620px] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 overflow-hidden flex items-center border-b border-emerald-500/20">
        {/* Continuous Multi-Use-Case Hero Video Reel */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          <AnimatePresence mode="sync">
            <motion.video
              key={`hero-bg-vid-${bgIdx}-${currentBg.src}`}
              src={currentBg.src}
              poster={currentBg.poster}
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={advanceHeroVideo}
              onError={advanceHeroVideo}
              initial={{ opacity: 0, scale: 1.14 }}
              animate={{ opacity: 0.86, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
            />
          </AnimatePresence>
          {/* Directional Cinematic Readability Scrim — crisp copy on left, unobstructed use-case action on right */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(100deg, rgba(4, 12, 28, 0.86) 0%, rgba(4, 12, 28, 0.52) 48%, rgba(4, 12, 28, 0.16) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent pointer-events-none" />
        </div>

        {/* Subtle Luminous Ambient Accent Glow */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-400/18 blur-3xl pointer-events-none animate-float-slow z-[1]" />

        <div className="max-w-7xl w-full mx-auto relative z-10">
          {/* Hero Copy — full clean Hero with zero competing overlay frame */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl space-y-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={ASSETS.logo}
                alt="SafetyLink Universal Logo"
                className="h-9 w-auto object-contain drop-shadow-[0_4px_14px_rgba(16,185,129,0.4)]"
              />
              <span className="text-xs font-bold uppercase tracking-wider drop-shadow" style={{ color: accentColor }}>
                {heroBadgeText}
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
              {heroTitle1}
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent mt-1">
                {heroTitle2}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-100/90 leading-relaxed max-w-xl drop-shadow">
              {heroSub}
            </p>

            {/* Clean Primary Account Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onRegisterUser}
                style={{ backgroundColor: accentColor }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl hover:brightness-110 text-slate-950 text-sm font-extrabold shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onRegisterOrg}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/14 hover:bg-white/22 backdrop-blur-xl border border-white/25 text-white text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Building2 size={16} style={{ color: accentColor }} />
                <span>{secondaryCtaText}</span>
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
        </div>
      </section>

      {/* ── HOW IT WORKS: 3-STEP GLASS PIPELINE (Scroll-Reactive 3D Reveal) ── */}
      {isSectionVisible('status') && (
      <section className="py-14 px-4 sm:px-6 border-y border-slate-200/70 dark:border-slate-800/70 bg-white/45 dark:bg-[#050d1c]/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                How It Works
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {editorialWeb.armourTitle || 'Three steps from distress trigger to live response'}
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
      )}

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
            <div className="flex flex-wrap items-start justify-between gap-3">
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
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setHwViewMode('3d')}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    hwViewMode === '3d'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Interactive 3D
                </button>
                <button
                  type="button"
                  onClick={() => setHwViewMode('photos')}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    hwViewMode === 'photos'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Photos
                </button>
              </div>
            </div>

            {hwViewMode === '3d' ? (
              <SceneErrorBoundary title="Interactive 3D BLE iTag" heightClass="h-[340px]">
                <Suspense
                  fallback={
                    <div className="h-[340px] rounded-2xl bg-[#060c18] border border-slate-800 flex items-center justify-center text-xs font-mono text-emerald-400">
                      Loading Interactive 3D iTAG...
                    </div>
                  }
                >
                  <HardwareTag3DScene
                    heightClass="h-[340px]"
                    compact
                    onFullscreenToggle={() => setHw3dFullscreen(true)}
                  />
                </Suspense>
              </SceneErrorBoundary>
            ) : (
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
            )}

            {hw3dFullscreen && (
              <div className="fixed inset-0 z-[120] bg-slate-950/95 p-3 sm:p-6 flex flex-col">
                <div className="flex-1 min-h-0">
                  <SceneErrorBoundary title="Fullscreen 3D BLE iTag Inspector" heightClass="h-full">
                    <Suspense
                      fallback={
                        <div className="h-full rounded-2xl bg-[#060c18] flex items-center justify-center text-xs font-mono text-emerald-400">
                          Loading Fullscreen 3D Hardware Inspector...
                        </div>
                      }
                    >
                      <HardwareTag3DScene
                        heightClass="h-full"
                        isFullscreen
                        onFullscreenToggle={() => setHw3dFullscreen(false)}
                      />
                    </Suspense>
                  </SceneErrorBoundary>
                </div>
              </div>
            )}

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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6 p-6 rounded-2xl sl-glass-card border-2 border-emerald-500/75 flex flex-col justify-between gap-4 shadow-lg shadow-emerald-950/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    VERSION 1 · OFFICIAL STABLE (MAIN)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    SafetyLink APK — Version 1
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {stableTag} · {stableBuildLabel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Version 1 official consumer &amp; responder Android build containing every tested feature: ZeroLink offline USSD + FCM alarm, native SMS &amp; voice dispatch, BLE iTag keyfobs, live Safety Feed, and POPIA vault.
                </p>
              </div>
              <a
                href={v1ApkUrl}
                download={`SafetyLink-v1-${stableTag}.apk`}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold text-center no-underline transition-all shadow-md shadow-emerald-600/20"
              >
                Download Stable v1 APK ({stableTag} · {stableBuildLabel})
              </a>
            </div>

            <div className="lg:col-span-3 p-6 rounded-2xl sl-glass-card flex flex-col justify-between gap-4">
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

            <div className="lg:col-span-3 p-6 rounded-2xl sl-glass-card flex flex-col justify-between gap-4">
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

          <details className="mt-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/40 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer select-none flex flex-wrap items-center justify-between gap-2 hover:text-slate-700 dark:hover:text-slate-300">
              <span>
                Testing Track · SafetyLink Beta ({testingTag} · {testingBuildLabel}
                {channels.sameBuildAsTesting ? ` · Matching Stable v1 ${stableTag}` : ` · Stable v1 on ${stableTag}`})
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Testers Only</span>
            </summary>
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
                {channels.sameBuildAsTesting
                  ? `Testing (${testingTag}) and Official Stable v1 (${stableTag}) currently share the same GitHub build following a fresh push to main. Install Official Stable v1 above for normal use.`
                  : `SafetyLink Testing (${testingTag} · ${testingBuildLabel}) trials upcoming updates ahead of Official Stable v1 (${stableTag} · ${stableBuildLabel}). Everyday users should install Official Stable v1 above.`}
              </p>
              <a
                href={betaApkUrl}
                download={`SafetyLink-Testing-${testingTag}.apk`}
                className="shrink-0 font-mono text-[11px] underline text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Download Testing ({testingTag}) · Testers Only
              </a>
            </div>
          </details>
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
