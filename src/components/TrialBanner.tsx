import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { openPaystackCheckout } from '../utils/paystackService';
import type { PlanId } from '../utils/paystackService';

export const TrialBanner: React.FC = () => {
  const currentUser = useAppStore(s => s.currentUser);
  const currentOrg = useAppStore(s => s.currentOrg);
  const [dismissed, setDismissed] = useState(false);
  const [paying, setPaying] = useState(false);

  if (dismissed) return null;

  const subject = currentOrg || currentUser;
  const isOrg = !!currentOrg;
  if (!subject || subject.subscriptionStatus !== 'trial') return null;

  const TRIAL_DAYS = 14;
  const createdAt = (subject as any).createdAt || Date.now();
  const expiresAt = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
  const urgent = daysLeft <= 3;

  const handleUpgrade = () => {
    const email = currentUser?.email || 'customer@safetylink.online';
    const planId: PlanId = isOrg ? 'org_starter' : 'individual_premium';
    setPaying(true);
    openPaystackCheckout({
      planId,
      email,
      metadata: { org_code: currentOrg?.id || '', user_id: currentUser?.id || '' },
      onSuccess: (ref) => {
        setPaying(false);
        alert(`Payment successful! Ref: ${ref}\nYour subscription is now active.`);
      },
      onClose: () => setPaying(false),
    });
  };

  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono font-bold z-[9999] flex-shrink-0
      ${urgent ? 'bg-red-950/90 border-b border-red-500/50 text-red-300'
               : 'bg-amber-950/90 border-b border-amber-500/40 text-amber-300'}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span>{urgent ? '🔴' : '⚡'}</span>
        <span className="truncate">
          {daysLeft > 0
            ? `TRIAL — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
            : 'TRIAL EXPIRED — upgrade to continue'}
        </span>
        {isOrg && <span className="opacity-60 hidden sm:inline truncate">· {currentOrg?.name}</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleUpgrade}
          disabled={paying}
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border transition-colors disabled:opacity-50
            ${urgent ? 'border-red-400 text-red-200 hover:bg-red-500/20'
                     : 'border-amber-400 text-amber-200 hover:bg-amber-500/20'}`}
        >
          {paying ? '...' : 'Upgrade'}
        </button>
        <button onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100 transition-opacity text-base leading-none">×</button>
      </div>
    </div>
  );
};
