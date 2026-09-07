import React, { useState } from 'react';
import './Home.css';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function UseCases({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');

  const toggleVideo = (src: string) => { setVideoSrc(src); setShowVideoModal(true); };
  const handleVideoEnded = () => {};

  return (
    <div className="landing-page-root w-full overflow-x-hidden">
      {showVideoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { setShowVideoModal(false); setVideoSrc(''); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer' }}>✕</button>
          <video src={videoSrc} controls autoPlay style={{ width: '90%', maxWidth: '1000px', borderRadius: '12px' }} />
        </div>
      )}
      {/* ══ VIDEO USE CASES ══ */}
      <section className="video-band" id="usecases">
        <div className="video-inner">
          <div className="section-eye">Use Cases</div>
          <h2 className="section-h">SafetyLink In The Real World</h2>
          <p className="section-sub">Every scenario. Every South African community. See how SafetyLink protects families, estates, schools, and neighbourhoods.</p>
          <div className="video-grid">

            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline  poster="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260809_035827088.png" onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Now_let_s_show_how_kids_would.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Family Protection Scenario</p><span>How SafetyLink protects your household</span></div>
            </div>

            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Government_use_case_senario.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Government &amp; Municipal Use Case</p><span>Public safety infrastructure deployment</span></div>
            </div>

            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Neighbourhood_watch_security_c.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Neighbourhood Watch</p><span>Community security network in action</span></div>
            </div>

            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/drone_dispatch_tracking_crimin.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Drone Dispatch &amp; Tracking</p><span>Aerial response to active incidents</span></div>
            </div>

            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Show_the_uses_in_school_and_wo.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Schools &amp; Workplaces</p><span>Protecting children and employees</span></div>
            </div>

            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline  onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Government_use_case_senario.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>Elderly Alone at Home</p><span>Watch-Me Timer and proactive monitoring</span></div>
            </div>
            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Now_let_s_show_how_kids_would.mp4" type="video/mp4"/>
              </video>
              <div className="vid-play"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
              <div className="vid-label"><p>SafetyLink Pitch Deck</p><span>Overview of our three pillars</span></div>
            </div>
            <div className="vid-card" onClick={() => {}}>
              <video preload="none" playsInline onEnded={handleVideoEnded}>
                <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/drone_dispatch_tracking_crimin.mp4" type="video/mp4"/>
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
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)', fontWeight:'900', color:'var(--navy)', letterSpacing:'-.02em', marginBottom:'12px'}}>Every Community. One Platform.</h2>
          <div className="uc-grid">
            <div className="uc-card">
              <img src="https://images.unsplash.com/photo-1541888049108-8eb6cb6699ed?q=80&w=2070&auto=format&fit=crop" alt="Security Command Room" style={{ borderRadius: '12px', height: '200px', objectFit: 'cover' }} />
              <div className="uc-body">
                <span className="uc-tag">Security Personnel</span>
                <div className="uc-title">Command Deck & Response</div>
                <p className="uc-text">Give your operators a live feed of every alert, responder location, and BLE beacon in your network. SafetyLink charges only its flat platform fee.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://images.unsplash.com/photo-1581983050228-5e5d326f86c8?q=80&w=2070&auto=format&fit=crop" alt="Family Safety" style={{ borderRadius: '12px', height: '200px', objectFit: 'cover' }} />
              <div className="uc-body">
                <span className="uc-tag">Families & Residents</span>
                <div className="uc-title">Personal Safety Hub</div>
                <p className="uc-text">Panic button, BLE wearable, Watch-Me Timer, and emergency contact dispatch. R49/month. Works offline. No estate required.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop" alt="Community Watch" style={{ borderRadius: '12px', height: '200px', objectFit: 'cover' }} />
              <div className="uc-body">
                <span className="uc-tag">Community Watch</span>
                <div className="uc-title">Neighborhood Networks</div>
                <p className="uc-text">Connect neighbors into a secure digital mesh. Broadcast suspicious activities, trigger mass alerts, and coordinate local volunteer responders instantly.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2069&auto=format&fit=crop" alt="School Kids" style={{ borderRadius: '12px', height: '200px', objectFit: 'cover' }} />
              <div className="uc-body">
                <span className="uc-tag">Schools & Students</span>
                <div className="uc-title">Campus Protection</div>
                <p className="uc-text">Clip an iTag to backpacks. Teachers and parents get live updates on location and immediate SOS signals if a student strays from the geofenced safe zone.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://images.unsplash.com/photo-1504307651254-35680f356f90?q=80&w=2070&auto=format&fit=crop" alt="Site Workers" style={{ borderRadius: '12px', height: '200px', objectFit: 'cover' }} />
              <div className="uc-body">
                <span className="uc-tag">Site Workers</span>
                <div className="uc-title">Lone Worker Safety</div>
                <p className="uc-text">Protect contractors, industrial workers, and lone operators with the Watch-Me Timer and offline voice triggers when operating in hazardous environments.</p>
              </div>
            </div>
            <div className="uc-card">
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" alt="Estate Security" style={{ borderRadius: '12px', height: '200px', objectFit: 'cover' }} />
              <div className="uc-body">
                <span className="uc-tag">Estates & Complexes</span>
                <div className="uc-title">Full Estate Deployment</div>
                <p className="uc-text">Deploy across every unit. GIS map, beacon overlay, Evidence Ledger, and multi-responder dispatch — all in one platform.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
