import React, { useEffect, useState } from 'react';

const WORKER = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

type Entry = { version: string; size?: number; date?: string };

const mb = (n?: number) => (n ? `${(n / 1048576).toFixed(1)} MB` : '');

type CardProps = {
  colour: string; icon: string; badge: string; title: string; sub: string; desc: string;
  meta: string; href: string; label: string;
};

const Card: React.FC<CardProps> = ({ colour, icon, badge, title, sub, desc, meta, href, label }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${colour}40`, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: '16px', right: '16px', background: `${colour}26`, color: colour, border: `1px solid ${colour}4d`, fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '999px', letterSpacing: '.08em' }}>
      {badge}
    </div>
    <div style={{ fontSize: '2.5rem' }}>{icon}</div>
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{title}</h3>
      <p style={{ fontSize: '12px', color: colour, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{sub}</p>
    </div>
    <p style={{ fontSize: '13px', color: '#8892a4', lineHeight: 1.6, flex: 1 }}>{desc}</p>
    {meta && <p style={{ fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono',monospace" }}>{meta}</p>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <a
        href={href}
        download
        style={{ background: `${colour}26`, color: colour, border: `1px solid ${colour}66`, fontWeight: 800, fontSize: '12px', letterSpacing: '.06em', padding: '14px 20px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <span>⬇️</span> {label}
      </a>
    </div>
  </div>
);

/** Download hub: SafetyLink Version 1 (stable) and Version 1 Beta, styled like the PWA and EXE cards. */
export const DownloadHubVersions: React.FC = () => {
  const [v1, setV1] = useState<Entry | null>(null);

  useEffect(() => {
    fetch(WORKER + '/api/app/versions').then(r => r.json()).then(j => setV1((j.versions || [])[0] || null)).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', margin: '24px 0' }}>
      <Card
        colour="#34d399" icon="📱" badge="STABLE"
        title="SafetyLink Version 1" sub="Android APK · Stable"
        desc="The tested, recommended version. Works for everyone, with native calls, SMS, WhatsApp when set, and the iTAG."
        meta={v1 ? `Version ${v1.version}${v1.size ? ' · ' + mb(v1.size) : ''}` : ''}
        href={`${WORKER}/download/safetylink.apk`} label="DOWNLOAD VERSION 1 (APK)"
      />
      <Card
        colour="#f59e0b" icon="🧪" badge="BETA"
        title="SafetyLink Version 1 Beta" sub="Android APK · Testing"
        desc="The newest changes, still being tested. Expect rough edges. Use this to help us find problems."
        meta="Work in progress"
        href={`${WORKER}/download/beta/safetylink.apk`} label="DOWNLOAD BETA (APK)"
      />
    </div>
  );
};
