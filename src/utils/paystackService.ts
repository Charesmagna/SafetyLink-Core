// SafetyLink Secure Paystack Payment Service
// Public browser key must be supplied via VITE_PAYSTACK_PUBLIC_KEY; secret keys remain server-side only.
import { useAppStore } from './store';

export const PLANS = {
  individual_premium: { name: 'SafetyLink Premium', amount: 4900, description: 'Individual Premium — R49/mo' },
  individual_family:  { name: 'SafetyLink Family',  amount: 9900, description: 'Family Plan — R99/mo' },
  org_starter:        { name: 'SafetyLink Org Starter',      amount: 99900,  description: 'Organisation Starter — R999/mo' },
  org_professional:   { name: 'SafetyLink Org Professional', amount: 249900, description: 'Organisation Professional — R2,499/mo' },
  org_business:       { name: 'SafetyLink Org Business',     amount: 599900, description: 'Organisation Business — R5,999/mo' },
} as const;

export type PlanId = keyof typeof PLANS;

function getBillingBaseUrls(): string[] {
  const custom = (useAppStore.getState().customBackendUrl || '').trim().replace(/\/+$/, '');
  const list = [
    custom ? `${custom}/api/paystack/initialize` : '',
    'https://api.safetylink.online/api/paystack/initialize',
    '/api/paystack/initialize',
  ].filter(Boolean);
  return Array.from(new Set(list));
}

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
  const store = useAppStore.getState();
  const plan =
    planId && planId in PLANS
      ? PLANS[planId as PlanId]
      : { amount: Math.max(4900, amount || 4900), name: planName || 'SafetyLink Subscription' };
  const totalAmount = Math.max(4900, plan.amount);
  const userId = metadata.userId || store.currentUser?.id || '';
  const orgId = metadata.orgId || store.currentOrg?.id || '';

  // 1. Server-initialized Paystack checkout (preferred — keeps all secret keys server-side)
  for (const endpoint of getBillingBaseUrls()) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: totalAmount,
          planId: String(planId || 'individual_premium'),
          userId,
          orgId,
          metadata: {
            planName: plan.name,
            userId,
            orgId,
            ...metadata,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.authorization_url) {
          window.location.href = data.data.authorization_url;
          return;
        }
      }
    } catch {
      // Try next configured endpoint
    }
  }

  // 2. Fallback to client-side PaystackPop inline modal when VITE_PAYSTACK_PUBLIC_KEY is configured
  const PaystackPop = (window as any).PaystackPop;
  const publicKey = String(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '').trim();

  if (PaystackPop && publicKey) {
    const handler = PaystackPop.setup({
      key: publicKey,
      email,
      amount: totalAmount,
      currency: 'ZAR',
      ref: `SL-${String(planId || 'CUSTOM').toUpperCase()}-${Date.now()}`,
      label: plan.name,
      metadata: {
        plan_id: planId,
        userId,
        orgId,
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

  // 3. Clean in-app toast notification (never window.alert)
  store.addToast(
    'Paystack checkout is not configured yet on this server. Please verify live Paystack credentials or use PayFast.',
    'warn'
  );
}
