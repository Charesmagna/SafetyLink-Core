import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchR2Assets, getR2StreamUrl, getR2DownloadUrl, R2_MEDIA } from '../../utils/r2Assets';
import { Download, Play, Maximize2, X, Images } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  category: 'video' | 'architecture';
  durationOrSize: string;
  description: string;
  r2Key: string;
  previewUrl: string;
}

interface LiveR2Image {
  key: string;
  name: string;
  sizeFormatted: string;
  streamUrl: string;
  downloadUrl: string;
}

const FEATURED_MEDIA: MediaItem[] = [
  {
    id: 'eco-video',
    title: "Inside SafetyLink's Offline-First Ecosystem",
    category: 'video',
    durationOrSize: '9.5 MB · MP4 Video',
    description: 'Deep dive into BLE mesh beacon failovers, local GIS mapping, and zero-connectivity panic triggers.',
    r2Key: 'Safetylink/Inside_SafetyLink_s_Offline-First_Emergency_Ecosystem.mp4',
    previewUrl: R2_MEDIA.architecture.meshPlatformOverview,
  },
  {
    id: 'pipeline-video',
    title: 'How Emergency Escalation Pipelines Work',
    category: 'video',
    durationOrSize: '2.5 MB · MP4 Video',
    description: 'Step-by-step breakdown of how distress signals route sequentially through response teams and contacts.',
    r2Key: 'Safetylink/How_Emergency_Escalation_Pipelines_Work.mp4',
    previewUrl: R2_MEDIA.platform.dispatchControl,
  },
  {
    id: 'auto-video',
    title: 'How SafetyLink Automates Emergency Responses',
    category: 'video',
    durationOrSize: '3.6 MB · MP4 Video',
    description: 'Autonomous dispatch rules, multi-carrier fallback loops, and real-time subscriber safety checks.',
    r2Key: 'Safetylink/How_SafetyLink_Automates_Emergency_Responses.mp4',
    previewUrl: R2_MEDIA.platform.commandDeckDark,
  },
  {
    id: 'hardware-video',
    title: "SafetyLink's Emergency Hardware Lineup",
    category: 'video',
    durationOrSize: '7.5 MB · MP4 Video',
    description: 'Physical Bluetooth wearable tags, vehicle responder beacons, and fixed estate muster sensors.',
    r2Key: 'Safetylink/SafetyLink_s_New_Emergency_Hardware_Lineup.mp4',
    previewUrl: R2_MEDIA.hardware.itagFinderProduct,
  },
  {
    id: 'reliability-video',
    title: 'Standard Panic Apps vs. SafetyLink Mesh',
    category: 'video',
    durationOrSize: 'MP4 Video',
    description: 'Why cloud-only panic buttons fail during load-shedding or airtime depletion — and how SafetyLink survives.',
    r2Key: 'Safetylink/The_Reliability_Gap__Standard_Panic_Apps_vs.mp4',
    previewUrl: R2_MEDIA.architecture.universalResilience,
  },
  {
    id: 'ecosystem-full-video',
    title: 'SafetyLink Core Emergency Ecosystem Walkthrough',
    category: 'video',
    durationOrSize: 'MP4 Video',
    description: 'Complete walkthrough from pocket trigger and mobile SOS to multi-tenant control room dispatch.',
    r2Key: 'Safetylink/SafetyLink_Ecosystem.mp4',
    previewUrl: R2_MEDIA.architecture.responseOverview,
  },
  {
    id: 'arch-system',
    title: 'Emergency Response System Architecture',
    category: 'architecture',
    durationOrSize: 'High-Res Diagram',
    description: 'Complete end-to-end telemetry map: client beacons, live relay, and security patrol dispatch.',
    r2Key: 'Safetylink/Emergency_Response_System_Architecture.png',
    previewUrl: R2_MEDIA.architecture.responseArchitecture,
  },
  {
    id: 'arch-platform',
    title: 'Platform Architecture & Guard Dispatch Deck',
    category: 'architecture',
    durationOrSize: 'Technical Blueprint',
    description: 'Control room topology showing organization multitenancy, patrol telemetry, and offline caches.',
    r2Key: 'Safetylink/Emergency_Response_Platform_Architecture_Overview.png',
    previewUrl: R2_MEDIA.architecture.responseOverview,
  },
  {
    id: 'arch-anatomy',
    title: 'Emergency Mesh Anatomy & Signal Flow',
    category: 'architecture',
    durationOrSize: 'System Schematic',
    description: 'Hardware, mobile OS background service, and cloud database state machine synchronization.',
    r2Key: 'Safetylink/Emergency_System_Architecture_Anatomy.png',
    previewUrl: R2_MEDIA.architecture.systemAnatomy,
  },
  {
    id: 'arch-mesh',
    title: 'Decentralized Mesh Platform Overview',
    category: 'architecture',
    durationOrSize: 'Mesh Blueprint',
    description: 'Peer-to-peer beacon relay topology without single points of cloud failure.',
    r2Key: 'Safetylink/Emergency_Mesh_Platform_Overview.png',
    previewUrl: R2_MEDIA.architecture.meshPlatformOverview,
  },
  {
    id: 'arch-resilience',
    title: 'Universal Resilience Comparison Matrix',
    category: 'architecture',
    durationOrSize: 'Benchmark Sheet',
    description: 'Head-to-head comparison of SafetyLink offline-first dispatch vs. conventional alarm apps.',
    r2Key: 'Safetylink/SafetyLink_Universal_Resilience_Comparison.png',
    previewUrl: R2_MEDIA.architecture.universalResilience,
  },
  {
    id: 'arch-ecosystem',
    title: 'Security Ecosystem Comparison Sheet',
    category: 'architecture',
    durationOrSize: 'Deployment Matrix',
    description: 'Feature matrix covering families, estates, schools, hospitals, fleets, and municipal nodes.',
    r2Key: 'Safetylink/Security_Ecosystem_Comparison_Sheet.png',
    previewUrl: R2_MEDIA.architecture.securityEcosystem,
  },
];

