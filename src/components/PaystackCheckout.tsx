import React, { useState } from 'react';
import { PaystackButton } from 'react-paystack';

interface Plan {
  name: string;
  amount: number;
  monthly: string;
  once_off: number;
  plan_code: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Individual',
    amount: 4900,
    monthly: 'R49',
    once_off: 149,
    plan_code: 'PLN_individual',
    features: [
      'SafetyLink Mobile app',
      'iTAG keyfob pairing',
      'SOS panic button',
      'Watch-Me Timer',
      '2 emergency contacts',
      'Offline SMS fallback',
      '11 SA languages',
    ],
  },
  {
    name: 'Family',
    amount: 9900,
    monthly: 'R99',
    once_off: 149,
    plan_code: 'PLN_family',
    popular: true,
    features: [
      'Up to 5 family members',
      'All Individual features',
      'Shared emergency contacts',
      'Family dashboard',
      'Priority alert routing',
    ],
  },
  {
    name: 'Organisation',
    amount: 4900,
    monthly: 'R49/user',
    once_off: 149,
    plan_code: 'PLN_organisation',
    features: [
      'Unlimited residents',
      'SafetyLink Command Deck',
      'Live GIS beacon overlay',
      'Evidence Ledger',
      'Admin panel + audit logs',
      'SL-ORG-XXXX mesh node',
      'API access',
    ],
  },
];

const PaystackCheckout: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_e1b5a3e2f6d0c9a4b8e7f2d1c3a5b9e8f4d2c6a0b3e7f1d5c9a2b6e0f4d8c2';

  const onSuccess = (reference: any) => {
    window.location.hash = '#payment-success';
  };

  const onClose = () => {
    console.log("Paystack closed");
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '60px 40px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'.18em', color:'#e8321e', marginBottom:'16px', textAlign: 'center' }}>// CHOOSE YOUR PLAN</div>
      <h2 style={{ textAlign: 'center', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '900', color: '#f0f4f8', marginBottom: '8px', letterSpacing: '-0.02em' }}>
        Simple, Transparent Pricing.
      </h2>
      <p style={{ textAlign: 'center', color: '#8892a4', marginBottom: '60px', fontSize: '15px' }}>
        No hidden costs. Cancel anytime. Billed via Paystack.
      </p>

      {/* Email + Name fields */}
      <div style={{ maxWidth: '400px', margin: '0 auto 60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px', color: '#f0f4f8', outline: 'none', transition: 'border 0.2s' }}
          onFocus={e => e.target.style.borderColor = 'rgba(232,50,30,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px', color: '#f0f4f8', outline: 'none', transition: 'border 0.2s' }}
          onFocus={e => e.target.style.borderColor = 'rgba(232,50,30,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {PLANS.map(plan => {
          const totalAmount = (plan.once_off * 100) + plan.amount;
          
          const componentProps = {
            email,
            amount: totalAmount,
            metadata: {
              name,
              custom_fields: [
                { display_name: "Name", variable_name: "name", value: name }
              ]
            },
            publicKey,
            text: `Subscribe — ${plan.monthly}`,
            plan: plan.plan_code,
            onSuccess,
            onClose,
            currency: 'ZAR',
          };

          return (
            <div key={plan.name} style={{
              background: plan.popular ? 'rgba(232,50,30,.06)' : '#111820',
              border: `1px solid ${plan.popular ? 'rgba(232,50,30,.3)' : 'rgba(255,255,255,.07)'}`,
              borderRadius: '20px',
              padding: '40px 32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s'
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '32px', background: '#e8321e', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 16px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                  Most Popular
                </div>
              )}
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: '11px', fontWeight: '700', color: plan.popular ? '#e8321e' : '#8892a4', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: '#f0f4f8', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>
                {plan.monthly}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: '11px', color: '#8892a4', marginBottom: '16px' }}>per month</div>
              
              <div style={{ fontSize: '11px', color: '#f5a623', background: 'rgba(245,166,35,0.08)', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', marginBottom: '32px', border: '1px solid rgba(245,166,35,0.2)' }}>
                + R{plan.once_off} once-off registration
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '13px', color: '#c8d0dc', display: 'flex', alignItems: 'flex-start', gap: '12px', lineHeight: 1.5 }}>
                    <span style={{ color: plan.popular ? '#e8321e' : '#00e676', fontWeight: '700', marginTop: '2px' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              
              {(!email || !name) ? (
                <button
                  onClick={() => alert('Please enter your name and email address above to proceed.')}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#8892a4', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    letterSpacing: '.05em', transition: 'background 0.2s'
                  }}
                >
                  Enter details to subscribe
                </button>
              ) : (
                <PaystackButton
                  {...componentProps}
                  className="paystack-button"
                  style={{
                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                    background: plan.popular ? '#e8321e' : '#f0f4f8',
                    color: plan.popular ? '#fff' : '#070a0f', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                    letterSpacing: '.05em', transition: 'transform 0.1s'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#8892a4', marginTop: '48px', fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }}>
        PAYMENTS SECURED BY PAYSTACK // POPIA COMPLIANT // CANCEL ANYTIME
      </p>
    </div>
  );
};

export default PaystackCheckout;
