import React from 'react';

const WORKER = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

/** Public download choices: stable Version 1 and the separate Version 1 Beta testing channel. */
export const DownloadHubVersions: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2 my-6">
    <div className="rounded-2xl border border-emerald-700 bg-slate-950 p-5">
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Stable release</span>
      <h3 className="mt-2 font-bold text-slate-100">SafetyLink Version 1</h3>
      <p className="mt-1 text-xs text-slate-400">The official stable release recommended for everyday use.</p>
      <a className="mt-4 inline-block rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white" href={WORKER + '/download/safetylink.apk'}>Download Version 1</a>
    </div>
    <div className="rounded-2xl border border-amber-600 bg-slate-950 p-5">
      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Development · Testing only</span>
      <h3 className="mt-2 font-bold text-slate-100">SafetyLink Version 1 Beta</h3>
      <p className="mt-1 text-xs text-slate-400">The separate development build for testing changes before stable release approval.</p>
      <a className="mt-4 inline-block rounded bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950" href={WORKER + '/download/beta/safetylink.apk'}>Download Version 1 Beta</a>
    </div>
  </div>
);

/** Legacy versions are intentionally not promoted as current download choices. */
export const OlderVersionsLine: React.FC = () => null;
