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

  return (
    <div className="grid gap-4 md:grid-cols-2 my-6">
      <div className="rounded-2xl border border-emerald-700 bg-slate-950 p-5">
        <h3 className="font-bold text-emerald-400">Download SafetyLink (Stable)</h3>
        <p className="text-xs text-slate-400 mt-1">Version 1, the stable release. Recommended for everyone.</p>
        <p className="text-xs text-slate-500 mt-2">{v1 ? 'Version ' + v1.version + ' ' + mb(v1.size) : 'Latest version'}</p>
        <a className="inline-block mt-4 rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white" href={WORKER + '/download/safetylink.apk'}>Download</a>
      </div>
      <div className="rounded-2xl border border-amber-600 bg-slate-950 p-5">
        <h3 className="font-bold text-amber-400">SafetyLink Version 2 (Development)</h3>
        <p className="text-xs text-slate-400 mt-1">Newer features in progress. Adds to Version 1; does not replace it.</p>
        <p className="text-xs text-slate-500 mt-2">{v2 ? 'Build ' + v2.version + ' ' + mb(v2.size) : 'Build not published yet'}</p>
        <a className="inline-block mt-4 rounded bg-amber-600 px-4 py-2 text-sm font-bold text-white" href={WORKER + '/download/v2/safetylink.apk'}>Download Version 2</a>
      </div>
    </div>
  );
};
