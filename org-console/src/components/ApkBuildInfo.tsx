import React, { useEffect, useState } from 'react';

const WORKER = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

export interface ChannelBuild { version: string; build: number | null; date: string | null; size: number | null; }
export interface ApkChannels { stable: ChannelBuild | null; testing: ChannelBuild | null; relation: string; }

let cached: ApkChannels | null = null;
let pending: Promise<ApkChannels | null> | null = null;

function loadChannels(): Promise<ApkChannels | null> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = fetch(WORKER + '/api/app/channels')
      .then((r) => (r.ok ? (r.json() as Promise<ApkChannels>) : null))
      .then((j) => { cached = j; return j; })
      .catch(() => null)
      .then((j) => { pending = null; return j; });
  }
  return pending;
}

export function useApkChannels(): ApkChannels | null {
  const [data, setData] = useState<ApkChannels | null>(cached);
  useEffect(() => {
    let alive = true;
    loadChannels().then((j) => { if (alive && j) setData(j); });
    return () => { alive = false; };
  }, []);
  return data;
}

const day = (d: string | null) => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface Props { variant?: 'full' | 'compact' | 'tiny'; tone?: 'auto' | 'dark'; className?: string; }

/** Shows the Stable (V1) and Testing build numbers next to every APK download button. */
export const ApkBuildInfo: React.FC<Props> = ({ variant = 'full', tone = 'auto', className = '' }) => {
  const ch = useApkChannels();
  if (!ch || !ch.stable) return null;
  const s = ch.stable;
  const t = ch.testing;
  if (variant === 'tiny') return <span className={`font-mono opacity-80 ${className}`}>v{s.version}</span>;

  const green = tone === 'dark' ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-400';
  const amber = tone === 'dark' ? 'text-amber-400' : 'text-amber-700 dark:text-amber-400';
  const muted = tone === 'dark' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400';

  if (variant === 'compact') {
    return (
      <span className={`block text-[10px] font-mono leading-snug ${className}`}>
        <span className={`font-bold ${green}`}>STABLE V1</span> · v{s.version}
        {t ? <> · <span className={`font-bold ${amber}`}>TESTING</span> v{t.version}</> : null}
        {ch.relation === 'same' ? <span className={amber}> · same build, untested</span> : null}
      </span>
    );
  }

  const note =
    ch.relation === 'same'
      ? `Stable and Testing are the same build (v${s.version}) - newly pushed, not tested separately yet.`
      : ch.relation === 'testing-ahead' && t
        ? `Testing (v${t.version}) is ahead of Stable - still being tested.`
        : ch.relation === 'testing-behind'
          ? 'Testing channel is behind Stable.'
          : '';

  return (
    <div className={`text-[11px] font-mono leading-relaxed ${className}`}>
      <div><span className={`font-bold ${green}`}>STABLE V1</span> · v{s.version} · build {s.build ?? '-'}{s.date ? ` · ${day(s.date)}` : ''}</div>
      {t ? <div><span className={`font-bold ${amber}`}>TESTING</span> · v{t.version} · build {t.build ?? '-'}{t.date ? ` · ${day(t.date)}` : ''}</div> : <div className={muted}>No separate testing build right now.</div>}
      {note ? <div className={muted}>{note}</div> : null}
    </div>
  );
};

export default ApkBuildInfo;
