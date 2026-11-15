import React from 'react';

interface Props {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
  navigate?: (p: string) => void;
}

export function DownloadPage(_props: Props) {
  return (
    <div style={{ background: 'transparent', color: '#f0f4f8', fontFamily: "'Inter',system-ui,sans-serif", minHeight: '100vh' }}>
      
      {/* ── HEADER ── */}
      <section style={{ padding: '80px 40px 60px', background: 'rgba(7,10,15,0.65)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#00e676', marginBottom: '16px' }}>
            // OFFICIAL DOWNLOAD HUB · SECURE DISTRIBUTION
          </div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: .95, marginBottom: '20px' }}>
            Deploy SafetyLink.<br />
            <span style={{ color: '#00e676', fontStyle: 'italic' }}>Verified native software packages.</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#8892a4', maxWidth: '640px', lineHeight: 1.7, marginBottom: '24px' }}>
            Choose the official Version 1 stable Android release, the separate Version 1 Beta testing build, or the supported desktop and web options.
            All production builds are compiled with hardware BLE listeners, background keepalive workers, and sequential SOS dispatch.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', color: '#00e676', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e676', display: 'inline-block' }}></span>
              SHA-256 SIGNED BINARIES
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
              HIGH-CAPACITY COMPLETE BUILDS (&gt; 80MB)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
              ZERO THIRD-PARTY TRACKERS
            </span>
          </div>
        </div>
      </section>

      {/* ── PRIMARY CHANNELS (CARDS) ── */}
      <section style={{ padding: '60px 40px', background: 'rgba(13,17,23,0.65)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#e8321e', marginBottom: '16px' }}>
            // RECOMMENDED TARGET ARCHITECTURES
          </div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, marginBottom: '36px' }}>
            Choose Your Release Channel
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Android APK */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                OFFICIAL MOBILE
              </div>
              <div style={{ fontSize: '2.5rem' }}>📱</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Download SafetyLink Version 1 (Stable)</h3>
                <p style={{ fontSize: '12px', color: '#00e676', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  Official stable release · Version 1
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#8892a4', lineHeight: 1.6, flex: 1 }}>
                The stable Version 1 Android release. Recommended for everyday use. Includes the currently released SafetyLink functionality.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk"
                  download
                  style={{
                    background: '#00e676',
                    color: '#020617',
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
                    boxShadow: '0 4px 16px rgba(0,230,118,0.25)',
                    transition: 'opacity .2s',
                  }}
                >
                  <span>⬇️</span> DOWNLOAD VERSION 1 (APK)
                </a>
              </div>
            </div>


            {/* Windows Control Room */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                DESKTOP COMMAND
              </div>
              <div style={{ fontSize: '2.5rem' }}>💻</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Windows Dispatch EXE</h3>
                <p style={{ fontSize: '12px', color: '#0ea5e9', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  Control Room & Security Desk Application
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#8892a4', lineHeight: 1.6, flex: 1 }}>
                High-capacity multi-screen command console for security control rooms, estate managers, and dispatch centers. Operates with local offline GIS map caching.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(14,165,233,0.15)',
                    color: '#0ea5e9',
                    border: '1px solid rgba(14,165,233,0.4)',
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
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', fontFamily: "'JetBrains Mono',monospace" }}>
                UNIVERSAL WEB
              </div>
              <div style={{ fontSize: '2.5rem' }}>🌐</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Progressive Web App</h3>
                <p style={{ fontSize: '12px', color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  iOS Safari · Android Chrome · Desktop Edge
                </p>
              </div>
              <p style={{ fontSize: '13px', color: '#8892a4', lineHeight: 1.6, flex: 1 }}>
                Instant deployment directly inside any modern browser. Supports offline service workers, local audio alarm playback, and home screen installation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="https://safetylink.online"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(167,139,250,0.15)',
                    color: '#a78bfa',
                    border: '1px solid rgba(167,139,250,0.4)',
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
                  <span>🌐</span> LAUNCH WEB APP (PWA)
                </a>
              </div>
            </div>
          </div>
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
