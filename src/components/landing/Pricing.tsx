import React, { useState } from 'react';
import './Home.css';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Pricing({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  return (
    <div className="landing-page-root w-full overflow-x-hidden">
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
        </div>
      </section>

    </div>
  );
}
