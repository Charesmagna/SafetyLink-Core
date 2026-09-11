// @ts-nocheck
import React, { useState } from 'react';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Pricing({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  const [billing, setBilling] = useState<'monthly'|'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayfast = async (plan: string, amount: string) => {
    try {
      setLoadingPlan(plan);
      const res = await fetch('/api/payfast/checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ plan_name: plan, amount, email:'user@safetylink.online' }),
      });
      const data = await res.json();
      if (data.success && data.url) window.location.href = data.url;
    } catch(e) { alert('Checkout error. WhatsApp us to subscribe manually.'); }
    finally { setLoadingPlan(null); }
  };

  return (
    <div style={{ background:'#070a0f', color:'#f0f4f8', fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh' }}>

      {/* ── HEADER ── */}
      <section style={{ padding:'80px 40px 60px', background:'linear-gradient(135deg,#070a0f 0%,#0d1117 100%)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px' }}>// TRANSPARENT PRICING</div>
          <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:900, letterSpacing:'-.04em', lineHeight:.92, marginBottom:'20px' }}>
            Flexible protection.<br/><span style={{ color:'#e8321e', fontStyle:'italic' }}>No surprises.</span>
          </h1>
          <p style={{ fontSize:'15px', color:'#8892a4', maxWidth:'480px', margin:'0 auto 32px', lineHeight:1.7 }}>
            70% cheaper than competitors. 11× more features. Every plan includes the full dispatch chain — WhatsApp, SMS, Voice and USSD.
          </p>
          {/* Billing toggle */}
          <div style={{ display:'inline-flex', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'10px', padding:'4px', gap:'4px' }}>
            {(['monthly','annual'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ padding:'8px 20px', borderRadius:'7px', fontSize:'11px', fontWeight:700, letterSpacing:'.08em', cursor:'pointer', transition:'all .2s', textTransform:'uppercase',
                  background: billing === b ? '#e8321e' : 'transparent',
                  color: billing === b ? '#fff' : '#8892a4',
                  border:'none' }}>
                {b}{b === 'annual' ? ' (2 months free)' : ''}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDIVIDUAL PLANS ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'32px' }}>// INDIVIDUAL & FAMILY</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {[
              { name:'Free', price:'R0', period:'forever', color:'#8892a4', cr:'136,146,164', popular:false,
                features:['Digital SOS (on-screen + widget)','Live GPS tracking','2 emergency contacts','Basic WhatsApp alert','No iTag pairing','Community tier only'] },
              { name:'Premium', price: billing === 'annual' ? 'R41' : 'R49', period:'/month', color:'#00e676', cr:'0,230,118', popular:true,
                features:['Physical iTAG pairing (up to 5)','Pro control room monitoring','Geofenced safe zones','Emergency audio recording','VAPI AI voice follow-up','Priority cloud routing'] },
              { name:'Family', price: billing === 'annual' ? 'R83' : 'R99', period:'/month', color:'#0ea5e9', cr:'14,165,233', popular:false,
                features:['Up to 6 family members','Up to 12 paired iTAGs','Shared family dashboard','Live family map & group panic','Shared safe zones + timeline','Family incident timeline'] },
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.popular ? 'rgba(0,230,118,.06)' : 'rgba(255,255,255,.03)', border: plan.popular ? '1px solid rgba(0,230,118,.3)' : '1px solid rgba(255,255,255,.07)', borderRadius:'16px', padding:'32px', position:'relative', display:'flex', flexDirection:'column' }}>
                {plan.popular && (
                  <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#00e676', color:'#000', fontSize:'9px', fontWeight:800, letterSpacing:'.12em', padding:'4px 12px', borderRadius:'20px', textTransform:'uppercase', whiteSpace:'nowrap' }}>MOST POPULAR</div>
                )}
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:plan.color, letterSpacing:'.16em', marginBottom:'12px', textTransform:'uppercase' }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'24px' }}>
                  <span style={{ fontSize:'clamp(36px,5vw,56px)', fontWeight:900, color:plan.color, letterSpacing:'-.04em' }}>{plan.price}</span>
                  <span style={{ fontSize:'13px', color:'#8892a4' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle:'none', flex:1, marginBottom:'24px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:'12px', color:'#c8d0dc' }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:plan.color, flexShrink:0 }}/>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.price === 'R0' ? onRegisterUser() : handlePayfast(plan.name, plan.price.replace('R','') + '.00')}
                  disabled={loadingPlan === plan.name}
                  style={{ background:`rgba(${plan.cr},.15)`, color:plan.color, border:`1px solid rgba(${plan.cr},.3)`, padding:'13px', borderRadius:'8px', fontWeight:700, fontSize:'11px', letterSpacing:'.1em', cursor:'pointer', transition:'all .2s' }}>
                  {loadingPlan === plan.name ? 'Processing...' : plan.price === 'R0' ? 'GET STARTED FREE' : `SUBSCRIBE WITH PAYFAST`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY PLANS ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'32px' }}>// SECURITY COMPANIES & PATROL</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:'rgba(255,255,255,.07)', borderRadius:'14px', overflow:'hidden' }}>
            {[
              { tier:'Starter', price: billing==='annual'?'R832':'R999', clients:'Up to 50 clients', features:'Live client map · Basic reporting · Client management', color:'#8892a4' },
              { tier:'Professional', price: billing==='annual'?'R2,082':'R2,499', clients:'Up to 250 clients', features:'Auto dispatch · Incident management · API access · WhatsApp alerts', color:'#00e676', highlight:true },
              { tier:'Business', price: billing==='annual'?'R4,999':'R5,999', clients:'Up to 1,000 clients', features:'White-label dashboard · Multi-branch · Fleet tracking', color:'#e8321e' },
              { tier:'Enterprise', price:'Custom', clients:'Unlimited scale', features:'Dedicated infrastructure · White-label APK · 24/7 priority support · B-BBEE procurement', color:'#a78bfa' },
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.highlight ? 'rgba(0,230,118,.04)' : '#111820', padding:'24px 28px', display:'flex', alignItems:'center', gap:'32px' }}>
                <div style={{ flex:'0 0 160px' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:plan.color, letterSpacing:'.14em', marginBottom:'4px', textTransform:'uppercase' }}>{plan.tier}</div>
                  <div style={{ fontSize:'24px', fontWeight:900, color: plan.highlight ? '#00e676' : '#f0f4f8' }}>{plan.price}<span style={{ fontSize:'12px', fontWeight:400, color:'#8892a4' }}>/mo</span></div>
                </div>
                <div style={{ flex:'0 0 160px', fontSize:'12px', color:'#8892a4', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px' }}>{plan.clients}</div>
                <div style={{ flex:1, fontSize:'12px', color:'#8892a4', lineHeight:1.5 }}>{plan.features}</div>
                <button onClick={() => plan.price === 'Custom' ? window.open('mailto:info@safetylink.online','_blank') : handlePayfast(plan.tier, plan.price.replace(/[^0-9]/g,'') + '.00')}
                  style={{ flexShrink:0, background:`rgba(255,255,255,.05)`, color:plan.color, border:`1px solid rgba(255,255,255,.1)`, padding:'10px 20px', borderRadius:'8px', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {plan.price === 'Custom' ? 'CONTACT US' : 'SUBSCRIBE →'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE ── */}
      <section style={{ padding:'80px 40px', background:'#0d1117', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'32px' }}>// HARDWARE (BLUETOOTH iTAGS)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'20px' }}>
            {[
              { label:'Single iTAG', price:'R149', sub:'+ 1 month Premium included', id:'single', qty:1 },
              { label:'2-Pack', price:'R265', sub:'R132.50/unit + 1 month Premium', id:'double', qty:2 },
              { label:'5-Pack', price:'R499', sub:'R99.80/unit + 1 month Premium', id:'5pack', qty:5, highlight:true },
              { label:'10-Pack', price:'R880', sub:'R88/unit · Estate deployment', id:'10pack', qty:10 },
            ].map((h, i) => (
              <div key={i} style={{ background: h.highlight ? 'rgba(232,50,30,.08)' : 'rgba(255,255,255,.03)', border: h.highlight ? '1px solid rgba(232,50,30,.3)' : '1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'24px', textAlign:'center' }}>
                {h.highlight && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'8px', color:'#e8321e', letterSpacing:'.12em', marginBottom:'8px', textTransform:'uppercase' }}>BEST VALUE</div>}
                <div style={{ fontSize:'12px', color:'#8892a4', marginBottom:'8px', fontWeight:600 }}>{h.label}</div>
                <div style={{ fontSize:'clamp(24px,3vw,32px)', fontWeight:900, color: h.highlight ? '#e8321e' : '#f0f4f8', marginBottom:'6px' }}>{h.price}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#8892a4', marginBottom:'16px', lineHeight:1.4 }}>{h.sub}</div>
                <a href="https://wa.me/27739441222?text=SafetyLink+iTAG+order" target="_blank" rel="noreferrer"
                  style={{ display:'block', padding:'10px', borderRadius:'8px', fontSize:'10px', fontWeight:700, letterSpacing:'.08em', background: h.highlight ? '#e8321e' : 'rgba(255,255,255,.06)', color: h.highlight ? '#fff' : '#8892a4', border: h.highlight ? '1px solid #e8321e' : '1px solid rgba(255,255,255,.08)', textDecoration:'none' }}>
                  ORDER
                </a>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'16px 24px', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8892a4' }}>
            <span style={{ color:'#00e676', fontWeight:700 }}>Universal Sourcing:</span> Hardware dispatched locally within 3–5 business days. Pre-paired to your SafetyLink org ID. Secure ordering via WhatsApp or website.
          </div>
        </div>
      </section>

      {/* ── ADD-ONS ── */}
      <section style={{ padding:'80px 40px', background:'#070a0f' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'32px' }}>// OPTIONAL ADD-ONS</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {[
              { icon:'🏷️', name:'White-Label APK', price:'R1,000/mo', desc:'Your logo, your brand, your APK name. Custom Play Store listing available.' },
              { icon:'📊', name:'Advanced Analytics', price:'R299/mo', desc:'Incident heatmaps, response SLA tracking, evidence audit exports and executive reporting.' },
              { icon:'📡', name:'Additional SMS Bundle', price:'Usage-based', desc:'Africa\'s Talking SMS top-up. Rate: R0.12/SMS. Billed monthly.' },
              { icon:'📞', name:'VAPI Voice Minutes', price:'R1.20/min', desc:'AI voice dispatch minutes billed per call. First 100 minutes free on Professional+.' },
              { icon:'🔗', name:'API Access + Webhooks', price:'R199/mo', desc:'Full REST API + webhook integration for PSIM, VMS, access control and CRM systems.' },
              { icon:'🚁', name:'Drone-in-a-Box Integration', price:'Custom', desc:'Autonomous aerial first-response. Requires site survey. Available for Enterprise tier.' },
            ].map((a, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'14px', padding:'24px', display:'flex', gap:'16px', alignItems:'flex-start' }}>
                <span style={{ fontSize:'1.8rem', flexShrink:0 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:800, marginBottom:'4px' }}>{a.name}</div>
                  <div style={{ fontSize:'13px', color:'#e8321e', fontWeight:700, marginBottom:'8px' }}>{a.price}</div>
                  <div style={{ fontSize:'12px', color:'#8892a4', lineHeight:1.5 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
