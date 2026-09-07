import React from 'react';
import './Home.css';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Hardware({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  return (
    <div className="landing-page-root w-full overflow-x-hidden">
      {/* ══ HARDWARE ══ */}
      <section className="hardware" id="hardware">
        <div className="hw-inner">
          <div className="section-eye" style={{color:'var(--green)'}}>Hardware Config</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)', fontWeight:'900', color:'var(--navy)', letterSpacing:'-.02em', marginBottom:'8px'}}>Your Hardware. Configured in Minutes.</h2>
          <p style={{fontSize:'15px', color:'var(--muted)', maxWidth:'520px', lineHeight:'1.7'}}>SafetyLink works with the iTAG BLE keyfob. Available in 5 colours. Standard CR2032 battery. No proprietary lock-in.</p>
          <div className="hw-grid">
            <div className="hw-main">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260819_020219883.jpg" alt="SafetyLink iTAG devices — blue white pink green black" />
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
                <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260819_020134421.jpg" alt="Pink iTAG close-up" />
              </div>
              <div className="hw-guide">
                <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Polish_20260819_020007723.jpg" alt="iTAG battery replacement guide" />
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


    </div>
  );
}
