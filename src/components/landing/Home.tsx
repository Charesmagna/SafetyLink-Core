import React, { useState, useEffect } from 'react';
import { getR2StreamUrl, R2_MEDIA } from '../../utils/r2Assets';
import { useAppStore } from '../../utils/store';
import { R2MediaShowcase } from './R2MediaShowcase';
import { SosFlowMotionIllustration } from './SosFlowMotionIllustration';
import './Home.css';

interface HomeProps {
  onLogin: () => void;
  onRegisterOrg: () => void;
  onRegisterUser: () => void;
  navigate?: (page: string) => void;
}

const TRANSLATIONS: Record<string, { h1a: string; h1b: string; sub: string }> = {
  en:  { h1a: 'EMERGENCY DISPATCH,', h1b: 'BUILT FOR SOUTH AFRICA.', sub: 'SafetyLink coordinates BLE iTAG keyfobs, native SMS & Voice dispatch, zero-airtime Please Call Me relays, and multi-tenant responder command across mobile, desktop, and web.' },
  zu:  { h1a: 'UKULAWULWA KWEZIMO', h1b: 'EZIPHUTHUMAYO.', sub: 'SafetyLink ithumela izexwayiso ngokushesha nge-SMS, ucingo, ne-WhatsApp usebenzisa izinkinobho ze-BLE.' },
  af:  { h1a: 'NOODREAKSIE,', h1b: 'VIR SUID-AFRIKA GEBOU.', sub: 'SafetyLink koördineer BLE-knoppies, SMS, stemoproepe en noodspanne in een betroubare platform.' },
  xh:  { h1a: 'IMPENDULO YEXESHA', h1b: 'ELIBUHLUNGU.', sub: 'SafetyLink ithuma izilumkiso nge-SMS, umnxeba kunye ne-WhatsApp ngokukhawuleza.' },
  st:  { h1a: 'KARABELO EA TŠOHANYETSO', h1b: 'E TSEPEHANG.', sub: 'SafetyLink e romela melaetsa ea tšohanyetso ka SMS, mohala le WhatsApp.' },
  tn:  { h1a: 'KARABELO YA TSHOGANYETSO', h1b: 'E IKANYEGANG.', sub: 'SafetyLink e romela melaetsa ya tshoganyetso ka SMS, mogala le WhatsApp.' },
};

const HERO_SLIDES = [
  {
    src: '/safetylink-shield.jpg',
    fallback: '/Polish_20260907_043403519.jpg',
    title: 'Mobile SOS Trigger & 10s Disarm Lock',
    caption: 'Single canonical countdown with Safety PIN & silent duress protection',
  },
  {
    src: R2_MEDIA.hardware.itagMacro,
    fallback: '/safetylink-shield.jpg',
    title: 'BLE iTAG Wearable Buttons',
    caption: 'Pocket panic triggers wired into the native Android PanicService',
  },
  {
    src: '/Polish_20260907_043403519.jpg',
    fallback: '/safetylink-shield.jpg',
    title: 'Rapid Household & Estate Deployment',
    caption: 'Unified protection for families, campuses, and security patrols',
  },
  {
    src: R2_MEDIA.platform.dispatchControl,
    fallback: '/safetylink-shield.jpg',
    title: 'Organization Command Deck',
    caption: 'Live Google Maps situational view, Street View, & responder routing',
  },
];

const GALLERY_ITEMS = [
  { src: '/safetylink-shield.jpg', label: 'Android One-Tap SOS', tag: 'MOBILE APP' },
  { src: R2_MEDIA.hardware.itagFinderProduct, label: 'iTAG Hardware Triggers', tag: 'BLE WEARABLE' },
  { src: R2_MEDIA.hardware.itagTeardown, label: 'Estate & Patrol Coordination', tag: 'COMMAND DECK' },
  { src: '/Polish_20260907_043403519.jpg', label: 'Offline Queue & Zero-Data Fallback', tag: 'RESILIENCE' },
  { src: R2_MEDIA.usecases.estateCommunity, label: 'Family Safe-Zone Linking', tag: 'HOUSEHOLDS' },
  { src: getR2StreamUrl('Safetylink/Emergency_Response_System_Architecture.png'), label: 'Dispatch Pipeline Blueprint', tag: 'ARCHITECTURE' },
];

