const fs = require('fs');

const imports = fs.readFileSync('imports.txt', 'utf8');
const css = fs.readFileSync('css.txt', 'utf8');
const parts = JSON.parse(fs.readFileSync('parts.json', 'utf8'));

// We need to inject the CSS for the hamburger menu if it's missing, but Tailwind covers most of it.
// We will use Tailwind classes for the menu.

const jsx = `
export function LandingPage({ onLogin, onRegisterOrg, onRegisterUser, onBackToApp, isLoggedIn }: LandingPageProps) {
  const [activeSection, setActiveSection] = React.useState('home');
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const navTo = (section) => {
    setActiveSection(section);
    setMenuOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            ${parts.hero}
            ${parts.pricing}
          </>
        );
      case 'platform':
        return <div className="pt-24">${parts.platform}</div>;
      case 'why':
        return <div className="pt-24">${parts.why}</div>;
      case 'klev':
        return <div className="pt-24">${parts.klev}</div>;
      case 'hardware':
        return <div className="pt-24">${parts.hardware}</div>;
      case 'download':
        return <div className="pt-24">${parts.download}</div>;
      case 'contact':
        return <div className="pt-24 pb-24">${parts.contactPart.replace('<div id="cta-banner" id="contact">', '<div id="cta-banner" id="contact" style={{marginTop: 0}}>')}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="landing-page-root">
      ${css}

      {/* Utility Bar */}
      <div id="utility-bar">
        <div className="utility-inner flex justify-center gap-6">
          <a href="https://facebook.com/SafetyLink" className="utility-link" target="_blank" rel="noopener">
            <i className="fa-brands fa-facebook-f"></i><span className="tub-label">Facebook</span>
          </a>
          <a href="https://wa.me/27739441222" className="utility-link" target="_blank" rel="noopener">
            <i className="fa-brands fa-whatsapp"></i><span className="tub-label">WhatsApp</span>
          </a>
          <a onClick={(e) => { e.preventDefault(); onLogin(); }} href="#" className="utility-link">
            <i className="fa-solid fa-right-to-bracket"></i><span className="tub-label">Log In</span>
          </a>
          <a href="mailto:info@safetylink.online" className="utility-link">
            <i className="fa-solid fa-envelope"></i><span className="tub-label">info@safetylink.online</span>
          </a>
          <a href="tel:+27739441222" className="utility-link">
            <i className="fa-solid fa-phone"></i><span className="tub-label">+27 73 944 1222</span>
          </a>
        </div>
      </div>

      {/* Navbar with Hamburger Menu */}
      <nav id="navbar" style={{ zIndex: 10000 }}>
        <div className="nav-inner flex items-center justify-between w-full px-4 lg:px-8">
          <a href="#" onClick={(e) => { e.preventDefault(); navTo('home'); }} className="nav-logo flex items-center gap-2">
            <LogoSetPart part="main" size={36} showBorder={false} />
            SafetyLink<span className="core">-Core</span>
          </a>
          
          <div className="flex items-center gap-4">
            {isLoggedIn && onBackToApp && (
              <a onClick={(e) => { e.preventDefault(); onBackToApp(); }} href="#" className="hidden md:flex items-center gap-2 text-emerald-400 font-bold bg-emerald-950/30 px-4 py-2 rounded-xl border border-emerald-500/20 hover:bg-emerald-900/50 transition-colors">
                <i className="fa-solid fa-arrow-left"></i> Dashboard
              </a>
            )}
            {!isLoggedIn && (
              <a onClick={(e) => { e.preventDefault(); onLogin(); }} href="#" className="hidden md:block btn-ghost">Log In</a>
            )}
            
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="text-white text-2xl p-2 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors z-[10001] relative"
            >
              <i className={\`fa-solid \${menuOpen ? 'fa-xmark text-emerald-400' : 'fa-bars'}\`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <div 
        className={\`fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center gap-6 transition-all duration-300 z-[9999] \${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }\`}
      >
        <div className="flex flex-col items-center gap-6 mt-16 max-h-[80vh] overflow-y-auto w-full px-4 pb-12">
          <button onClick={() => navTo('home')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'home' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Home</button>
          <button onClick={() => navTo('platform')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'platform' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Platform Features</button>
          <button onClick={() => navTo('why')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'why' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Use Cases</button>
          <button onClick={() => navTo('hardware')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'hardware' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Hardware Config</button>
          <button onClick={() => navTo('klev')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'klev' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>AI Co-Pilot</button>
          <button onClick={() => navTo('pricing')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'pricing' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Pricing</button>
          <button onClick={() => navTo('download')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'download' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Download</button>
          <button onClick={() => navTo('contact')} className={\`text-3xl font-black uppercase tracking-wider \${activeSection === 'contact' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}\`}>Contact Us</button>
          
          <div className="w-24 h-1 bg-slate-800 rounded-full my-4"></div>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button onClick={() => { setMenuOpen(false); onLogin(); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-lg tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20">
              <i className="fa-solid fa-right-to-bracket mr-2"></i> Access Dashboard
            </button>
            {onRegisterOrg && (
              <button onClick={() => { setMenuOpen(false); onRegisterOrg(); }} className="w-full py-4 bg-slate-900 border border-slate-700 hover:border-emerald-500 text-white font-bold rounded-xl text-sm tracking-wider uppercase transition-all">
                Register Organization
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="min-h-screen">
        {renderSection()}
      </main>
      
      {/* Footer is part of contactPart natively, or we can just keep it attached to the bottom if we extracted it properly. But contactPart actually contains the footer. Let's make sure the footer is always visible or just leave it inside contactPart. Actually, let's let contactPart have it, or put footer globally. */}
      {activeSection !== 'contact' && (
        <div className="text-center py-8 text-slate-500 text-xs font-mono border-t border-slate-900 mt-12">
          &copy; {new Date().getFullYear()} TM Media Solutions. All rights reserved.
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/LandingPage.tsx', imports + '\n' + jsx);
console.log('Reassembled LandingPage.tsx');
