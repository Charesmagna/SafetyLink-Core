import React from 'react';
import { useAppStore } from '../utils/store';

export const TrialBanner: React.FC = () => {
  const currentUser = useAppStore(s => s.currentUser);
  const currentOrg = useAppStore(s => s.currentOrg);
  const adminUpdateSubscription = useAppStore(s => s.adminUpdateSubscription);

  // Determine trial subject
  const subject = currentOrg || currentUser;
  const isOrg = !!currentOrg;
  if (!subject || subject.subscriptionStatus !== 'trial') return null;

  // Calculate days remaining (trial = 14 days from createdAt)
  const TRIAL_DAYS = 14;
  const createdAt = (subject as any).createdAt || Date.now();
  const expiresAt = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = expiresAt - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  const urgent = daysLeft <= 3;

  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono font-bold z-[9999]
      ${urgent
        ? 'bg-red-950/90 border-b border-red-500/50 text-red-300'
        : 'bg-amber-950/90 border-b border-amber-500/40 text-amber-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{urgent ? '🔴' : '⚡'}</span>
        <span>
          {daysLeft > 0
            ? `TRIAL — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
            : 'TRIAL EXPIRED — upgrade to continue'}
        </span>
        {isOrg && <span className="opacity-60">· {currentOrg?.name}</span>}
      </div>
      <a
        href="https://wa.me/27739441222?text=I+want+to+upgrade+my+SafetyLink+subscription"
        target="_blank"
        rel="noreferrer"
        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border transition-colors
          ${urgent
            ? 'border-red-400 text-red-200 hover:bg-red-500/20'
            : 'border-amber-400 text-amber-200 hover:bg-amber-500/20'
          }`}
      >
        Upgrade
      </a>
    </div>
  );
};
