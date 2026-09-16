import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ASSETS } from '../../utils/cloudinary';

export function Header({ onLogin, onRegisterOrg }: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [mobileView, setMobileView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleView = () => {
    setMobileView(!mobileView);
    const body = document.body;
    if (!mobileView) {
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

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <>
      <nav id="nav" className={`fixed top-0 left-0 right-0 z-[1000] bg-white/97 border-b border-slate-200 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-[1200px] mx-auto px-5 h-[60px] flex items-center justify-between gap-2">
          
          <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
            <img
              src={ASSETS.logo}
              alt="SafetyLink"
              className="h-8 w-auto object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span className="text-[17px] font-extrabold text-slate-900 tracking-[-0.02em] hidden sm:block">SafetyLink</span>
          </Link>

          <div className="hidden lg:flex items-center gap-5">
            <Link to="/" className={`text-xs font-medium text-slate-500 hover:text-green-700 whitespace-nowrap ${isActive('/')}`}>Home</Link>
            <Link to="/platform" className={`text-xs font-medium text-slate-500 hover:text-green-700 whitespace-nowrap ${isActive('/platform')}`}>Platform</Link>
            <Link to="/use-cases" className={`text-xs font-medium text-slate-500 hover:text-green-700 whitespace-nowrap ${isActive('/use-cases')}`}>Use Cases</Link>
            <Link to="/hardware" className={`text-xs font-medium text-slate-500 hover:text-green-700 whitespace-nowrap ${isActive('/hardware')}`}>Hardware</Link>
            <Link to="/pricing" className={`text-xs font-medium text-slate-500 hover:text-green-700 whitespace-nowrap ${isActive('/pricing')}`}>Pricing</Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <button className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100" onClick={toggleView} title="Toggle mobile/desktop view">
              {!mobileView ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
              )}
              <span className="hidden sm:inline">{!mobileView ? 'Desktop' : 'Mobile'}</span>
            </button>

            {/* Social icons */}
            <div className="flex items-center gap-1.5">
              <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center transition-colors hover:bg-green-100 shrink-0" title="Message Safetylink on WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5" target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center transition-colors hover:bg-green-100 shrink-0" title="Join WhatsApp Group">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </a>
              <a href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s" target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center transition-colors hover:bg-green-100 shrink-0" title="SafetyLink WhatsApp Channel">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </a>
            </div>

            <a href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+want+to+get+SafetyLink" target="_blank" rel="noreferrer" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-colors hidden sm:block">
              Get Started
            </a>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1 ml-1" aria-label="Open menu">
              <svg width="22" height="22" fill="none" stroke="#0f172a" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="flex lg:hidden flex-col bg-white border-t border-slate-200">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium text-sm py-3 px-5 border-b border-slate-100 hover:bg-slate-50">Home</Link>
            <Link to="/platform" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium text-sm py-3 px-5 border-b border-slate-100 hover:bg-slate-50">Platform Features</Link>
            <Link to="/use-cases" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium text-sm py-3 px-5 border-b border-slate-100 hover:bg-slate-50">Use Cases</Link>
            <Link to="/hardware" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium text-sm py-3 px-5 border-b border-slate-100 hover:bg-slate-50">Hardware Config</Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium text-sm py-3 px-5 border-b border-slate-100 hover:bg-slate-50">Pricing</Link>
            <button onClick={() => { setMobileMenuOpen(false); if(onLogin) onLogin(); }} className="text-slate-800 font-medium text-sm py-3 px-5 border-b border-slate-100 hover:bg-slate-50 text-left">Login</button>
            <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" className="bg-green-700 text-white font-bold text-center text-sm py-3 block">Contact Us on WhatsApp</a>
            <div className="flex gap-3 py-3 px-5 items-center bg-slate-50">
              <a href="mailto:info@safetylink.online" className="text-xs text-slate-500">✉️ info@safetylink.online</a>
              <a href="tel:+27816738186" className="text-xs text-slate-500">📞 +27 81 673 8186</a>
            </div>
          </div>
        )}
      </nav>
      <div className="h-[60px]"></div>
    </>
  );
}
