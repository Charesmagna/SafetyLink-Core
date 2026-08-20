
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brand } from '../config/brand';
import { LogoSetPart } from './LogoSetPart';

interface LandingPageProps {
  onLogin: () => void;
  onRegisterOrg?: () => void;
  onRegisterUser?: () => void;
  onBackToApp?: () => void;
  isLoggedIn?: boolean;
}



export function LandingPage({ onLogin, onRegisterOrg, onRegisterUser, onBackToApp, isLoggedIn }: LandingPageProps) {
  const [activeSection, setActiveSection] = React.useState('home');
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const navTo = (section: string) => {
    setActiveSection(section);
    setMenuOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            <section id="hero">
  <div className="hero-bg"></div>
  <div className="hero-grid-overlay"></div>
  
  <div className="hero-container">
        
        {/* Header */}
        <header className="hero-header">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                SAFETY LINK: GLOBAL PROTECTION NETWORK
            </motion.h1>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
                (Integrated Emergency Dispatch Ecosystem)
            </motion.h2>
        </header>

        {/* Main Visual / Integration Area */}
        <section className="integration-section">
            <h3 className="integration-title">System Integration</h3>
            
            <div className="integration-grid">
                
                {/* Left Column */}
                <div className="grid-column">
                    <motion.div className="mockup-item" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                        <div style={{ fontSize: '4rem' }}>👨‍👩‍👧‍👦</div>
                        <p style={{ marginTop: '10px', color: '#a0aec0' }}>Family Protection</p>
                    </motion.div>
                    <motion.div className="mockup-item" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
                        <div style={{ fontSize: '3rem' }}>🎛️</div>
                        <p style={{ marginTop: '10px', color: '#a0aec0' }}>Tactile Triggers</p>
                    </motion.div>
                </div>

                {/* Center Column */}
                <div className="grid-column">
                    <motion.div className="phone-mockup" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
                        <div style={{ color: '#a0aec0', fontSize: '0.7rem', letterSpacing: '1px', marginBottom: 'auto' }}>SAFETYLINK HUB</div>
                        
                        <div className="sos-btn">
                            SOS
                            <span>HOLD 1.5S</span>
                        </div>
                        
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginTop: 'auto' }}>
                            <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Live Security Armed</div>
                            <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '4px' }}>Sequential escalation active</div>
                        </div>
                    </motion.div>

                    {/* Row of colored fobs */}
                    <motion.div className="fob-row" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.6 }}>
                        <div className="fob-mini" style={{ background: '#4fc3f7' }}></div>
                        <div className="fob-mini" style={{ background: '#ffffff' }}></div>
                        <div className="fob-mini" style={{ background: '#f06292' }}></div>
                        <div className="fob-mini" style={{ background: '#aed581' }}></div>
                        <div className="fob-mini" style={{ background: '#263238' }}></div>
                    </motion.div>
                </div>

                {/* Right Column */}
                <div className="grid-column">
                    <motion.div className="mockup-item" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                        <div style={{ fontSize: '3rem', color: '#ffffff' }}>🗄️ 🔒</div>
                        <p style={{ marginTop: '10px', color: '#a0aec0' }}>Secure Server Network</p>
                    </motion.div>
                    <motion.div className="mockup-item" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
                        <div style={{ fontSize: '3rem' }}>🚁</div>
                        <p style={{ marginTop: '10px', color: '#a0aec0' }}>Automated Response</p>
                    </motion.div>
                </div>

            </div>
        </section>

        {/* Pricing & Info Cards */}
        <section className="info-cards">
            
            <motion.div className="feature-card-clean" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                <div className="feature-card-icon">👤</div>
                <div className="feature-card-content">
                    <h4>Individual Link</h4>
                    <p>Starts from R49 p/m.<br/>Individual coverage with 24/7 Monitoring.</p>
                </div>
            </motion.div>

            <motion.div className="feature-card-clean" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                <div className="feature-card-icon">👨‍👩‍👧‍👦</div>
                <div className="feature-card-content">
                    <h4>Family Link</h4>
                    <p>R99 p/m for family of 5.<br/>Link family members, shared alerts.</p>
                </div>
            </motion.div>

            <motion.div className="feature-card-clean" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
                <div className="feature-card-icon">🏢</div>
                <div className="feature-card-content">
                    <h4>Enterprise Solution</h4>
                    <p>Security Companies Get:<br/>Own Control-Room Dashboard & Server Network.</p>
                </div>
            </motion.div>

        </section>

  </div>
