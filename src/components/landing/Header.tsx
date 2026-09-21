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

  return (
    <>
      <nav
        id="nav"
        className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-md border-b transition-all duration-300 ${
          globalTheme === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
            : 'bg-slate-950/90 border-slate-800/80 text-slate-100'
        } ${scrolled ? (globalTheme === 'light' ? 'shadow-[0_4px_20px_rgba(0,0,0,0.06)]' : 'shadow-[0_4px_24px_rgba(0,0,0,0.4)]') : ''}`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 h-[60px] flex items-center justify-between gap-2">

          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className="flex items-center gap-2 no-underline shrink-0"
          >
            <img
              src="https://res.cloudinary.com/qcp4fx2v/image/upload/Polish_20260818_074430308"
              alt="SafetyLink"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const imgEl = e.currentTarget as HTMLImageElement;
                if (!imgEl.src.includes('Polish_20260620')) {
                  imgEl.src = 'https://res.cloudinary.com/qcp4fx2v/image/upload/Polish_20260620_014530309';
                }
              }}
            />
            <span className={`text-[17px] font-[800] tracking-[-0.02em] hidden min-[601px]:inline ${
              globalTheme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              SafetyLink
            </span>
          </a>

          {/* Desktop nav links (visible on lg screens) */}
          <div className="hidden lg:flex items-center gap-5">
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, 'home')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'home'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => handleLinkClick(e, 'platform')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'platform' || activePage === 'features'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Platform Features
            </a>
            <a
              href="#usecases"
              onClick={(e) => handleLinkClick(e, 'usecases')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'usecases'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Use Cases
            </a>
            <a
              href="#hardware"
              onClick={(e) => handleLinkClick(e, 'hardware')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'hardware'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Hardware Config
            </a>
            <a
              href="#ai"
              onClick={(e) => handleLinkClick(e, 'enterprise')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'enterprise' || activePage === 'ai'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              AI Co-Pilot
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleLinkClick(e, 'pricing')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'pricing'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Pricing
            </a>
            <a
              href="#download"
              onClick={(e) => handleLinkClick(e, 'store')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'store' || activePage === 'download'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 pb-[2px]'
                  : globalTheme === 'light'
                  ? 'text-slate-600 hover:text-emerald-600'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Download
            </a>
            {onLogin && (
              <button
                onClick={onLogin}
                className={`text-[12px] font-[600] px-3 py-1.5 rounded-[7px] border transition-colors ${
                  globalTheme === 'light'
                    ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                    : 'text-slate-200 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 border-slate-700'
                }`}
              >
                Log In
              </button>
            )}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Language selector */}
            <div className="relative">
              <select
                id="lang-select"
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                aria-label="Select language"
                className={`appearance-none rounded-[7px] py-[6px] pl-[7px] sm:pl-[9px] pr-[22px] sm:pr-[24px] text-[10px] sm:text-[11px] font-[700] cursor-pointer outline-none font-sans transition-colors ${
                  globalTheme === 'light'
                    ? 'bg-slate-100 border border-slate-300 text-slate-800 focus:border-slate-400'
                    : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-slate-500'
                }`}
              >
                <option value="en">🌐 EN</option>
                <option value="zu">🌐 ZULU</option>
                <option value="af">🌐 AFR</option>
                <option value="xh">🌐 XHOSA</option>
                <option value="st">🌐 SOTHO</option>
                <option value="tn">🌐 TSWANA</option>
                <option value="ts">🌐 TSONGA</option>
                <option value="ss">🌐 SWATI</option>
                <option value="ve">🌐 VENDA</option>
                <option value="nr">🌐 NDEBELE</option>
                <option value="nso">🌐 SEPEDI</option>
              </select>
              <svg
                className="absolute right-[6px] top-1/2 -translate-y-1/2 pointer-events-none"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke={globalTheme === 'light' ? '#475569' : '#94a3b8'}
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>

            {/* Desktop / Mobile view toggle (hidden on native app and compact mobile) */}
            {!Capacitor.isNativePlatform() && (
              <button
                className={`hidden md:flex items-center gap-[5px] rounded-[7px] px-[9px] py-[6px] cursor-pointer text-[11px] font-[600] font-sans transition-colors ${
                  globalTheme === 'light'
                    ? 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
                onClick={toggleView}
                id="view-btn"
                title="Toggle mobile/desktop view"
              >
                {!mobileView ? (
                  <svg id="icon-desktop" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                ) : (
                  <svg id="icon-mobile" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/>
                  </svg>
                )}
                <span id="view-label" className="hidden lg:inline">
                  {!mobileView ? 'Desktop' : 'Mobile'}
                </span>
              </button>
            )}

            {/* Social icons - visible on tablets and desktop */}
            <div className="hidden md:flex items-center gap-[4px]">
              <a
                href="mailto:info@safetylink.online"
                className={`w-7 h-7 rounded-[7px] flex items-center justify-center text-inherit no-underline transition-colors shrink-0 ${
                  globalTheme === 'light'
                    ? 'bg-slate-100 border border-slate-300 hover:bg-slate-200'
                    : 'bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#e0f2fe]'
                }`}
                title="Email us"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/share/1D8xnzfY8T/"
                target="_blank"
                rel="noreferrer"
                className={`w-7 h-7 rounded-[7px] flex items-center justify-center text-inherit no-underline transition-colors shrink-0 ${
                  globalTheme === 'light'
                    ? 'bg-slate-100 border border-slate-300 hover:bg-slate-200'
                    : 'bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#dbeafe]'
                }`}
                title="Facebook"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* Directionable WhatsApp Hub */}
              <div className="relative">
                <button
                  onClick={() => setWhatsappMenuOpen(prev => !prev)}
                  onMouseEnter={() => setWhatsappMenuOpen(true)}
                  className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    whatsappMenuOpen
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-sm'
                      : globalTheme === 'light'
                      ? 'bg-slate-100 border border-slate-300 hover:bg-slate-200'
                      : 'bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#dcfce7]'
                  }`}
                  title="Connect on WhatsApp (Direct Support, Channel & Community)"
                  aria-label="Open WhatsApp Channels Menu"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>

                {whatsappMenuOpen && (
                  <div
                    onMouseLeave={() => setWhatsappMenuOpen(false)}
                    className={`absolute right-0 top-full mt-2 w-72 p-2.5 rounded-2xl shadow-2xl border z-[1050] animate-in fade-in zoom-in-95 duration-150 ${
                      globalTheme === 'light'
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
                    }`}
                  >
                    <div className="px-2 py-1.5 border-b border-slate-700/30 mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 font-mono">
                        WhatsApp Channels
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        +27 68 009 911
                      </span>
                    </div>

                    <a
                      href="https://wa.me/message/YIEA73M7H3P5M1"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsappMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl transition-all no-underline ${
                        globalTheme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-sm">
                        💬
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                          <span>Chat on WhatsApp</span>
                          <span className="text-[9px] font-mono text-emerald-500/80">Support</span>
                        </div>
                        <p className="text-[10px] text-slate-400 m-0 leading-tight">
                          Direct chat with dispatch & team (+27 68 009 911)
                        </p>
                      </div>
                    </a>

                    <a
                      href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsappMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl transition-all no-underline ${
                        globalTheme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0 text-sm">
                        📢
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-teal-400 flex items-center justify-between">
                          <span>Official WA Channel</span>
                          <span className="text-[9px] font-mono text-teal-500/80">Follow</span>
                        </div>
                        <p className="text-[10px] text-slate-400 m-0 leading-tight">
                          Live platform advisories & emergency broadcasts
                        </p>
                      </div>
                    </a>

                    <a
                      href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setWhatsappMenuOpen(false)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl transition-all no-underline ${
                        globalTheme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0 text-sm">
                        👥
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-green-400 flex items-center justify-between">
                          <span>Community Group</span>
                          <span className="text-[9px] font-mono text-green-500/80">Join</span>
                        </div>
                        <p className="text-[10px] text-slate-400 m-0 leading-tight">
                          Estate, neighbourhood & mesh responder community
                        </p>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Theme Toggle (Moon / Sun) - Always Prominently Visible */}
            <button
              id="theme-toggle-btn"
              onClick={() => setGlobalTheme(globalTheme === 'dark' ? 'light' : 'dark')}
              className={`w-8 h-8 rounded-[7px] flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm ${
                globalTheme === 'dark'
                  ? 'bg-slate-900 border border-slate-700 text-amber-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-slate-850'
                  : 'bg-slate-100 border border-slate-300 text-indigo-600 hover:text-indigo-700 hover:border-indigo-400 hover:bg-slate-200'
              }`}
              title={globalTheme === 'dark' ? "Switch to Light Mode" : "Switch to Tactical Dark Mode"}
              aria-label="Toggle visual theme"
            >
              {globalTheme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* CTA button (visible on tablet/desktop) */}
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
              target="_blank"
              rel="noreferrer"
              className="bg-[#15803d] hover:bg-[#166534] text-white px-3.5 py-1.5 rounded-[7px] text-[11px] font-[700] no-underline whitespace-nowrap transition-colors hidden sm:block shadow-sm"
            >
              Get Started
            </a>

            {/* Hamburger Button (visible on <lg screens) */}
            <button
              id="ham"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className={`flex lg:hidden rounded-[7px] cursor-pointer p-2 shrink-0 items-center justify-center transition-all ${
                globalTheme === 'light'
                  ? 'bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[60px] bg-black/60 backdrop-blur-xs z-[1001] lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mob-menu"
          className={`fixed top-[60px] left-0 right-0 z-[1002] flex flex-col border-b shadow-2xl max-h-[calc(100vh-60px)] overflow-y-auto lg:hidden transition-all ${
            globalTheme === 'light'
              ? 'bg-white/98 border-slate-200 text-slate-800'
              : 'bg-slate-950/98 border-slate-800 text-slate-100'
          }`}
        >
          {/* Quick Theme Toggle Row in Mobile Drawer */}
          <div className={`flex items-center justify-between py-3 px-5 border-b ${
            globalTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-850'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{globalTheme === 'dark' ? '☀️' : '🌙'}</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${globalTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                Visual Mode: {globalTheme === 'dark' ? 'Tactical Dark' : 'Daylight High-Contrast'}
              </span>
            </div>
            <button
              onClick={() => setGlobalTheme(globalTheme === 'dark' ? 'light' : 'dark')}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-colors ${
                globalTheme === 'dark'
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-indigo-600 border-slate-300 hover:bg-slate-100 shadow-xs'
              }`}
            >
              Switch to {globalTheme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>Home</span>
            <span className="text-xs text-slate-500 font-mono">01</span>
          </a>
          <a
            href="#features"
            onClick={(e) => handleLinkClick(e, 'platform')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>Platform Features</span>
            <span className="text-xs text-slate-500 font-mono">02</span>
          </a>
          <a
            href="#usecases"
            onClick={(e) => handleLinkClick(e, 'usecases')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>Use Cases</span>
            <span className="text-xs text-slate-500 font-mono">03</span>
          </a>
          <a
            href="#hardware"
            onClick={(e) => handleLinkClick(e, 'hardware')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>Hardware Config</span>
            <span className="text-xs text-slate-500 font-mono">04</span>
          </a>
          <a
            href="#ai"
            onClick={(e) => handleLinkClick(e, 'enterprise')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>AI Co-Pilot</span>
            <span className="text-xs text-slate-500 font-mono">05</span>
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleLinkClick(e, 'pricing')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>Pricing</span>
            <span className="text-xs text-slate-500 font-mono">06</span>
          </a>
          <a
            href="#download"
            onClick={(e) => handleLinkClick(e, 'store')}
            className={`font-[500] no-underline text-[14px] py-3.5 px-5 border-b transition-colors flex items-center justify-between ${
              globalTheme === 'light'
                ? 'text-slate-800 border-slate-100 hover:bg-slate-50'
                : 'text-slate-200 border-slate-900 hover:bg-slate-900'
            }`}
          >
            <span>Download</span>
            <span className="text-xs text-slate-500 font-mono">07</span>
          </a>

          {onLogin && (
            <button
              onClick={() => { setMobileMenuOpen(false); onLogin(); }}
              className={`text-left font-[600] text-[14px] py-3.5 px-5 border-b transition-colors flex items-center gap-2 ${
                globalTheme === 'light'
                  ? 'text-slate-900 border-slate-200 hover:bg-slate-100 bg-slate-50/50'
                  : 'text-slate-100 border-slate-900 hover:bg-slate-900 bg-slate-900/30'
              }`}
            >
              <span>🔑</span>
              <span>Log In to Portal</span>
            </button>
          )}

          <div className="p-4 flex flex-col gap-2.5">
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
              target="_blank"
              rel="noreferrer"
              className="bg-[#15803d] hover:bg-[#166534] text-white font-[700] text-center text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 no-underline transition-colors shadow-sm"
            >
              <span>💬</span>
              <span>Chat on WhatsApp (+27 68 009 911)</span>
            </a>
            <a
              href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s"
              target="_blank"
              rel="noreferrer"
              className="bg-[#0f766e] hover:bg-[#115e59] text-white font-[700] text-center text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 no-underline transition-colors shadow-sm"
            >
              <span>📢</span>
              <span>Follow WhatsApp Official Channel</span>
            </a>
            <a
              href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5"
              target="_blank"
              rel="noreferrer"
              className="bg-[#25d366] hover:bg-[#20ba59] text-white font-[700] text-center text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 no-underline transition-colors shadow-sm"
            >
              <span>👥</span>
              <span>Join WhatsApp Community Group</span>
            </a>
          </div>

          <div className={`flex flex-wrap gap-4 py-3 px-5 items-center text-[12px] ${
            globalTheme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-400'
          }`}>
            <a href="mailto:info@safetylink.online" className="no-underline hover:underline flex items-center gap-1">
              <span>✉️</span> info@safetylink.online
            </a>
            <a href="https://www.facebook.com/share/1D8xnzfY8T/" target="_blank" rel="noreferrer" className="text-[#0284c7] no-underline font-semibold hover:underline flex items-center gap-1">
              <span>📘</span> Facebook
            </a>
            <a href="https://youtu.be/L4gykMYDYjk" target="_blank" rel="noreferrer" className="text-[#ef4444] no-underline font-semibold hover:underline flex items-center gap-1">
              <span>▶️</span> Video Demo
            </a>
          </div>
        </div>
      )}

      {/* Spacer so content isn't hidden under fixed nav */}
      <div className="h-[60px]" style={{ height: '60px' }}></div>
    </>
  );
}
