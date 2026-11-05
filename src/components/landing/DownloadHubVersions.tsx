import React, { useEffect, useState } from 'react';

const WORKER = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

type Entry = { version: string; size?: number; date?: string };

/** Download hub: SafetyLink (stable, version 1) and SafetyLink Version 2 (development). */
export const DownloadHubVersions: React.FC = () => {
  const [v1, setV1] = useState<Entry | null>(null);
  const [v2, setV2] = useState<Entry | null>(null);

  useEffect(() => {
    fetch(WORKER + '/api/app/versions').then(r => r.json()).then(j => setV1((j.versions || [])[0] || null)).catch(() => {});
    fetch(WORKER + '/api/app/v2/versions').then(r => r.json()).then(j => setV2((j.versions || [])[0] || null)).catch(() => {});
  }, []);

  const mb = (n?: number) => (n ? (n / 1048576).toFixed(1) + ' MB' : '');

  const card = (title: string, note: string, href: string, label: string, colour: string, extra: string) => (
    <div className={`rounded-2xl border ${colour} bg-slate-950 p-5`}>
      <h3 className="font-bold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 mt-1">{note}</p>
      <p className="text-xs text-slate-500 mt-2">{extra}</p>
      <a className="inline-block mt-4 rounded bg-slate-700 px-4 py-2 text-sm font-bold text-white" href={href}>{label}</a>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-3 my-6">
      {card('SafetyLink 2.0 (Stable)', 'Latest tested version. Recommended for everyone.', WORKER + '/download/safetylink.apk', 'Download stable', 'border-emerald-700', v1 ? 'Version ' + v1.version : '')}
      {card('SafetyLink 1.x (Legacy)', 'Older version, kept for anyone who needs it.', WORKER + '/download/v1/safetylink.apk', 'Download 1.x', 'border-slate-700', 'Older release')}
      {card('SafetyLink Beta (Testing)', 'Newest changes, still being tested. Expect rough edges.', WORKER + '/download/beta/safetylink.apk', 'Download beta', 'border-amber-600', 'Work in progress')}
    </div>
  );
};

/** Older versions line, shown under the download cards. */
export const OlderVersionsLine: React.FC = () => (
  <p className="text-sm text-slate-400 mt-4">
    Older versions: <a className="underline" href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk">SafetyLink 1.x (legacy)</a>
  </p>
);
