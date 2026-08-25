const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

// We need to add state for currentView and isMenuOpen
code = code.replace(
  'const [isScrolled, setIsScrolled] = useState(false);',
  `const [isScrolled, setIsScrolled] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);`
);

// We replace the <nav> element with a hamburger menu
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
`;
code = code.replace(/<nav id="nav"[\s\S]*?<\/nav>/, newNav);

// Now conditionally render the sections based on currentView
code = code.replace(/<header id="home">/, '{currentView === "home" && (<header id="home">');
code = code.replace(/<\/header>/, '</header>)}');

code = code.replace(/<section className="features" id="features">/, '{currentView === "features" && (<section className="features" id="features">');
code = code.replace(/<\/section>[\s]*\{\/\* ══ VIDEO CAROUSEL ══ \*\/\}/, '</section>)}\n\n      {/* ══ VIDEO CAROUSEL ══ */}');

code = code.replace(/\{\/\* ══ VIDEO CAROUSEL ══ \*\/\}/, '{currentView === "features" && (\n      {/* ══ VIDEO CAROUSEL ══ */}');
code = code.replace(/\{\/\* ══ USE CASE CARDS ══ \*\/\}/, ')}\n\n      {currentView === "usecases" && (\n      {/* ══ USE CASE CARDS ══ */}');
code = code.replace(/\{\/\* ══ DISPATCH SECTION ══ \*\/\}/, ')}\n\n      {currentView === "home" && (\n      {/* ══ DISPATCH SECTION ══ */}');
code = code.replace(/\{\/\* ══ HARDWARE ══ \*\/\}/, ')}\n\n      {currentView === "hardware" && (\n      {/* ══ HARDWARE ══ */}');
code = code.replace(/\{\/\* ══ GALLERY ══ \*\/\}/, ')}\n\n      {currentView === "gallery" && (\n      {/* ══ GALLERY ══ */}');
code = code.replace(/\{\/\* ══ KLEV\.AI ══ \*\/\}/, ')}\n\n      {currentView === "ai" && (\n      {/* ══ KLEV.AI ══ */}');
code = code.replace(/\{\/\* ══ PRICING ══ \*\/\}/, ')}\n\n      {currentView === "pricing" && (\n      {/* ══ PRICING ══ */}');
code = code.replace(/\{\/\* ══ DOWNLOAD ══ \*\/\}/, ')}\n\n      {currentView === "download" && (\n      {/* ══ DOWNLOAD ══ */}');
code = code.replace(/\{\/\* ══ CTA BAND ══ \*\/\}/, ')}\n\n      {/* ══ CTA BAND ══ */}');

// Let's add the video popup logic to the DISPATCH SECTION
// The user wanted: "SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH -which when clicked a relevant video will pop up and starts playing."
const dispatchTitleHTML = '<h2 className="dtitle">SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH</h2>';
const dispatchTitleClickableHTML = '<h2 className="dtitle" style={{ cursor: "pointer" }} onClick={() => { setVideoSrc("https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310192/Pitch_deck.mp4"); setShowVideoModal(true); }}>SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH <span style={{ fontSize: "12px", verticalAlign: "middle", opacity: 0.8 }}>▶ PLAY VIDEO</span></h2>';

code = code.replace(dispatchTitleHTML, dispatchTitleClickableHTML);

// Add state for video modal
code = code.replace(
  'const [isMenuOpen, setIsMenuOpen] = useState(false);',
  `const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');`
);

// Add the video modal render right after the hamburger menu overlay
const videoModalHTML = `
      {showVideoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { setShowVideoModal(false); setVideoSrc(''); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          <video src={videoSrc} controls autoPlay style={{ width: '90%', maxWidth: '1000px', borderRadius: '12px' }} />
        </div>
      )}
`;

code = code.replace(/\{\/\* Hamburger Menu Overlay \*\/\}/, videoModalHTML + '\n      {/* Hamburger Menu Overlay */}');

fs.writeFileSync('src/components/landing/Home.tsx', code);
