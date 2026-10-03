import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import fallbackManifest from '../utils/r2AssetManifest.json';

export interface R2Asset {
  key: string;
  name: string;
  category: 'images' | 'videos' | 'documents' | 'audio' | 'code' | 'archives' | string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  lastModified?: string;
  streamUrl: string;
  downloadUrl: string;
}

export const MediaHub: React.FC = () => {
  const [assets, setAssets] = useState<R2Asset[]>(fallbackManifest as R2Asset[]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<R2Asset | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [r2Status, setR2Status] = useState<{ connected: boolean; bucket: string; count: number }>({
    connected: true,
    bucket: 'media',
    count: fallbackManifest.length,
  });

  // Fetch live R2 assets from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/r2/assets');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
            setAssets(data.assets);
            setR2Status({
              connected: true,
              bucket: data.bucket || 'media',
              count: data.totalCount || data.assets.length,
            });
          }
        }
      } catch (err) {
        console.warn('[MediaHub] Using verified local R2 fallback manifest:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAssets();
    return () => { isMounted = false; };
  }, []);

  // Filtered assets calculation
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category filter
      if (activeCategory === 'videos' && asset.category !== 'videos') return false;
      if (activeCategory === 'images' && asset.category !== 'images') return false;
      if (activeCategory === 'documents' && asset.category !== 'documents') return false;
      if (activeCategory === 'audio' && asset.category !== 'audio') return false;
      if (activeCategory === 'logos') {
        const isLogo = asset.name.toLowerCase().includes('logo') || asset.name.toLowerCase().includes('brand');
        if (!isLogo) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesExt = asset.extension.toLowerCase().includes(q);
        const matchesCat = asset.category.toLowerCase().includes(q);
        if (!matchesName && !matchesExt && !matchesCat) return false;
      }
      return true;
    });
  }, [assets, activeCategory, searchQuery]);

  // Category counts
  const counts = useMemo(() => {
    const vids = assets.filter((a) => a.category === 'videos').length;
    const imgs = assets.filter((a) => a.category === 'images').length;
    const docs = assets.filter((a) => a.category === 'documents').length;
    const audio = assets.filter((a) => a.category === 'audio').length;
    const logos = assets.filter((a) => a.name.toLowerCase().includes('logo') || a.name.toLowerCase().includes('brand')).length;
    return { all: assets.length, videos: vids, images: imgs, documents: docs, audio, logos };
  }, [assets]);

  // Clean, human-readable name formatter
  const formatName = (filename: string) => {
    return filename
      .replace(/^Safetylink\//, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ');
  };

  return (
    <div className="w-full flex flex-col bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* ── HEADER & TELEMETRY BAR ── */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
            <h2 className="text-base font-black text-white font-mono tracking-wider uppercase">
              Cloudflare R2 Media Vault
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {r2Status.count} ASSETS LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Direct streaming pipeline connecting Cloudflare R2 bucket <span className="text-emerald-400 font-semibold">{r2Status.bucket}</span> to responsive client nodes.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search 138+ R2 media files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: `All Assets (${counts.all})` },
          { id: 'videos', label: `🎬 Videos (${counts.videos})` },
          { id: 'images', label: `📐 Blueprints & Renders (${counts.images})` },
          { id: 'documents', label: `📄 Specs & PDFs (${counts.documents})` },
          { id: 'audio', label: `🎧 Audio (${counts.audio})` },
          { id: 'logos', label: `🏷️ Brand Logos (${counts.logos})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeCategory === tab.id
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MEDIA ASSETS GRID ── */}
      <div className="p-5 max-h-[680px] overflow-y-auto">
        {loading && assets.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-mono text-xs">
            Connecting to Cloudflare R2 edge...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            No assets match your search or filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset, idx) => {
              const isVideo = asset.category === 'videos' || asset.extension === 'mp4';
              const isImage = asset.category === 'images' || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(asset.extension);
              const isDoc = asset.category === 'documents' || ['pdf', 'docx', 'xlsx', 'txt', 'md'].includes(asset.extension);
              const isAudio = asset.category === 'audio' || ['mp3', 'm4a', 'wav'].includes(asset.extension);

              return (
                <motion.div
                  key={asset.key || idx}
                  whileHover={{ y: -2 }}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col group transition-colors"
                >
                  {/* Visual Header / Thumbnail */}
                  <div
                    onClick={() => setSelectedAsset(asset)}
                    className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer select-none"
                  >
                    {isVideo ? (
                      <>
                        <video
                          src={asset.streamUrl}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          muted
                          playsInline
                          preload="metadata"
                          onMouseEnter={(e) => {
                            try { e.currentTarget.play(); } catch (_) {}
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-slate-900/80 border border-emerald-500/40 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-emerald-400 ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : isImage ? (
                      <img
                        src={asset.streamUrl}
                        alt={asset.name}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logos/Safety_Link_Logo_Transparent.png';
                        }}
                      />
                    ) : isAudio ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-purple-400 p-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl">
                          🎧
                        </div>
                        <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest">Audio Track</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-blue-400 p-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl">
                          {asset.extension === 'pdf' ? '📑' : asset.extension.includes('xls') ? '📊' : '📄'}
                        </div>
                        <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest">{asset.extension.toUpperCase()} Doc</span>
                      </div>
                    )}

                    {/* Format pill badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 border border-slate-700/60 font-mono text-[9px] text-slate-300 font-bold uppercase">
                      {asset.extension}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => setSelectedAsset(asset)}
                        title={asset.name}
                        className="text-xs font-bold text-white font-mono hover:text-emerald-400 cursor-pointer line-clamp-1 transition-colors"
                      >
                        {formatName(asset.name)}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {asset.sizeFormatted} • {asset.category}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold text-emerald-400 text-center transition-colors"
                      >
                        {isVideo ? 'Play Video' : isDoc ? 'Inspect' : 'View'}
                      </button>
                      <a
                        href={asset.downloadUrl}
                        download={asset.name}
                        className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-mono font-bold text-slate-300 text-center transition-colors"
                        title="Download raw file"
                      >
                        ⬇
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FULL-SCREEN INTERACTIVE VIEWER / LIGHTBOX MODAL ── */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-mono text-white">
                    {formatName(selectedAsset.name)}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {selectedAsset.sizeFormatted} • {selectedAsset.key}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedAsset.downloadUrl}
                  download={selectedAsset.name}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Download</span>
                  <span>⬇</span>
                </a>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-2xl bg-black/60 border border-slate-800/80 my-4 shadow-2xl p-2 sm:p-6">
              {selectedAsset.category === 'videos' || selectedAsset.extension === 'mp4' ? (
                <video
                  src={selectedAsset.streamUrl}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  controls
                  autoPlay
                  playsInline
                />
              ) : selectedAsset.category === 'audio' || ['mp3', 'm4a', 'wav'].includes(selectedAsset.extension) ? (
                <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-xl">
                  <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-3xl animate-pulse">
                    🎧
                  </div>
                  <div>
                    <h4 className="font-bold text-white font-mono text-base">{selectedAsset.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">Autonomous Audio Stream</p>
                  </div>
                  <audio
                    src={selectedAsset.streamUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                </div>
              ) : ['pdf', 'docx', 'xlsx', 'txt', 'md'].includes(selectedAsset.extension) ? (
                <div className="flex flex-col items-center justify-center gap-4 text-center max-w-lg p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-3xl">
                    📑
                  </div>
                  <h4 className="font-bold text-white font-mono text-base">{selectedAsset.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Enterprise document stored in Cloudflare R2 ({selectedAsset.sizeFormatted}).
                  </p>
                  <div className="flex gap-3 mt-2">
                    <a
                      href={selectedAsset.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-xl border border-slate-700"
                    >
                      Open in New Tab
                    </a>
                    <a
                      href={selectedAsset.downloadUrl}
                      download={selectedAsset.name}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold rounded-xl"
                    >
                      Download Document
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedAsset.streamUrl}
                  alt={selectedAsset.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MediaHub;
