import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const mediaAssets = [
  {
    type: 'video',
    src: 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310204/Now_let_s_show_how_kids_would.mp4',
    title: 'How SafetyLink Automates Emergency Responses',
    description: 'A complete overview of the autonomous emergency pipeline.'
  },
  {
    type: 'video',
    src: 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4',
    title: 'Emergency Escalation Pipelines',
    description: 'Learn how distress signals are routed securely.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg',
    title: 'Platform Architecture Overview',
    description: 'High-level diagram of the SafetyLink infrastructure.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_48euet48euet48eu.png',
    title: 'Command Center Interface',
    description: 'Live view of the dispatch tactical screen.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309977/Gemini_Generated_Image_6iikvx6iikvx6iik.png',
    title: 'Security Operations Concept',
    description: 'Visualizing response network topology.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309975/Gemini_Generated_Image_td9rg6td9rg6td9r.png',
    title: 'Hardware Node Integration',
    description: 'Concept art for IoT safety beacons.'
  },
  {
    type: 'video',
    src: 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4',
    title: 'Inside the SafetyLink Emergency Ecosystem',
    description: 'A deep dive into how nodes communicate across the mesh network.'
  },
  {
    type: 'video',
    src: 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310213/Now_I_need_the_d_animation_lo.mp4',
    title: 'SafetyLink 3D Logo Animation',
    description: 'Official 3D animated branding asset.'
  },
  {
    type: 'video',
    src: 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310194/drone_dispatch_tracking_crimin.mp4',
    title: 'System Demonstration',
    description: 'Demonstration of the SafetyLink user interface.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309940/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg',
    title: 'Emergency System Anatomy',
    description: 'Detailed structural anatomy of the emergency pipelines.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309942/Gemini_Generated_Image_283s3m283s3m283s.jpg',
    title: 'Safety Response System Architecture',
    description: 'Technical breakdown of the response capabilities.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_waguavwaguavwagu.jpg',
    title: 'Field Node Map',
    description: 'Conceptualization of a deployment field node.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_s8bl6ps8bl6ps8bl.jpg',
    title: 'Data Flow Topology',
    description: 'Visualizing emergency data routing patterns.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309971/image_1786374730511.jpg',
    title: 'SafetyLink Field Operations',
    description: 'Visual of on-site field operations.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309819/1785107409613.png',
    title: 'Dashboard Telemetry UI',
    description: 'Reference UI for telemetry panels.'
  },
  {
    type: 'image',
    src: 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309110/main-sample.png',
    title: 'Action Interface Diagram',
    description: 'Actionable response patterns.'
  }
];

export const MediaHub: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<typeof mediaAssets[0] | null>(null);

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto p-0 relative bg-slate-950 text-slate-200 scanlines">
      <div className="sticky top-0 left-0 right-0 p-6 z-10 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
        <h2 className="text-xl font-bold font-mono tracking-tight text-white">System Verification Gallery</h2>
        <p className="text-sm text-slate-400 mt-1">Mission-critical visual telemetry guides and architecture diagrams.</p>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaAssets.map((asset, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAsset(asset)}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
          >
            <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
              {asset.type === 'video' ? (
                <>
                  <video src={asset.src} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted loop playsInline onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center backdrop-blur-md">
                      <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[12px] border-l-white ml-1"></div>
                    </div>
                  </div>
                </>
              ) : (
                <img src={asset.src} alt={asset.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm text-slate-200">{asset.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asset.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-mono text-white">{selectedAsset.title}</h3>
                <p className="text-sm text-slate-400">{selectedAsset.description}</p>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl">
              {selectedAsset.type === 'video' ? (
                <video src={selectedAsset.src} className="max-w-full max-h-full object-contain" controls autoPlay playsInline />
              ) : (
                <img src={selectedAsset.src} alt={selectedAsset.title} className="max-w-full max-h-full object-contain" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
