const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

// 1. Add state hooks
code = code.replace(
  'const [isScrolled, setIsScrolled] = useState(false);',
  `const [isScrolled, setIsScrolled] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');`
);

// 2. Replace nav with hamburger menu and Video Modal
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

// 3. Make Dispatch section title clickable
const dispatchTitleHTML = '<h2 className="dtitle">SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH</h2>';
const dispatchTitleClickableHTML = '<h2 className="dtitle" style={{ cursor: "pointer" }} onClick={() => { setVideoSrc("https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310192/Pitch_deck.mp4"); setShowVideoModal(true); }}>SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH <span style={{ fontSize: "12px", verticalAlign: "middle", opacity: 0.8 }}>▶ PLAY VIDEO</span></h2>';
code = code.replace(dispatchTitleHTML, dispatchTitleClickableHTML);

// 4. Wrap sections in conditional rendering safely
code = code.replace(/<header id="home">/, '{currentView === "home" && (<>\n      <header id="home">');
code = code.replace(/<section className="features" id="features">/, '</>\n      )}\n\n      {currentView === "features" && (\n      <section className="features" id="features">');
code = code.replace(/\{\/\* ══ VIDEO CAROUSEL ══ \*\/\}/, '      )}\n\n      {currentView === "features" && (\n      <>\n      {/* ══ VIDEO CAROUSEL ══ */}');
code = code.replace(/<section className="dispatch" id="technology">/, '      </>\n      )}\n\n      {currentView === "home" && (\n      <section className="dispatch" id="technology">');
code = code.replace(/<section style={{background:'#fff', padding:'80px 0'}}>/, '      )}\n\n      {currentView === "usecases" && (\n      <section style={{background:"#fff", padding:"80px 0"}}>');
code = code.replace(/<section className="hardware" id="hardware">/, '      )}\n\n      {currentView === "hardware" && (\n      <section className="hardware" id="hardware">');
code = code.replace(/<section className="gallery">/, '      )}\n\n      {currentView === "gallery" && (\n      <section className="gallery">');
code = code.replace(/<section className="klev" id="ai">/, '      )}\n\n      {currentView === "ai" && (\n      <section className="klev" id="ai">');
code = code.replace(/<section className="pricing" id="pricing">/, '      )}\n\n      {currentView === "pricing" && (\n      <section className="pricing" id="pricing">');
code = code.replace(/<section className="download" id="download">/, '      )}\n\n      {currentView === "download" && (\n      <section className="download" id="download">');
code = code.replace(/\{\/\* ══ CTA BAND ══ \*\/\}/, '      )}\n\n      {/* ══ CTA BAND ══ */}');

fs.writeFileSync('src/components/landing/Home.tsx', code);
