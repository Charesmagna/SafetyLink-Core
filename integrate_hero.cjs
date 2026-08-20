const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const newStyles = `
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
`;

// Insert the new styles
code = code.replace('.hero-inner {', newStyles + '\n    .hero-inner-old {');


const newHeroHtml = `
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
`;

// Extract between <section id="hero"> and the end of that section
const regexHero = /<section id="hero">[\s\S]*?<\/section>/;
code = code.replace(regexHero, newHeroHtml.trim());

fs.writeFileSync('src/components/LandingPage.tsx', code);
