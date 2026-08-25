const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

const navStart = code.indexOf('<nav id="nav"');
const navEnd = code.indexOf('</nav>') + '</nav>'.length;
if (navStart === -1 || navEnd === -1) {
    console.error("Could not find nav tags");
    process.exit(1);
}

// Also remove the overlay hamburger menu
const overlayStart = code.indexOf('{/* Hamburger Menu Overlay */}');
let overlayEnd = code.indexOf('      {/* Video Modal */}');
if (overlayStart !== -1 && overlayEnd !== -1) {
    const originalBlock = code.substring(navStart, overlayEnd);
    const newNav = `      <nav id="nav" className={isScrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="nav-logo">
            <span>SafetyLink</span>
          </a>
          <div className="nav-links">
            <a href="#" className={currentView === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Home</a>
            <a href="#" className={currentView === 'features' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('features'); }}>Features</a>
            <a href="#" className={currentView === 'usecases' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('usecases'); }}>Use Cases</a>
            <a href="#" className={currentView === 'hardware' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('hardware'); }}>Hardware</a>
            <a href="#" className={currentView === 'ai' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('ai'); }}>AI Co-Pilot</a>
            <a href="#" className={currentView === 'pricing' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentView('pricing'); }}>Pricing</a>
            <div style={{display:'flex', gap:'12px', alignItems:'center', marginLeft:'12px'}}>
              <button onClick={onLogin} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Log In</button>
              <button onClick={onRegisterOrg} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Create Network</button>
            </div>
          </div>
          <button id="ham" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" style={{color: '#1e293b'}}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        <div id="mob-menu" className={mobileMenuOpen ? 'open' : ''}>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); setMobileMenuOpen(false); }}>Home</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('features'); setMobileMenuOpen(false); }}>Features</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('usecases'); setMobileMenuOpen(false); }}>Use Cases</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('hardware'); setMobileMenuOpen(false); }}>Hardware</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('ai'); setMobileMenuOpen(false); }}>AI Co-Pilot</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('pricing'); setMobileMenuOpen(false); }}>Pricing</a>
          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid var(--border)'}}>
            <button onClick={() => { setMobileMenuOpen(false); onLogin(); }} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Log In</button>
            <button onClick={() => { setMobileMenuOpen(false); onRegisterOrg(); }} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Create Network</button>
          </div>
        </div>
      </nav>
`;
    code = code.replace(originalBlock, newNav);
    fs.writeFileSync('src/components/landing/Home.tsx', code);
    console.log("Replaced nav!");
} else {
    console.log("Could not find overlay start/end");
}
