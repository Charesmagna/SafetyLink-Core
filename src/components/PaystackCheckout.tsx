import React, { useState } from 'react';

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
  const [loading, setLoading] = useState<string | null>(null);

  const initiate = async (plan: Plan) => {
    if (!email || !name) {
      alert('Please enter your name and email first');
      return;
    }
    setLoading(plan.name);

    const totalAmount = (plan.once_off * 100) + plan.amount; // amount in cents/kobo
    const ref = `SL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. Attempt official Paystack transaction initialization via backend
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: totalAmount,
          planId: plan.plan_code || plan.name,
          metadata: {
            name,
            plan: plan.name,
            plan_code: plan.plan_code,
            registration_fee: plan.once_off,
            callback_url: 'https://safetylink.online/#payment-success'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.authorization_url) {
          window.location.href = data.data.authorization_url;
          return;
        }
      }
    } catch (err) {
      console.warn('Backend Paystack initialize error, falling back to inline popup:', err);
    }

    // 2. Fallback to inline modal using window.PaystackPop
    const PaystackPop = (window as any).PaystackPop;
    const paystackKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';

    if (PaystackPop && paystackKey) {
      const handler = PaystackPop.setup({
        key: paystackKey,
        email,
        amount: totalAmount,
        ref,
        currency: 'ZAR',
        metadata: {
          name,
          plan: plan.name,
          plan_code: plan.plan_code,
        },
        callback: (response: any) => {
          setLoading(null);
          alert(`Payment successful! Reference: ${response.reference}`);
          window.location.href = 'https://safetylink.online/#payment-success';
        },
        onClose: () => {
          setLoading(null);
        },
      });

      handler.openIframe();
      return;
    }

    setLoading(null);
    alert('Unable to initialize Paystack transaction. Please ensure PAYSTACK_SECRET_KEY or VITE_PAYSTACK_PUBLIC_KEY is configured.');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>
        Simple Pricing
      </h2>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px' }}>
        No hidden costs. Cancel anytime.
      </p>

      {/* Email + Name fields */}
      <div style={{ maxWidth: '400px', margin: '0 auto 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
        />
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            background: plan.popular ? 'linear-gradient(160deg, rgba(21,128,61,0.05), #f8fafc)' : '#f8fafc',
            border: `1px solid ${plan.popular ? 'rgba(21,128,61,0.4)' : '#e2e8f0'}`,
            borderRadius: '20px',
            padding: '32px 24px',
            position: 'relative',
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: '-11px', left: '24px', background: '#15803d', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 12px', borderRadius: '100px', textTransform: 'uppercase' }}>
                Most Popular
              </div>
            )}
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              {plan.name}
            </div>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {plan.monthly}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>per month</div>
            <div style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '24px' }}>
              + R{plan.once_off} once-off registration
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: '13px', color: '#475569', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#15803d', fontWeight: '700' }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => initiate(plan)}
              disabled={loading === plan.name}
              style={{
                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                background: plan.popular ? '#15803d' : '#0f172a',
                color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              {loading === plan.name ? 'Redirecting...' : `Subscribe — ${plan.monthly}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '32px' }}>
        Payments secured by Paystack · POPIA compliant · Cancel anytime via WhatsApp +27 68 007 9911
      </p>
    </div>
  );
};

export default PaystackCheckout;
