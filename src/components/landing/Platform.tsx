import React, { useState, useRef } from 'react';
import './Home.css';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Platform({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [activePanel, setActivePanel] = useState<number | null>(1);
  const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTour = () => { if (tourIntervalRef.current) { clearInterval(tourIntervalRef.current); tourIntervalRef.current = null; } };
  const openPanel = (n: number) => { setActivePanel(n); stopTour(); };
  const closePanel = () => { setActivePanel(null); stopTour(); };
  const startTour = () => {
    stopTour();
    let n = 1;
    tourIntervalRef.current = setInterval(() => { n = n >= 4 ? 1 : n + 1; setActivePanel(n); }, 3000);
  };

  return (
    <div className="landing-page-root w-full overflow-x-hidden">
      {showVideoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { setShowVideoModal(false); setVideoSrc(''); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer' }}>✕</button>
          <video src={videoSrc} controls autoPlay style={{ width: '90%', maxWidth: '1000px', borderRadius: '12px' }} />
        </div>
      )}
                  {/* ══ DISPATCH SECTION ══ */}
      <section className="dispatch" id="technology">
        <div className="dispatch-inner">
          <div className="dispatch-header">
            <div className="live-badge"><div className="ldot"></div><span>Live System</span></div>
            <h2 className="dtitle" style={{ cursor: "pointer" }} onClick={() => { setVideoSrc("https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Okay_now_for_the_next_scene_.mp4"); setShowVideoModal(true); }}>SAFETYLINK — OFFLINE-FIRST INTELLIGENT DISPATCH <span style={{ fontSize: "12px", verticalAlign: "middle", opacity: 0.8 }}>▶ PLAY VIDEO</span></h2>
            <p className="dsub">Intelligent Local Coordination · Local Processing · Local Control · Offline, On Purpose.</p>
          </div>
          <button className="tour-btn" onClick={startTour}>▶ &nbsp;TAKE A TOUR</button>
          <div className="img-wrap">
            <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_4jokgv4jokgv4jok.jpg" alt="SafetyLink Offline-First Intelligent Dispatch System" />
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
                <div className="pthumb"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Code_Generated_Image_1.png" alt="SOS App"/></div>
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
                <div className="pthumb"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="Command Login"/></div>
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
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Code_Generated_Image_1.png" alt="SafetyLink Mobile App" />
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
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="SafetyLink Command" />
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
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="SafetyLink Admin" />
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
      {/* ══ PROMO GALLERY ══ */}
      <section className="gallery">
        <div className="gal-inner">
          <div className="section-eye">Visual Library</div>
          <h2 className="section-h">SafetyLink In Action</h2>
          <div className="gal-grid">
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260809_035827088.png" alt="SafetyLink tactical poster" /><div className="gal-caption">SafetyLink Tactical Deployment</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="System diagram" /><div className="gal-caption">Intelligent Dispatch Architecture</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg" alt="Drone minutes matter" /><div className="gal-caption">Minutes Matter. Drones Act Now.</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_s8bl6ps8bl6ps8bl.jpg" alt="SafetyLink business card" /><div className="gal-caption">SafetyLink Brand Identity</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/SafetyLink_3D_Render.png" alt="SafetyLink 3D logo" style={{ padding: '20px', objectFit: 'contain', background: '#1e293b' }} /><div className="gal-caption">SafetyLink Brand Identity</div></div>
            <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="UI screenshot" /><div className="gal-caption">Command Dashboard Interface</div></div>
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
            <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="SafetyLink App Analytics UI" style={{ borderRadius: '12px' }} />
          </div>
        </div>
      </section>

    </div>
  );
}