export function Home({ onLogin, onRegisterOrg, onRegisterUser, navigate }: HomeProps) {
  const { globalTheme, language } = useAppStore();
  const isLight = globalTheme !== 'dark';
  const [slideIdx, setSlideIdx] = useState(0);
  const [v2ApkUrl] = useState('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk');
  const [v1ApkUrl, setV1ApkUrl] = useState('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk');
  const [exeDownloadUrl, setExeDownloadUrl] = useState('https://github.com/Charesmagna/SafetyLink-Core/releases/latest');
  const [releaseVersion, setReleaseVersion] = useState('v2.0 (Latest Signed)');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Preload hero slides + cycle cleanly every 5s
  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const preload = new Image();
      preload.src = slide.src;
    });
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Single deduplicated fetch for Worker release metadata + GitHub latest Windows EXE
  useEffect(() => {
    let active = true;
    fetch('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/latest')
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (!active || !info) return;
        if (info.version) {
          const cleanVer = String(info.version).replace(/^v/i, '');
          setReleaseVersion(`v${cleanVer}`);
        }
        if (info.v1ApkUrl) setV1ApkUrl(info.v1ApkUrl);
      })
      .catch(() => {});

    fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=10', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        for (const rel of list) {
          if (!Array.isArray(rel?.assets)) continue;
          const exe = rel.assets.find((a: any) => a.name?.endsWith('.exe'));
          if (exe?.browser_download_url) {
            setExeDownloadUrl(exe.browser_download_url);
            break;
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const currentSlide = HERO_SLIDES[slideIdx];
  const cardBg = isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)';
  const softBg = isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.55)';
  const borderCol = isLight ? '#d1fae5' : 'rgba(51, 65, 85, 0.7)';
  const headingCol = isLight ? '#0f172a' : '#f8fafc';
  const mutedCol = isLight ? '#475569' : '#94a3b8';

  return (
    <div style={{ background: 'transparent', color: headingCol, fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* ── HERO COLLAGE ── */}
      <section style={{ padding: '48px 24px 64px', background: isLight ? 'linear-gradient(180deg, rgba(236,253,245,0.72) 0%, rgba(255,255,255,0.92) 100%)' : 'transparent' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '40px', alignItems: 'center' }}>
          {/* Hero Copy */}
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', color: '#059669', marginBottom: '14px', textTransform: 'uppercase' }}>
              South African Emergency Network · POPIA Compliant
            </div>

            <h1 id="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.02, marginBottom: '20px', color: headingCol }}>
              {t.h1a}<br />
              <span style={{ color: '#059669' }}>{t.h1b}</span>
            </h1>

            <p id="hero-sub" style={{ fontSize: '15px', lineHeight: 1.7, color: mutedCol, maxWidth: '520px', marginBottom: '28px' }}>
              {t.sub}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onRegisterUser}
                style={{ background: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: 800, padding: '14px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(5,150,105,0.22)' }}
              >
                Create Personal Account →
              </button>
              <button
                type="button"
                onClick={onRegisterOrg}
                style={{ background: cardBg, color: '#059669', fontSize: '13px', fontWeight: 700, padding: '13px 20px', borderRadius: '10px', border: '1px solid #10b981', cursor: 'pointer' }}
              >
                Register Organization
              </button>
            </div>
            <div style={{ marginTop: '14px' }}>
              <a
                href="#sos-drill"
                style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                See how the 10-second SOS &amp; R0-airtime failover works ↓
              </a>
            </div>
          </div>

          {/* Interactive Hero Image Slideshow */}
          <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 48px rgba(5, 150, 105, 0.10)' }}>
            <div style={{ position: 'relative', height: '320px', background: '#0f172a', overflow: 'hidden' }}>
              <img
                key={currentSlide.src}
                src={currentSlide.src}
                alt={currentSlide.title}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = currentSlide.fallback;
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 20px', background: 'linear-gradient(to top, rgba(15,23,42,0.92), transparent)', color: '#ffffff' }}>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>{currentSlide.title}</div>
                <div style={{ fontSize: '11.5px', color: '#d1fae5', marginTop: '2px' }}>{currentSlide.caption}</div>
              </div>
              <button
                type="button"
                onClick={() => setSlideIdx((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                aria-label="Previous slide"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', color: '#0f172a', border: 'none', fontWeight: 900, cursor: 'pointer' }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((slideIdx + 1) % HERO_SLIDES.length)}
                aria-label="Next slide"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', color: '#0f172a', border: 'none', fontWeight: 900, cursor: 'pointer' }}
              >
                ›
              </button>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cardBg }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10.5px', fontWeight: 700, color: '#059669' }}>
                SERVER → FCM → SMS → CALL → R0 PCM
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIdx(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    style={{
                      width: idx === slideIdx ? '18px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      background: idx === slideIdx ? '#059669' : '#cbd5e1',
                      transition: 'all .2s',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANIMATED 10-SECOND SOS & R0-AIRTIME FAILOVER ILLUSTRATION ── */}
      <SosFlowMotionIllustration />

      {/* ── UNIFIED EMERGENCY ENGINE ── */}
      <section style={{ padding: '64px 24px', background: softBg, borderBottom: `1px solid ${borderCol}` }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 44px' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', color: '#059669', marginBottom: '10px', textTransform: 'uppercase' }}>
              02 · Built for Reliability Under Pressure
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '12px', color: headingCol }}>
              One Unified Emergency Engine
            </h2>
            <p style={{ fontSize: '14px', color: mutedCol, lineHeight: 1.6 }}>
              Every trigger — software button, physical BLE iTAG, home-screen widget, or quick tile — converges on the native Android PanicService with offline persistence and real dispatch tracking.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { code: '01', title: 'Zero-Airtime Please Call Me Relay', desc: 'Send a free Please Call Me with R0 airtime and 0MB data to our Rain SIM gateway (081 673 8186) — signed via HMAC-SHA256 to notify your saved contacts via SMSGate with automatic retries.' },
              { code: '02', title: '10-Second Single Countdown', desc: 'Instant cancellation lock requiring your Safety PIN, fingerprint/device passcode, or silent duress PIN to protect against coerced cancellation.' },
              { code: '03', title: 'Sequential Carrier Dispatch', desc: 'Coordinates backend API sync first, then native GSM SMS, direct cellular voice call, and WhatsApp alerts for saved contacts.' },
              { code: '04', title: 'BLE iTAG Wearable Mesh', desc: 'Native GATT scanning, automatic reconnect after screen-off, and programmable 1-2-3 click triggers that fire from your pocket.' },
              { code: '05', title: 'Google Maps & Command Deck', desc: 'Live situational mapping, satellite layers, Street View inspection, and multi-tenant responder routing for estates, campuses, and patrols.' },
              { code: '06', title: 'AES-256 Encrypted Vault & POPIA', desc: 'On-device encrypted evidence & document vault built for South African POPIA compliance (Act 4 of 2013) with 11 official languages.' },
            ].map((card) => (
              <div key={card.code} style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: 800, color: '#059669', marginBottom: '10px' }}>
                  CAPABILITY {card.code}
                </div>
                <h3 style={{ fontSize: '15.5px', fontWeight: 800, marginBottom: '8px', color: headingCol }}>{card.title}</h3>
                <p style={{ fontSize: '13px', color: mutedCol, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISUAL GALLERY ── */}
      <section style={{ padding: '64px 24px', background: cardBg }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', color: '#059669', marginBottom: '8px', textTransform: 'uppercase' }}>
                03 · Product Gallery
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: headingCol, margin: 0 }}>
                Hardware, Mobile &amp; Control Room
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate?.('platform')}
              style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #059669', background: 'transparent', color: '#059669', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              Explore Platform Architecture →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {GALLERY_ITEMS.map((item, idx) => (
              <div key={idx} style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${borderCol}`, background: softBg }}>
                <div style={{ height: '180px', background: '#0f172a', overflow: 'hidden' }}>
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/safetylink-shield.jpg';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: headingCol }}>{item.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, color: '#059669', letterSpacing: '.06em' }}>
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOUDFLARE R2 MEDIA SHOWCASE ── */}
      <R2MediaShowcase />

      {/* ── DOWNLOAD VERSION 2, VERSION 1 & WINDOWS DESKTOP ── */}
      <section style={{ padding: '64px 24px', background: softBg, borderTop: `1px solid ${borderCol}` }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', color: '#059669', marginBottom: '10px', textTransform: 'uppercase' }}>
            04 · Official Packages
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: '28px', color: headingCol }}>
            Download SafetyLink
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ background: cardBg, border: '2px solid #059669', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10.5px', fontWeight: 800, color: '#059669', letterSpacing: '.08em' }}>
                RECOMMENDED · ANDROID V2
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: headingCol }}>SafetyLink Version 2 ({releaseVersion})</h3>
              <p style={{ fontSize: '13px', color: mutedCol, lineHeight: 1.55, flex: 1, margin: 0 }}>
                Signed Android APK with zero-airtime Please Call Me relay, Rain SIM SMSGate retry engine, BLE iTAG triggers, and POPIA compliance.
              </p>
              <a href={v2ApkUrl} download style={{ background: '#059669', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', textDecoration: 'none' }}>
                Download SafetyLink Version 2 APK
              </a>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10.5px', fontWeight: 700, color: mutedCol, letterSpacing: '.08em' }}>
                LEGACY BUILD · ANDROID V1
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: headingCol }}>SafetyLink Version 1</h3>
              <p style={{ fontSize: '13px', color: mutedCol, lineHeight: 1.55, flex: 1, margin: 0 }}>
                Classic Version 1 production Android build with foreground protection, BLE iTAG support, and SMS/Voice fallback.
              </p>
              <a href={v1ApkUrl} download style={{ background: '#0f172a', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', textDecoration: 'none' }}>
                Download Version 1 APK
              </a>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10.5px', fontWeight: 700, color: '#0284c7', letterSpacing: '.08em' }}>
                CONTROL ROOM · WINDOWS
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: headingCol }}>Windows Control Deck EXE</h3>
              <p style={{ fontSize: '13px', color: mutedCol, lineHeight: 1.55, flex: 1, margin: 0 }}>
                Desktop application for security control rooms, estate reception desks, and dispatch supervisors.
              </p>
              <a href={exeDownloadUrl} target="_blank" rel="noreferrer" style={{ background: '#0284c7', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', textDecoration: 'none' }}>
                Get Windows EXE
              </a>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate?.('download')}
              style={{ background: 'transparent', border: `1px solid ${borderCol}`, color: '#059669', padding: '10px 20px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              Open Full Download Hub →
            </button>
          </div>
        </div>
      </section>

      {/* ── VERIFIED SOUTH AFRICAN CONTACT & POPIA BAND ── */}
      <section style={{ padding: '56px 24px', background: isLight ? '#ecfdf5' : 'rgba(6,78,59,0.25)', borderTop: `1px solid ${borderCol}` }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '28px', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.12em' }}>
              South Africa Headquarters &amp; Support
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '10px', color: headingCol }}>
              TM Media Solutions (Pty) Ltd
            </h2>
            <p style={{ fontSize: '13.5px', color: mutedCol, lineHeight: 1.65, margin: 0 }}>
              Reg: 2018/500191/07 · Johannesburg, Gauteng, South Africa<br />
              Voice Dispatch Line: <strong>081 673 8186</strong> · Cell / WhatsApp: <strong>+27 68 007 9911</strong><br />
              Email: <a href="mailto:info@safetylink.online" style={{ color: '#059669', fontWeight: 700 }}>info@safetylink.online</a>
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start' }}>
            <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" style={{ background: '#059669', color: '#fff', padding: '12px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', textDecoration: 'none' }}>
              Chat on WhatsApp
            </a>
            <button type="button" onClick={() => navigate?.('privacy')} style={{ background: cardBg, color: headingCol, border: `1px solid ${borderCol}`, padding: '12px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>
              View POPIA Privacy Policy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