</section>
            <section id="pricing">
  <div className="section-inner">
    <div className="section-eyebrow">Pricing</div>
    <h2 className="section-headline">Transparent Pricing for Every Community</h2>
    <p className="section-sub">From individual protection to enterprise security infrastructure — choose the plan that fits your situation.</p>

    <h3 style={{'fontFamily': 'Exo 2, sans-serif', 'fontSize': '18px', 'fontWeight': '700', 'margin': '48px 0 0', 'color': 'var(--muted)', 'letterSpacing': '.5px', 'textTransform': 'uppercase'}}>Individual &amp; Family</h3>
    <div className="plans-grid" style={{'marginTop': '24px'}}>

      <div className="plan-card">
        <div className="plan-tier">Individual</div>
        <div className="plan-name">Free</div>
        <div className="plan-price">R<sup></sup>0<span className="period">/mo</span></div>
        <div className="plan-desc">Basic protection for individuals. No credit card required.</div>
        <hr className="plan-divider"/>
        <ul className="plan-features">
          <li><i className="fa-solid fa-check"></i>1 user</li>
          <li><i className="fa-solid fa-check"></i>Live GPS tracking</li>
          <li><i className="fa-solid fa-check"></i>24-hour incident history</li>
          <li><i className="fa-solid fa-check"></i>Community alerts</li>
          <li><i className="fa-solid fa-check"></i>Basic push notifications</li>
        </ul>
        <a href="#" onClick={(e) => { e.preventDefault(); navTo("download"); }} className="plan-cta">Get Started Free</a>
      </div>

      <div className="plan-card featured-plan">
        <div className="plan-badge">Most Popular</div>
        <div className="plan-tier">Individual</div>
        <div className="plan-name">Premium</div>
        <div className="plan-price">R<sup></sup>49<span className="period">/mo</span></div>
        <div className="plan-desc">Full protection. Also available at R499/yr or R149 once-off.</div>
        <hr className="plan-divider"/>
        <ul className="plan-features">
          <li><i className="fa-solid fa-check"></i>Up to 5 iTAG keyfobs</li>
          <li><i className="fa-solid fa-check"></i>Unlimited panic activations</li>
          <li><i className="fa-solid fa-check"></i>Private company monitoring</li>
          <li><i className="fa-solid fa-check"></i>Live real-time tracking</li>
          <li><i className="fa-solid fa-check"></i>12-month incident history</li>
          <li><i className="fa-solid fa-check"></i>Safe zone alerts</li>
          <li><i className="fa-solid fa-check"></i>Emergency audio recording</li>
          <li><i className="fa-solid fa-check"></i>Priority cloud & support</li>
        </ul>
        <a href="#" onClick={(e) => { e.preventDefault(); navTo("download"); }} className="plan-cta cta-red">Get Premium</a>
      </div>

      <div className="plan-card">
        <div className="plan-tier">Family</div>
        <div className="plan-name">Family</div>
        <div className="plan-price">R<sup></sup>99<span className="period">/mo</span></div>
        <div className="plan-desc">Full household coverage. Also R999/yr or R249 once-off.</div>
        <hr className="plan-divider"/>
        <ul className="plan-features">
          <li><i className="fa-solid fa-check"></i>Up to 6 family members</li>
          <li><i className="fa-solid fa-check"></i>12 iTAG keyfobs</li>
          <li><i className="fa-solid fa-check"></i>Shared family dashboard</li>
          <li><i className="fa-solid fa-check"></i>Live family tracking</li>
          <li><i className="fa-solid fa-check"></i>Group panic activation</li>
          <li><i className="fa-solid fa-check"></i>Shared safe zones</li>
          <li><i className="fa-solid fa-check"></i>Family emergency timeline</li>
        </ul>
        <a href="#" onClick={(e) => { e.preventDefault(); navTo("download"); }} className="plan-cta">Get Family Plan</a>
      </div>
    </div>

    
    <h3 style={{'fontFamily': 'Exo 2, sans-serif', 'fontSize': '18px', 'fontWeight': '700', 'margin': '72px 0 0', 'color': 'var(--muted)', 'letterSpacing': '.5px', 'textTransform': 'uppercase'}}>Security Company &amp; Community Patrol</h3>
    <div className="sec-plans-grid">
      <div className="sec-card">
        <div className="sec-tier">Starter</div>
        <div className="sec-name">Starter</div>
        <div className="sec-price">R999<span className="per">/mo</span></div>
        <div className="sec-clients"><i className="fa-solid fa-users"></i> Up to 50 clients</div>
        <div className="sec-feat">Live map · Basic reporting · Client management</div>
      </div>
      <div className="sec-card" style={{'borderColor': 'rgba(198,40,40,0.3)'}}>
        <div className="sec-tier">Professional</div>
        <div className="sec-name">Professional</div>
        <div className="sec-price">R2,499<span className="per">/mo</span></div>
        <div className="sec-clients"><i className="fa-solid fa-users"></i> Up to 250 clients</div>
        <div className="sec-feat">Auto dispatch · Incident & staff management · API access · Advanced reports · WhatsApp alerts</div>
      </div>
      <div className="sec-card">
        <div className="sec-tier">Business</div>
        <div className="sec-name">Business</div>
        <div className="sec-price">R5,999<span className="per">/mo</span></div>
        <div className="sec-clients"><i className="fa-solid fa-users"></i> Up to 1,000 clients</div>
        <div className="sec-feat">White-label dashboard · Multi-branch · Fleet tracking</div>
      </div>
      <div className="sec-card" style={{'borderColor': 'rgba(255,143,0,0.3)'}}>
        <div className="sec-tier">Enterprise</div>
        <div className="sec-name">Enterprise</div>
        <div className="sec-price" style={{'color': 'var(--amber)'}}>Custom</div>
        <div className="sec-clients" style={{'color': 'var(--muted)'}}><i className="fa-solid fa-infinity"></i> Unlimited</div>
        <div className="sec-feat">Dedicated infrastructure · White-label mobile app · 24/7 priority support</div>
      </div>
    </div>
    <p style={{'fontSize': '13px', 'color': 'var(--muted)', 'marginTop': '20px'}}>Add-ons: White-Label Mobile App R1,000/mo · Advanced Analytics R299/mo · SMS bundles, WhatsApp Business, Voice Dispatch: usage-based</p>
  </div>
</section>
          </>
        );
      case 'platform':
        return <div className="pt-24"><section id="platform">
  <div className="section-inner">
    <div className="platform-header">
      <div>
        <div className="section-eyebrow">Platform</div>
        <h2 className="section-headline">Everything You Need to Manage Community Safety</h2>
      </div>
      <p className="section-sub" style={{'alignSelf': 'end'}}>From a single panic button to a full organisational command centre — SafetyLink-Core connects every layer of your community's safety infrastructure.</p>
    </div>
    <div className="platform-grid">
      
      <div className="platform-card featured">
        <div className="pc-icon"><i className="fa-solid fa-bell"></i></div>
        <div className="pc-title">Panic Trigger System</div>
        <p className="pc-desc">2-second hold to arm, 10-second countdown to disarm. Sequential SMS and voice dispatch to up to 5 contacts with live GPS coordinates attached. The core of everything SafetyLink does.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-map"></i></div>
        <div className="pc-title">Live GIS Map</div>
        <p className="pc-desc">Leaflet.js-powered live map centred on your community — track members, incidents, and responder positions in real time.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-brands fa-bluetooth-b"></i></div>
        <div className="pc-title">BLE Keyfob</div>
        <p className="pc-desc">HST-01 iTAG integration with foreground service persistence — panic works through screen lock, OEM battery killers, and background restrictions.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-brands fa-whatsapp"></i></div>
        <div className="pc-title">WhatsApp Alerts</div>
        <p className="pc-desc">Dispatch emergency notifications directly to WhatsApp groups and individual contacts alongside SMS and voice call.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-shield-check"></i></div>
        <div className="pc-title">Drill Mode</div>
        <p className="pc-desc">Run live emergency drills without triggering real alerts — train your team, test the system, confirm every contact works.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-vault"></i></div>
        <div className="pc-title">ZK Evidence Vault</div>
        <p className="pc-desc">AES-256-GCM encrypted local evidence storage with PBKDF2 key derivation — secure incident media and documents that only you can access.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-users-gear"></i></div>
        <div className="pc-title">Org Dashboard</div>
        <p className="pc-desc">Full member management, QR code onboarding, referral tracking, live incident feeds, and role-based access — built for security companies and community leadership.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-chart-line"></i></div>
        <div className="pc-title">Incident Analytics</div>
        <p className="pc-desc">Time-of-day heat maps, response time tracking, area risk scoring — data that helps organisations allocate patrols and prevent incidents before they occur.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-microphone"></i></div>
        <div className="pc-title">Emergency Audio Recording</div>
        <p className="pc-desc">Automatic audio capture on panic activation, uploaded securely to your vault for evidentiary use or insurance claims.</p>
      </div>

      <div className="platform-card">
        <div className="pc-icon"><i className="fa-solid fa-network-wired"></i></div>
        <div className="pc-title">Open Platform Layer</div>
        <p className="pc-desc">Ntfy, OwnCloud, and Sensor Stream integrations extend dispatch beyond SMS — connect your existing community infrastructure.</p>
      </div>
    </div>
  </div>
