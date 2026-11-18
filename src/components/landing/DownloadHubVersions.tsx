import React, { useEffect, useState } from 'react';

const WORKER = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

type Entry = { version: string; size?: number; date?: string };

/** Download hub: Version 1 (stable) and Version 1.1 Beta only. */
export const DownloadHubVersions: React.FC = () => {
  const [v1, setV1] = useState<Entry | null>(null);

  useEffect(() => {
    fetch(WORKER + '/api/app/versions').then(r => r.json()).then(j => setV1((j.versions || [])[0] || null)).catch(() => {});
  }, []);

  const card = (title: string, note: string, href: string, label: string, colour: string, extra: string) => (
    <div className={`rounded-2xl border ${colour} bg-white p-5 shadow-sm`}>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 mt-1">{note}</p>
      <p className="text-xs text-emerald-700 font-mono mt-2">{extra}</p>
      <a className="inline-block mt-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors" href={href}>{label}</a>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 my-6">
      {card('SafetyLink Version 1 (Stable)', 'Verified production build recommended for households, estates, and responders.', WORKER + '/download/safetylink.apk', 'Download Version 1 APK', 'border-emerald-200', v1 ? 'Version ' + v1.version : 'Production Channel')}
      {card('SafetyLink Version 1.1 Beta', 'Testing release with upcoming features before promotion to Version 1.', WORKER + '/download/beta/safetylink.apk', 'Download Version 1.1 Beta', 'border-amber-200', 'Beta Channel')}
    </div>
  );
};

/** Older versions line, shown under the download cards. */
export const OlderVersionsLine: React.FC = () => (
  <p className="text-sm text-slate-600 mt-4">
    Production channel: <a className="underline text-emerald-700" href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk">SafetyLink Version 1 (APK)</a>
  </p>
);

