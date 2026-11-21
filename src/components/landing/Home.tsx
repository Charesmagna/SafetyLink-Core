// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { getR2StreamUrl } from '../../utils/r2Assets';
import { useAppStore } from '../../utils/store';
import { R2MediaShowcase } from './R2MediaShowcase';
import './Home.css';

interface HomeProps {
  onLogin: () => void;
  onRegisterOrg: () => void;
  onRegisterUser: () => void;
  navigate?: (page: string) => void;
}

const TRANSLATIONS: Record<string, { h1a: string; h1b: string; sub: string }> = {
  en:  { h1a: 'EMERGENCY DISPATCH,', h1b: 'BUILT FOR SOUTH AFRICA.', sub: 'SafetyLink coordinates BLE iTAG keyfobs, native SMS & Voice dispatch, and multi-tenant responder command — working cleanly across mobile, desktop, and web.' },
  zu:  { h1a: 'UKULAWULWA KWEZIMO', h1b: 'EZIPHUTHUMAYO.', sub: 'SafetyLink ithumela izexwayiso ngokushesha nge-SMS, ucingo, ne-WhatsApp usebenzisa izinkinobho ze-BLE.' },
  af:  { h1a: 'NOODREAKSIE,', h1b: 'VIR SUID-AFRIKA GEBOU.', sub: 'SafetyLink koördineer BLE-knoppies, SMS, stemoproepe en noodspanne in een betroubare platform.' },
  xh:  { h1a: 'IMPENDULO YEXESHA', h1b: 'ELIBUHLUNGU.', sub: 'SafetyLink ithuma izilumkiso nge-SMS, umnxeba kunye ne-WhatsApp ngokukhawuleza.' },
  st:  { h1a: 'KARABELO EA TŠOHANYETSO', h1b: 'E TSEPEHANG.', sub: 'SafetyLink e romela melaetsa ea tšohanyetso ka SMS, mohala le WhatsApp.' },
  tn:  { h1a: 'KARABELO YA TSHOGANYETSO', h1b: 'E IKANYEGANG.', sub: 'SafetyLink e romela melaetsa ya tshoganyetso ka SMS, mogala le WhatsApp.' },
};

const HERO_SLIDES = [
  {
    src: '/Screenshot_20260820_201927_com.aistudio.safetylink.vqnztp.jpg',
    fallback: '/panic-button-smooth.png',
    title: 'Mobile SOS Trigger & 10s Disarm Lock',
    caption: 'Single canonical countdown with PIN & silent duress protection',
  },
  {
    src: '/multi-buttons-smooth.png',
    fallback: '/panic-button-smooth.png',
    title: 'BLE iTAG Wearable Buttons',
    caption: 'Pocket panic triggers wired into the native Android PanicService',
  },
  {
    src: '/Polish_20260727_023640262.jpg',
    fallback: '/hand-smooth.png',
    title: 'Rapid Household & Estate Deployment',
    caption: 'Unified protection for families, campuses, and security patrols',
  },
  {
    src: '/Polish_20260819_020007723.jpg',
    fallback: '/safetylink-shield.jpg',
    title: 'Organization Command Deck',
    caption: 'Live Google Maps situational view, Street View, & responder routing',
  },
];

const GALLERY_ITEMS = [
  { src: '/panic-button-smooth.png', label: 'Android One-Tap SOS', tag: 'MOBILE APP' },
  { src: '/multi-buttons-smooth.png', label: 'iTAG Hardware Triggers', tag: 'BLE WEARABLE' },
  { src: '/Polish_20260819_020134421.jpg', label: 'Estate & Patrol Coordination', tag: 'COMMAND DECK' },
  { src: '/Polish_20260907_043403519.jpg', label: 'Offline Queue & Zero-Data Fallback', tag: 'RESILIENCE' },
  { src: '/hand-smooth.png', label: 'Family Safe-Zone Linking', tag: 'HOUSEHOLDS' },
  { src: getR2StreamUrl('Safetylink/Emergency_Response_System_Architecture.png'), label: 'Dispatch Pipeline Blueprint', tag: 'ARCHITECTURE' },
];

