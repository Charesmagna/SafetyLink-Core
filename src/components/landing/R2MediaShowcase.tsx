import React, { useState } from 'react';

interface MediaItem {
  id: string;
  title: string;
  category: 'video' | 'architecture' | 'doc';
  durationOrSize: string;
  description: string;
  r2Key: string;
  thumbnail?: string;
}

const FEATURED_MEDIA: MediaItem[] = [
  {
    id: 'eco-video',
    title: "Inside SafetyLink's Offline-First Ecosystem",
    category: 'video',
    durationOrSize: '9.5 MB • MP4 Video',
    description: 'Deep dive into BLE mesh beacon failovers, local GIS mapping, and zero-connectivity panic triggers.',
    r2Key: 'Safetylink/Inside_SafetyLink_s_Offline-First_Emergency_Ecosystem.mp4',
  },
  {
    id: 'pipeline-video',
    title: 'How Emergency Escalation Pipelines Work',
    category: 'video',
    durationOrSize: '2.5 MB • MP4 Video',
    description: 'Step-by-step breakdown of how distress signals route sequentially through response teams and contacts.',
    r2Key: 'Safetylink/How_Emergency_Escalation_Pipelines_Work.mp4',
  },
  {
    id: 'auto-video',
    title: 'How SafetyLink Automates Emergency Responses',
    category: 'video',
    durationOrSize: '3.6 MB • MP4 Video',
    description: 'Autonomous dispatch rules, multi-carrier fallback loops, and real-time subscriber safety checks.',
    r2Key: 'Safetylink/How_SafetyLink_Automates_Emergency_Responses.mp4',
  },
  {
    id: 'hardware-video',
    title: "SafetyLink's Emergency Hardware Lineup",
    category: 'video',
    durationOrSize: '7.5 MB • MP4 Video',
    description: 'Physical Bluetooth wearable tags, vehicle responder beacons, and fixed estate muster sensors.',
    r2Key: 'Safetylink/SafetyLink_s_New_Emergency_Hardware_Lineup.mp4',
  },
  {
    id: 'gap-video',
    title: 'The Reliability Gap: Panic Apps vs SafetyLink',
    category: 'video',
    durationOrSize: '65 MB • Full Walkthrough',
    description: 'Side-by-side comparison of consumer panic buttons failing without cell signal vs mesh delivery.',
    r2Key: 'Safetylink/The_Reliability_Gap__Standard_Panic_Apps_vs.mp4',
  },
  {
    id: 'arch-system',
    title: 'Emergency Response System Architecture',
    category: 'architecture',
    durationOrSize: '5.6 MB • High-Res Diagram',
    description: 'Complete end-to-end telemetry map: client beacons, WebSocket live relay, and security patrol dispatch.',
    r2Key: 'Safetylink/Emergency_Response_System_Architecture.png',
  },
  {
    id: 'arch-platform',
    title: 'Platform Architecture & Guard Dispatch Deck',
    category: 'architecture',
    durationOrSize: '4.6 MB • Technical Blueprint',
    description: 'Control room topology showing organization multitenancy, patrol telemetry, and offline caches.',
    r2Key: 'Safetylink/Emergency_Response_Platform_Architecture_Overview.png',
  },
  {
    id: 'arch-anatomy',
    title: 'Emergency Mesh Anatomy & Signal Flow',
    category: 'architecture',
    durationOrSize: '4.1 MB • Schematic',
    description: 'Hardware, mobile OS background service, and cloud database state machine synchronization.',
    r2Key: 'Safetylink/Emergency_System_Architecture_Anatomy.png',
  },
  {
    id: 'arch-resilience',
    title: 'Universal Resilience Comparison Matrix',
    category: 'architecture',
    durationOrSize: '3.8 MB • Comparison Sheet',
    description: 'Direct architectural comparison across mesh nodes, offline storage resilience, and failover latency.',
    r2Key: 'Safetylink/SafetyLink_Universal_Resilience_Comparison.png',
  },
  {
    id: 'arch-ecosystem',
    title: 'Security Ecosystem Comparison Sheet',
    category: 'architecture',
    durationOrSize: '3.5 MB • Enterprise Matrix',
    description: 'Evaluation criteria comparing SafetyLink vs legacy armed response, GSM trackers, and panic apps.',
    r2Key: 'Safetylink/Security_Ecosystem_Comparison_Sheet.png',
  },
];

