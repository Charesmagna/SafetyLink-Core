// @ts-nocheck
import React, { useState } from 'react';
import { useAppStore } from '../../utils/store';

interface Plan {
  id: string;
  category: 'individual' | 'security';
  name: string;
  tier: string;
  badge?: string;
  priceMonthly: string;
  priceNum: number;
  cadence: string;
  subPricing?: string;
  description: string;
  features: string[];
  ctaText: string;
  highlighted?: boolean;
  color?: string;
}

const PLANS: Plan[] = [
  // Individual & Family
  {
    id: 'free',
    category: 'individual',
    name: 'Free',
    tier: 'Individual',
    priceMonthly: 'R0',
    priceNum: 0,
    cadence: '/month',
    description: 'Basic protection for individuals. No credit card required.',
    features: [
      '1 active user profile',
      'Live GPS emergency tracking',
      '2 emergency contacts (SMS & Push)',
      'Digital SOS trigger & quick widget',
      '24-hour incident event history',
      'Community safety broadcast alerts',
      'Offline SMS emergency fallback',
      '11 South African official languages',
    ],
    ctaText: 'Get Started Free',
    color: '#64748b',
  },
  {
    id: 'premium',
    category: 'individual',
    name: 'Premium',
    tier: 'Individual',
    badge: 'Most Popular',
    priceMonthly: 'R49',
    priceNum: 49,
    cadence: '/month',
    subPricing: 'Or R499/year (Save 15%) • R149 once-off onboarding',
    description: 'Full hardware-paired protection for individuals with control room link.',
    features: [
      'Physical iTAG keyfob pairing (Bluetooth Low Energy)',
      'Up to 5 physical iTags per profile',
      'Unlimited SOS panic activations',
      'Control room monitoring & responder routing',
      'Live real-time breadcrumb telemetry',
      '12-month tamper-proof incident evidence logs',
      'Geofenced Safe Zones (enter/exit alerts)',
      'Emergency ambient audio recording',
      'Priority cloud delivery & 24/7 support link',
    ],
    ctaText: 'Get Premium — R49/mo',
    highlighted: true,
    color: '#15803d',
  },
  {
    id: 'family',
    category: 'individual',
    name: 'Family',
    tier: 'Household Group',
    priceMonthly: 'R99',
    priceNum: 99,
    cadence: '/month',
    subPricing: 'Or R999/year (Save 16%) • R249 once-off onboarding',
    description: 'Complete household protection for families, children, and elderly relatives.',
    features: [
      'Protects up to 6 family members',
      'Up to 12 physical Bluetooth iTAG keyfobs',
      'Shared family safety dashboard',
      'Live family radar tracking & check-in pins',
      'Simultaneous family group panic activation',
      'Shared safe zones (Home, School, Work)',
      'Family emergency timeline & audio ledger',
      'Escalation routing to neighbourhood watch',
    ],
    ctaText: 'Get Family Plan — R99/mo',
    color: '#0284c7',
  },

  // Security Companies & Community Patrols
  {
    id: 'starter_security',
    category: 'security',
    name: 'Starter',
    tier: 'Patrol Agency',
    priceMonthly: 'R999',
    priceNum: 999,
    cadence: '/month',
    description: 'Entry-level dispatch command for private security and neighbourhood watches.',
    features: [
      'Up to 50 active client endpoints',
      'Live GIS client distress radar map',
      'Basic incident reporting & PDF exports',
      'Client contact directory & keyholder records',
      'Manual dispatch assignment',
      'Standard email & WhatsApp alert notifications',
    ],
    ctaText: 'Deploy Starter — R999/mo',
    color: '#475569',
  },
  {
    id: 'pro_security',
    category: 'security',
    name: 'Professional',
    tier: 'Security Company',
    badge: 'Recommended for Security',
    priceMonthly: 'R2,499',
    priceNum: 2499,
    cadence: '/month',
    description: 'Comprehensive automated dispatch for armed response & patrol fleets.',
    features: [
      'Up to 250 active client endpoints',
      'Automated proximity dispatch engine',
      'Guard telemetry & patrol shift monitoring',
      'Full REST API & Webhook integration',
      'Automated instant WhatsApp responder dispatch',
      'Evidence Ledger with cryptographic timestamps',
      'Multi-operator Command Deck logins',
      'Priority 99.9% uptime SLA',
    ],
    ctaText: 'Deploy Professional — R2,499/mo',
    highlighted: true,
    color: '#e8321e',
  },
  {
    id: 'business_security',
    category: 'security',
    name: 'Business',
    tier: 'Regional Operations',
    priceMonthly: 'R5,999',
    priceNum: 5999,
    cadence: '/month',
    description: 'Enterprise fleet & multi-branch command for established security providers.',
    features: [
      'Up to 1,000 active client endpoints',
      'White-label Command Deck with custom branding',
      'Multi-branch control room federation',
      'Patrol vehicle GPS tracking & geo-fencing',
      'Automated shift change & guard muster checks',
      'Dedicated integration specialist',
    ],
    ctaText: 'Deploy Business — R5,999/mo',
    color: '#7c3aed',
  },
  {
    id: 'enterprise_security',
    category: 'security',
    name: 'Enterprise',
    tier: 'Government & Metro',
    priceMonthly: 'Custom',
    priceNum: 0,
    cadence: 'tailored',
    description: 'Custom mesh safety infrastructure for universities, metropolises & corporations.',
    features: [
      'Unlimited client endpoints & responder nodes',
      'Dedicated private cloud or on-premise infrastructure',
      'Custom white-label Android & iOS mobile apps',
      'Hardware beacon mesh integration (BLE + LoRaWAN)',
      '24/7 dedicated engineering support & 15-min SLA',
      'Custom regulatory compliance & data residency',
    ],
    ctaText: 'Contact Enterprise Sales',
    color: '#d97706',
  },
];

