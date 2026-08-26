
import React, { useState, useEffect, useRef } from 'react';
import './Home.css';




function PricingCalculator() {
  const [residents, setResidents] = useState(1);
  const [tags, setTags] = useState({lite: 1, active: 0, premium: 0, pack5: 0});

  const residentMonthly = residents * 49;
  
  const hardwareLite = tags.lite * 149;
  const hardwareActive = tags.active * 199;
  const hardwarePremium = tags.premium * 348;
  const hardwarePack5 = tags.pack5 * 499;
  
  const totalHardware = hardwareLite + hardwareActive + hardwarePremium + hardwarePack5;

  return (
    <div className="mt-16 bg-slate-50 rounded-2xl p-6 border border-slate-200" style={{maxWidth: '800px', margin: '40px auto 0'}}>
      <h3 className="text-xl font-bold text-slate-800 mb-6" style={{textAlign: 'center'}}>Interactive Setup Calculator</h3>
      <div className="grid md:grid-cols-2 gap-8" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px'}}>
        <div>
           <div className="mb-6" style={{marginBottom: '24px'}}>
             <label className="block text-sm font-semibold text-slate-700 mb-2" style={{display: 'block', marginBottom: '8px'}}>Number of Residents (R49/mo)</label>
             <input type="number" min="1" value={residents} onChange={e => setResidents(Math.max(1, parseInt(e.target.value)||1))} style={{width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px'}} />
           </div>
           
           <h4 className="text-sm font-semibold text-slate-700 mb-2" style={{marginBottom: '12px'}}>Hardware (Once-off)</h4>
           <div className="space-y-3" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>Lite iTAG (R149)</span>
               <input type="number" min="0" value={tags.lite} onChange={e => setTags({...tags, lite: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>Active iTAG (R199)</span>
               <input type="number" min="0" value={tags.active} onChange={e => setTags({...tags, active: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>Premium iTAG (R348)</span>
               <input type="number" min="0" value={tags.premium} onChange={e => setTags({...tags, premium: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
             <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span className="text-sm" style={{color: '#475569'}}>5-Pack iTAG (R499)</span>
               <input type="number" min="0" value={tags.pack5} onChange={e => setTags({...tags, pack5: Math.max(0, parseInt(e.target.value)||0)})} style={{width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'right'}} />
             </div>
           </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center" style={{background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
           <div className="mb-6" style={{marginBottom: '24px'}}>
             <div className="text-sm text-slate-500 font-medium" style={{color: '#64748b', fontSize: '14px', fontWeight: 500}}>Monthly Subscription</div>
             <div className="text-3xl font-bold text-slate-800" style={{fontSize: '30px', fontWeight: 800, color: '#1e293b'}}>R{residentMonthly.toLocaleString()} <span className="text-base font-normal text-slate-500" style={{fontSize: '16px', fontWeight: 400, color: '#64748b'}}>/mo</span></div>
           </div>
           
           <div className="mb-6" style={{marginBottom: '24px'}}>
             <div className="text-sm text-slate-500 font-medium" style={{color: '#64748b', fontSize: '14px', fontWeight: 500}}>Once-off Hardware</div>
             <div className="text-3xl font-bold text-slate-800" style={{fontSize: '30px', fontWeight: 800, color: '#1e293b'}}>R{totalHardware.toLocaleString()}</div>
           </div>
           
           <div className="pt-4 border-t border-slate-100" style={{paddingTop: '16px', borderTop: '1px solid #f1f5f9'}}>
             <div className="text-sm text-slate-500 font-medium" style={{color: '#64748b', fontSize: '14px', fontWeight: 500}}>Total First Month</div>
             <div className="text-4xl font-black text-emerald-600" style={{fontSize: '36px', fontWeight: 900, color: '#059669'}}>R{(residentMonthly + totalHardware).toLocaleString()}</div>
           </div>
        </div>
      </div>
    </div>
  )
}

export function Home({ onLogin, onRegisterOrg, onRegisterUser }: { onLogin: () => void, onRegisterOrg: () => void, onRegisterUser: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [releases, setReleases] = useState<any[]>([]);
  const [latestApkUrl, setLatestApkUrl] = useState<string>("");
  const [latestExeUrl, setLatestExeUrl] = useState<string>("");

  const [activePanel, setActivePanel] = useState<number | null>(1);
  const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=20', {
          headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
          const releases = await res.json();
          if (Array.isArray(releases) && releases.length > 0) {
            setReleases(releases.slice(0, 5));
            // Scan all releases for latest APK (APK build may lag behind EXE)
            for (const r of releases) {
              const apkAsset = r.assets?.find((a: any) =>
                a.name.toLowerCase().endsWith('.apk') && a.name.toLowerCase().includes('signed')
              ) || r.assets?.find((a: any) => a.name.toLowerCase().endsWith('.apk'));
              if (apkAsset) { setLatestApkUrl(apkAsset.browser_download_url); break; }
            }
            // EXE from latest release
            const exeAsset = releases[0].assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe'));
            if (exeAsset) setLatestExeUrl(exeAsset.browser_download_url);
          }
        }
      } catch (_) {
        // silent
      }
    };
    fetchReleases();
  }, []);


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
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/official_safetylink_logo.svg" alt="SafetyLink Logo" style={{ height: '32px' }} />
            <span>SafetyLink</span>
          </a>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#usecases">Use Cases</a>
            <a href="#hardware">Hardware</a>
            <a href="#ai">AI Co-Pilot</a>
            <a href="#pricing">Pricing</a>
            <div style={{display:'flex', gap:'12px', alignItems:'center', marginLeft:'12px'}}>
              <button onClick={onLogin} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Log In</button>
              <button onClick={onRegisterUser} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Create New Account</button>
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
            <button onClick={() => { setMobileMenuOpen(false); onRegisterUser(); }} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Create New Account</button>
          </div>
        </div>
      </nav>
      {/* Video Modal */}
      {showVideoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { setShowVideoModal(false); setVideoSrc(''); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          <video src={videoSrc} controls autoPlay style={{ width: '90%', maxWidth: '1000px', borderRadius: '12px' }} />
        </div>
      )}

      {/* ══ HERO ══ */}
      <section className="hero" id="home">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow"><div className="hero-dot"></div>Live in South Africa</div>
            <h1>SAFETY FOR YOUR FAMILY AND <span className="g">HOUSE HOLD</span></h1>
            <p className="hero-sub">Peace of mind STARTS AT HOME. Protect what matters most – your family and your home. Seamless end-to-end protection, from key fob to app.</p>
            <div className="hero-btns" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={onRegisterUser} className="btn-wa" style={{background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Register Individual</button>
              <button onClick={onRegisterOrg} className="btn-wa" style={{background: 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Start your 14-day trial</button>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-phone-wrap">
                            <img className="hero-phone" src="/Screenshot_20260820_201927_com.aistudio.safetylink.vqnztp.jpg" alt="SafetyLink App UI" />
              <img className="hero-phone" src="/panic-button-smooth.png" alt="SafetyLink Button" style={{ padding: '20px', objectFit: 'contain' }} />
              <img className="hero-phone" src="/Polish_20260620_014530309.jpg" alt="Organizations Panel" />
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
              <video preload="none" playsInline  poster="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310050/Polish_20260809_035827088.png" onEnded={handleVideoEnded}>
                <source src="/media/videos/How_SafetyLink_Automates_Emergency_Responses.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Family Protection Scenario</p><span>How SafetyLink protects your household</span></div>
            </div>

            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="/media/videos/How_Emergency_Escalation_Pipelines_Work.mp4" type="video/mp4"/>
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
                <source src="/media/videos/How_Emergency_Escalation_Pipelines_Work.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Elderly Alone at Home</p><span>Watch-Me Timer and proactive monitoring</span></div>
            </div>
            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline onEnded={handleVideoEnded}>
                <source src="/media/videos/How_SafetyLink_Automates_Emergency_Responses.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>SafetyLink Pitch Deck</p><span>Overview of our three pillars</span></div>
            </div>
            <div className="vid-card" onClick={toggleVideo}>
              <video preload="none" playsInline onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310194/drone_dispatch_tracking_crimin.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Why SafetyLink?</p><span>The core mission and vision</span></div>
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
              <img src="/Polish_20260727_023640262.jpg" alt="Security Command Room" style={{ borderRadius: '12px' }} />
              <div className="uc-body">
                <span className="uc-tag">Security Companies</span>
                <div className="uc-title">Command Deck for Armed Response</div>
                <p className="uc-text">Give your operators a live feed of every alert, responder location, and BLE beacon in your network. SafetyLink charges only its flat platform fee.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310215/Gemini_Generated_Image_viirg9viirg9viir.png" alt="Family Safety" />
              <div className="uc-body">
                <span className="uc-tag">Families &amp; Residents</span>
                <div className="uc-title">Personal Safety Hub</div>
                <p className="uc-text">Panic button, BLE wearable, Watch-Me Timer, and emergency contact dispatch. R49/month. Works offline. No estate required.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="/Polish_20260620_014530309.jpg" alt="Estate Security" style={{ borderRadius: '12px' }} />
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
            <h2 className="dtitle" style={{ cursor: "pointer" }} onClick={() => { setVideoSrc("https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4"); setShowVideoModal(true); }}>SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH <span style={{ fontSize: "12px", verticalAlign: "middle", opacity: 0.8 }}>▶ PLAY VIDEO</span></h2>
            <p className="dsub">Intelligent Local Coordination · Local Processing · Local Control · Offline, On Purpose.</p>
          </div>
          <button className="tour-btn" onClick={startTour}>▶ &nbsp;TAKE A TOUR</button>
          <div className="img-wrap">
            <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313191/Gemini_Generated_Image_4jokgv4jokgv4jok.jpg" alt="SafetyLink Offline-First Intelligent Dispatch System" />
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
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="SafetyLink Admin" />
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
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310050/Polish_20260809_035827088.png" alt="SafetyLink tactical poster" /><div className="gal-caption">SafetyLink Tactical Deployment</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="System diagram" /><div className="gal-caption">Intelligent Dispatch Architecture</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309940/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg" alt="Drone minutes matter" /><div className="gal-caption">Minutes Matter. Drones Act Now.</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_s8bl6ps8bl6ps8bl.jpg" alt="SafetyLink business card" /><div className="gal-caption">SafetyLink Brand Identity</div></div>
            <div className="gal-item"><img src="/safetylink-metallic.svg" alt="SafetyLink 3D logo" style={{ padding: '20px', objectFit: 'contain', background: '#1e293b' }} /><div className="gal-caption">SafetyLink Brand Identity</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="UI screenshot" /><div className="gal-caption">Command Dashboard Interface</div></div>
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
            <img src="/Polish_20260727_023640262.jpg" alt="SafetyLink App Analytics UI" style={{ borderRadius: '12px' }} />
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
              <div className="price-once">From R149 once-off hardware</div>
              <ul className="price-features">
                <li>SafetyLink Mobile app</li>
                <li>iTAG keyfob pairing</li>
                <li>SOS alerts &amp; Watch-Me Timer</li>
                <li>Emergency contact dispatch</li>
                <li>Offline SMS fallback</li>
                <li>11-language support</li>
              </ul>
              <button onClick={onRegisterUser} className="price-cta o" style={{border: "none", cursor: "pointer"}}>Register Now</button>
            </div>
            <div className="price-card featured">
              <div className="price-badge">Most Popular</div>
              <div className="price-tier">Organisation / Estate</div>
              <div className="price-amt"><span className="cur">R</span>49</div>
              <div className="price-period">per resident / month</div>
              <div className="price-once">From R149 once-off hardware per resident</div>
              <ul className="price-features">
                <li>Everything in Individual</li>
                <li>SafetyLink Command Deck</li>
                <li>Multi-responder dispatch</li>
                <li>Live GIS beacon overlay</li>
                <li>Admin panel &amp; audit logs</li>
                <li>Evidence Ledger</li>
                <li>SL-ORG-XXXX mesh node</li>
              </ul>
              <button onClick={onRegisterOrg} className="price-cta g" style={{border: "none", cursor: "pointer"}}>Start your 14-day trial</button>
            </div>
          </div>
                  <PricingCalculator />
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
              {latestApkUrl ? (
                <a href={latestApkUrl} download target="_blank" rel="noreferrer" className="dl-btn-link apk">Download Latest APK</a>
              ) : (
                <span className="dl-btn-link apk" style={{opacity:0.5,cursor:'default'}}>APK — Building…</span>
              )}
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313191/Gemini_Generated_Image_4jokgv4jokgv4jok.jpg" alt="Windows Command Deck"/>
              <div className="dl-title">Windows EXE</div>
              <div className="dl-sub">SafetyLink Command Deck desktop app. Requires SL-ORG-XXXX access code.</div>
              <a href={latestExeUrl || "https://github.com/Charesmagna/SafetyLink-Core/releases/latest"} target="_blank" rel="noreferrer" className="dl-btn-link exe">{latestExeUrl ? 'Download Latest EXE' : 'View Releases'}</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310049/Polish_20260620_014530309.jpg" alt="SafetyLink PWA"/>
              <div className="dl-title">PWA</div>
              <div className="dl-sub">Access directly from your browser. Tap Add to Home Screen. Full offline capability once installed.</div>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="dl-btn-link pwa">Open PWA</a>
            </div>
          </div>
          
          {releases.length > 0 && (
            <div style={{ marginTop: '4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '2rem', maxWidth: '800px', margin: '4rem auto 0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', fontFamily: 'monospace' }}>Release History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {releases.map((release: any) => (
                  <div key={release.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.125rem' }}>{release.tag_name}</span>
                        {release.prerelease && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 'bold', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>Pre-release</span>}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>{new Date(release.published_at).toLocaleDateString()} - {release.name}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {release.assets?.map((a: any) => (
                        <a key={a.id} href={a.browser_download_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 0.75rem', background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.5rem', textDecoration: 'none' }}>
                          {a.name.endsWith('.apk') ? 'APK' : a.name.endsWith('.exe') ? 'EXE' : 'DL'}
                        </a>
                      ))}
                      <a href={release.html_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.5rem', textDecoration: 'none' }}>
                        Notes
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ══ CTA BAND ══ */}
      <div className="cta-band">
        <h2>Ready to protect your community?</h2>
        <p>Message us on WhatsApp — your estate or complex set up within 48 hours.</p>
        <button onClick={onRegisterOrg} className="wa-btn" style={{border: "none", cursor: "pointer"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Start on WhatsApp
        </button>
      </div>

      {/* ══ NETWORK BANNER ══ */}
      <img className="network-banner" src="/Polish_20260727_010938698.jpg" alt="SafetyLink Global Protection Network" />

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
              <a href="mailto:info@safetylink.online">Email Us</a>
              <a href="https://www.facebook.com/share/1D8xnzfY8T/" target="_blank" rel="noreferrer">Facebook</a>
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
