import React, { useState } from 'react';
import './Home.css';

const TRANSLATIONS: Record<string, any> = {
  en:  { h1a: 'FAMILY SAFETY',        h1b: 'STARTS HERE',   sub: 'Emergency response for every South African. Instant alerts. No internet required.' },
  zu:  { h1a: 'UKUPHEPHA KOMNDENI',   h1b: 'KUQALA LAPHA',  sub: 'Impendulo yezimo eziphuthumayo yawo wonke umuntu.' },
  af:  { h1a: 'GESINSEILIGHEID',      h1b: 'BEGIN HIER',    sub: 'Noodreaksie vir elke Suid-Afrikaner.' },
  xh:  { h1a: 'UKHUSELEKO LOSAPHO',   h1b: 'LUQALA APHA',   sub: 'Iimpendulo eziphuthumayo. Akudingeki iintanethi.' },
  st:  { h1a: 'TSHIRELETSO YA LELAPA',h1b: 'E QALA MONA',   sub: 'Karabo ya maemo a tshohanyetso bakeng sa Mafrika Borwa.' },
  tn:  { h1a: 'TSHIRELETSO YA LELWAPA',h1b:'E SIMOLOLA FA',  sub: 'Karabelo ya maemo a tshoganyetso.' },
  ts:  { h1a: 'KULANGUTA KA NDYANGU', h1b: 'KU SUNGULA',    sub: 'Nhlamulo ya xiphiqo xa rivilo.' },
  ss:  { h1a: 'KUVIKELWA KWEMNDENI',  h1b: 'KUQALA LAPHA',  sub: 'Inphendvulo yetinhlupheko tetemphilo.' },
  ve:  { h1a: 'DZIDZIMELO YA MUḒI',   h1b: 'I THOMA AFHA',  sub: 'Ndaela ya tshumelo ya vhuvha vhukati.' },
  nr:  { h1a: 'UKUVIKELWA KOMNDENI',  h1b: 'KUQALA LAPHA',  sub: 'Impendulo yezimo eziphuthumayo.' },
  nso: { h1a: 'TSHIRELETSO YA LELOKO',h1b: 'LAPENG',        sub: 'Kgotso ya kelelo e thoma lapeng.' },
};

interface HomeProps {
  onLogin: () => void;
  onRegisterOrg: () => void;
  onRegisterUser: () => void;
  navigate?: (page: string) => void;
}

export function Home({ onLogin, onRegisterOrg, onRegisterUser, navigate }: HomeProps) {
  const [language, setLanguage] = useState('en');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="landing-page-root w-full overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="hero" id="home" style={{
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%), url("https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', padding: '80px 0 60px', position: 'relative'
      }}>
        <div className="hero-inner">
          <div className="hero-left" style={{ maxWidth: '600px', backgroundColor: 'rgba(255,255,255,0.75)', padding: '40px', borderRadius: '24px', backdropFilter: 'blur(10px)' }}>
            <div className="hero-eyebrow"><div className="hero-dot"></div>Live in South Africa</div>
            <h1>{t.h1a} <span className="g">{t.h1b}</span></h1>
            <p className="hero-sub" style={{ color: '#334155', fontWeight: 500 }}>{t.sub}</p>

            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '6px 9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none', marginBottom: '16px', width: '100%' }}>
              {[['en','🌐 ENGLISH'],['zu','🌐 ZULU'],['af','🌐 AFRIKAANS'],['xh','🌐 XHOSA'],['st','🌐 SESOTHO'],['tn','🌐 SETSWANA'],['ts','🌐 TSONGA'],['ss','🌐 SWATI'],['ve','🌐 VENDA'],['nr','🌐 NDEBELE'],['nso','🌐 SEPEDI']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            <div className="hero-btns" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={onRegisterUser} style={{ background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px' }}>Register Individual</button>
              <button onClick={onRegisterOrg} style={{ background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px' }}>Start 14-day Trial</button>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-phone-wrap">
              <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260809_035827088.png" alt="SafetyLink App UI" />
              <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260819_020134421.jpg" alt="SafetyLink Button" style={{ padding: '20px', objectFit: 'contain' }} />
              <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260620_014530309.jpg" alt="Organizations Panel" />
            </div>
            <div className="hero-flow">
              <div className="flow-step">
                <div className="flow-icon"><svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="#15803d"/></svg></div>
                <span className="flow-label">Wearable &amp; App</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <div className="flow-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M6 20v-1a6 6 0 0112 0v1"/></svg></div>
                <span className="flow-label">Auto Response</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <div className="flow-icon"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg></div>
                <span className="flow-label">Command &amp; Control</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK NAV CARDS ── */}
      <section style={{ background: '#f8fafc', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Everything You Need</h2>
          <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>Tap any section to explore SafetyLink</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '16px' }}>
            {[
              { emoji: '📱', label: 'Platform', sub: 'How it works', page: 'platform' },
              { emoji: '📡', label: 'Hardware', sub: 'BLE & devices', page: 'hardware' },
              { emoji: '🎯', label: 'Use Cases', sub: 'Who needs it', page: 'usecases' },
              { emoji: '💎', label: 'Pricing', sub: 'Plans & costs', page: 'pricing' },
              { emoji: '🏢', label: 'Enterprise', sub: 'For organisations', page: 'enterprise' },
            ].map(c => (
              <button key={c.page} onClick={() => navigate?.(c.page)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px 16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                onMouseOver={e => (e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)')}
                onMouseOut={e => (e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)')}>
                <span style={{ fontSize: '2rem' }}>{c.emoji}</span>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{c.label}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section className="download" id="download">
        <div className="dl-inner">
          <div className="section-eye">Download</div>
          <h2 className="section-h">Get SafetyLink On Your Device</h2>
          <p className="section-sub">Available on Android, Windows, and as a Progressive Web App.</p>
          <div className="dl-grid">
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Code_Generated_Image_1.png" alt="Android App Preview"/>
              <div className="dl-title">Android APK</div>
              <div className="dl-sub">Minimum Android 8.0. Bluetooth LE required.</div>
              <a href="https://safetylink.online/download/apk" className="dl-btn-link apk">Download for Android</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_4jokgv4jokgv4jok.jpg" alt="Windows Command Deck"/>
              <div className="dl-title">Windows EXE</div>
              <div className="dl-sub">SafetyLink Command Deck. Requires SL-ORG-XXXX access code.</div>
              <a href="https://safetylink.online/download/exe" className="dl-btn-link exe">Download for Windows</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260620_014530309.jpg" alt="SafetyLink PWA"/>
              <div className="dl-title">Web App (PWA)</div>
              <div className="dl-sub">Open in browser. Tap Add to Home Screen. Full offline support.</div>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="dl-btn-link pwa">Open Web App</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="cta-band">
        <h2>Ready to protect your community?</h2>
        <p>Message us on WhatsApp — your estate or complex set up within 48 hours.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" className="btn-wa">💬 WhatsApp Us</a>
          <button onClick={onLogin} className="btn-wa" style={{ background: '#1e293b', border: 'none', cursor: 'pointer' }}>Open App</button>
        </div>
      </div>

    </div>
  );
}