export function R2MediaShowcase() {
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'architecture'>('all');
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(FEATURED_MEDIA[0]);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  const filtered = activeTab === 'all' ? FEATURED_MEDIA : FEATURED_MEDIA.filter((m) => m.category === activeTab);

  return (
    <section style={{ padding: '80px 40px', background: '#0a0d14', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', letterSpacing: '.18em', color: '#00e676', marginBottom: '8px' }}>
              // CLOUDFLARE R2 SECURE MEDIA VAULT
            </div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-.02em', color: '#f8fafc', margin: 0 }}>
              Official Platform Media & Technical Blueprints
            </h2>
            <p style={{ color: '#8892a4', fontSize: '14px', marginTop: '8px', maxWidth: '640px' }}>
              Explore official system demonstrations, interactive video walk-throughs, and high-resolution architecture blueprints served directly from high-speed Cloudflare storage.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['all', 'video', 'architecture'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  background: activeTab === tab ? '#e8321e' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#8892a4',
                  transition: 'all .2s',
                }}
              >
                {tab === 'all' ? 'All Assets' : tab === 'video' ? '🎬 Explainer Videos' : '📐 System Blueprints'}
              </button>
            ))}
          </div>
        </div>

        {/* Video Player Showcase */}
        {selectedVideo && (
          <div style={{ background: '#05070a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00e676' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>STREAMING FROM R2: {selectedVideo.title}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{selectedVideo.durationOrSize}</span>
            </div>

            <div style={{ position: 'relative', width: '100%', background: '#000', maxHeight: '520px', display: 'flex', justifyContent: 'center' }}>
              <video
                key={selectedVideo.r2Key}
                controls
                playsInline
                preload="metadata"
                style={{ width: '100%', maxHeight: '520px', objectFit: 'contain' }}
                src={`/api/r2/stream/${encodeURIComponent(selectedVideo.r2Key)}`}
              >
                Your browser does not support HTML5 video streaming.
              </video>
            </div>

            <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{selectedVideo.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{selectedVideo.description}</p>
              </div>
              <a
                href={`/api/r2/download/${encodeURIComponent(selectedVideo.r2Key)}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⬇️ Download MP4 File
              </a>
            </div>
          </div>
        )}

        {/* Media Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filtered.map((item) => {
            const isVideo = item.category === 'video';
            const isSelected = isVideo && selectedVideo?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isVideo) {
                    setSelectedVideo(item);
                  } else {
                    setSelectedImage(item);
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all .2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>{isVideo ? '▶️' : '📐'}</span>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: isVideo ? '#00e676' : '#38bdf8', padding: '3px 8px', borderRadius: '4px', background: isVideo ? 'rgba(0,230,118,0.1)' : 'rgba(56,189,248,0.1)' }}>
                      {item.durationOrSize}
                    </span>
                  </div>

                  {!isVideo && (
                    <div style={{ width: '100%', height: '110px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px', background: '#05070a' }}>
                      <img
                        src={`/api/r2/stream/${encodeURIComponent(item.r2Key)}`}
                        alt={item.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px', lineHeight: 1.4 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#8892a4', lineHeight: 1.5, margin: 0 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: isVideo ? '#00e676' : '#38bdf8', fontWeight: 700 }}>
                    {isVideo ? (isSelected ? '● Now Playing' : '▶ Watch Video') : '🔍 View Full Blueprint'}
                  </span>
                  <a
                    href={`/api/r2/download/${encodeURIComponent(item.r2Key)}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#64748b', fontSize: '11px', textDecoration: 'none' }}
                  >
                    ⬇ Save
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Blueprint Lightbox Modal */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.88)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '1100px',
                width: '100%',
                maxHeight: '90vh',
                background: '#0a0d14',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{selectedImage.title}</h4>
                  <span style={{ fontSize: '11px', color: '#8892a4' }}>Cloudflare R2 High-Resolution Master • {selectedImage.durationOrSize}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a
                    href={`/api/r2/download/${encodeURIComponent(selectedImage.r2Key)}`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    ⬇ Download Original
                  </a>
                  <button
                    onClick={() => setSelectedImage(null)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#fff',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ overflow: 'auto', padding: '16px', display: 'flex', justifyContent: 'center', background: '#020408' }}>
                <img
                  src={`/api/r2/stream/${encodeURIComponent(selectedImage.r2Key)}`}
                  alt={selectedImage.title}
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