function prettifyAssetName(raw: string): string {
  return raw
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function R2MediaShowcase() {
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'architecture' | 'library'>('all');
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(FEATURED_MEDIA[0]);
  const [selectedImage, setSelectedImage] = useState<{ title: string; subtitle: string; url: string; downloadUrl: string } | null>(null);
  const [liveR2Images, setLiveR2Images] = useState<LiveR2Image[]>([]);
  const [libraryLimit, setLibraryLimit] = useState(16);

  // Dynamically load ALL live images from Cloudflare R2 so the entire 80+ asset library is accessible
  useEffect(() => {
    let active = true;
    fetchR2Assets('Safetylink/')
      .then((res) => {
        if (!active || !res?.assets) return;
        const imgs = res.assets
          .filter((a: any) => a.category === 'images' && a.streamUrl)
          .map((a: any) => ({
            key: a.key,
            name: a.name,
            sizeFormatted: a.sizeFormatted || '',
            streamUrl: a.streamUrl,
            downloadUrl: a.downloadUrl || a.streamUrl,
          }));
        setLiveR2Images(imgs);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    activeTab === 'all'
      ? FEATURED_MEDIA
      : activeTab === 'library'
        ? []
        : FEATURED_MEDIA.filter((m) => m.category === activeTab);

  return (
    <section className="py-16 px-4 sm:px-6 border-t border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              Cloudflare R2 Media &amp; Architecture Vault
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Explainer Videos, Blueprints &amp; Full R2 Gallery
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Stream platform walk-throughs, inspect technical architecture diagrams, or browse all{' '}
              {liveR2Images.length > 0 ? `${liveR2Images.length} live` : 'live'} visuals straight from SafetyLink R2 storage.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl sl-glass-card self-start sm:self-auto">
            {([
              { id: 'all', label: 'Featured' },
              { id: 'video', label: 'Videos (6)' },
              { id: 'architecture', label: 'Blueprints (6)' },
              { id: 'library', label: `All R2 Images${liveR2Images.length ? ` (${liveR2Images.length})` : ''}` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Video Showcase Card */}
        {selectedVideo && (activeTab === 'all' || activeTab === 'video') && (
          <div className="rounded-3xl overflow-hidden sl-glass-card mb-8">
            <div className="px-5 py-3.5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Now Playing: {selectedVideo.title}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                {selectedVideo.durationOrSize}
              </span>
            </div>

            <div className="relative w-full bg-slate-950 flex justify-center max-h-[460px]">
              <video
                key={selectedVideo.r2Key}
                controls
                playsInline
                poster={selectedVideo.previewUrl}
                preload="metadata"
                className="w-full max-h-[460px] object-contain"
                src={getR2StreamUrl(selectedVideo.r2Key)}
              >
                Your browser does not support HTML5 video streaming.
              </video>
            </div>

            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {selectedVideo.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{selectedVideo.description}</p>
              </div>
              <a
                href={getR2DownloadUrl(selectedVideo.r2Key)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold no-underline shrink-0 self-start sm:self-auto"
              >
                <Download size={14} />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        )}

        {/* Featured Videos & Blueprints Grid */}
        {activeTab !== 'library' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((item, idx) => {
              const isVideo = item.category === 'video';
              const isSelected = isVideo && selectedVideo?.id === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ delay: (idx % 4) * 0.05 }}
                  onClick={() =>
                    isVideo
                      ? setSelectedVideo(item)
                      : setSelectedImage({
                          title: item.title,
                          subtitle: item.durationOrSize,
                          url: item.previewUrl,
                          downloadUrl: getR2DownloadUrl(item.r2Key),
                        })
                  }
                  className={`rounded-2xl overflow-hidden sl-glass-card cursor-pointer flex flex-col justify-between group ${
                    isSelected ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div>
                    <div className="relative h-40 bg-slate-900 overflow-hidden">
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          {isVideo ? <Play size={16} className="ml-0.5" /> : <Maximize2 size={15} />}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                        {item.durationOrSize}
                      </div>
                      <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {isVideo ? (isSelected ? 'Playing' : 'Watch Video') : 'Inspect Diagram'}
                    </span>
                    <a
                      href={getR2DownloadUrl(item.r2Key)}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 no-underline"
                    >
                      Save
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Dynamic R2 Cloud Library Browser (All 80+ Live Images) */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {liveR2Images.slice(0, libraryLimit).map((imgItem) => (
                <div
                  key={imgItem.key}
                  onClick={() =>
                    setSelectedImage({
                      title: prettifyAssetName(imgItem.name),
                      subtitle: imgItem.sizeFormatted || 'Cloudflare R2 Asset',
                      url: imgItem.streamUrl,
                      downloadUrl: imgItem.downloadUrl,
                    })
                  }
                  className="rounded-2xl overflow-hidden sl-glass-card cursor-pointer group"
                >
                  <div className="relative h-40 sm:h-44 bg-slate-900 overflow-hidden">
                    <img
                      src={imgItem.streamUrl}
                      alt={prettifyAssetName(imgItem.name)}
                      loading="lazy"
                      className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-slate-950/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={13} />
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {prettifyAssetName(imgItem.name)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                      {imgItem.sizeFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {libraryLimit < liveR2Images.length && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setLibraryLimit((prev) => prev + 24)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Images size={15} />
                  <span>
                    Load More R2 Images ({liveR2Images.length - libraryLimit} remaining)
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Image / Blueprint Lightbox Modal */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full max-h-[90vh] rounded-3xl overflow-hidden bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {selectedImage.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedImage.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedImage.downloadUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold no-underline"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    aria-label="Close preview"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto flex justify-center bg-slate-50 dark:bg-[#071124]">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
