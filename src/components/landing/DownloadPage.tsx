import React, { useState, useEffect } from 'react';
import { ASSETS } from '../../utils/cloudinary';

interface Props {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
  navigate?: (p: string) => void;
}

interface ReleaseItem {
  version: string;
  name: string;
  publishedAt: string;
  sizeMb: string;
  apkUrl: string;
  exeUrl?: string;
  isLatest?: boolean;
}

export function DownloadPage({ onLogin, onRegisterUser, onRegisterOrg, navigate }: Props) {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestRelease, setLatestRelease] = useState<ReleaseItem | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const xhr = new XMLHttpRequest();
    // Fetch recent releases
    xhr.open('GET', 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=35', true);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.timeout = 10000;
    xhr.onload = () => {
      try {
        const rawList = JSON.parse(xhr.responseText);
        if (Array.isArray(rawList)) {
          // Strictly filter for high-capacity, fully-compiled APK releases (file size > 80 MB)
          // to ensure zero incomplete builds or stripped stubs are shown to users.
          const qualified: ReleaseItem[] = [];

          rawList.forEach((r, idx) => {
            if (!r.assets || !Array.isArray(r.assets)) return;
            const apkAsset = r.assets.find((a: any) => a.name && a.name.endsWith('.apk') && a.size > 80 * 1024 * 1024);
            const exeAsset = r.assets.find((a: any) => a.name && a.name.endsWith('.exe'));

            if (apkAsset) {
              qualified.push({
                version: r.tag_name || 'latest',
                name: r.name || `SafetyLink Core ${r.tag_name}`,
                publishedAt: r.published_at ? new Date(r.published_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Verified Build',
                sizeMb: (apkAsset.size / (1024 * 1024)).toFixed(1),
                apkUrl: apkAsset.browser_download_url,
                exeUrl: exeAsset?.browser_download_url,
                isLatest: idx === 0,
              });
            }
          });

          if (qualified.length > 0) {
            setReleases(qualified);
            setLatestRelease(qualified[0]);
          } else {
            // High reliability fallback served directly from Cloudflare R2 Worker
            const fallback: ReleaseItem = {
              version: 'v2.0 (Latest Signed)',
              name: 'SafetyLink Version 2 (Signed Android APK)',
              publishedAt: 'Verified Release',
              sizeMb: '100.5',
              apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk',
              isLatest: true,
            };
            setReleases([fallback]);
            setLatestRelease(fallback);
          }
        }
      } catch (e) {
        console.warn('Error reading release list:', e);
      }
      setLoading(false);
    };
    xhr.onerror = () => setLoading(false);
    xhr.ontimeout = () => setLoading(false);
    xhr.send();
  }, []);

  const filteredReleases = releases.filter(r => 
    r.version.toLowerCase().includes(searchFilter.toLowerCase()) || 
    r.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const v2ApkUrl = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk';
  const v2ExeUrl = latestRelease?.exeUrl || 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest';

  return (
    <div style={{ background: '#070a0f', color: '#f0f4f8', fontFamily: "'Inter',system-ui,sans-serif", minHeight: '100vh' }}>
      
      {/* ── HEADER ── */}
      <section style={{ padding: '80px 40px 60px', background: '#ffffff', borderBottom: '1px solid #d1fae5' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', color: '#0f172a' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#059669', marginBottom: '16px', fontWeight: 700 }}>
            // OFFICIAL DOWNLOAD HUB · SECURE DISTRIBUTION
          </div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: .95, marginBottom: '20px', color: '#0f172a' }}>
            Deploy SafetyLink.<br />
            <span style={{ color: '#059669', fontStyle: 'italic' }}>Version 2 &amp; verified packages.</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', lineHeight: 1.7, marginBottom: '24px' }}>
            Direct access to SafetyLink Version 2 (with zero-airtime Please Call Me relay, POPIA compliance, and BLE iTAG support), Version 1 legacy Android builds, and Windows Dispatch Control Room packages.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', color: '#059669', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
              SIGNED ANDROID BUILDS
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', color: '#475569', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
              SAFETYLINK VERSION 2 &amp; VERSION 1
            </span>
          </div>
        </div>
      </section>

      {/* ── PRIMARY CHANNELS (CARDS) ── */}
      <section style={{ padding: '60px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', color: '#0f172a' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#059669', marginBottom: '16px', fontWeight: 700 }}>
            // AVAILABLE CHANNELS
          </div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, marginBottom: '36px', color: '#0f172a' }}>
            SafetyLink Releases
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {/* SafetyLink Version 2 (Latest Official APK) */}
            <div style={{ background: '#ffffff', border: '2px solid #059669', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(5,150,105,0.12)' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#059669', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                VERSION 2 · NEW
              </div>
              <div style={{ fontSize: '2.5rem' }}>🛡️</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px', color: '#0f172a' }}>SafetyLink Version 2</h3>
                <p style={{ fontSize: '12px', color: '#059669', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  {latestRelease?.version || 'v2.0'} · Signed Android APK
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, flex: 1 }}>
                Next-generation SafetyLink Android APK with Zero-Airtime Please Call Me relay (Rain SIM + SMSGate), durable retry queues, BLE iTAG monitoring, native SMS/Call dispatch, and POPIA compliance.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={v2ApkUrl}
                  download
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '.06em',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(5,150,105,0.25)',
                  }}
                >
                  <span>⬇️</span> DOWNLOAD VERSION 2 (APK)
                </a>
              </div>
            </div>

            {/* Version 1 Legacy Stable APK */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 6px 24px rgba(15,23,42,0.05)' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                VERSION 1 (LEGACY)
              </div>
              <div style={{ fontSize: '2.5rem' }}>📱</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: '#0f172a' }}>SafetyLink Version 1</h3>
                <p style={{ fontSize: '12px', color: '#475569', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  v1.0 · Classic Production Android APK
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, flex: 1 }}>
                Classic Version 1 production Android APK for existing deployments running foreground keepalive, iTAG keyfobs, and home screen widgets.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk"
                  download
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '.06em',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⬇️</span> DOWNLOAD VERSION 1 (APK)
                </a>
              </div>
            </div>

            {/* Windows Control Room */}
            <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', boxShadow: '0 6px 24px rgba(14,165,233,0.06)' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                DESKTOP COMMAND
              </div>
              <div style={{ fontSize: '2.5rem' }}>💻</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: '#0f172a' }}>Windows Dispatch EXE</h3>
                <p style={{ fontSize: '12px', color: '#0284c7', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  Control Room &amp; Security Desk Application
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, flex: 1 }}>
                High-capacity multi-screen command console for security control rooms, estate managers, and dispatch centers. Operates with local offline GIS map caching.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={v2ExeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '.06em',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>💻</span> GET WINDOWS COMMAND DECK
                </a>
              </div>
            </div>

            {/* Instant PWA */}
            <div style={{ background: '#ffffff', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', boxShadow: '0 6px 24px rgba(124,58,237,0.06)' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                UNIVERSAL WEB
              </div>
              <div style={{ fontSize: '2.5rem' }}>🌐</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: '#0f172a' }}>Progressive Web App</h3>
                <p style={{ fontSize: '12px', color: '#7c3aed', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  iOS Safari · Android Chrome · Desktop Edge
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, flex: 1 }}>
                Instant deployment directly inside any modern browser. Supports offline service workers, local audio alarm playback, and home screen installation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => onLogin?.()}
                  style={{
                    background: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '.06em',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🌐</span> LAUNCH WEB APP (PWA)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTERED HIGH-CAPACITY RELEASES CATALOGUE ── */}
      <section style={{ padding: '60px 40px', background: '#070a0f', color: '#f0f4f8' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#00e676', marginBottom: '10px' }}>
                // VERIFIED PRODUCTION ARCHIVE
              </div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900 }}>
                High-Capacity Release Catalog
              </h2>
              <p style={{ fontSize: '13px', color: '#8892a4', marginTop: '6px' }}>
                Showing only verified production APKs compiled with complete background services (&gt; 80 MB).
              </p>
            </div>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search releases (e.g. v1.1.9)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8892a4' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(0,230,118,0.2)', borderTopColor: '#00e676', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px' }}>Loading verified release manifest...</p>
            </div>
          ) : filteredReleases.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#8892a4', fontSize: '14px' }}>No production releases matching "{searchFilter}".</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredReleases.map((rel, idx) => (
                <div
                  key={rel.version + idx}
                  style={{
                    background: rel.isLatest ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)',
                    border: rel.isLatest ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: rel.isLatest ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      📦
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>{rel.name}</span>
                        {rel.isLatest && (
                          <span style={{ background: '#00e676', color: '#020617', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            LATEST STABLE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8892a4', fontFamily: "'JetBrains Mono',monospace", marginTop: '2px' }}>
                        Released: {rel.publishedAt} · Size: {rel.sizeMb} MB · Signed Package
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <a
                      href={rel.apkUrl}
                      download
                      style={{
                        background: rel.isLatest ? '#00e676' : 'rgba(255,255,255,0.08)',
                        color: rel.isLatest ? '#020617' : '#f0f4f8',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '.05em',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: "'JetBrains Mono',monospace",
                        transition: 'opacity .15s',
                      }}
                    >
                      <span>⬇️</span> DOWNLOAD APK
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── INSTALLATION INSTRUCTIONS ── */}
      <section style={{ padding: '60px 40px', background: '#0d1117', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#0ea5e9', marginBottom: '16px' }}>
            // INSTALLATION GUIDE
          </div>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, marginBottom: '24px' }}>
            How to Install SafetyLink on Android
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { step: '01', title: 'Download APK', desc: 'Tap the Download Official APK button above on your Android smartphone.' },
              { step: '02', title: 'Allow Unknown Apps', desc: 'If prompted by Chrome or your file manager, enable "Allow from this source".' },
              { step: '03', title: 'Tap Install', desc: 'Open the downloaded package and tap Install to complete setup.' },
              { step: '04', title: 'Grant Permissions', desc: 'Grant Location (Always) and Bluetooth to allow emergency beacon monitoring.' },
            ].map((s) => (
              <div key={s.step} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', padding: '24px', borderRadius: '12px' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: 900, color: '#0ea5e9', marginBottom: '8px' }}>
                  {s.step}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{s.title}</h4>
                <p style={{ fontSize: '12px', color: '#8892a4', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '36px', padding: '20px 24px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>Need technical assistance deploying to an enterprise fleet?</p>
              <p style={{ fontSize: '11px', color: '#8892a4', marginTop: '2px' }}>Our technical team supports MDM deployment, custom APK branding, and secure hardware pairing.</p>
            </div>
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+need+help+installing+SafetyLink"
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#0ea5e9',
                color: '#020617',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                textDecoration: 'none',
                letterSpacing: '.05em',
              }}
            >
              CHAT WITH SUPPORT →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