</section></div>;
      case 'why':
        return <div className="pt-24"><section id="why">
  <div className="section-inner">
    <div className="section-eyebrow">Why SafetyLink-Core</div>
    <h2 className="section-headline">Protection That Works When It Matters Most</h2>
    <p className="section-sub">Built from the ground up for South Africa's unique safety environment — fast, reliable, offline-capable, and community-driven.</p>
    <div className="why-grid">
      <div className="why-card">
        <div className="why-icon"><i className="fa-solid fa-bolt"></i></div>
        <h3>2-Second Activation</h3>
        <p>A 2-second hold-to-trigger panic button with a 10-second disarm window eliminates accidental calls while ensuring instant real activation when you need it most.</p>
      </div>
      <div className="why-card">
        <div className="why-icon"><i className="fa-solid fa-map-location-dot"></i></div>
        <h3>Live GPS Dispatch</h3>
        <p>Your exact GPS coordinates are pushed to up to 5 emergency contacts via sequential SMS and voice call the moment panic is triggered — no guessing, no delay.</p>
      </div>
      <div className="why-card">
        <div className="why-icon"><i className="fa-brands fa-bluetooth-b"></i></div>
        <h3>BLE Keyfob Integration</h3>
        <p>The HST-01 iTAG keyfob connects via Bluetooth Low Energy, activating panic directly from your pocket or keychain — even with the screen locked.</p>
      </div>
      <div className="why-card">
        <div className="why-icon"><i className="fa-solid fa-building-shield"></i></div>
        <h3>Organisation Management</h3>
        <p>Security companies, estates, and neighbourhood watches get a full command dashboard — manage members, view live incidents, and run drill exercises from anywhere.</p>
      </div>
      <div className="why-card">
        <div className="why-icon"><i className="fa-solid fa-brain"></i></div>
        <h3>K'lev.ai Assistant</h3>
        <p>An embedded AI co-pilot helps members, responders, and administrators — answering safety protocols, drafting incident reports, and guiding emergency response in real time.</p>
      </div>
      <div className="why-card">
        <div className="why-icon"><i className="fa-solid fa-devices"></i></div>
        <h3>APK, Web & Desktop</h3>
        <p>One unified login across the Android APK, the web dashboard, and the Windows EXE — your profile, your organisation, your incident history — everywhere you need it.</p>
      </div>
    </div>
  </div>
</section></div>;
      case 'klev':
        return <div className="pt-24"><section id="klev">
  <div className="section-inner">
    <div className="klev-inner">
      <div>
        <div className="section-eyebrow">K'lev.ai</div>
        <h2 className="section-headline">Your AI Emergency Response Co-Pilot</h2>
        <p className="section-sub" style={{'marginBottom': '32px'}}>K'lev.ai is embedded directly in SafetyLink-Core — available to members, responders, and administrators instantly. Ask a question, get a protocol. Draft an incident report in seconds. Guide a bystander through first response.</p>
        <ul style={{'listStyle': 'none', 'display': 'flex', 'flexDirection': 'column', 'gap': '14px'}}>
          <li style={{'display': 'flex', 'gap': '12px', 'alignItems': 'flex-start'}}>
            <i className="fa-solid fa-check" style={{'color': '#4ade80', 'marginTop': '2px', 'flexShrink': '0'}}></i>
            <span style={{'fontSize': '15px'}}>Real-time safety protocol guidance during active incidents</span>
          </li>
          <li style={{'display': 'flex', 'gap': '12px', 'alignItems': 'flex-start'}}>
            <i className="fa-solid fa-check" style={{'color': '#4ade80', 'marginTop': '2px', 'flexShrink': '0'}}></i>
            <span style={{'fontSize': '15px'}}>Automated incident report drafting from event data</span>
          </li>
          <li style={{'display': 'flex', 'gap': '12px', 'alignItems': 'flex-start'}}>
            <i className="fa-solid fa-check" style={{'color': '#4ade80', 'marginTop': '2px', 'flexShrink': '0'}}></i>
            <span style={{'fontSize': '15px'}}>Community communication drafting — alerts, notices, updates</span>
          </li>
          <li style={{'display': 'flex', 'gap': '12px', 'alignItems': 'flex-start'}}>
            <i className="fa-solid fa-check" style={{'color': '#4ade80', 'marginTop': '2px', 'flexShrink': '0'}}></i>
            <span style={{'fontSize': '15px'}}>Available in all three platforms — APK, web, and EXE</span>
          </li>
        </ul>
      </div>

      <div className="ai-chat-mock">
        <div className="ai-chat-header">
          <div className="ai-avatar"><i className="fa-solid fa-brain"></i></div>
          <div>
            <div className="ai-name">K'lev.ai</div>
            <div className="ai-status">● Online — SafetyLink-Core</div>
          </div>
        </div>
        <div className="ai-messages">
          <div className="ai-msg from-user">Panic triggered on Moira Park sector. What should responders do first?</div>
          <div className="ai-msg from-ai">
            Immediate response protocol:<br /><br />
            1. Confirm GPS coordinates received — locate on live map.<br />
            2. Dispatch nearest patrol unit — ETA estimation required.<br />
            3. Attempt voice callback to the member within 30 seconds.<br />
            4. Alert sector group via WhatsApp broadcast.<br />
            5. If no response in 90s, escalate to SAPS 10111.
          </div>
          <div className="ai-msg from-user">Draft an incident report for this event.</div>
          <div className="ai-msg from-ai">
            <strong>Incident Report — SafetyLink-Core</strong><br />
            Date: 2026-08-19 · Sector: Moira Park<br />
            Type: Panic Activation · Status: Active<br />
            Member: [Auto-resolved from GPS]<br />
            Response time: calculating…<br />
            Actions taken: [Will auto-populate on resolution]
          </div>
        </div>
        <div className="ai-input-row">
          <i className="fa-solid fa-comment-dots"></i>
          <span>Ask K'lev.ai anything…</span>
        </div>
      </div>
    </div>
  </div>
