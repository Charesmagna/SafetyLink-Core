import fs from 'fs';

const path = 'src/components/landing/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add state for releases
if (!content.includes('const [releases, setReleases]')) {
  content = content.replace(
    'const [mobileMenuOpen, setMobileMenuOpen] = useState(false);',
    'const [mobileMenuOpen, setMobileMenuOpen] = useState(false);\n  const [releases, setReleases] = useState<any[]>([]);\n  const [latestApkUrl, setLatestApkUrl] = useState<string>("");\n  const [latestExeUrl, setLatestExeUrl] = useState<string>("");\n'
  );
}

// Add fetch in useEffect
if (!content.includes('fetch(\'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases\')')) {
  const fetchEffect = `
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases');
        if (res.ok) {
          const data = await res.json();
          setReleases(data);
          if (data.length > 0) {
            const latest = data[0];
            const apkAsset = latest.assets?.find((a: any) => a.name.endsWith('.apk'));
            const exeAsset = latest.assets?.find((a: any) => a.name.endsWith('.exe'));
            if (apkAsset) setLatestApkUrl(apkAsset.browser_download_url);
            if (exeAsset) setLatestExeUrl(exeAsset.browser_download_url);
          }
        }
      } catch (e) {
        console.error('Failed to fetch releases', e);
      }
    };
    fetchReleases();
  }, []);
`;
  content = content.replace(
    'const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);',
    'const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);\n' + fetchEffect
  );
}

// Update the download section
const downloadSectionOld = `<div className="dl-grid">
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="Android App Preview"/>
              <div className="dl-title">Android APK</div>
              <div className="dl-sub">Minimum Android 8.0. Bluetooth LE required for iTAG functionality.</div>
              <a href="https://wa.me/27739441222?text=I+want+the+SafetyLink+APK" target="_blank" rel="noreferrer" className="dl-btn-link apk">Request on WhatsApp</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Windows Command Deck"/>
              <div className="dl-title">Windows EXE</div>
              <div className="dl-sub">SafetyLink Command Deck desktop app. Requires SL-ORG-XXXX access code.</div>
              <a href="https://wa.me/27739441222?text=I+want+the+SafetyLink+EXE" target="_blank" rel="noreferrer" className="dl-btn-link exe">Request on WhatsApp</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310049/Polish_20260620_014530309.jpg" alt="SafetyLink PWA"/>
              <div className="dl-title">PWA</div>
              <div className="dl-sub">Access directly from your browser. Tap Add to Home Screen. Full offline capability once installed.</div>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="dl-btn-link pwa">Open PWA</a>
            </div>
          </div>`;

const downloadSectionNew = `<div className="dl-grid">
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="Android App Preview"/>
              <div className="dl-title">Android APK</div>
              <div className="dl-sub">Minimum Android 8.0. Bluetooth LE required for iTAG functionality.</div>
              <a href={latestApkUrl || "https://github.com/Charesmagna/SafetyLink-Core/releases/latest"} target="_blank" rel="noreferrer" className="dl-btn-link apk">{latestApkUrl ? 'Download Latest APK' : 'View Releases'}</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Windows Command Deck"/>
              <div className="dl-title">Windows EXE</div>
              <div className="dl-sub">SafetyLink Command Deck desktop app. Requires SL-ORG-XXXX access code.</div>
              <a href={latestExeUrl || "https://github.com/Charesmagna/SafetyLink-Core/releases/latest"} target="_blank" rel="noreferrer" className="dl-btn-link exe">{latestExeUrl ? 'Download Latest EXE' : 'View Releases'}</a>
            </div>
            <div className="dl-card">
              <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310049/Polish_20260620_014530309.jpg" alt="SafetyLink PWA"/>
              <div className="dl-title">PWA</div>
              <div className="dl-sub">Access directly from your browser. Tap Add to Home Screen. Full offline capability once installed.</div>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="dl-btn-link pwa">Open PWA</a>
            </div>
          </div>
          
          {releases.length > 0 && (
            <div style={{ marginTop: '4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '2rem', maxWidth: '800px', margin: '4rem auto 0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', fontFamily: 'monospace' }}>Release History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {releases.map((release: any) => (
                  <div key={release.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.125rem' }}>{release.tag_name}</span>
                        {release.prerelease && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 'bold', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>Pre-release</span>}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>{new Date(release.published_at).toLocaleDateString()} - {release.name}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {release.assets?.map((a: any) => (
                        <a key={a.id} href={a.browser_download_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 0.75rem', background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.5rem', textDecoration: 'none' }}>
                          {a.name.endsWith('.apk') ? 'APK' : a.name.endsWith('.exe') ? 'EXE' : 'DL'}
                        </a>
                      ))}
                      <a href={release.html_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.5rem', textDecoration: 'none' }}>
                        Notes
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
`;

content = content.replace(downloadSectionOld, downloadSectionNew);
fs.writeFileSync(path, content, 'utf8');
