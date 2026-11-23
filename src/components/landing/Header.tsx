import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../utils/store';
import { ChevronDown, Download, Menu, Moon, Sun, X, Phone, MessageCircle } from 'lucide-react';

interface HeaderProps {
  onLogin?: () => void;
  onRegisterOrg?: () => void;
  onNavigate?: (page: string) => void;
  activePage?: string;
}

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'platform', label: 'Solutions' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'store', label: 'Store' },
  { id: 'download', label: 'Downloads' },
];

export function Header({ onLogin, onRegisterOrg, onNavigate, activePage = 'home' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { globalTheme, setDisplaySettings } = useAppStore();

  const isDark = globalTheme === 'dark';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all border-b ${
          isDark
            ? 'bg-[#071124]/92 border-slate-800/80 text-slate-100'
            : 'bg-white/95 border-slate-200/80 text-slate-900'
        } backdrop-blur-md ${scrolled ? 'shadow-sm' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Wordmark */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className="flex items-center gap-2.5 shrink-0 no-underline group"
          >
            <img
              src="/logos/Safety_Link_Logo_Transparent.png"
              alt="SafetyLink"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                const imgEl = e.currentTarget as HTMLImageElement;
                if (!imgEl.src.includes('New SafetyLink Official Logo')) {
                  imgEl.src = '/logos/New SafetyLink Official Logo.svg';
                }
              }}
            />
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              SafetyLink
            </span>
          </a>

          {/* Center: Clean Single-Line Navigation */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => {
              const isActive =
                activePage === link.id ||
                (link.id === 'platform' && (activePage === 'features' || activePage === 'usecases' || activePage === 'enterprise'));
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className={`text-[13.5px] font-semibold whitespace-nowrap py-1 border-b-2 transition-colors no-underline ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right: Theme Toggle, Download Menu, Log In & Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Download Quick Dropdown (Separate Legacy v1 & v2 APKs + EXE) */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setDownloadMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d1b34] text-slate-700 dark:text-slate-200 hover:border-emerald-500/60 transition-colors"
              >
                <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Get App</span>
                <ChevronDown size={13} className="opacity-70" />
              </button>

              {downloadMenuOpen && (
                <div
                  onMouseLeave={() => setDownloadMenuOpen(false)}
                  className="absolute right-0 top-full mt-2 w-64 p-2 rounded-xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-700 shadow-xl z-50 space-y-1"
                >
                  <a
                    href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk"
                    download="SafetyLink-Legacy-v1-Full.apk"
                    onClick={() => setDownloadMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors no-underline"
                  >
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">SafetyLink Legacy v1 APK</div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">All latest features included</div>
                  </a>
                  <a
                    href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk"
                    download="SafetyLink-v2.apk"
                    onClick={() => setDownloadMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-underline"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">SafetyLink v2 Signed APK</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Latest production build</div>
                  </a>
                  <a
                    href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setDownloadMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-underline"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Windows Control Desk EXE</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Desktop command console</div>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => handleLinkClick(e, 'download')}
                    className="w-full text-left px-3 py-2 rounded-lg border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    Open Full Download Hub →
                  </button>
                </div>
              )}
            </div>

            {/* Unified Light / Deep-Navy Dark Toggle */}
            <button
              type="button"
              onClick={() => setDisplaySettings({ themeMode: isDark ? 'light' : 'dark' })}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d1b34] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Deep Navy Dark Mode'}
              aria-label="Toggle visual theme"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
            </button>

            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Log In
              </button>
            )}

            <button
              type="button"
              onClick={() => (onRegisterOrg ? onRegisterOrg() : onLogin?.())}
              className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
            >
              Get Started
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071124] px-4 py-4 space-y-2 max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-xl">
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold no-underline ${
                    activePage === link.id
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 gap-2">
              <a
                href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk"
                download="SafetyLink-Legacy-v1-Full.apk"
                className="w-full py-2.5 px-3 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-bold text-center no-underline"
              >
                Download Legacy v1 APK (All Features)
              </a>
              <a
                href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk"
                download="SafetyLink-v2.apk"
                className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold text-center no-underline"
              >
                Download v2 Signed APK
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              {onLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold"
                >
                  Log In
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRegisterOrg?.();
                }}
                className="flex-1 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold"
              >
                Get Started
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <a href="tel:0816738186" className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 no-underline">
                <Phone size={13} /> 081 673 8186
              </a>
              <a
                href="https://wa.me/message/YIEA73M7H3P5M1"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 no-underline"
              >
                <MessageCircle size={13} /> WhatsApp Support
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed top bar */}
      <div className="h-16" />
    </>
  );
}