const HARDWARE_PRODUCTS = [
  {
    id: 'lite',
    name: 'SafetyLink iTAG Lite',
    price: 100,
    priceStr: 'R100',
    tag: 'Single Keyfob',
    desc: 'Compact Bluetooth Low Energy panic keyfob. One-touch silent trigger with 1-year replaceable battery.',
    features: ['BLE 5.0 Long Range', 'Silent double-click SOS', 'Keyring attachment included', 'CR2032 battery included'],
  },
  {
    id: 'active',
    name: 'SafetyLink iTAG Active (3-Pack)',
    price: 179,
    priceStr: 'R179',
    tag: 'Most Popular Hardware',
    desc: 'Bundle of 3 BLE panic tags for the whole family, vehicle keys, or school backpacks.',
    features: ['3x BLE panic keyfobs', 'Individual name assignments', 'Lanyard & clip attachments', 'Saves R121 vs single units'],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'SafetyLink iTAG Premium (5-Pack)',
    price: 299,
    priceStr: 'R299',
    tag: 'Best Value Bundle',
    desc: 'Family or small business pack. 5x high-gain transmitters with rugged silicone protective cases.',
    features: ['5x Rugged BLE keyfobs', 'Protective silicone sleeves', '5x Extra spare batteries', 'Priority dispatch pairing'],
  },
];

