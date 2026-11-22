import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../utils/store';

interface HeaderProps {
  onLogin?: () => void;
  onRegisterOrg?: () => void;
  onNavigate?: (page: string) => void;
  activePage?: string;
}

const PRIMARY_NAV = [
  { id: 'platform', label: 'Platform' },
  { id: 'usecases', label: 'Use Cases' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'store', label: 'Store' },
  { id: 'download', label: 'Download' },
];

const SA_LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'isiZulu' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'xh', label: 'isiXhosa' },
  { code: 'st', label: 'Sesotho' },
  { code: 'tn', label: 'Setswana' },
  { code: 'ts', label: 'Xitsonga' },
  { code: 'ss', label: 'siSwati' },
  { code: 've', label: 'Tshivenda' },
  { code: 'nr', label: 'isiNdebele' },
  { code: 'nso', label: 'Sepedi' },
];

export function Header({ onLogin, onNavigate, activePage = 'home' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { globalTheme, setGlobalTheme, language, setLanguage } = useAppStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, pageId: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(pageId);
    }
    setMobileMenuOpen(false);
    setDownloadMenuOpen(false);
  };

  const isLight = globalTheme !== 'dark';
  const navBorder = isLight ? '#d1fae5' : 'rgba(30, 41, 59, 0.8)';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textMuted = isLight ? '#475569' : '#94a3b8';

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
          background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(2, 6, 23, 0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${navBorder}`,
          transition: 'box-shadow .25s, background .25s',
          boxShadow: scrolled
            ? (isLight ? '0 4px 20px rgba(5,150,105,.08)' : '0 4px 20px rgba(0,0,0,.45)')
            : 'none',
        }}
      >
        <div
          className="sl-nav-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Zone 1: Brand Identity */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="/logos/Safety_Link_Logo_Transparent.png"
              alt="SafetyLink"
              style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                const imgEl = e.currentTarget as HTMLImageElement;
                if (!imgEl.src.includes('New SafetyLink Official Logo')) {
                  imgEl.src = '/logos/New SafetyLink Official Logo.svg';
                }
              }}
            />
            <span
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: textPrimary,
                letterSpacing: '-.02em',
                whiteSpace: 'nowrap',
              }}
            >
              SafetyLink
            </span>
          </a>

          {/* Zone 2: Clean Single-Line Navigation */}
          <div className="sl-nav-links">
            {PRIMARY_NAV.map((item) => {
              const isActive = activePage === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleLinkClick(e, item.id)}
                  style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#059669' : textMuted,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    padding: '4px 0',
                    borderBottom: isActive ? '2px solid #059669' : '2px solid transparent',
                    transition: 'color .2s',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Zone 3: Focused Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <select
              id="lang-select"
              value={language || 'en'}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select South African language"
              className="sl-desktop-utility"
              style={{
                background: isLight ? '#f8fafc' : '#0f172a',
                border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: textPrimary,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SA_LANG_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              id="theme-toggle-btn"
              type="button"
              onClick={() => setGlobalTheme(isLight ? 'dark' : 'light')}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle visual theme"
              style={{
                width: '34px',
                height: '34px',
                background: isLight ? '#f8fafc' : '#0f172a',
                border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="sl-desktop-utility"
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: textPrimary,
                  background: 'transparent',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                  borderRadius: '8px',
                  padding: '7px 13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign In
              </button>
            )}

            <div style={{ position: 'relative' }} className="sl-desktop-cta">
              <button
                type="button"
                onClick={() => setDownloadMenuOpen((prev) => !prev)}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 15px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                Get App
              </button>

              {downloadMenuOpen && (
                <div
                  onMouseLeave={() => setDownloadMenuOpen(false)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '250px',
                    padding: '10px',
                    borderRadius: '12px',
                    background: isLight ? '#ffffff' : '#0f172a',
                    border: isLight ? '1px solid #d1fae5' : '1px solid #334155',
                    boxShadow: '0 14px 34px rgba(0,0,0,0.2)',
                    zIndex: 1060,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <a
                    href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk"
                    download
                    onClick={() => setDownloadMenuOpen(false)}
                    style={{ padding: '9px 11px', borderRadius: '8px', background: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.16)', color: '#059669', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}
                  >
                    Download Android v2 APK
                  </a>
                  <a
                    href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setDownloadMenuOpen(false)}
                    style={{ padding: '9px 11px', borderRadius: '8px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', color: textPrimary, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Windows Control Deck EXE
                  </a>
                  <a
                    href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setDownloadMenuOpen(false)}
                    style={{ padding: '9px 11px', borderRadius: '8px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', color: textMuted, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    WhatsApp Support (+27 68 007 9911)
                  </a>
                  <button
                    type="button"
                    onClick={(e) => handleLinkClick(e, 'download')}
                    style={{ padding: '8px 11px', borderRadius: '8px', border: isLight ? '1px solid #e2e8f0' : '1px solid #334155', background: 'transparent', color: '#059669', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Open Full Download Hub →
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              id="ham"
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'none',
              }}
            >
              <svg width="22" height="22" fill="none" stroke={textPrimary} strokeWidth="2.2">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div
            id="mob-menu"
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
              background: isLight ? '#ffffff' : '#020617',
              borderTop: `1px solid ${navBorder}`,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            }}
          >
            {[{ id: 'home', label: 'Home' }, ...PRIMARY_NAV, { id: 'enterprise', label: 'Enterprise & AI' }].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleLinkClick(e, item.id)}
                style={{
                  color: activePage === item.id ? '#059669' : textPrimary,
                  fontWeight: activePage === item.id ? 700 : 500,
                  textDecoration: 'none',
                  fontSize: '15px',
                  padding: '13px 20px',
                  borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a',
                }}
              >
                {item.label}
              </a>
            ))}

            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid #0f172a' }}>
              <select
                value={language || 'en'}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Mobile language selector"
                style={{
                  background: isLight ? '#f8fafc' : '#0f172a',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: textPrimary,
                }}
              >
                {SA_LANG_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {onLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    background: 'transparent',
                    color: textPrimary,
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Sign In to SafetyLink Portal
                </button>
              )}

              <a
                href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk"
                download
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Download Android v2 APK
              </a>
            </div>

            <div style={{ padding: '12px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
              <a href="tel:0816738186" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
                Dispatch: 081 673 8186
              </a>
              <span style={{ color: textMuted }}>·</span>
              <a href="tel:+27680079911" style={{ color: textMuted, fontWeight: 600, textDecoration: 'none' }}>
                +27 68 007 9911
              </a>
              <span style={{ color: textMuted }}>·</span>
              <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Fixed header spacer */}
      <div style={{ height: '64px' }} />

      <style>{`
        .sl-nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .sl-nav-links a:hover {
          color: #059669 !important;
        }
        @media (max-width: 1024px) {
          .sl-nav-links,
          .sl-desktop-utility,
          .sl-desktop-cta {
            display: none !important;
          }
          #ham {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
