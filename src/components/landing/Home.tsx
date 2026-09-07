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
      <section className="hero-new" style={{
        background: '#0f172a', width: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px', position: 'relative'
      }}>
        {/* Placeholder for the uploaded poster */}
        <div style={{ maxWidth: '1000px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
           <img src="/Polish_20260907_043403519.jpg" alt="SafetyLink Promotional Poster" style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#1e293b' }} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop'; }} />
           
           {/* Interactive Overlay Buttons at the bottom of the poster */}
           <div style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px' }}>
              <button onClick={onRegisterOrg} style={{ background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 28px', borderRadius: '4px', fontWeight: 'bold', fontSize: '15px', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onMouseOver={e => e.currentTarget.style.background='#15803d'} onMouseOut={e => e.currentTarget.style.background='#16a34a'}>Get Started</button>
              <button style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', padding: '14px 28px', borderRadius: '4px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'border-color 0.2s', backdropFilter: 'blur(4px)' }} onMouseOver={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.8)'} onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch the Video
              </button>
           </div>
        </div>
        
        {/* Missing Image Warning (Only shows if image fails) */}
        <div style={{ marginTop: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', maxWidth: '600px', textAlign: 'center' }}>
          <strong>Note:</strong> To display your promotional poster here, please upload <code>Polish_20260907_043403519.jpg</code> into the <strong>public</strong> folder using the file explorer on the left.
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section style={{ background: '#f8fafc', padding: '0 24px 60px', marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8"/><path d="M9 11l3-3 3 3"/></svg>, title: 'Unified Monitoring', desc: 'Comprehensive security management in one place.' },
            { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="18" cy="6" r="3" fill="#dc2626" stroke="none"/></svg>, title: 'Real-Time Alerts', desc: 'Instant SOS alerts and activity notifications' },
            { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title: 'Cross-Platform Integration', desc: 'Seamless access on desktop, tablet, and mobile devices.' }
          ].map((card, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{card.title}</h3>
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>Our Plans</h2>
          <p style={{ fontSize: '18px', color: '#475569', fontWeight: 500, marginTop: '8px' }}>Affordable Security Solutions</p>
          <div style={{ width: '100px', height: '2px', background: '#e2e8f0', margin: '24px auto 0' }}></div>
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