</section></div>;
      case 'hardware':
        return <div className="pt-24"><section id="hardware">
  <div className="section-inner">
    <div style={{'display': 'grid', 'gridTemplateColumns': '1fr 1fr', 'gap': '80px', 'alignItems': 'center'}} className="hw-grid">
      <div>
        <div className="section-eyebrow">Hardware</div>
        <h2 className="section-headline">iTAG BLE Keyfob — Your Wearable Panic Button</h2>
        <p className="section-sub" style={{'marginBottom': '32px'}}>
          The HST-01 iTAG attaches to your keys, bag, or belt. One press triggers SafetyLink panic from anywhere — no phone unlock required. Included automatically with Premium and Family plans.
        </p>
        <p className="hw-note">
          Available individually or in bulk packs for neighbourhood watch groups and security companies. 
          ~28% margin on 10-packs for reseller and distributor programmes.
        </p>
      </div>
      <div>
        <div className="hw-card">
          <div className="hw-icon-wrap"><i className="fa-solid fa-tag"></i></div>
          <div className="hw-info">
            <h4>Single iTAG</h4>
            <p>1 BLE panic keyfob</p>
          </div>
          <div className="hw-price">R100</div>
        </div>
        <div className="hw-card">
          <div className="hw-icon-wrap"><i className="fa-solid fa-tags"></i></div>
          <div className="hw-info">
            <h4>3-Pack</h4>
            <p>Family starter pack</p>
          </div>
          <div className="hw-price">R179</div>
        </div>
        <div className="hw-card">
          <div className="hw-icon-wrap"><i className="fa-solid fa-boxes-stacked"></i></div>
          <div className="hw-info">
            <h4>5-Pack</h4>
            <p>Household or small team</p>
          </div>
          <div className="hw-price">R299</div>
        </div>
        <div className="hw-card" style={{'borderColor': 'rgba(255,143,0,0.3)'}}>
          <div className="hw-icon-wrap"><i className="fa-solid fa-warehouse"></i></div>
          <div className="hw-info">
            <h4>10-Pack</h4>
            <p>Reseller / estate / NHW</p>
          </div>
          <div className="hw-price" style={{'color': 'var(--amber)'}}>R499</div>
        </div>
      </div>
    </div>
  </div>
</section></div>;
      case 'download':
        return <div className="pt-24"><section id="download">
  <div className="section-inner">
    <div className="section-eyebrow">Get SafetyLink-Core</div>
    <h2 className="section-headline">One Login. Three Platforms.</h2>
    <p className="section-sub">Register once at safetylink.online. Your profile, organisation, and incident history sync instantly across every platform.</p>
    <div className="download-grid">
      <div className="dl-card">
        <div className="dl-icon"><i className="fa-brands fa-android"></i></div>
        <h3>Android APK</h3>
        <p>The full SafetyLink-Core experience — panic button, BLE keyfob, live GPS, K'lev.ai — built for Android. Download direct from safetylink.online.</p>
        <a href="#" onClick={(e) => { e.preventDefault(); }} className="dl-btn">
          <i className="fa-solid fa-download"></i> Download APK
        </a>
      </div>
      <div className="dl-card">
        <div className="dl-icon"><i className="fa-solid fa-globe"></i></div>
        <h3>Web Dashboard</h3>
        <p>Organisation management, incident command, live map, member administration, and analytics — accessible from any browser, anywhere.</p>
        <a href="#" onClick={(e) => { e.preventDefault(); onLogin(); }} className="dl-btn outline">
          <i className="fa-solid fa-arrow-up-right-from-square"></i> Open Dashboard
        </a>
      </div>
      <div className="dl-card">
        <div className="dl-icon"><i className="fa-brands fa-windows"></i></div>
        <h3>Windows EXE</h3>
        <p>The full organisation console as a native Windows desktop application — for security control rooms that need dedicated, always-on monitoring.</p>
        <a href="#" onClick={(e) => { e.preventDefault(); }} className="dl-btn outline">
          <i className="fa-solid fa-download"></i> Download EXE
        </a>
      </div>
    </div>
    <div style={{'background': 'var(--panel)', 'border': '1px solid var(--border)', 'borderRadius': 'var(--r-lg)', 'padding': '32px', 'marginTop': '32px', 'display': 'flex', 'alignItems': 'center', 'gap': '24px', 'flexWrap': 'wrap'}}>
      <i className="fa-solid fa-qrcode" style={{'fontSize': '40px', 'color': 'var(--red)', 'flexShrink': '0'}}></i>
      <div>
        <h4 style={{'fontFamily': 'Exo 2, sans-serif', 'fontWeight': '700', 'marginBottom': '6px'}}>Organisation QR Onboarding</h4>
        <p style={{'fontSize': '14px', 'color': 'var(--muted)'}}>Organisations generate QR codes from their dashboard — members scan and are instantly placed under the correct organisation. No manual codes required.</p>
      </div>
      <a href="#" onClick={(e) => { e.preventDefault(); if (onRegisterOrg) onRegisterOrg(); else onLogin(); }} className="btn-hero-secondary">Register Your Org</a>
    </div>
  </div>
</section></div>;
      case 'contact':
        return <div className="pt-24 pb-24"><div id="contact" style={{marginTop: 0}}>
  <h2 className="cta-headline">Ready to Protect Your Community?</h2>
  <p className="cta-sub">SafetyLink-Core is built right here in South Africa — for South African communities.<br />Start free today. No credit card required.</p>
  <div className="cta-actions">
    <a href="#" onClick={(e) => { e.preventDefault(); }} className="btn-hero-primary">
      <i className="fa-brands fa-android"></i> Download APK — Free
    </a>
    <a href="#" onClick={(e) => { e.preventDefault(); if (onRegisterOrg) onRegisterOrg(); else onLogin(); }} className="btn-hero-secondary">
      <i className="fa-solid fa-building-shield"></i> Register Your Organisation
    </a>
    <a href="mailto:info@safetylink.online" className="btn-hero-secondary">
      <i className="fa-solid fa-envelope"></i> Contact Us
    </a>
  </div>
</div>


