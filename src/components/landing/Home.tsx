
import React, { useState, useEffect, useRef } from 'react';
import './Home.css';



export function Home({ onLogin, onRegisterOrg }: { onLogin: () => void, onRegisterOrg: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<number | null>(1);
  const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openPanel = (n: number) => {
    setActivePanel(n);
    stopTour();
  };

  const closePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePanel(null);
    stopTour();
  };

  const startTour = () => {
    stopTour();
    setActivePanel(1);
    tourIntervalRef.current = setInterval(() => {
      setActivePanel((prev) => (prev && prev >= 4 ? 1 : (prev || 0) + 1));
    }, 3500);
  };

  const stopTour = () => {
    if (tourIntervalRef.current) {
      clearInterval(tourIntervalRef.current);
      tourIntervalRef.current = null;
    }
  };

  const toggleVideo = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
    const playBtn = e.currentTarget.querySelector('.vid-play') as HTMLElement | null;
    if (video && video.paused) {
      video.play();
      if (playBtn) playBtn.style.display = 'none';
    } else if (video) {
      video.pause();
      if (playBtn) playBtn.style.display = 'flex';
    }
  };

  const handleVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const card = e.currentTarget.closest('.vid-card');
    if (card) {
      const playBtn = card.querySelector('.vid-play') as HTMLElement | null;
      if (playBtn) playBtn.style.display = 'flex';
    }
  };

  return (
    <div className="landing-page-root w-full text-[#1e293b] bg-white overflow-x-hidden font-['Inter',system-ui,sans-serif]">
      {/* ══ NAV ══ */}
      <nav id="nav" className={isScrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a href="#home" className="nav-logo">
            
            <span>SafetyLink</span>
          </a>
          <div className="nav-links">
            <a href="#home" className="active">Home</a>
            <a href="#features">Platform Features</a>
            <a href="#usecases">Use Cases</a>
            <a href="#hardware">Hardware</a>
            <a href="#ai">AI Co-Pilot</a>
            <a href="#pricing">Pricing</a>
            <a href="#download">Download</a>
            <a href="https://wa.me/27739441222" target="_blank" rel="noreferrer" className="nav-cta">Contact Us</a>
          </div>
          <button id="ham" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            <svg width="24" height="24" fill="none" stroke="#0f172a" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        <div id="mob-menu" className={mobileMenuOpen ? 'open' : ''}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Platform Features</a>
          <a href="#usecases" onClick={() => setMobileMenuOpen(false)}>Use Cases</a>
          <a href="#hardware" onClick={() => setMobileMenuOpen(false)}>Hardware Config</a>
          <a href="#ai" onClick={() => setMobileMenuOpen(false)}>AI Co-Pilot</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#download" onClick={() => setMobileMenuOpen(false)}>Download</a>
          <a href="https://wa.me/27739441222" target="_blank" rel="noreferrer">Contact Us</a>
          <button onClick={onLogin} style={{background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: '700'}}>ACCESS Dashboard</button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero" id="home">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow"><div className="hero-dot"></div>Live in South Africa</div>
            <h1>SAFETY FOR YOUR FAMILY AND <span className="g">HOUSE HOLD</span></h1>
            <p className="hero-sub">Peace of mind STARTS AT HOME. Protect what matters most – your family and your home. Seamless end-to-end protection, from key fob to app.</p>
            <div className="hero-btns">
              <a href="https://wa.me/27739441222?text=Hi+I+want+to+get+SafetyLink" target="_blank" rel="noreferrer" className="btn-wa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Get SafetyLink Now
              </a>
              <a href="#technology" className="btn-out">See How It Works →</a>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-phone-wrap">
              <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="SafetyLink SOS Screen" />
              <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="SafetyLink Command Login" />
            </div>
            <div className="hero-flow">
              <div className="flow-step">
                <div className="flow-icon"><svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="#15803d"/></svg></div>
                <span className="flow-label">Wearable &amp; App Alerts</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <div className="flow-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M6 20v-1a6 6 0 0112 0v1"/></svg></div>
                <span className="flow-label">Automated Response</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <div className="flow-icon"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg></div>
                <span className="flow-label">Command &amp; Control</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ VIDEO USE CASES ══ */}
      <section className="video-band" id="usecases">
        <div className="video-inner">
          <div className="section-eye">Use Cases</div>
          <h2 className="section-h">SafetyLink In The Real World</h2>
          <p className="section-sub">Every scenario. Every South African community. See how SafetyLink protects families, estates, schools, and neighbourhoods.</p>
          <div className="video-grid">

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  poster="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Family Protection Scenario</p><span>How SafetyLink protects your household</span></div>
            </div>

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Government &amp; Municipal Use Case</p><span>Public safety infrastructure deployment</span></div>
            </div>

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310200/Neighbourhood_watch_security_c.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Neighbourhood Watch</p><span>Community security network in action</span></div>
            </div>

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310194/drone_dispatch_tracking_crimin.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Drone Dispatch &amp; Tracking</p><span>Aerial response to active incidents</span></div>
            </div>

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310205/Show_the_uses_in_school_and_wo.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Schools &amp; Workplaces</p><span>Protecting children and employees</span></div>
            </div>

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310200/Old_people_scenario_alone_at_h.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Elderly Alone at Home</p><span>Watch-Me Timer and proactive monitoring</span></div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ USE CASE CARDS ══ */}
      <section style={{background:'#fff', padding:'80px 0'}}>
        <div className="uc-inner" style={{maxWidth:'1200px', margin:'0 auto', padding:'0 24px'}}>
          <div className="section-eye" style={{color:'var(--green)'}}>Who It's For</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)', fontWeight:'900', color:'var(--navy)', letterSpacing:'-.02em', marginBottom:'12px'}}>Three Audiences. One Platform.</h2>
          <div className="uc-grid">
            <div className="uc-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310051/copilot_image_1786916665016.png" alt="Security Command Room" />
              <div className="uc-body">
                <span className="uc-tag">Security Companies</span>
                <div className="uc-title">Command Deck for Armed Response</div>
                <p className="uc-text">Give your operators a live feed of every alert, responder location, and BLE beacon in your network. SafetyLink charges only its flat platform fee.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Family Safety" />
              <div className="uc-body">
                <span className="uc-tag">Families &amp; Residents</span>
                <div className="uc-title">Personal Safety Hub</div>
                <p className="uc-text">Panic button, BLE wearable, Watch-Me Timer, and emergency contact dispatch. R49/month. Works offline. No estate required.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Estate Security" />
              <div className="uc-body">
                <span className="uc-tag">Estates &amp; Complexes</span>
                <div className="uc-title">Full Estate Deployment</div>
                <p className="uc-text">Deploy across every unit. GIS map, beacon overlay, Evidence Ledger, and multi-responder dispatch — all in one platform.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DISPATCH SECTION ══ */}
      <section className="dispatch" id="technology">
        <div className="dispatch-inner">
          <div className="dispatch-header">
            <div className="live-badge"><div className="ldot"></div><span>Live System</span></div>
            <h2 className="dtitle">SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH</h2>
            <p className="dsub">Intelligent Local Coordination · Local Processing · Local Control · Offline, On Purpose.</p>
          </div>
          <button className="tour-btn" onClick={startTour}>▶ &nbsp;TAKE A TOUR</button>
          <div className="img-wrap">
            <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink Offline-First Intelligent Dispatch System" />
            <div className="hgrid">
              <div className={"hz" + (activePanel === 1 ? " active" : "")} id="z1" onClick={() => openPanel(1)} style={{boxShadow: activePanel === 1 ? 'inset 0 0 0 2px rgba(16,185,129,0.5)' : ''}}>
                <div className="hdot"><div className="dp"></div><div className="dc"></div></div>
                <div className="zlbl">1 · Wearable &amp; App Alerts</div>
              </div>
              <div className={"hz" + (activePanel === 2 ? " active" : "")} id="z2" onClick={() => openPanel(2)} style={{boxShadow: activePanel === 2 ? 'inset 0 0 0 2px rgba(16,185,129,0.5)' : ''}}>
                <div className="hdot"><div className="dp"></div><div className="dc"></div></div>
                <div className="zlbl">3 · Drone Dispatch</div>
              </div>
              <div className={"hz" + (activePanel === 3 ? " active" : "")} id="z3" onClick={() => openPanel(3)} style={{boxShadow: activePanel === 3 ? 'inset 0 0 0 2px rgba(16,185,129,0.5)' : ''}}>
                <div className="hdot"><div className="dp"></div><div className="dc"></div></div>
                <div className="zlbl">2 · Secure Local Network</div>
              </div>
              <div className={"hz" + (activePanel === 4 ? " active" : "")} id="z4" onClick={() => openPanel(4)} style={{boxShadow: activePanel === 4 ? 'inset 0 0 0 2px rgba(16,185,129,0.5)' : ''}}>
                <div className="hdot"><div className="dp"></div><div className="dc"></div></div>
                <div className="zlbl">4 · Live Coordination</div>
              </div>
            </div>
            <div className="hub">
              <div className="hub-rings"><div className="hr"></div><div className="hr"></div><div className="hr"></div></div>
              <div className="hub-tag"><span>LIVE DISPATCH HUB</span></div>
            </div>
          </div>
          <div className="panels">
            <div className={"panel pt" + (activePanel === 1 ? " visible" : "")} id="p1">
              <div className="pi">
                <div className="pthumb"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="SOS App"/></div>
                <div className="pbody">
                  <button className="pclose" onClick={closePanel}>×</button>
                  <div className="pbadge">Offline Operation</div>
                  <div className="ptitle">1. Wearable &amp; App Alerts</div>
                  <p className="ptext"><strong>Instant triggers</strong> from iTAG keyfob or app. Hold SOS 1.5s to initiate sequential security escalation chain. Works fully <strong>offline</strong> via BLE mesh and SMS fallback. Family Linked. No internet required.</p>
                </div>
              </div>
            </div>
            <div className={"panel pt" + (activePanel === 2 ? " visible" : "")} id="p2">
              <div className="pi">
                <div className="pbody">
                  <button className="pclose" onClick={closePanel}>×</button>
                  <div className="pbadge">Automated Physical Response</div>
                  <div className="ptitle">3. Automated Drone Dispatch</div>
                  <p className="ptext"><strong>Immediate dispatch</strong> on alert trigger. Pre-programmed offline flight path. SafetyLink <strong>Drone-in-a-Box</strong> — eyes on scene within minutes. Autonomous return-to-base on mission complete.</p>
                </div>
              </div>
            </div>
            <div className={"panel pt" + (activePanel === 3 ? " visible" : "")} id="p3">
              <div className="pi">
                <div className="pbody">
                  <button className="pclose" onClick={closePanel}>×</button>
                  <div className="pbadge">Offline Ready</div>
                  <div className="ptitle">2. Private Local Mesh Network</div>
                  <p className="ptext"><strong>Data Privacy-First.</strong> Encrypted local communication. No cloud dependency. Local devices connect via <strong>Secure Communication Gateway</strong>. Your data never leaves your property. Zero internet required.</p>
                </div>
              </div>
            </div>
            <div className={"panel pt" + (activePanel === 4 ? " visible" : "")} id="p4">
              <div className="pi">
                <div className="pthumb"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="Command Login"/></div>
                <div className="pbody">
                  <button className="pclose" onClick={closePanel}>×</button>
                  <div className="pbadge">Local Operator Control</div>
                  <div className="ptitle">4. Live Local Coordination</div>
                  <p className="ptext"><strong>Control Room operators</strong> monitor all active incidents via Secure Command Gateway. Access with your <strong>SL-ORG-XXXX</strong> Mesh Code. Evidence Ledger auto-logs every action for compliance.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="caption"><p>From Trigger to Action: A Comprehensive Offline Emergency Ecosystem</p></div>
        </div>
      </section>

      {/* ══ PLATFORM FEATURES ══ */}
      <section className="features" id="features">
        <div className="feat-inner">
          <div className="section-eye" style={{color:'var(--green)'}}>Platform Features</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)', fontWeight:'900', color:'var(--navy)', letterSpacing:'-.02em', marginBottom:'12px'}}>One Platform. Total Situational Awareness.</h2>
          <p style={{fontSize:'15px', color:'var(--muted)', maxWidth:'520px', lineHeight:'1.7', marginBottom:'48px'}}>Three layers of intelligent emergency response — Mobile, Command, and Admin — built for South African conditions.</p>
          <div className="feat-grid">
            <div className="feat-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="SafetyLink Mobile App" />
              <div className="feat-body">
                <span className="feat-tag mobile">SafetyLink Mobile</span>
                <div className="feat-title">Citizen Safety Hub</div>
                <ul className="feat-list">
                  <li>Mission-Control SOS Actuator — hold 1.5s</li>
                  <li>Watch-Me Timer proactive protection</li>
                  <li>Native iTAG BLE keyfob pairing</li>
                  <li>Sequential escalation chain</li>
                  <li>Offline SMS fallback</li>
                  <li>11 South African languages</li>
                </ul>
              </div>
            </div>
            <div className="feat-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="SafetyLink Command" />
              <div className="feat-body">
                <span className="feat-tag command">SafetyLink Command</span>
                <div className="feat-title">Responder Control Deck</div>
                <ul className="feat-list">
                  <li>Secure Command Gateway (SL-ORG-XXXX)</li>
                  <li>Real-time alert feed with GPS</li>
                  <li>Multi-responder dispatch</li>
                  <li>Evidence Ledger — immutable logs</li>
                  <li>Demo Showcase Mode</li>
                  <li>Control room integration</li>
                </ul>
              </div>
            </div>
            <div className="feat-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink Admin" />
              <div className="feat-body">
                <span className="feat-tag admin">SafetyLink Admin</span>
                <div className="feat-title">Organisation Management</div>
                <ul className="feat-list">
                  <li>Onboard and manage residents</li>
                  <li>Assign SL-ORG-XXXX mesh codes</li>
                  <li>Audit logs and compliance reports</li>
                  <li>Hardware device inventory</li>
                  <li>Billing and subscription management</li>
                  <li>Multi-estate support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HARDWARE ══ */}
      <section className="hardware" id="hardware">
        <div className="hw-inner">
          <div className="section-eye" style={{color:'var(--green)'}}>Hardware Config</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)', fontWeight:'900', color:'var(--navy)', letterSpacing:'-.02em', marginBottom:'8px'}}>Your Hardware. Configured in Minutes.</h2>
          <p style={{fontSize:'15px', color:'var(--muted)', maxWidth:'520px', lineHeight:'1.7'}}>SafetyLink works with the iTAG BLE keyfob. Available in 5 colours. Standard CR2032 battery. No proprietary lock-in.</p>
          <div className="hw-grid">
            <div className="hw-main">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020219883.jpg" alt="SafetyLink iTAG devices — blue white pink green black" />
              <div className="hw-badge b1">
                <div className="btag">Start From</div>
                <div className="bamt">R49<span style={{fontSize:'14px', fontWeight:'500'}}>pm</span></div>
                <div className="bsub">for individuals</div>
              </div>
              <div className="hw-badge b2">
                <div className="bamt">R99<span style={{fontSize:'14px', fontWeight:'500'}}>pm</span></div>
                <div className="bsub">for a family of 5</div>
              </div>
            </div>
            <div className="hw-right">
              <div className="hw-detail">
                <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020134421.jpg" alt="Pink iTAG close-up" />
              </div>
              <div className="hw-guide">
                <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310010/Polish_20260819_020007723.jpg" alt="iTAG battery replacement guide" />
                <div className="hw-guide-label">
                  <p>Battery Replacement Guide</p>
                  <span>Rotate lid → Remove → Insert CR2032 → Replace</span>
                </div>
              </div>
              <div className="enterprise-banner">
                <div className="etag">For Security Companies</div>
                <h3>GET YOUR OWN CONTROL-ROOM DASHBOARD &amp; SERVER NETWORK</h3>
                <a href="https://wa.me/27739441222?text=I+want+a+SafetyLink+control+room" target="_blank" rel="noreferrer">Contact Us on WhatsApp →</a>
              </div>
              <div className="pricing-circles">
                <div className="pc outline">
                  <div className="pctag">Once Off</div>
                  <div className="pcamt">R149</div>
                </div>
                <div className="pc filled">
                  <div className="pctag">Monthly</div>
                  <div className="pcamt">R49</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROMO GALLERY ══ */}
      <section className="gallery">
        <div className="gal-inner">
          <div className="section-eye">Visual Library</div>
          <h2 className="section-h">SafetyLink In Action</h2>
          <div className="gal-grid">
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink tactical poster" /><div className="gal-caption">SafetyLink Tactical Deployment</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="System diagram" /><div className="gal-caption">Intelligent Dispatch Architecture</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Drone minutes matter" /><div className="gal-caption">Minutes Matter. Drones Act Now.</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink business card" /><div className="gal-caption">SafetyLink Brand Identity</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1783703540293.png" alt="SafetyLink 3D logo" /><div className="gal-caption">SafetyLink 3D Brand Mark</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="UI screenshot" /><div className="gal-caption">Command Dashboard Interface</div></div>
          </div>
        </div>
      </section>

      {/* ══ KLEV.AI ══ */}
      <section className="klev" id="ai">
        <div className="klev-inner">
          <div className="klev-left">
            <div className="section-eye">AI Co-Pilot</div>
            <h2 className="section-h">DeepMind Security Intelligence. Always On.</h2>
            <p className="section-sub">Powered by K'lev.ai — an additive intelligence layer that enhances situational awareness without modifying core emergency dispatch logic. The platform works without it. With it, it thinks ahead.</p>
            <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:'10px', marginTop:'16px'}}>
              <li style={{fontSize:'13px', color:'#94a3b8', display:'flex', gap:'8px'}}><span style={{color:'#10b981', fontWeight:'700'}}>✓</span>Analyses alert patterns and flags anomalies</li>
              <li style={{fontSize:'13px', color:'#94a3b8', display:'flex', gap:'8px'}}><span style={{color:'#10b981', fontWeight:'700'}}>✓</span>Generates incident summaries automatically</li>
              <li style={{fontSize:'13px', color:'#94a3b8', display:'flex', gap:'8px'}}><span style={{color:'#10b981', fontWeight:'700'}}>✓</span>Translates into all 11 SA official languages</li>
              <li style={{fontSize:'13px', color:'#94a3b8', display:'flex', gap:'8px'}}><span style={{color:'#10b981', fontWeight:'700'}}>✓</span>Degrades gracefully offline — core safety always 100%</li>
            </ul>
          </div>
          <div className="klev-right">
            <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png" alt="K'lev.ai Intelligence Platform" />
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="pricing" id="pricing">
        <div className="price-inner">
          <div className="section-eye" style={{color:'var(--green)'}}>Pricing</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)', fontWeight:'900', color:'var(--navy)', letterSpacing:'-.02em', marginBottom:'8px'}}>Simple Pricing. No Surprises.</h2>
          <p style={{fontSize:'15px', color:'var(--muted)', maxWidth:'480px', lineHeight:'1.7'}}>One platform fee. Zero interference with how security operators run their business.</p>
          <div className="price-grid">
            <div className="price-card">
              <div className="price-tier">Individual Resident</div>
              <div className="price-amt"><span className="cur">R</span>49</div>
              <div className="price-period">per resident / month</div>
              <div className="price-once">+ R149 once-off registration</div>
              <ul className="price-features">
                <li>SafetyLink Mobile app</li>
                <li>iTAG keyfob pairing</li>
                <li>SOS alerts &amp; Watch-Me Timer</li>
                <li>Emergency contact dispatch</li>
                <li>Offline SMS fallback</li>
                <li>11-language support</li>
              </ul>
              <a href="https://wa.me/27739441222?text=I+want+to+register+as+a+SafetyLink+resident" target="_blank" rel="noreferrer" className="price-cta o">Register Now</a>
            </div>
            <div className="price-card featured">
              <div className="price-badge">Most Popular</div>
              <div className="price-tier">Organisation / Estate</div>
              <div className="price-amt"><span className="cur">R</span>49</div>
              <div className="price-period">per resident / month</div>
              <div className="price-once">+ R149 once-off per resident</div>
              <ul className="price-features">
                <li>Everything in Individual</li>
                <li>SafetyLink Command Deck</li>
                <li>Multi-responder dispatch</li>
                <li>Live GIS beacon overlay</li>
                <li>Admin panel &amp; audit logs</li>
                <li>Evidence Ledger</li>
                <li>SL-ORG-XXXX mesh node</li>
              </ul>
              <a href="https://wa.me/27739441222?text=I+want+to+onboard+my+estate+to+SafetyLink" target="_blank" rel="noreferrer" className="price-cta g">Get a Quote on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DOWNLOAD ══ */}
      <section className="download" id="download">
        <div className="dl-inner">
          <div className="section-eye">Download</div>
          <h2 className="section-h">Get SafetyLink On Your Device</h2>
          <p className="section-sub">Available on Android, Windows, and as a Progressive Web App. Contact us on WhatsApp to receive your download link.</p>
          <div className="dl-grid">
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="Android App Preview"/>
              <div className="dl-title">Android APK</div>
              <div className="dl-sub">Minimum Android 8.0. Bluetooth LE required for iTAG functionality.</div>
              <a href="https://wa.me/27739441222?text=I+want+the+SafetyLink+APK" target="_blank" rel="noreferrer" className="dl-btn-link apk">Request on WhatsApp</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Windows Command Deck"/>
              <div className="dl-title">Windows EXE</div>
              <div className="dl-sub">SafetyLink Command Deck desktop app. Requires SL-ORG-XXXX access code.</div>
              <a href="https://wa.me/27739441222?text=I+want+the+SafetyLink+EXE" target="_blank" rel="noreferrer" className="dl-btn-link exe">Request on WhatsApp</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310049/Polish_20260620_014530309.jpg" alt="SafetyLink PWA"/>
              <div className="dl-title">PWA</div>
              <div className="dl-sub">Access directly from your browser. Tap Add to Home Screen. Full offline capability once installed.</div>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="dl-btn-link pwa">Open PWA</a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ══ */}
      <div className="cta-band">
        <h2>Ready to protect your community?</h2>
        <p>Message us on WhatsApp — your estate or complex set up within 48 hours.</p>
        <a href="https://wa.me/27739441222?text=Hi+I+want+to+deploy+SafetyLink+for+my+community" target="_blank" rel="noreferrer" className="wa-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Start on WhatsApp
        </a>
      </div>

      {/* ══ NETWORK BANNER ══ */}
      <img className="network-banner" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/SafetyLink_3D_Render.pdf" alt="SafetyLink Global Protection Network" />

      {/* ══ FOOTER ══ */}
      <footer id="contact">
        <div className="foot-inner">
          <div className="foot-top">
            <h3>One App. Total Peace of Mind.</h3>
            <div className="foot-icons">
              <div className="foot-icon-item"><div className="foot-icon-box">📱</div><p className="foot-icon-title">One Tap Alert</p><p className="foot-icon-sub">Quickly send an emergency alert.</p></div>
              <div className="foot-icon-item"><div className="foot-icon-box">👥</div><p className="foot-icon-title">Trusted Network</p><p className="foot-icon-sub">Your alerts go to the people you trust.</p></div>
              <div className="foot-icon-item"><div className="foot-icon-box">📍</div><p className="foot-icon-title">Real Time Location</p><p className="foot-icon-sub">Help can find you faster.</p></div>
              <div className="foot-icon-item"><div className="foot-icon-box">🛡️</div><p className="foot-icon-title">Reliable &amp; Secure</p><p className="foot-icon-sub">Your safety and data are our priority.</p></div>
            </div>
          </div>
          <div className="foot-div"></div>
          <div className="foot-links">
            <div className="foot-col">
              <h5>Company Information</h5>
              <a href="#">About Us</a>
              <a href="#">Our Partners</a>
              <a href="#">Company</a>
              <a href="https://wa.me/27739441222" target="_blank" rel="noreferrer">Contact Us</a>
            </div>
            <div className="foot-col">
              <h5>Resources</h5>
              <a href="#technology">How It Works</a>
              <a href="#features">Solutions</a>
              <a href="#pricing">Pricing</a>
              <a href="#download">Download</a>
            </div>
            <div className="foot-col" style={{gridColumn:'span 2'}}>
              <h5>Legal Disclaimers</h5>
              <p>This disclaimer applies to all content, software, and services provided by SafetyLink. The information provided is for general safety enhancement. While we strive for absolute reliability, physical safety cannot be guaranteed by software alone.</p>
              <div style={{display:'flex', gap:'16px', marginTop:'12px'}}>
                <a href="#">Legal</a>
                <a href="#">Privacy Policy</a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <div className="foot-bottom-left">
              <p>Powered by TM Media Solutions — Reg: 2018/500191/07</p>
              <a href="https://safetylink.online">safetylink.online</a>
            </div>
            <p className="foot-center">STAY CONNECTED. STAY PROTECTED. STAY IN CONTROL.</p>
            <div className="foot-right">
              <p>Contact: 073 944 1222</p>
              <p style={{color:'#334155', fontStyle:'italic', marginTop:'2px'}}>K'lev.c</p>
            </div>
          </div>
          <div className="foot-copy">
            <p>© 2024–2026 SafetyLink®. All rights reserved. Powered by ©TM Media Solutions · Reg : 2018/500191/07</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
