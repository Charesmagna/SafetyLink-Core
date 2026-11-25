import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';

interface WebAdSlotProps {
  slotId?: string;
  label?: string;
  className?: string;
}

/**
 * Non-emergency, Web-only Google AdSense container.
 * Strictly disabled:
 *  - inside native Android/iOS APKs (Capacitor.isNativePlatform())
 *  - during any active SOS or countdown state
 *  - for organization / enterprise / super-admin accounts
 */
export const WebAdSlot: React.FC<WebAdSlotProps> = ({
  slotId = 'auto',
  label = 'Sponsored Community Partner',
  className = '',
}) => {
  const activeSOSState = useAppStore((s) => s.activeSOSState);
  const panicCountdown = useAppStore((s) => s.panicCountdown);
  const currentOrg = useAppStore((s) => s.currentOrg);
  const currentUser = useAppStore((s) => s.currentUser);
  const superAdminActive = useAppStore((s) => s.superAdminActive);
  const pushedRef = useRef(false);

  const isNative = Capacitor.isNativePlatform();
  const isEmergencyActive = activeSOSState !== 'IDLE' || panicCountdown !== null;
  const isPaidOrOrg = Boolean(
    currentOrg ||
    superAdminActive ||
    currentUser?.orgCode ||
    currentUser?.subscriptionStatus === 'active'
  );

  useEffect(() => {
    if (isNative || isEmergencyActive || isPaidOrOrg || pushedRef.current) return;
    try {
      const w = window as any;
      if (Array.isArray(w.adsbygoogle)) {
        w.adsbygoogle.push({});
        pushedRef.current = true;
      }
    } catch {
      // AdSense script blocked or not yet loaded — fail silently, never affect app
    }
  }, [isNative, isEmergencyActive, isPaidOrOrg]);

  if (isNative || isEmergencyActive || isPaidOrOrg) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-3 text-center overflow-hidden ${className}`}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </div>
      <ins
        className="adsbygoogle block min-h-[90px]"
        data-ad-client="ca-pub-9698872193899450"
        data-ad-slot={slotId === 'auto' ? undefined : slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};

export default WebAdSlot;