<footer>
  <div className="footer-inner">
    <div className="footer-top">
      <div className="footer-brand">
        <div className="nav-logo" style={{'marginBottom': '0'}}>
          <div className="shield"><i className="fa-solid fa-shield-halved"></i></div>
          SafetyLink<span className="core">-Core</span>
        </div>
        <p>South Africa's most advanced community emergency response platform — built by TM Media Solutions in Lenasia South, Gauteng.</p>
        <div style={{'display': 'flex', 'gap': '12px', 'marginTop': '20px'}}>
          <a href="https://facebook.com/SafetyLink" style={{'color': 'var(--muted)', 'transition': 'color .2s'}} onMouseOver={(e) => e.currentTarget.style.color='#fff'} onMouseOut={(e) => e.currentTarget.style.color='var(--muted)'}><i className="fa-brands fa-facebook-f fa-lg"></i></a>
          <a href="https://wa.me/27739441222" style={{'color': 'var(--muted)', 'transition': 'color .2s'}} onMouseOver={(e) => e.currentTarget.style.color='#25d366'} onMouseOut={(e) => e.currentTarget.style.color='var(--muted)'}><i className="fa-brands fa-whatsapp fa-lg"></i></a>
        </div>
      </div>
      <div className="footer-col">
        <h4>Platform</h4>
        <ul>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("platform"); }}>Panic Trigger</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("platform"); }}>Live GPS</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("platform"); }}>BLE Keyfob</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("platform"); }}>ZK Evidence Vault</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("klev"); }}>K'lev.ai</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("platform"); }}>Drill Mode</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Plans</h4>
        <ul>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}>Free</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}>Premium</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}>Family</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}>Security Starter</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}>Professional</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}>Enterprise</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="mailto:info@safetylink.online">Contact Us</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("download"); }}>Download APK</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("download"); }}>Web Dashboard</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navTo("hardware"); }}>iTAG Hardware</a></li>
          <li><a href="/legal/privacy">Privacy Policy</a></li>
          <li><a href="/legal/terms">Terms of Use</a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© 2026 SafetyLink-Core by TM Media Solutions. All rights reserved.</span>
      <div className="footer-legal">
        <a href="/legal/privacy">Privacy Policy</a>
        <a href="/legal/terms">Terms of Use</a>
        <a href="/legal/popia">POPIA Compliance</a>
      </div>
    </div>
  </div>
