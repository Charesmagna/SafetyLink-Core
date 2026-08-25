const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

// Add states
code = code.replace(
  'const [isScrolled, setIsScrolled] = useState(false);',
  `const [isScrolled, setIsScrolled] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');`
);

// Replace nav
const newNav = `
      <nav id="nav" className={isScrolled ? 'scrolled' : ''}>
        <div className="nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setIsMenuOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ width: '24px', height: '3px', background: 'white', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '3px', background: 'white', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '3px', background: 'white', borderRadius: '2px' }} />
            </button>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="nav-logo" style={{ marginLeft: 0 }}>
              <span>SafetyLink</span>
            </a>
          </div>
          <div className="nav-actions">
            <button className="btn outline" onClick={onLogin}>Log In</button>
            <button className="btn solid" onClick={onRegisterOrg}>Create Network</button>
          </div>
        </div>
      </nav>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
            {['home', 'features', 'usecases', 'hardware', 'gallery', 'ai', 'pricing', 'download'].map(view => (
              <button 
                key={view}
                onClick={() => { setCurrentView(view); setIsMenuOpen(false); }}
                style={{ background: 'transparent', border: 'none', color: currentView === view ? '#10b981' : 'white', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {view === 'ai' ? "K'lev.ai" : view === 'usecases' ? "Use Cases" : view === 'home' ? 'Home & Dispatch' : view}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { setShowVideoModal(false); setVideoSrc(''); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          <video src={videoSrc} controls autoPlay style={{ width: '90%', maxWidth: '1000px', borderRadius: '12px' }} />
        </div>
      )}
`;
code = code.replace(/<nav id="nav"[\s\S]*?<\/nav>/, newNav);

// Clickable Title
const dispatchTitleHTML = '<h2 className="dtitle">SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH</h2>';
const dispatchTitleClickableHTML = '<h2 className="dtitle" style={{ cursor: "pointer" }} onClick={() => { setVideoSrc("https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310192/Pitch_deck.mp4"); setShowVideoModal(true); }}>SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH <span style={{ fontSize: "12px", verticalAlign: "middle", opacity: 0.8 }}>▶ PLAY VIDEO</span></h2>';
code = code.replace(dispatchTitleHTML, dispatchTitleClickableHTML);

// We will split the file by comments and wrap them safely.
// Since JSX allows Fragments <></>, we just need to wrap each logical section group in {currentView === 'X' && (<> ... </>)}.

const parts = [
  { match: '{/* ══ HEADER / HERO ══ */}', view: 'home' },
  { match: '{/* ══ FEATURES ══ */}', view: 'features' }, // Wait, there is no comment for features.
  { match: '{/* ══ VIDEO CAROUSEL ══ */}', view: 'features' },
  { match: '{/* ══ USE CASE CARDS ══ */}', view: 'usecases' },
  { match: '{/* ══ DISPATCH SECTION ══ */}', view: 'home' },
  { match: '{/* ══ HARDWARE ══ */}', view: 'hardware' },
  { match: '{/* ══ GALLERY ══ */}', view: 'gallery' },
  { match: '{/* ══ KLEV.AI ══ */}', view: 'ai' },
  { match: '{/* ══ PRICING ══ */}', view: 'pricing' },
  { match: '{/* ══ DOWNLOAD ══ */}', view: 'download' },
  { match: '{/* ══ CTA BAND ══ */}', view: 'none' } // Stop here, render the rest always
];

// Wait, let's just use string replace on specific sections.
// 1. Wrap <header id="home">
code = code.replace(/<header id="home">/, '{currentView === "home" && (<header id="home">');
code = code.replace(/(<\/header>\s*)<section className="features" id="features">/, '$1</header>)}\n\n      {currentView === "features" && (<>\n      <section className="features" id="features">');

// 2. Wrap features + video carousel
code = code.replace(/(<\/section>\s*\{\/\* ══ USE CASE CARDS ══ \*\/\}\s*)<section style=\{\{background:'#fff'/, '</>\n      )}\n\n      {currentView === "usecases" && (\n      <section style={{background:"#fff"');

// 3. Wrap use cases
code = code.replace(/(<\/section>\s*\{\/\* ══ DISPATCH SECTION ══ \*\/\}\s*)<section className="dispatch" id="technology">/, '$1</section>)}\n\n      {currentView === "home" && (\n      <section className="dispatch" id="technology">');

// 4. Wrap dispatch
code = code.replace(/(<\/section>\s*\{\/\* ══ HARDWARE ══ \*\/\}\s*)<section className="hardware" id="hardware">/, '$1</section>)}\n\n      {currentView === "hardware" && (\n      <section className="hardware" id="hardware">');

// 5. Wrap hardware
code = code.replace(/(<\/section>\s*\{\/\* ══ GALLERY ══ \*\/\}\s*)<section className="gallery">/, '$1</section>)}\n\n      {currentView === "gallery" && (\n      <section className="gallery">');

// 6. Wrap gallery
code = code.replace(/(<\/section>\s*\{\/\* ══ KLEV\.AI ══ \*\/\}\s*)<section className="klev" id="ai">/, '$1</section>)}\n\n      {currentView === "ai" && (\n      <section className="klev" id="ai">');

// 7. Wrap Klev
code = code.replace(/(<\/section>\s*\{\/\* ══ PRICING ══ \*\/\}\s*)<section className="pricing" id="pricing">/, '$1</section>)}\n\n      {currentView === "pricing" && (\n      <section className="pricing" id="pricing">');

// 8. Wrap Pricing
code = code.replace(/(<\/section>\s*\{\/\* ══ DOWNLOAD ══ \*\/\}\s*)<section className="download" id="download">/, '$1</section>)}\n\n      {currentView === "download" && (\n      <section className="download" id="download">');

// 9. Wrap Download
code = code.replace(/(<\/section>\s*\{\/\* ══ CTA BAND ══ \*\/\}\s*)<div className="cta-band">/, '$1</section>)}\n\n      <div className="cta-band">');


fs.writeFileSync('src/components/landing/Home.tsx', code);
