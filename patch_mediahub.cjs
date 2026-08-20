const fs = require('fs');
let code = fs.readFileSync('src/components/MediaHub.tsx', 'utf8');

const newComponentCode = `
export const MediaHub: React.FC = () => {
  const [driveFiles, setDriveFiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/drive/media?folderId=1l78cZjsK9RFFsr4DNqYwhK4swg8SIbmW')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDriveFiles(data.files);
        } else {
          setError(data.error || 'Failed to load media');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching drive media:', err);
        setError('Network error connecting to API');
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden p-6" style={{ backgroundColor: tokens.colors.graphiteBlack }}>
      <div className="mb-4">
        <h2 style={{ fontSize: tokens.typography.sizes.xl, color: tokens.colors.slate100 }}>System Verification Gallery</h2>
        <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.slate400 }}>Mission-critical visual telemetry guides and software tutorials fetched dynamically from Google Drive.</p>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center text-red-500 mb-2">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
          </div>
          <p className="text-red-400 font-mono text-sm">{error}</p>
          <p className="text-slate-500 text-xs">Ensure GOOGLE_DRIVE_API_KEY is configured in the environment variables to access the Google Drive folder.</p>
          
          <div className="w-full text-left mt-8">
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">Fallback to Local Cache</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MEDIA_MANIFEST.map((clip, index) => (
                <div key={'fallback-'+index} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 flex gap-3">
                  <div className="w-1/3 aspect-video bg-black rounded overflow-hidden">
                    <video src={clip.path} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-2/3 flex flex-col justify-center">
                    <span className="text-slate-200 text-xs font-bold truncate">{clip.title}</span>
                    <span className="text-slate-500 text-[9px] font-mono truncate">{clip.filename}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && driveFiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm">
          No media files found in the specified Drive folder.
        </div>
      )}

      {!loading && !error && driveFiles.length > 0 && (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
          {driveFiles.map((file) => (
            <div 
              key={file.id} 
              className="rounded-xl flex flex-col overflow-hidden border transition-all duration-300 hover:border-emerald-500/50"
              style={{ 
                backgroundColor: tokens.colors.charcoal,
                borderColor: tokens.colors.slate800,
                boxShadow: tokens.shadows.md
              }}
            >
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                {file.mimeType.includes('video') ? (
                  <video 
                    src={file.webContentLink || file.webViewLink} 
                    controls 
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : file.mimeType.includes('image') ? (
                  <img 
                    src={file.webContentLink || file.thumbnailLink} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center">
                    <i className="fa-solid fa-file text-3xl mb-2"></i>
                    <span className="text-xs font-mono">{file.mimeType.split('/').pop()}</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-emerald-500 uppercase tracking-wider font-mono truncate mr-2" style={{ fontSize: tokens.typography.sizes.xs }}>
                    {file.name}
                  </span>
                  <a href={file.webViewLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white shrink-0">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </a>
                </div>
                <p className="flex-grow text-xs text-slate-400 mt-2 line-clamp-3">
                  {file.description || "No description provided."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
`;

code = code.replace(/export const MediaHub: React\.FC = \(\) => \{[\s\S]*?^};/m, newComponentCode);

fs.writeFileSync('src/components/MediaHub.tsx', code);
console.log('Patched MediaHub');
