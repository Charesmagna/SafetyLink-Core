import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../../utils/store';

interface HeaderProps {
  onLogin?: () => void;
  onRegisterOrg?: () => void;
  onNavigate?: (page: string) => void;
  activePage?: string;
}

const T_LANG: Record<string, { h1a: string; h1b: string; sub: string }> = {
  en:  { h1a:'SAFETY FOR YOUR FAMILY AND', h1b:'HOUSE HOLD',    sub:'Peace of mind STARTS AT HOME. Protect what matters most – your family and your home.' },
  zu:  { h1a:'UKUPHEPHA KOMNDENI WAKHO',   h1b:'IKHAYA',        sub:'Ukuthula kwengqondo kuQALA EKHAYA. Vikela okukubalulekile.' },
  af:  { h1a:'VEILIGHEID VIR JOU GESIN EN',h1b:'HUISHOUDING',   sub:'Gemoedsrus BEGIN TUIS. Beskerm wat die meeste saakmaak.' },
  xh:  { h1a:'UKHUSELEKO LOSAPHO LWAKHO',  h1b:'IKHAYA',        sub:'Ukuzola kwengqondo kuQALA EKHAYA. Khusela okubalulekileyo.' },
  st:  { h1a:'TSHIRELETSO YA LELAPA',      h1b:'LAPENG',        sub:'Kgotso ya kelello e qala habo. Sireletsa se hlokehang.' },
  tn:  { h1a:'TSHIRELETSO YA LELWAPA',     h1b:'LAPENG',        sub:'Kagiso ya kelelo e simolola gago. Sireletsa se tlhokegang.' },
  ts:  { h1a:'ANTSWISO YA NDYANGU',        h1b:'KAYA',          sub:'Ku rula ka miehleketo ku sungula kaya. Hlayisa leswi fambisanaka.' },
  ss:  { h1a:'KUVIKELWA KWEMNDENI',        h1b:'EKHAYA',        sub:'Kuthula kwenhlitiyo kweQALA EKHAYA. Vikela loko kubalulekile.' },
  ve:  { h1a:'VHUSIRELE HA MUVHUSO',       h1b:'HAYANI',        sub:'Vhutondoli vhu sumbedzela hayani. Vhusirele zwine zwa vha muhulwane.' },
  nr:  { h1a:'UKUVIKELWA KOMNDENI',        h1b:'EKHAYA',        sub:'Ukuthula kwenhliziyo kuqala ekhaya. Vikela okuyimqoka.' },
  nso: { h1a:'TSHIRELETSO YA LELOKO',      h1b:'LAPENG',        sub:'Kgotso ya kelelo e thoma lapeng. Sireletsa seo se hlokegago.' },
};