export function Pricing({ onNavigate, onRegisterOrg }: { onNavigate?: (page: string) => void; onRegisterOrg?: () => void }) {
  const [categoryTab, setCategoryTab] = useState<'all' | 'individual' | 'security' | 'hardware'>('all');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedHardware, setSelectedHardware] = useState<typeof HARDWARE_PRODUCTS[0] | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [hardwareQty, setHardwareQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { globalTheme } = useAppStore();

  const isLight = globalTheme === 'light';

  const handleSelectPlan = (plan: Plan) => {
    if (plan.priceNum === 0 && plan.id === 'free') {
      if (onNavigate) onNavigate('store');
      else window.location.hash = '#download';
      return;
    }
    if (plan.id === 'enterprise_security') {
      window.open('https://wa.me/message/YIEA73M7H3P5M1?text=Hi+SafetyLink+Enterprise+Sales+Inquiry', '_blank');
      return;
    }
    setSelectedHardware(null);
    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
  };

  const handleSelectHardware = (item: typeof HARDWARE_PRODUCTS[0]) => {
    setSelectedPlan(null);
    setSelectedHardware(item);
    setHardwareQty(1);
    setCheckoutModalOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!customerEmail || !customerName) {
      alert('Please enter your full name and email address to proceed.');
      return;
    }
    setIsProcessing(true);

    const isHardware = !!selectedHardware;
    const amountZAR = isHardware
      ? selectedHardware.price * hardwareQty
      : (selectedPlan ? selectedPlan.priceNum : 49);
    const amountInCents = amountZAR * 100;
    const ref = `SL-${isHardware ? 'HW' : 'SUB'}-${Date.now()}`;

    // Try PaystackPop iframe
    const PaystackPop = (window as any).PaystackPop;
    const paystackKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_123a593f6611ef474e5076a9d1b8c442eb9f3aa3';

    if (PaystackPop && paystackKey) {
      try {
        const handler = PaystackPop.setup({
          key: paystackKey,
          email: customerEmail,
          amount: amountInCents,
          currency: 'ZAR',
          ref,
          metadata: {
            customer_name: customerName,
            item_name: isHardware ? selectedHardware.name : selectedPlan?.name,
            item_type: isHardware ? 'hardware' : 'subscription',
            quantity: isHardware ? hardwareQty : 1,
          },
          callback: (response: any) => {
            setIsProcessing(false);
            setCheckoutModalOpen(false);
            alert(`Order confirmed! Payment Reference: ${response.reference}\nOur dispatch team will contact you on ${customerEmail}.`);
            window.location.hash = '#payment-success';
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
        handler.openIframe();
        return;
      } catch (e) {
        console.warn('PaystackPop setup error, falling back to WhatsApp confirmation:', e);
      }
    }

    // Direct WhatsApp assisted order fallback
    setIsProcessing(false);
    setCheckoutModalOpen(false);
    const orderTitle = isHardware
      ? `${hardwareQty}x ${selectedHardware?.name} (Total: R${amountZAR})`
      : `${selectedPlan?.name} Subscription (R${amountZAR}/mo)`;
    const msg = encodeURIComponent(`Hi SafetyLink! I want to confirm my order:\n\n• Item: ${orderTitle}\n• Name: ${customerName}\n• Email: ${customerEmail}\n• Ref: ${ref}`);
    window.open(`https://wa.me/message/YIEA73M7H3P5M1?text=${msg}`, '_blank');
  };

  const filteredPlans = PLANS.filter(p => {
    if (categoryTab === 'all') return true;
    if (categoryTab === 'individual') return p.category === 'individual';
    if (categoryTab === 'security') return p.category === 'security';
    return false;
  });

  return (
    <div
      style={{
        background: isLight ? 'rgba(248, 250, 252, 0.85)' : 'transparent',
        color: isLight ? '#0f172a' : '#f8fafc',
        minHeight: '100vh',
        paddingTop: '60px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── HEADER HERO ────────────────────────────────────────── */}
      <section style={{ padding: '60px 20px 40px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', color: '#15803d', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
          // TRANSPARENT COMMUNITY PRICING
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '18px' }}>
          Protection Plans Built for <br />
          <span style={{ color: '#15803d' }}>Every South African Community</span>
        </h1>
        <p style={{ fontSize: '16px', color: isLight ? '#475569' : '#94a3b8', maxWidth: '680px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          From free individual smartphone safety to armed response dispatch networks and bulk hardware BLE panic buttons. Cancel anytime.
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'inline-flex', padding: '4px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)', backdropFilter:'blur(8px)', borderRadius: '12px', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'all', label: 'All Solutions' },
            { id: 'individual', label: 'Individuals & Families' },
            { id: 'security', label: 'Security & Patrol Agencies' },
            { id: 'hardware', label: 'Physical iTAG Hardware' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryTab(tab.id as any)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'all .2s',
                background: categoryTab === tab.id ? '#15803d' : 'transparent',
                color: categoryTab === tab.id ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── PLANS GRID ────────────────────────────────────────── */}
      {categoryTab !== 'hardware' && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredPlans.map(plan => (
              <div
                key={plan.id}
                style={{
                  background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(13,17,23,0.65)',
                  backdropFilter: 'blur(12px)',
                  border: plan.highlighted
                    ? '2px solid #15803d'
                    : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)'),
                  borderRadius: '20px',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plan.highlighted
                    ? '0 12px 36px rgba(21,128,61,0.18)'
                    : (isLight ? '0 4px 16px rgba(0,0,0,0.04)' : 'none'),
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#15803d',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '100px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: plan.color || '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {plan.tier}
                  </span>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 900 }}>{plan.priceMonthly}</span>
                    <span style={{ fontSize: '13px', color: isLight ? '#64748b' : '#94a3b8' }}>{plan.cadence}</span>
                  </div>
                  {plan.subPricing && (
                    <p style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, margin: '4px 0 0' }}>
                      {plan.subPricing}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', marginTop: '10px', lineHeight: 1.5 }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ height: '1px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)', margin: '16px 0' }}></div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.4 }}>
                      <span style={{ color: '#15803d', fontWeight: 900 }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    transition: 'all .2s',
                    background: plan.highlighted ? '#15803d' : (isLight ? '#0f172a' : '#ffffff'),
                    color: plan.highlighted ? '#ffffff' : (isLight ? '#ffffff' : '#0f172a'),
                  }}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HARDWARE BUNDLES SECTION ─────────────────────────── */}
      {(categoryTab === 'all' || categoryTab === 'hardware') && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', color: '#15803d', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              // PHYSICAL HARDWARE ACCESSORIES
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px' }}>SafetyLink iTAG Hardware Units</h2>
            <p style={{ fontSize: '14px', color: isLight ? '#64748b' : '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
              Physical panic buttons that operate over Bluetooth Low Energy (BLE). No screen wake needed.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {HARDWARE_PRODUCTS.map(item => (
              <div
                key={item.id}
                style={{
                  background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(13,17,23,0.65)',
                  backdropFilter: 'blur(12px)',
                  border: item.highlighted
                    ? '2px solid #15803d'
                    : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)'),
                  borderRadius: '18px',
                  padding: '28px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803d', background: 'rgba(21,128,61,0.12)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 900 }}>{item.priceStr}</span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>{item.name}</h3>
                <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>{item.desc}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.features.map((f, i) => (
                    <li key={i} style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#15803d' }}>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectHardware(item)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#15803d',
                    color: '#ffffff',
                    transition: 'background .2s',
                  }}
                >
                  Order {item.name} — {item.priceStr}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECURITY ADD-ONS & SLA CALLOUT ──────────────────── */}
      <section style={{ background: isLight ? '#f1f5f9' : '#0d1117', borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Need a Custom Enterprise or Estate Rollout?</h3>
          <p style={{ fontSize: '14px', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
            We deploy complete physical and digital safety meshes for gated residential estates, corporate headquarters, schools, and armed patrol fleets with custom SLAs and API telemetry integrations.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="tel:0816738186"
              style={{
                background: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(0,230,118,0.3)',
                color: isLight ? '#0f172a' : '#00e676',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📞 Tel. 081 673 8186
            </a>
            <a
              href="tel:+27680079911"
              style={{
                background: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(14,165,233,0.3)',
                color: isLight ? '#0f172a' : '#0ea5e9',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📲 Cel. +27 68 007 9911
            </a>
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+SafetyLink+I+need+custom+enterprise+pricing"
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#15803d',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              💬 Enterprise WhatsApp (+27 68 007 9911)
            </a>
            <a
              href="mailto:info@safetylink.online"
              style={{
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                color: isLight ? '#1e293b' : '#f8fafc',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              ✉️ Email info@safetylink.online
            </a>
          </div>
        </div>
      </section>

      {/* ── CHECKOUT MODAL ───────────────────────────────────── */}
      {checkoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={() => setCheckoutModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: isLight ? '#64748b' : '#94a3b8',
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>
              {selectedHardware ? `Order ${selectedHardware.name}` : `Subscribe: ${selectedPlan?.name}`}
            </h3>
            <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '20px' }}>
              Secure payment processing via Paystack (ZAR) with automated WhatsApp fulfillment link.
            </p>

            <div style={{ background: isLight ? '#f8fafc' : '#020617', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: '10px', padding: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                <span>Item</span>
                <span>{selectedHardware ? selectedHardware.name : `${selectedPlan?.name} (${selectedPlan?.tier})`}</span>
              </div>
              {selectedHardware && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '10px' }}>
                  <span>Quantity</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setHardwareQty(q => Math.max(1, q - 1))}
                      style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #334155', background: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 700 }}>{hardwareQty}</span>
                    <button
                      onClick={() => setHardwareQty(q => q + 1)}
                      style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #334155', background: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, color: '#15803d', marginTop: '12px', paddingTop: '8px', borderTop: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                <span>Total Amount</span>
                <span>
                  R{selectedHardware ? selectedHardware.price * hardwareQty : selectedPlan?.priceNum}
                  {!selectedHardware && <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}> /mo</span>}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <input
                type="text"
                placeholder="Full Name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                  background: isLight ? '#ffffff' : '#020617',
                  color: 'inherit',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <input
                type="email"
                placeholder="Email Address (for receipts & dispatch)"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                  background: isLight ? '#ffffff' : '#020617',
                  color: 'inherit',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: isProcessing ? 'wait' : 'pointer',
                background: '#15803d',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'background .2s',
              }}
            >
              {isProcessing ? 'Connecting...' : 'Proceed to Payment →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
