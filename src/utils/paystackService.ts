// SafetyLink Secure Payment Gateway Payment Service
// Public key must be VITE_PAYSTACK_PUBLIC_KEY in environment
// NEVER put secret key (gqgynogxhcomh) in frontend code

export const PLANS = {
  individual_premium: { name: 'SafetyLink Premium', amount: 4900, description: 'Individual Premium — R49/mo' },
  individual_family:  { name: 'SafetyLink Family',  amount: 9900, description: 'Family Plan — R99/mo' },
  org_starter:        { name: 'SafetyLink Org Starter',      amount: 99900,  description: 'Organisation Starter — R999/mo' },
  org_professional:   { name: 'SafetyLink Org Professional', amount: 249900, description: 'Organisation Professional — R2,499/mo' },
  org_business:       { name: 'SafetyLink Org Business',     amount: 599900, description: 'Organisation Business — R5,999/mo' },
} as const;

export type PlanId = keyof typeof PLANS;

export async function openPaystackCheckout({
  planId,
  amount,
  planName,
  email,
  metadata = {},
  onSuccess,
  onClose,
}: {
  planId?: string | PlanId;
  amount?: number;
  planName?: string;
  email: string;
  metadata?: Record<string, any>;
  onSuccess?: (ref: string) => void;
  onClose?: () => void;
}) {
  const plan = planId && planId in PLANS ? PLANS[planId as PlanId] : { amount: amount || 0, name: planName || 'SafetyLink Subscription' };
  const totalAmount = plan.amount;

  // 1. Try backend server initialization first (Paystack official authorization URL)
  try {
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: totalAmount,
        planId: String(planId || 'CUSTOM'),
        metadata: {
          merchant_id: '26778541',
          planName: plan.name,
          ...metadata,
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.data?.authorization_url) {
        // Redirect to Paystack's official verified checkout screen
        window.location.href = data.data.authorization_url;
        return;
      }
    }
  } catch (err) {
    console.warn('Backend Paystack initialize error, attempting inline modal fallback:', err);
  }

  // 2. Fallback to client-side PaystackPop inline modal
  const PaystackPop = (window as any).PaystackPop;
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

  if (PaystackPop && key) {
    const handler = PaystackPop.setup({
      key,
      email,
      amount: totalAmount,
      currency: 'ZAR',
      ref: `SL-${String(planId || 'CUSTOM').toUpperCase()}-${Date.now()}`,
      label: plan.name,
      metadata: {
        merchant_id: '26778541',
        plan_id: planId,
        ...metadata,
      },
      callback: (transaction: any) => {
        onSuccess?.(transaction.reference);
      },
      onClose: () => {
        onClose?.();
      },
    });

    handler.openIframe();
    return;
  }

  // 3. User notification if no active Paystack keys are set up
  alert('Paystack payments are being configured. Please ensure VITE_PAYSTACK_PUBLIC_KEY or PAYSTACK_SECRET_KEY is provided in settings.');
}
