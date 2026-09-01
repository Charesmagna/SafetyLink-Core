// SafetyLink Paystack Payment Service
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

export function openPaystackCheckout({
  planId,
  email,
  metadata = {},
  onSuccess,
  onClose,
}: {
  planId: PlanId;
  email: string;
  metadata?: Record<string, any>;
  onSuccess?: (ref: string) => void;
  onClose?: () => void;
}) {
  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) {
    alert('Payment system failed to load. Please refresh and try again.');
    return;
  }

  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  if (!key) {
    // Fallback: open Paystack payment page directly
    window.open('https://paystack.com/pay/safetylink', '_blank');
    return;
  }

  const plan = PLANS[planId];
  const handler = PaystackPop.setup({
    key,
    email,
    amount: plan.amount,
    currency: 'ZAR',
    ref: `SL-${planId.toUpperCase()}-${Date.now()}`,
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
}
