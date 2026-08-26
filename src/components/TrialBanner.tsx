import React, { useState } from 'react';
import { useAppStore } from '../utils/store';

// Paystack payment page slugs — update these to your live Paystack payment links
const PAYSTACK_INDIVIDUAL = 'https://paystack.com/pay/safetylink-premium';
const PAYSTACK_ORG = 'https://paystack.com/pay/safetylink-organisation';

export const TrialBanner: React.FC = () => {
  const currentUser = useAppStore(s => s.currentUser);
  const currentOrg = useAppStore(s => s.currentOrg);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const subject = currentOrg || currentUser;
  const isOrg = !!currentOrg;
  if (!subject || subject.subscriptionStatus !== 'trial') return null;

  const TRIAL_DAYS = 14;
  const createdAt = (subject as any).createdAt || Date.now();
  const expiresAt = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = expiresAt - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  const urgent = daysLeft <= 3;

  const handleUpgrade = () => {
    const url = isOrg ? PAYSTACK_ORG : PAYSTACK_INDIVIDUAL;
    window.open(url, '_blank');
  };

  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono font-bold z-[9999] flex-shrink-0
      ${urgent
        ? 'bg-red-950/90 border-b border-red-500/50 text-red-300'
        : 'bg-amber-950/90 border-b border-amber-500/40 text-amber-300'
      }`}
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
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border transition-colors
            ${urgent
              ? 'border-red-400 text-red-200 hover:bg-red-500/20'
              : 'border-amber-400 text-amber-200 hover:bg-amber-500/20'
            }`}
        >
          Upgrade
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};