export function Home({ onLogin, onRegisterOrg, onRegisterUser, navigate }: HomeProps) {
  const { globalTheme } = useAppStore();
  const isLight = globalTheme !== 'dark';
  const [language, setLanguage] = useState('en');
  const [slideIdx, setSlideIdx] = useState(0);
  const [v2ApkUrl] = useState('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk');
  const [v1ApkUrl] = useState('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk');
  const [exeDownloadUrl, setExeDownloadUrl] = useState('https://github.com/Charesmagna/SafetyLink-Core/releases/latest');
  const [releaseVersion, setReleaseVersion] = useState('v2.0 (Latest Signed)');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Cycle Hero Slideshow cleanly (every 4.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Fetch latest verified release metadata from Worker + GitHub (for Windows EXE)
  useEffect(() => {
    fetch('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/latest')
      .then(r => (r.ok ? r.json() : null))
      .then((info) => {
        if (info?.version) setReleaseVersion(`v2 (${info.version})`);
      })
      .catch(() => {});

    fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=10', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then(r => (r.ok ? r.json() : null))
      .then((list) => {
        if (!Array.isArray(list)) return;
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

    fetch('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/latest')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.apkUrl) setV1ApkUrl(data.apkUrl);
      })
      .catch(() => {});
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
      <section style={{ padding: '56px 24px 72px', background: isLight ? 'linear-gradient(180deg, rgba(236,253,245,0.72) 0%, rgba(255,255,255,0.92) 100%)' : 'transparent' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '40px', alignItems: 'center' }}>
          {/* Hero Copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', color: '#059669', background: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)', border: '1px solid #a7f3d0', padding: '5px 12px', borderRadius: '999px', marginBottom: '18px' }}>
              ● SOUTH AFRICAN EMERGENCY NETWORK · POPIA COMPLIANT
            </div>

            <div style={{ marginBottom: '16px' }}>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                aria-label="Hero language selector"
                style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: headingCol, cursor: 'pointer' }}
              >
                <option value="en">🌐 English</option>
                <option value="zu">🌐 isiZulu</option>
                <option value="af">🌐 Afrikaans</option>
                <option value="xh">🌐 isiXhosa</option>
                <option value="st">🌐 Sesotho</option>
                <option value="tn">🌐 Setswana</option>
              </select>
            </div>

            <h1 id="hero-h1" style={{ fontSize: 'clamp(36px, 5.5vw, 62px)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.0, marginBottom: '20px', color: headingCol }}>
              {t.h1a}<br />
              <span style={{ color: '#059669' }}>{t.h1b}</span>
            </h1>

            <p id="hero-sub" style={{ fontSize: '15px', lineHeight: 1.7, color: mutedCol, maxWidth: '520px', marginBottom: '28px' }}>
              {t.sub}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={onRegisterUser}
                style={{ background: '#059669', color: '#ffffff', fontSize: '12px', fontWeight: 800, letterSpacing: '.06em', padding: '14px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(5,150,105,0.22)' }}
              >
                CREATE PERSONAL ACCOUNT →
              </button>
              <button
                onClick={onRegisterOrg}
                style={{ background: cardBg, color: '#059669', fontSize: '12px', fontWeight: 700, padding: '13px 20px', borderRadius: '10px', border: '1px solid #10b981', cursor: 'pointer' }}
              >
                REGISTER ORGANIZATION
              </button>
              <button
                onClick={onLogin}
                style={{ background: 'transparent', color: mutedCol, fontSize: '12px', fontWeight: 700, padding: '13px 16px', borderRadius: '10px', border: `1px solid ${borderCol}`, cursor: 'pointer' }}
              >
                SIGN IN
              </button>
            </div>
          </div>

          {/* Interactive Hero Image Slideshow (Opaque card — video backdrop excluded inside) */}
          <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 48px rgba(5, 150, 105, 0.10)' }}>
            <div style={{ position: 'relative', height: '320px', background: '#f1f5f9', overflow: 'hidden' }}>
              <img
                src={currentSlide.src}
                alt={currentSlide.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = currentSlide.fallback;
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 20px', background: 'linear-gradient(to top, rgba(15,23,42,0.88), transparent)', color: '#ffffff' }}>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>{currentSlide.title}</div>
                <div style={{ fontSize: '11px', color: '#d1fae5', marginTop: '2px' }}>{currentSlide.caption}</div>
              </div>
              <button
                type="button"
                onClick={() => setSlideIdx((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                aria-label="Previous slide"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#0f172a', border: 'none', fontWeight: 900, cursor: 'pointer' }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((slideIdx + 1) % HERO_SLIDES.length)}
                aria-label="Next slide"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#0f172a', border: 'none', fontWeight: 900, cursor: 'pointer' }}
              >
                ›
              </button>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cardBg }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, color: '#059669' }}>
                CANONICAL SEQUENCE: SERVER → SMS → CALL → USSD
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

      {/* ── COLLAGE ARCHITECTURE & VERIFIED CAPABILITIES ── */}
      <section style={{ padding: '64px 24px', background: softBg, borderTop: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 44px' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '.16em', color: '#059669', marginBottom: '10px' }}>
              // BUILT FOR RELIABILITY UNDER PRESSURE
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
              { icon: '📵', title: 'Zero-Airtime Please Call Me Relay', desc: 'Send a free Please Call Me with R0 airtime and 0MB data to our Rain SIM gateway (081 673 8186) — signed via HMAC-SHA256 to notify your saved contacts via SMSGate with automatic retries.' },
              { icon: '⏱️', title: '10-Second Single Countdown', desc: 'Instant cancellation lock requiring your Safety PIN, fingerprint/device passcode, or silent duress PIN to protect against coerced cancellation.' },
              { icon: '📶', title: 'Sequential Carrier Dispatch', desc: 'Coordinates backend API sync first, then native GSM SMS, direct cellular voice call, and WhatsApp alerts for saved contacts.' },
              { icon: '📡', title: 'BLE iTAG Wearable Mesh', desc: 'Native GATT scanning, automatic reconnect after screen-off, and programmable 1-2-3 click triggers that fire from your pocket.' },
              { icon: '🗺️', title: 'Google Maps & Command Deck', desc: 'Live situational mapping, satellite layers, Street View inspection, and multi-tenant responder routing for estates, campuses, and patrols.' },
              { icon: '🔐', title: 'AES-256 Encrypted Vault & POPIA', desc: 'On-device encrypted evidence & document vault built for South African POPIA compliance (Act 4 of 2013) with 11 official languages.' },
            ].map((card, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(15,23,42,0.03)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '14px' }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '8px', color: headingCol }}>{card.title}</h3>
                <p style={{ fontSize: '12.5px', color: mutedCol, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISUAL GALLERY (NAMED PRODUCT ASSETS) ── */}
      <section style={{ padding: '64px 24px', background: cardBg }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '.16em', color: '#059669', marginBottom: '8px' }}>
                // PRODUCT GALLERY
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: headingCol, margin: 0 }}>
                Hardware, Mobile &amp; Control Room
              </h2>
            </div>
            <button
              onClick={() => navigate?.('platform')}
              style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #059669', background: 'transparent', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Explore Platform Architecture →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {GALLERY_ITEMS.map((item, idx) => (
              <div key={idx} style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${borderCol}`, background: softBg }}>
                <div style={{ height: '180px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/panic-button-smooth.png';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: headingCol }}>{item.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', fontWeight: 800, color: '#059669', background: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '999px' }}>
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
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '.16em', color: '#059669', marginBottom: '10px' }}>
            // OFFICIAL PACKAGES
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: '28px', color: headingCol }}>
            Download SafetyLink
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ background: cardBg, border: '2px solid #059669', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 24px rgba(5,150,105,0.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '28px' }}>🛡️</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', fontWeight: 900, background: '#059669', color: '#fff', padding: '3px 8px', borderRadius: '999px' }}>VERSION 2 · NEW</span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: headingCol }}>SafetyLink Version 2 ({releaseVersion})</h3>
              <p style={{ fontSize: '12.5px', color: mutedCol, lineHeight: 1.5, flex: 1, margin: 0 }}>
                Signed Android APK with zero-airtime Please Call Me relay, Rain SIM SMSGate retry engine, BLE iTAG triggers, and POPIA compliance.
              </p>
              <a href={v2ApkUrl} download style={{ background: '#059669', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', textDecoration: 'none' }}>
                ⬇️ Download SafetyLink Version 2 APK
              </a>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>📱</span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: headingCol }}>SafetyLink Version 1 (Legacy)</h3>
              <p style={{ fontSize: '12.5px', color: mutedCol, lineHeight: 1.5, flex: 1, margin: 0 }}>
                Classic Version 1 production Android build with foreground protection, BLE iTAG support, and SMS/Voice fallback.
              </p>
              <a href={v1ApkUrl} download style={{ background: '#0f172a', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
                Download Version 1 APK
              </a>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>💻</span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: headingCol }}>Windows Control Deck EXE</h3>
              <p style={{ fontSize: '12.5px', color: mutedCol, lineHeight: 1.5, flex: 1, margin: 0 }}>
                Desktop application for security control rooms, estate reception desks, and dispatch supervisors.
              </p>
              <a href={exeDownloadUrl} target="_blank" rel="noreferrer" style={{ background: '#0284c7', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
                Get Windows EXE
              </a>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => navigate?.('download')}
              style={{ background: 'transparent', border: `1px solid ${borderCol}`, color: '#059669', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
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
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
              // SOUTH AFRICA HEADQUARTERS &amp; SUPPORT
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '10px', color: headingCol }}>
              TM Media Solutions (Pty) Ltd
            </h2>
            <p style={{ fontSize: '13px', color: mutedCol, lineHeight: 1.6, margin: 0 }}>
              Reg: 2018/500191/07 · Johannesburg, Gauteng, South Africa<br />
              Voice Dispatch Line: <strong>081 673 8186</strong> · Cell / WhatsApp: <strong>+27 68 007 9911</strong><br />
              Email: <a href="mailto:info@safetylink.online" style={{ color: '#059669', fontWeight: 700 }}>info@safetylink.online</a>
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start' }}>
            <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" style={{ background: '#059669', color: '#fff', padding: '12px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
              💬 Chat on WhatsApp
            </a>
            <button onClick={() => navigate?.('privacy')} style={{ background: cardBg, color: headingCol, border: `1px solid ${borderCol}`, padding: '12px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              🛡️ View POPIA Privacy Policy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