export function Header({ onLogin, onRegisterOrg, onNavigate, activePage = 'home' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const { globalTheme, setGlobalTheme } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleView = () => {
    const nextView = !mobileView;
    setMobileView(nextView);
    const body = document.body;
    if (nextView) {
      body.style.maxWidth = '390px';
      body.style.margin = '60px auto 0';
      body.style.boxShadow = '0 0 0 1px #e2e8f0, 0 8px 48px rgba(0,0,0,0.15)';
      body.style.borderRadius = '20px';
      body.style.overflow = 'hidden';
      body.style.position = 'relative';
    } else {
      body.style.maxWidth = '';
      body.style.margin = '';
      body.style.boxShadow = '';
      body.style.borderRadius = '';
      body.style.overflow = '';
      body.style.position = '';
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    const t = T_LANG[lang] || T_LANG.en;
    const h1 = document.getElementById('hero-h1');
    if (h1) h1.innerHTML = `${t.h1a}<br/><span style="color:#15803d;">${t.h1b}</span>`;
    const sub = document.getElementById('hero-sub');
    if (sub) sub.textContent = t.sub;
    const badge = document.getElementById('lang-badge');
    if (badge) {
      const selectEl = document.getElementById('lang-select') as HTMLSelectElement | null;
      if (selectEl) {
        badge.textContent = selectEl.options[selectEl.selectedIndex].text.replace('🌐 ', '');
      }
    }
  };

  const handleLinkClick = (e: React.MouseEvent, pageId: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(pageId);
    }
    setMobileMenuOpen(false);
  };

  const isLight = globalTheme === 'light';

  return (
    <>
      <nav
        id="nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(2, 6, 23, 0.96)',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
          transition: 'box-shadow .3s, background .3s',
          boxShadow: scrolled
            ? (isLight ? '0 4px 24px rgba(0,0,0,.08)' : '0 4px 24px rgba(0,0,0,.5)')
            : 'none',
        }}
      >
        <div
          className="nav-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* LOGO */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className="nav-logo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="https://res.cloudinary.com/qcp4fx2v/image/upload/Polish_20260818_074430308"
              alt="SafetyLink"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                const imgEl = e.currentTarget as HTMLImageElement;
                if (!imgEl.src.includes('Polish_20260620')) {
                  imgEl.src = 'https://res.cloudinary.com/qcp4fx2v/image/upload/Polish_20260620_014530309';
                }
              }}
            />
            <span
              className="nav-brand-text"
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: isLight ? '#0f172a' : '#f8fafc',
                letterSpacing: '-.02em',
              }}
            >
              SafetyLink
            </span>
          </a>

          {/* NAV LINKS — desktop only */}
          <div className="nav-links">
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, 'home')}
              className={activePage === 'home' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: activePage === 'home' ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: activePage === 'home' ? '2px solid #15803d' : 'none',
                paddingBottom: activePage === 'home' ? '2px' : '0',
              }}
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => handleLinkClick(e, 'platform')}
              className={activePage === 'platform' || activePage === 'features' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: (activePage === 'platform' || activePage === 'features') ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: (activePage === 'platform' || activePage === 'features') ? '2px solid #15803d' : 'none',
                paddingBottom: (activePage === 'platform' || activePage === 'features') ? '2px' : '0',
              }}
            >
              Platform Features
            </a>
            <a
              href="#usecases"
              onClick={(e) => handleLinkClick(e, 'usecases')}
              className={activePage === 'usecases' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: activePage === 'usecases' ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: activePage === 'usecases' ? '2px solid #15803d' : 'none',
                paddingBottom: activePage === 'usecases' ? '2px' : '0',
              }}
            >
              Use Cases
            </a>
            <a
              href="#hardware"
              onClick={(e) => handleLinkClick(e, 'hardware')}
              className={activePage === 'hardware' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: activePage === 'hardware' ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: activePage === 'hardware' ? '2px solid #15803d' : 'none',
                paddingBottom: activePage === 'hardware' ? '2px' : '0',
              }}
            >
              Hardware Config
            </a>
            <a
              href="#ai"
              onClick={(e) => handleLinkClick(e, 'enterprise')}
              className={activePage === 'enterprise' || activePage === 'ai' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: (activePage === 'enterprise' || activePage === 'ai') ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: (activePage === 'enterprise' || activePage === 'ai') ? '2px solid #15803d' : 'none',
                paddingBottom: (activePage === 'enterprise' || activePage === 'ai') ? '2px' : '0',
              }}
            >
              AI Co-Pilot
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleLinkClick(e, 'pricing')}
              className={activePage === 'pricing' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: activePage === 'pricing' ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: activePage === 'pricing' ? '2px solid #15803d' : 'none',
                paddingBottom: activePage === 'pricing' ? '2px' : '0',
              }}
            >
              Pricing
            </a>
            <a
              href="#download"
              onClick={(e) => handleLinkClick(e, 'store')}
              className={activePage === 'store' || activePage === 'download' ? 'active' : ''}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: (activePage === 'store' || activePage === 'download') ? '#15803d' : (isLight ? '#64748b' : '#94a3b8'),
                textDecoration: 'none',
                transition: 'color .2s',
                whiteSpace: 'nowrap',
                borderBottom: (activePage === 'store' || activePage === 'download') ? '2px solid #15803d' : 'none',
                paddingBottom: (activePage === 'store' || activePage === 'download') ? '2px' : '0',
              }}
            >
              Download
            </a>
            {onLogin && (
              <button
                onClick={onLogin}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#cbd5e1',
                  background: isLight ? '#f8fafc' : '#1e293b',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '7px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  transition: 'background .2s',
                }}
              >
                Log In
              </button>
            )}
          </div>

          {/* RIGHT CLUSTER */}
          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {/* Language selector */}
            <div className="lang-wrap" style={{ position: 'relative' }}>
              <select
                id="lang-select"
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                aria-label="Select language"
                style={{
                  appearance: 'none',
                  background: isLight ? '#f8fafc' : '#0f172a',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '7px',
                  padding: '6px 24px 6px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isLight ? '#1e293b' : '#f1f5f9',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                <option value="en">🌐 ENGLISH</option>
                <option value="zu">🌐 ZULU</option>
                <option value="af">🌐 AFRIKAANS</option>
                <option value="xh">🌐 XHOSA</option>
                <option value="st">🌐 SESOTHO</option>
                <option value="tn">🌐 SETSWANA</option>
                <option value="ts">🌐 TSONGA</option>
                <option value="ss">🌐 SWATI</option>
                <option value="ve">🌐 VENDA</option>
                <option value="nr">🌐 NDEBELE</option>
                <option value="nso">🌐 SEPEDI</option>
              </select>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isLight ? '#64748b' : '#94a3b8'}
                strokeWidth="2.5"
                style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>

            {/* Desktop / Mobile view toggle (hidden on native app) */}
            {!Capacitor.isNativePlatform() && (
              <button
                className="view-toggle"
                onClick={toggleView}
                id="view-btn"
                title="Toggle mobile/desktop view"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isLight ? '#f8fafc' : '#0f172a',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '7px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#cbd5e1',
                  fontFamily: 'inherit',
                  transition: 'background .2s',
                }}
              >
                {!mobileView ? (
                  <svg id="icon-desktop" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                ) : (
                  <svg id="icon-mobile" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/>
                  </svg>
                )}
                <span id="view-label" className="view-toggle-text">{!mobileView ? 'Desktop' : 'Mobile'}</span>
              </button>
            )}

            {/* Theme Toggle (Moon / Sun) */}
            <button
              id="theme-toggle-btn"
              onClick={() => setGlobalTheme(isLight ? 'dark' : 'light')}
              style={{
                width: '32px',
                height: '32px',
                background: isLight ? '#f8fafc' : '#0f172a',
                border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background .2s',
                flexShrink: 0,
              }}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle visual theme"
            >
              {!isLight ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Social icons */}
            <div className="social-row" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <a
                href="mailto:info@safetylink.online"
                className="soc-btn"
                title="Email us (info@safetylink.online)"
                style={{
                  width: '32px',
                  height: '32px',
                  background: isLight ? '#f8fafc' : '#0f172a',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'background .2s',
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#64748b' : '#94a3b8'} strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </a>

              <a
                href="https://www.facebook.com/share/1D8xnzfY8T/"
                target="_blank"
                rel="noreferrer"
                className="soc-btn fb"
                title="Facebook"
                style={{
                  width: '32px',
                  height: '32px',
                  background: isLight ? '#f8fafc' : '#0f172a',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'background .2s',
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* WhatsApp button with direction popover */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setWhatsappMenuOpen(prev => !prev)}
                  onMouseEnter={() => setWhatsappMenuOpen(true)}
                  className="soc-btn wa"
                  title="Direct Contacts: Tel. 081 673 8186 & Cel. +27 68 007 9911"
                  aria-label="Direct Contacts and WhatsApp"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: isLight ? '#f8fafc' : '#0f172a',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                    borderRadius: '7px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background .2s',
                    flexShrink: 0,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>

                {whatsappMenuOpen && (
                  <div
                    onMouseLeave={() => setWhatsappMenuOpen(false)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '6px',
                      width: '280px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isLight ? '#ffffff' : '#0f172a',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                      boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                      zIndex: 1050,
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '8px', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #1e293b', marginBottom: '8px' }}>
                      Official Emergency Lines
                    </div>

                    {/* Direct Voice & Cell Lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', paddingBottom: '8px', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #1e293b' }}>
                      <a
                        href="tel:0816738186"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)',
                          color: isLight ? '#0f172a' : '#f8fafc',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <span>📞 Tel:</span>
                        <span style={{ fontFamily: 'monospace', color: '#15803d', fontSize: '12px' }}>081 673 8186</span>
                      </a>
                      <a
                        href="tel:+27680079911"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)',
                          color: isLight ? '#0f172a' : '#f8fafc',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <span>📲 Cel:</span>
                        <span style={{ fontFamily: 'monospace', color: '#0ea5e9', fontSize: '12px' }}>+27 68 007 9911</span>
                      </a>
                    </div>

                    <a
                      href="https://wa.me/message/YIEA73M7H3P5M1"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsappMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '7px',
                        textDecoration: 'none',
                        color: isLight ? '#1e293b' : '#f8fafc',
                        fontSize: '11px',
                        fontWeight: 600,
                        transition: 'background .15s',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>💬</span>
                      <div>
                        <div>Chat on WhatsApp</div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 400 }}>Direct Support & Dispatch</div>
                      </div>
                    </a>

                    <a
                      href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsappMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '7px',
                        textDecoration: 'none',
                        color: isLight ? '#1e293b' : '#f8fafc',
                        fontSize: '11px',
                        fontWeight: 600,
                        transition: 'background .15s',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>📢</span>
                      <div>
                        <div>Follow WA Channel</div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 400 }}>Official Platform Broadcasts</div>
                      </div>
                    </a>

                    <a
                      href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsappMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '7px',
                        textDecoration: 'none',
                        color: isLight ? '#1e293b' : '#f8fafc',
                        fontSize: '11px',
                        fontWeight: 600,
                        transition: 'background .15s',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>👥</span>
                      <div>
                        <div>Join Community Group</div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 400 }}>Estates & Mesh Responders</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
              target="_blank"
              rel="noreferrer"
              className="nav-cta"
              style={{
                background: '#15803d',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'background .2s',
              }}
            >
              Get Started
            </a>

            {/* Hamburger */}
            <button
              id="ham"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'none',
              }}
            >
              <svg width="22" height="22" fill="none" stroke={isLight ? '#0f172a' : '#f8fafc'} strokeWidth="2">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </>
                )}
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div
          id="mob-menu"
          className={mobileMenuOpen ? 'open' : ''}
          style={{
            display: mobileMenuOpen ? 'flex' : 'none',
            flexDirection: 'column',
            gap: 0,
            background: isLight ? '#ffffff' : '#020617',
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            Home
          </a>
          <a
            href="#features"
            onClick={(e) => handleLinkClick(e, 'platform')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            Platform Features
          </a>
          <a
            href="#usecases"
            onClick={(e) => handleLinkClick(e, 'usecases')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            Use Cases
          </a>
          <a
            href="#hardware"
            onClick={(e) => handleLinkClick(e, 'hardware')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            Hardware Config
          </a>
          <a
            href="#ai"
            onClick={(e) => handleLinkClick(e, 'enterprise')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            AI Co-Pilot
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleLinkClick(e, 'pricing')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            Pricing
          </a>
          <a
            href="#download"
            onClick={(e) => handleLinkClick(e, 'store')}
            style={{
              color: isLight ? '#1e293b' : '#f8fafc',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: '14px',
              padding: '12px 20px',
              borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
            }}
          >
            Download
          </a>

          {onLogin && (
            <button
              onClick={() => { setMobileMenuOpen(false); onLogin(); }}
              style={{
                color: isLight ? '#1e293b' : '#f8fafc',
                fontWeight: 600,
                fontSize: '14px',
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
                cursor: 'pointer',
              }}
            >
              🔑 Log In to Portal
            </button>
          )}

          <div style={{ padding: '10px 20px', display: 'flex', gap: '8px', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a' }}>
            <a
              href="tel:0816738186"
              style={{
                flex: 1,
                background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '12px',
                padding: '10px 6px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#64748b' }}>VOICE DISPATCH</span>
              <span>📞 081 673 8186</span>
            </a>
            <a
              href="tel:+27680079911"
              style={{
                flex: 1,
                background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '12px',
                padding: '10px 6px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#64748b' }}>CELL LINE</span>
              <span>📲 +27 68 007 9911</span>
            </a>
          </div>

          <a
            href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#15803d',
              color: '#fff',
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '13px',
              padding: '12px 20px',
            }}
          >
            💬 Contact Us on WhatsApp (+27 68 007 9911)
          </a>

          <div
            className="mob-social"
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 20px',
              alignItems: 'center',
              background: isLight ? '#f8fafc' : '#0f172a',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="mailto:info@safetylink.online"
              style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', textDecoration: 'none' }}
            >
              ✉️ info@safetylink.online
            </a>
            <a
              href="https://www.facebook.com/share/1D8xnzfY8T/"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#1877f2', textDecoration: 'none', fontWeight: 600 }}
            >
              📘 Facebook
            </a>
            <a
              href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#15803d', textDecoration: 'none', fontWeight: 600 }}
            >
              📢 Channel
            </a>
            <a
              href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#15803d', textDecoration: 'none', fontWeight: 600 }}
            >
              👥 Group
            </a>
          </div>
        </div>
      </nav>

      {/* Spacer so content isn't hidden under fixed nav */}
      <div style={{ height: '60px' }}></div>

      {/* Inline styles matching the exact specification */}
      <style>{`
        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .nav-links a:hover {
          color: #15803d !important;
        }
        .view-toggle:hover {
          background: ${isLight ? '#f1f5f9' : '#1e293b'} !important;
        }
        .soc-btn:hover {
          background: ${isLight ? '#e0f2fe' : '#1e293b'} !important;
        }
        .soc-btn.wa:hover {
          background: ${isLight ? '#dcfce7' : '#064e3b'} !important;
        }
        .soc-btn.fb:hover {
          background: ${isLight ? '#dbeafe' : '#1e3a8a'} !important;
        }
        .nav-cta:hover {
          background: #166534 !important;
        }
        #mob-menu a:hover {
          background: ${isLight ? '#f8fafc' : '#0f172a'};
        }

        @media(max-width: 960px) {
          .nav-links {
            display: none !important;
          }
          #ham {
            display: block !important;
          }
        }
        @media(max-width: 600px) {
          .view-toggle-text {
            display: none !important;
          }
          .nav-brand-text {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