</footer>


      
    </div>;
      default:
        return null;
    }
  };

  return (
    <div className="landing-page-root">
      <style dangerouslySetInnerHTML={{ __html: `
        
    /* ─── TOKENS ─────────────────────────────────────────────────── */
    :root {
      --red:      #C62828;
      --red-deep: #8B0000;
      --red-glow: rgba(198,40,40,0.25);
      --amber:    #FF8F00;
      --black:    #0A0A0A;
      --dark:     #111111;
      --panel:    #181818;
      --glass:    rgba(255,255,255,0.04);
      --border:   rgba(255,255,255,0.08);
      --text:     #F0F0F0;
      --muted:    #9CA3AF;
      --white:    #FFFFFF;
      --r: 4px;
      --r-lg: 12px;
    }

    /* ─── RESET ──────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--black);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; display: block; }

    /* ─── UTILITY BAR ────────────────────────────────────────────── */
    #utility-bar {
      background: #0f0f0f;
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
    }
    .utility-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
      height: 40px;
      justify-content: flex-end;
    }
    .utility-link {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--muted);
      transition: color .2s;
    }
    .utility-link:hover { color: var(--white); }
    .utility-link i { font-size: 11px; }

    /* ─── NAV ────────────────────────────────────────────────────── */
    #navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(10,10,10,0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      transition: background .3s;
    }
    .nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      height: 68px;
      gap: 32px;
    }
    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Exo 2', sans-serif;
      font-weight: 800;
      font-size: 20px;
      letter-spacing: .5px;
      flex-shrink: 0;
    }
    .nav-logo .shield {
      width: 36px;
      height: 36px;
      background: var(--red);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px var(--red-glow);
      font-size: 16px;
    }
    .nav-logo span.core { color: var(--red); }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .nav-link {
      font-size: 14px;
      color: var(--muted);
      padding: 6px 12px;
      border-radius: var(--r);
      transition: color .2s, background .2s;
      font-weight: 500;
    }
    .nav-link:hover { color: var(--white); background: var(--glass); }
    .nav-ctas {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }
    .btn-ghost {
      padding: 8px 18px;
      border: 1px solid var(--border);
      border-radius: var(--r);
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      transition: border-color .2s, color .2s;
    }
    .btn-ghost:hover { border-color: var(--red); color: var(--white); }
    .btn-primary {
      padding: 8px 20px;
      background: var(--red);
      border-radius: var(--r);
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      transition: background .2s, box-shadow .2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary:hover { background: #d93030; box-shadow: 0 0 20px var(--red-glow); }

    /* ─── HERO ───────────────────────────────────────────────────── */
    #hero {
      position: relative;
      min-height: 88vh;
      display: flex;
      align-items: center;
      overflow: hidden;
      padding: 80px 24px;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 60% at 80% 40%, rgba(198,40,40,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,143,0,0.06) 0%, transparent 60%),
        #0A0A0A;
    }
    .hero-grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 64px 64px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
    }
    
    /* New User Hero Integration */
    .hero-container {
        max-width: 1200px;
        width: 100%;
        padding: 40px 20px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 50px;
        position: relative;
        z-index: 2;
    }

    /* Header Styles */
    .hero-header {
        text-align: center;
    }

    .hero-header h1 {
        font-size: 2.8rem;
        font-weight: 800;
        letter-spacing: 1px;
        margin-bottom: 10px;
        text-transform: uppercase;
        color: #ffffff;
    }

    .hero-header h2 {
        font-size: 1.5rem;
        color: #a0aec0;
        font-weight: 400;
    }

    /* System Integration Layout */
    .integration-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
    }

    .integration-title {
        color: #d4af37;
        font-size: 1.4rem;
        letter-spacing: 2px;
        margin-bottom: 40px;
        text-transform: uppercase;
    }

    .integration-grid {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        position: relative;
    }

    /* Abstract connecting lines using SVG background */
    .integration-grid::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 10%;
        right: 10%;
        height: 200px;
        transform: translateY(-50%);
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><line x1="0" y1="100" x2="50%" y2="50" stroke="%23d4af37" stroke-width="1" opacity="0.4"/><line x1="0" y1="100" x2="50%" y2="150" stroke="%23d4af37" stroke-width="1" opacity="0.4"/><line x1="100%" y1="100" x2="50%" y2="50" stroke="%23d4af37" stroke-width="1" opacity="0.4"/><line x1="100%" y1="100" x2="50%" y2="150" stroke="%23d4af37" stroke-width="1" opacity="0.4"/><line x1="25%" y1="20" x2="50%" y2="100" stroke="%23d4af37" stroke-width="1" opacity="0.3"/><line x1="75%" y1="180" x2="50%" y2="100" stroke="%23d4af37" stroke-width="1" opacity="0.3"/></svg>');
        background-size: cover;
        background-position: center;
        z-index: 0;
        pointer-events: none;
    }

    .grid-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        z-index: 1;
        flex: 1;
    }

    /* Mockup elements */
    .mockup-item {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        backdrop-filter: blur(5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        transition: transform 0.3s ease, border-color 0.3s ease;
    }
    
    .mockup-item:hover {
        transform: translateY(-5px);
        border-color: #d4af37;
    }

    .phone-mockup {
        width: 260px;
        height: 520px;
        background: #0d121b;
        border: 12px solid #222;
        border-radius: 35px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 0 2px rgba(212, 175, 55, 0.3);
    }

    .sos-btn {
        width: 130px;
        height: 130px;
        background: radial-gradient(circle, #ff5252 0%, #b71c1c 100%);
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: auto;
        box-shadow: 0 0 30px rgba(229, 57, 53, 0.5), inset 0 2px 10px rgba(255,255,255,0.3);
        border: 4px solid rgba(255,255,255,0.1);
        color: white;
        font-weight: 800;
        font-size: 1.8rem;
        letter-spacing: 1px;
    }

    .sos-btn span {
        font-size: 0.7rem;
        font-weight: 400;
        opacity: 0.8;
        margin-top: 5px;
    }

    .fob-row {
        display: flex;
        gap: 10px;
        margin-top: -30px;
        z-index: 2;
    }

    .fob-mini {
        width: 35px;
        height: 55px;
        border-radius: 20px 20px 15px 15px;
        border: 2px solid rgba(255,255,255,0.2);
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        padding-top: 5px;
    }

    .fob-mini::before {
        content: '';
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #222;
        border: 2px solid #ccc;
    }

    /* Info Cards Container */
    .info-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        width: 100%;
        position: relative;
        z-index: 2;
        margin-bottom: 60px;
    }

    .feature-card-clean {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 12px;
        padding: 25px;
        display: flex;
        align-items: center;
        gap: 20px;
        transition: all 0.3s ease;
    }

    .feature-card-clean:hover {
        background: rgba(212, 175, 55, 0.05);
        border-color: #d4af37;
        transform: translateY(-3px);
    }

    .feature-card-icon {
        font-size: 2.5rem;
        color: #d4af37;
        min-width: 60px;
        text-align: center;
    }

    .feature-card-content h4 {
        color: #d4af37;
        font-size: 1.1rem;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        margin-top: 0;
    }

    .feature-card-content p {
        color: #a0aec0;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
    }

    @media (max-width: 992px) {
        .integration-grid {
            flex-direction: column;
            gap: 50px;
        }
        .integration-grid::before {
            display: none;
        }
        .info-cards {
            grid-template-columns: 1fr;
        }
    }

    .hero-inner-old {
      max-width: 1280px;
      margin: 0 auto;
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
      width: 100%;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(198,40,40,0.12);
      border: 1px solid rgba(198,40,40,0.3);
      border-radius: 100px;
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #ff6b6b;
      letter-spacing: .8px;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .hero-eyebrow i { font-size: 10px; }
    .hero-headline {
      font-family: 'Exo 2', sans-serif;
      font-size: clamp(38px, 5vw, 64px);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -1px;
      margin-bottom: 24px;
    }
    .hero-headline .accent { color: var(--red); }
    .hero-headline .amber { color: var(--amber); }
    .hero-sub {
      font-size: 18px;
      color: var(--muted);
      line-height: 1.65;
      margin-bottom: 40px;
      max-width: 520px;
    }
    .hero-ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      align-items: center;
    }
    .btn-hero-primary {
      padding: 14px 28px;
      background: var(--red);
      border-radius: var(--r);
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background .2s, box-shadow .3s, transform .15s;
      box-shadow: 0 4px 32px var(--red-glow);
    }
    .btn-hero-primary:hover { background: #d93030; box-shadow: 0 6px 40px rgba(198,40,40,0.5); transform: translateY(-1px); }
    .btn-hero-secondary {
      padding: 14px 28px;
      border: 1px solid var(--border);
      border-radius: var(--r);
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: border-color .2s, background .2s;
    }
    .btn-hero-secondary:hover { border-color: rgba(255,255,255,0.3); background: var(--glass); }
    .hero-badge {
      margin-top: 36px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--muted);
    }
    .hero-badge span { border-right: 1px solid var(--border); padding-right: 10px; }
    .hero-badge span:last-child { border-right: none; }

    /* Hero visual — panic button mock */
    .hero-visual {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .phone-mock {
      width: 280px;
      background: #141414;
      border-radius: 40px;
      border: 1.5px solid rgba(255,255,255,0.1);
      padding: 20px 16px 28px;
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.5),
        0 40px 80px rgba(0,0,0,0.6),
        0 0 60px rgba(198,40,40,0.08);
      position: relative;
    }
    .phone-notch {
      width: 80px;
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 3px;
      margin: 0 auto 20px;
    }
    .phone-status {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--muted);
      padding: 0 4px;
      margin-bottom: 24px;
    }
    .panic-button-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px 0 10px;
    }
    .panic-ring-outer {
      position: relative;
      width: 160px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .panic-ring-outer::before,
    .panic-ring-outer::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid rgba(198,40,40,0.3);
      animation: pulse-ring 2.4s ease-out infinite;
    }
    .panic-ring-outer::before { width: 100%; height: 100%; }
    .panic-ring-outer::after  { width: 80%; height: 80%; animation-delay: .8s; }
    @keyframes pulse-ring {
      0%   { transform: scale(.85); opacity: .8; }
      100% { transform: scale(1.1); opacity: 0; }
    }
    .panic-btn {
      width: 110px;
      height: 110px;
      background: radial-gradient(circle at 35% 35%, #e53935, var(--red-deep));
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 0 0 3px rgba(198,40,40,0.3),
        0 8px 32px rgba(198,40,40,0.5),
        inset 0 2px 4px rgba(255,255,255,0.15);
      cursor: pointer;
      position: relative;
      z-index: 2;
      animation: btn-breathe 3s ease-in-out infinite;
    }
    @keyframes btn-breathe {
      0%,100% { box-shadow: 0 0 0 3px rgba(198,40,40,0.3), 0 8px 32px rgba(198,40,40,0.5), inset 0 2px 4px rgba(255,255,255,0.15); }
      50%      { box-shadow: 0 0 0 6px rgba(198,40,40,0.2), 0 8px 48px rgba(198,40,40,0.7), inset 0 2px 4px rgba(255,255,255,0.15); }
    }
    .panic-btn i { font-size: 28px; color: #fff; }
    .panic-btn span { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.8); margin-top: 4px; text-transform: uppercase; }
    .panic-label {
      font-size: 11px;
      color: var(--muted);
      text-align: center;
      letter-spacing: .5px;
    }
    .phone-info-row {
      display: flex;
      justify-content: space-between;
      padding: 16px 4px 0;
      border-top: 1px solid var(--border);
      margin-top: 16px;
    }
    .phone-info-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .phone-info-item .val { font-size: 15px; font-weight: 700; color: var(--white); }
    .phone-info-item .key { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
    .phone-info-item .dot-active { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; animation: blink 1.5s infinite; }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

    /* floating badges around phone */
    .float-badge {
      position: absolute;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 10px 14px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      animation: float 4s ease-in-out infinite;
    }
    .float-badge.ble { top: 12%; left: -30%; animation-delay: .5s; }
    .float-badge.gps { bottom: 20%; right: -25%; animation-delay: 1.2s; }
    .float-badge.ai  { top: 55%;  left: -35%; animation-delay: 2s; }
    @keyframes float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    .float-badge i { color: var(--amber); }
    .float-badge .fb-label { font-weight: 600; color: var(--white); }
    .float-badge .fb-sub   { font-size: 10px; color: var(--muted); }

    /* ─── TRUST BAR ──────────────────────────────────────────────── */
    #trust-bar {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 20px 24px;
      background: var(--dark);
    }
    .trust-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 40px;
      flex-wrap: wrap;
    }
    .trust-label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .trust-items {
      display: flex;
      align-items: center;
      gap: 32px;
      flex-wrap: wrap;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
    }
    .trust-item i { color: var(--red); font-size: 14px; }

    /* ─── SECTIONS SHARED ────────────────────────────────────────── */
    section { padding: 100px 24px; }
    .section-inner { max-width: 1280px; margin: 0 auto; }
    .section-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--red);
      margin-bottom: 16px;
    }
    .section-headline {
      font-family: 'Exo 2', sans-serif;
      font-size: clamp(28px, 3.5vw, 48px);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -.5px;
      margin-bottom: 16px;
    }
    .section-sub {
      font-size: 17px;
      color: var(--muted);
      line-height: 1.65;
      max-width: 600px;
    }
    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 0;
    }

    /* ─── WHY SECTION ────────────────────────────────────────────── */
    #why { background: var(--dark); }
    .why-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 2px;
      margin-top: 64px;
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      overflow: hidden;
    }
    .why-card {
      background: var(--panel);
      padding: 40px 32px;
      transition: background .2s;
    }
    .why-card:hover { background: #1e1e1e; }
    .why-icon {
      width: 48px;
      height: 48px;
      background: rgba(198,40,40,0.12);
      border: 1px solid rgba(198,40,40,0.25);
      border-radius: var(--r);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--red);
      margin-bottom: 20px;
    }
    .why-card h3 {
      font-family: 'Exo 2', sans-serif;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .why-card p { font-size: 15px; color: var(--muted); line-height: 1.65; }

    /* ─── PLATFORM GRID ──────────────────────────────────────────── */
    #platform {}
    .platform-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      align-items: end;
      margin-bottom: 64px;
    }
    .platform-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      overflow: hidden;
    }
    .platform-card {
      background: var(--dark);
      padding: 28px 24px;
      transition: background .2s;
      cursor: default;
    }
    .platform-card:hover { background: #161616; }
    .platform-card.featured {
      grid-column: span 2;
      background: rgba(198,40,40,0.06);
    }
    .platform-card.featured:hover { background: rgba(198,40,40,0.1); }
    .pc-icon {
      font-size: 22px;
      color: var(--amber);
      margin-bottom: 14px;
    }
    .platform-card.featured .pc-icon { color: var(--red); font-size: 28px; }
    .pc-title {
      font-family: 'Exo 2', sans-serif;
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .platform-card.featured .pc-title { font-size: 20px; }
    .pc-desc { font-size: 13px; color: var(--muted); line-height: 1.6; }
    .platform-card.featured .pc-desc { font-size: 15px; }

    /* ─── STATS BAR ──────────────────────────────────────────────── */
    #stats {
      background: var(--red);
      padding: 64px 24px;
    }
    .stats-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 40px;
      text-align: center;
    }
    .stat-val {
      font-family: 'Exo 2', sans-serif;
      font-size: 48px;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 8px;
    }
    .stat-label { font-size: 14px; opacity: .85; font-weight: 500; }

    /* ─── PLANS ──────────────────────────────────────────────────── */
    #pricing { background: var(--dark); }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 64px;
    }
    .plan-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 36px 28px;
      display: flex;
      flex-direction: column;
      transition: border-color .2s, transform .2s;
    }
    .plan-card:hover { border-color: rgba(198,40,40,0.4); transform: translateY(-2px); }
    .plan-card.featured-plan {
      border-color: var(--red);
      background: rgba(198,40,40,0.07);
      position: relative;
    }
    .plan-badge {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--red);
      padding: 4px 16px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .5px;
      white-space: nowrap;
    }
    .plan-tier {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }
    .plan-name {
      font-family: 'Exo 2', sans-serif;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .plan-price {
      font-family: 'Exo 2', sans-serif;
      font-size: 38px;
      font-weight: 900;
      margin: 16px 0 4px;
    }
    .plan-price sup { font-size: 18px; font-weight: 600; color: var(--muted); vertical-align: super; }
    .plan-price .period { font-size: 14px; font-weight: 400; color: var(--muted); }
    .plan-desc { font-size: 14px; color: var(--muted); margin-bottom: 28px; }
    .plan-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
    .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .plan-features li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 14px;
    }
    .plan-features li i { color: #4ade80; font-size: 13px; margin-top: 2px; flex-shrink: 0; }
    .plan-cta {
      margin-top: 28px;
      display: block;
      text-align: center;
      padding: 12px;
      border-radius: var(--r);
      font-weight: 700;
      font-size: 15px;
      border: 1px solid var(--border);
      transition: background .2s, border-color .2s;
    }
    .plan-cta:hover { background: var(--glass); border-color: rgba(255,255,255,0.2); }
    .plan-cta.cta-red {
      background: var(--red);
      border-color: var(--red);
    }
    .plan-cta.cta-red:hover { background: #d93030; }

    /* Security plans */
    .sec-plans-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 48px;
    }
    .sec-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 28px 20px;
      transition: border-color .2s;
    }
    .sec-card:hover { border-color: rgba(198,40,40,0.3); }
    .sec-tier { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .sec-name { font-family: 'Exo 2', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 12px; }
    .sec-price { font-size: 28px; font-weight: 900; font-family: 'Exo 2', sans-serif; margin-bottom: 4px; }
    .sec-price .per { font-size: 13px; font-weight: 400; color: var(--muted); }
    .sec-clients { font-size: 12px; color: var(--amber); margin-bottom: 16px; font-weight: 600; }
    .sec-feat { font-size: 12px; color: var(--muted); line-height: 1.7; }

    /* ─── HARDWARE ───────────────────────────────────────────────── */
    #hardware { background: var(--black); }
    .hw-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
      margin-top: 64px;
    }
    .hw-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 32px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
      transition: border-color .2s;
    }
    .hw-card:hover { border-color: rgba(255,143,0,0.3); }
    .hw-icon-wrap {
      width: 56px;
      height: 56px;
      background: rgba(255,143,0,0.1);
      border: 1px solid rgba(255,143,0,0.2);
      border-radius: var(--r);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      color: var(--amber);
      flex-shrink: 0;
    }
    .hw-info h4 { font-family: 'Exo 2', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .hw-info p  { font-size: 13px; color: var(--muted); }
    .hw-price {
      margin-left: auto;
      font-family: 'Exo 2', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: var(--amber);
      flex-shrink: 0;
    }
    .hw-note { font-size: 13px; color: var(--muted); line-height: 1.6; margin-top: 8px; }

    /* ─── KLEV AI ─────────────────────────────────────────────────  */
    #klev { background: var(--dark); }
    .klev-inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
    }
    .ai-chat-mock {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      overflow: hidden;
    }
    .ai-chat-header {
      background: rgba(198,40,40,0.08);
      border-bottom: 1px solid var(--border);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ai-avatar {
      width: 32px;
      height: 32px;
      background: var(--red);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .ai-name { font-weight: 700; font-size: 14px; }
    .ai-status { font-size: 11px; color: #4ade80; }
    .ai-messages { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .ai-msg {
      padding: 12px 16px;
      border-radius: var(--r-lg);
      font-size: 13px;
      line-height: 1.6;
      max-width: 85%;
    }
    .ai-msg.from-ai {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      color: var(--text);
      align-self: flex-start;
    }
    .ai-msg.from-user {
      background: rgba(198,40,40,0.15);
      border: 1px solid rgba(198,40,40,0.25);
      color: var(--text);
      align-self: flex-end;
    }
    .ai-input-row {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 13px;
    }
    .ai-input-row i { color: var(--red); }

    /* ─── PLATFORMS / DOWNLOAD ───────────────────────────────────── */
    #download { background: var(--black); }
    .download-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 64px;
    }
    .dl-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 40px 32px;
      text-align: center;
      transition: border-color .2s, transform .2s;
    }
    .dl-card:hover { border-color: rgba(198,40,40,0.4); transform: translateY(-3px); }
    .dl-icon {
      font-size: 40px;
      color: var(--red);
      margin-bottom: 20px;
    }
    .dl-card h3 { font-family: 'Exo 2', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 10px; }
    .dl-card p  { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 24px; }
    .dl-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--red);
      border-radius: var(--r);
      font-weight: 700;
      font-size: 14px;
      color: #fff;
      transition: background .2s;
    }
    .dl-btn:hover { background: #d93030; }
    .dl-btn.outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .dl-btn.outline:hover { border-color: var(--red); background: var(--glass); }

    /* ─── CTA BANNER ─────────────────────────────────────────────── */
    #cta-banner {
      padding: 100px 24px;
      background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(198,40,40,0.15) 0%, transparent 70%), var(--dark);
      text-align: center;
      border-top: 1px solid var(--border);
    }
    .cta-headline {
      font-family: 'Exo 2', sans-serif;
      font-size: clamp(32px, 4vw, 56px);
      font-weight: 900;
      margin-bottom: 16px;
      letter-spacing: -.5px;
    }
    .cta-sub { font-size: 18px; color: var(--muted); margin-bottom: 40px; }
    .cta-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }

    /* ─── FOOTER ─────────────────────────────────────────────────── */
    footer {
      background: #080808;
      border-top: 1px solid var(--border);
      padding: 64px 24px 32px;
    }
    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
    }
    .footer-top {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 48px;
      margin-bottom: 48px;
    }
    .footer-brand p { font-size: 14px; color: var(--muted); line-height: 1.7; margin-top: 16px; max-width: 280px; }
    .footer-col h4 { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; }
    .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .footer-col ul li a { font-size: 14px; color: rgba(255,255,255,0.5); transition: color .2s; }
    .footer-col ul li a:hover { color: var(--white); }
    .footer-bottom {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 13px;
      color: var(--muted);
    }
    .footer-bottom a { color: var(--muted); transition: color .2s; }
    .footer-bottom a:hover { color: var(--white); }
    .footer-legal { display: flex; gap: 20px; }

    /* ─── RESPONSIVE ─────────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .hero-inner      { grid-template-columns: 1fr; gap: 48px; }
      .hero-visual     { order: -1; }
      .float-badge     { display: none; }
      .why-grid        { grid-template-columns: 1fr 1fr; }
      .platform-grid   { grid-template-columns: repeat(2, 1fr); }
      .platform-card.featured { grid-column: span 2; }
      .plans-grid      { grid-template-columns: 1fr 1fr; }
      .sec-plans-grid  { grid-template-columns: 1fr 1fr; }
      .hw-grid         { grid-template-columns: 1fr; }
      .klev-inner      { grid-template-columns: 1fr; }
      .download-grid   { grid-template-columns: 1fr 1fr; }
      .footer-top      { grid-template-columns: 1fr 1fr; }
      .stats-inner     { grid-template-columns: repeat(2, 1fr); }
      .platform-header { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .nav-links { display: none; }
      .why-grid  { grid-template-columns: 1fr; }
      .plans-grid { grid-template-columns: 1fr; }
      .sec-plans-grid { grid-template-columns: 1fr; }
      .download-grid { grid-template-columns: 1fr; }
      .footer-top { grid-template-columns: 1fr; }
      .stats-inner { grid-template-columns: 1fr 1fr; }
      .hero-headline { font-size: 36px; }
      .utility-inner .utility-link:not(:last-child):not(:nth-last-child(2)) { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; }
    }
  
        .landing-page-root {
          font-family: 'DM Sans', sans-serif;
          background: #0A0A0A;
          color: #F0F0F0;
          line-height: 1.6;
          overflow-x: hidden;
          min-height: 100vh;
        }
        /* Ensuring standard scrolling on landing page */
        .landing-page-root {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          overflow-y: auto;
        }
      `}} />

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
              <i className={`fa-solid ${menuOpen ? 'fa-xmark text-emerald-400' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center gap-6 transition-all duration-300 z-[9999] ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center gap-6 mt-16 max-h-[80vh] overflow-y-auto w-full px-4 pb-12">
          <button onClick={() => navTo('home')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'home' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Home</button>
          <button onClick={() => navTo('platform')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'platform' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Platform Features</button>
          <button onClick={() => navTo('why')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'why' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Use Cases</button>
          <button onClick={() => navTo('hardware')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'hardware' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Hardware Config</button>
          <button onClick={() => navTo('klev')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'klev' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>AI Co-Pilot</button>
          <button onClick={() => navTo('pricing')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'pricing' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Pricing</button>
          <button onClick={() => navTo('download')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'download' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Download</button>
          <button onClick={() => navTo('contact')} className={`text-3xl font-black uppercase tracking-wider ${activeSection === 'contact' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}>Contact Us</button>
          
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
