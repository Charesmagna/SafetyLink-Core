import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

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
        className={`fixed top-0 left-0 right-0 z-[1000] bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300 ${
          scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.4)]' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-5 h-[60px] flex items-center justify-between gap-2">

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
            <span className="text-[17px] font-[800] text-slate-100 tracking-[-0.02em] hidden min-[601px]:inline">
              SafetyLink
            </span>
          </a>

          {/* Desktop nav links (visible on >960px) */}
          <div className="hidden min-[961px]:flex items-center gap-5">
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, 'home')}
              className={`text-[12px] font-[500] no-underline whitespace-nowrap transition-colors py-0.5 ${
                activePage === 'home'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
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
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
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
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
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
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
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
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
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
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
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
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-[2px]'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Download
            </a>
            {onLogin && (
              <button
                onClick={onLogin}
                className="text-[12px] font-[600] text-slate-200 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-[7px] border border-slate-700 transition-colors"
              >
                Log In
              </button>
            )}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Language selector */}
            <div className="relative">
              <select
                id="lang-select"
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                aria-label="Select language"
                className="appearance-none bg-slate-900 border border-slate-700 rounded-[7px] py-[6px] pl-[9px] pr-[24px] text-[11px] font-[700] text-slate-200 cursor-pointer outline-none font-sans"
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
                className="absolute right-[7px] top-1/2 -translate-y-1/2 pointer-events-none"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>

            {/* Desktop / Mobile view toggle (hidden on native app) */}
            {!Capacitor.isNativePlatform() && (
              <button
                className="flex items-center gap-[5px] bg-slate-900 border border-slate-700 rounded-[7px] px-[10px] py-[6px] cursor-pointer text-[11px] font-[600] text-slate-300 font-sans transition-colors hover:bg-slate-800"
                onClick={toggleView}
                id="view-btn"
                title="Toggle mobile/desktop view"
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
                <span id="view-label" className="hidden min-[601px]:inline">
                  {!mobileView ? 'Desktop' : 'Mobile'}
                </span>
              </button>
            )}

            {/* Social icons */}
            <div className="flex items-center gap-[5px]">
              <a
                href="mailto:info@safetylink.online"
                className="w-8 h-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] flex items-center justify-center text-inherit no-underline transition-colors hover:bg-[#e0f2fe] shrink-0"
                title="Email us"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/share/1D8xnzfY8T/"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] flex items-center justify-center text-inherit no-underline transition-colors hover:bg-[#dbeafe] shrink-0"
                title="Facebook"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/message/YIEA73M7H3P5M1"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] flex items-center justify-center text-inherit no-underline transition-colors hover:bg-[#dcfce7] shrink-0"
                title="WhatsApp Direct"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a
                href="https://youtu.be/L4gykMYDYjk"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] flex items-center justify-center text-inherit no-underline transition-colors hover:bg-[#fee2e2] shrink-0 hidden min-[480px]:flex"
                title="YouTube Video"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#ef4444">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>

            {/* CTA */}
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
              target="_blank"
              rel="noreferrer"
              className="bg-[#15803d] hover:bg-[#166534] text-white px-4 py-2 rounded-[7px] text-[12px] font-[700] no-underline whitespace-nowrap transition-colors hidden sm:block"
            >
              Get Started
            </a>

            {/* Hamburger (visible on <=960px) */}
            <button
              id="ham"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="block min-[961px]:hidden bg-transparent border-none cursor-pointer p-1"
              aria-label="Open menu"
            >
              <svg width="22" height="22" fill="none" stroke="#e2e8f0" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div id="mob-menu" className="flex flex-col bg-slate-950 border-t border-slate-800 shadow-2xl">
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, 'home')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => handleLinkClick(e, 'platform')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              Platform Features
            </a>
            <a
              href="#usecases"
              onClick={(e) => handleLinkClick(e, 'usecases')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              Use Cases
            </a>
            <a
              href="#hardware"
              onClick={(e) => handleLinkClick(e, 'hardware')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              Hardware Config
            </a>
            <a
              href="#ai"
              onClick={(e) => handleLinkClick(e, 'enterprise')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              AI Co-Pilot
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleLinkClick(e, 'pricing')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              Pricing
            </a>
            <a
              href="#download"
              onClick={(e) => handleLinkClick(e, 'store')}
              className="text-slate-200 font-[500] no-underline text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900"
            >
              Download
            </a>
            {onLogin && (
              <button
                onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                className="text-left text-slate-200 font-[600] text-[14px] py-3 px-5 border-b border-slate-900 hover:bg-slate-900 bg-transparent"
              >
                🔑 Log In to Portal
              </button>
            )}
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink"
              target="_blank"
              rel="noreferrer"
              className="bg-[#15803d] hover:bg-[#166534] text-white font-[700] text-center text-[14px] py-3 block no-underline transition-colors"
            >
              Contact Us on WhatsApp
            </a>
            <a
              href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5"
              target="_blank"
              rel="noreferrer"
              className="bg-[#25d366] text-white font-[700] text-center text-[14px] py-3 block no-underline transition-colors"
            >
              👥 Join WhatsApp Community Group
            </a>
            <div className="flex flex-wrap gap-4 py-3 px-5 items-center bg-slate-900">
              <a href="mailto:info@safetylink.online" className="text-[12px] text-slate-400 no-underline">
                ✉️ info@safetylink.online
              </a>
              <a href="https://www.facebook.com/share/1D8xnzfY8T/" target="_blank" rel="noreferrer" className="text-[12px] text-[#38bdf8] no-underline font-semibold">
                📘 Facebook
              </a>
              <a href="https://youtu.be/L4gykMYDYjk" target="_blank" rel="noreferrer" className="text-[12px] text-[#ef4444] no-underline font-semibold">
                ▶️ Video Demo
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content isn't hidden under fixed nav */}
      <div className="h-[60px]" style={{ height: '60px' }}></div>
    </>
  );
}
