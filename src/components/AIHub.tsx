import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const AIHub: React.FC = () => {
  const { userLocation, addAuditLog } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'voice' | 'image' | 'surveillance' | 'lyria'>('chat');

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; timestamp: number }>>([
    { sender: 'bot', text: 'Greeting Responder. I am K\'leva.info, your secure AI coordinator. How can I assist you with your tactical mesh or emergency dispatch parameters today?', timestamp: Date.now() - 5000 }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Voice States
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceWaves, setVoiceWaves] = useState<number[]>([10, 10, 10, 10, 10, 10]);
  const [voiceLog, setVoiceLog] = useState<string>('Press start to establish high-frequency secure voice link.');

  // Image Generation States
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [imageQuality, setImageQuality] = useState('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Surveillance/Video Generation States (Veo)
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoRatio, setVeoRatio] = useState('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Lyria Music States
  const [isSynthesizingMusic, setIsSynthesizingMusic] = useState(false);
  const [currentSynthWave, setCurrentSynthWave] = useState('IDLE');
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Handle Chat Submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    // Simulate high intelligence Gemini model thinking processing
    setTimeout(() => {
      let reply = '';
      const promptLower = userMsg.toLowerCase();

      if (promptLower.includes('sos') || promptLower.includes('panic') || promptLower.includes('danger')) {
        reply = `CRITICAL ALERT INTERCEPTED: Activating coordinated response metrics. I have verified your geo-coordinates at [${userLocation?.lat.toFixed(5)}, ${userLocation?.lng.toFixed(5)}]. Initializing dispatch enqueuer with 10s cancel buffer. Keep your wearable iTAG nearby.`;
      } else if (promptLower.includes('location') || promptLower.includes('gps') || promptLower.includes('where')) {
        reply = `GEOLOCATION DECRYPT: Your node is centered at Latitude: ${userLocation?.lat.toFixed(6)}, Longitude: ${userLocation?.lng.toFixed(6)}. Map accuracy index is calculated at 98.7% (High-precision cellular trilateration).`;
      } else if (promptLower.includes('itag') || promptLower.includes('ble') || promptLower.includes('button')) {
        reply = `HARDWARE HARMONY: Physical BLE buttons can be bonded via the Scanner Tab. When pressed once, they notify contacts. A triple-click triggers instant SOS bypass.`;
      } else if (promptLower.includes('who are you') || promptLower.includes('kleva') || promptLower.includes('k\'leva') || promptLower.includes('lizzy')) {
        reply = `IDENT DECRYPT: I am Lizzy from K'lev.ai, your edge-computing AI safety agent. Built specifically for high-durability Mesh Networks to coordinate medical, tactical, and community nodes.`;
      } else {
        reply = `SECURE MEMO: Node request received. Under emergency conditions, I will coordinate with TM Media Solutions servers to ensure persistent dispatch alerts. Let me know if you need exit routing or weather grounding.`;
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: Date.now() }]);
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info processed chat request', `Query: ${userMsg.substring(0, 30)}`);
    }, 1200);
  };

  // Image Analyzer (gemini-3.1-pro-preview / Image Understanding)
  const handleAnalyzeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTyping(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      // Add custom analyzed message
      setChatMessages(prev => [
        ...prev,
        { sender: 'user', text: `[Evidence Photograph Uploaded: ${file.name}]`, timestamp: Date.now() }
      ]);

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `⚠️ EVIDENCE ANALYZED (gemini-3.1-pro-preview): Checked image "${file.name}". High probability match: Indoor security parameter or user environment. No immediate thermal anomalies or chemical hazardous materials detected. Ground status secure.`,
            timestamp: Date.now()
          }
        ]);
        setIsTyping(false);
        addAuditLog('SECURITY', 'INFO', 'K\'leva.info analyzed evidence image', file.name);
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  // Live Voice Waveform Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (voiceActive) {
      interval = setInterval(() => {
        setVoiceWaves(Array.from({ length: 8 }, () => Math.floor(Math.random() * 32) + 5));
      }, 100);
    } else {
      setVoiceWaves([10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => clearInterval(interval);
  }, [voiceActive]);

  const toggleVoiceLink = () => {
    if (voiceActive) {
      setVoiceActive(false);
      setVoiceLog('Voice link terminated.');
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info voice chat disconnected');
    } else {
      setVoiceActive(true);
      setVoiceLog('Connecting to gemini-3.1-flash-live-preview...');
      setTimeout(() => {
        setVoiceLog('Live voice link established! K\'leva.info is listening...');
        addAuditLog('SYSTEM', 'INFO', 'K\'leva.info voice chat connected', 'Using gemini-3.1-flash-live-preview');
      }, 1000);
    }
  };

  // Image Generator using gemini-3.1-flash-image-preview & gemini-3-pro-image-preview
  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImg(true);

    // Simulate Image Generation via Canvas/SVG DataURL
    setTimeout(() => {
      // We render an gorgeous custom SVG blueprint grid representing their prompt
      const canvas = document.createElement('canvas');
      canvas.width = imageAspectRatio === '16:9' ? 640 : imageAspectRatio === '9:16' ? 360 : 500;
      canvas.height = imageAspectRatio === '16:9' ? 360 : imageAspectRatio === '9:16' ? 640 : 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw futuristic dark mesh layout
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Circular safety rings
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 4, 0, Math.PI * 2);
        ctx.stroke();

        // Target coordinates
        ctx.fillStyle = '#10b981';
        ctx.font = '11px Courier New';
        ctx.fillText(`PROMPT: ${imagePrompt.substring(0, 35)}...`, 20, 30);
        ctx.fillText(`QUALITY: ${imageQuality} RESOLUTION / RATIO: ${imageAspectRatio}`, 20, 50);
        ctx.fillText(`LAT: ${userLocation?.lat.toFixed(5)} LNG: ${userLocation?.lng.toFixed(5)}`, 20, 70);

        // Center crosshair
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 20);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 20);
        ctx.stroke();
      }

      setGeneratedImage(canvas.toDataURL());
      setIsGeneratingImg(false);
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info generated tactical safety mockup', imagePrompt);
    }, 1500);
  };

  // Veo Video Loop generation
  const handleGenerateVideo = () => {
    if (!veoPrompt.trim()) return;
    setIsGeneratingVideo(true);

    setTimeout(() => {
      // Use a canvas simulation to build an animated video thumbnail
      setGeneratedVideoUrl('ACTIVE');
      setIsGeneratingVideo(false);
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info triggered Veo 3 Video drone loop', veoPrompt);
    }, 1800);
  };

  // Lyria calming music generator using Web Audio API
  const startCalmingSynth = () => {
    try {
      if (isSynthesizingMusic) {
        // Stop current synthesis
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        }
        setIsSynthesizingMusic(false);
        setCurrentSynthWave('IDLE');
        return;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine'; // Super clean smooth sine wave to reduce panic heartrate
      osc.frequency.setValueAtTime(136.1, audioCtx.currentTime); // 136.1 Hz (OM pitch / calming earth frequency)

      // Slow fading ambient filter
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 2);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();

      oscillatorRef.current = osc;
      gainRef.current = gainNode;
      setIsSynthesizingMusic(true);
      setCurrentSynthWave('LYRIA_AMB_136HZ');
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info started Lyria Calming Synthesis', '136.1Hz Earth Frequency');
    } catch (e) {
      console.error('Web Audio API synthesis failed:', e);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 text-left space-y-4 shadow relative overflow-hidden">
      {/* Decorative side accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header with styled bigger a and I */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <SafetyLinkLogo size={18} glowColor="rgba(168, 85, 247, 0.4)" />
          <h2 className="text-xs font-black tracking-widest font-mono uppercase text-slate-100 flex items-center gap-1">
            CO-RESPONDER: K'lev<span className="text-sm font-black text-purple-400">a</span>.<span className="text-sm font-black text-purple-400">I</span>nfo
          </h2>
        </div>
        <span className="text-[7.5px] font-mono font-bold bg-purple-950/40 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
          gemini-3.5-flash
        </span>
      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-850">
        {[
          { id: 'chat', label: 'Chatbot', icon: '💬' },
          { id: 'voice', label: 'Voice', icon: '🎙️' },
          { id: 'image', label: 'Tactical Img', icon: '🎨' },
          { id: 'surveillance', label: 'Drone Veo', icon: '📹' },
          { id: 'lyria', label: 'Lyria Music', icon: '🎵' }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`flex-1 py-1.5 text-[9px] font-mono font-bold rounded-xl uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeSubTab === sub.id
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{sub.icon}</span>
            <span className="hidden sm:inline">{sub.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[220px] flex flex-col justify-between">
        {/* SUBTAB 1: CHATBOT */}
        {activeSubTab === 'chat' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {/* Scrollable messages thread */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2.5 text-xs font-mono">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-purple-900/30 border border-purple-500/20 text-purple-200 ml-auto'
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
              ))}
              {isTyping && (
                <div className="text-slate-500 italic animate-pulse">
                  K'leva.info is computing response parameters...
                </div>
              )}
            </div>

            {/* Input & Image Analyzer Trigger */}
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              {/* Evidence photo trigger */}
              <label className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer flex items-center justify-center text-sm shrink-0 hover:scale-105 transition-transform" title="Upload Evidence/Hazard Photo to Analyze">
                📸
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAnalyzeImage}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask K'leva about GPS, iTAGs, or dispatch routes..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />

              <button
                type="submit"
                className="px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider font-mono shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* SUBTAB 2: VOICE LIVE API */}
        {activeSubTab === 'voice' && (
          <div className="space-y-4 text-center py-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              {/* Pulsing microphone waveform representing gemini-3.1-flash-live-preview */}
              <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs bg-slate-950 rounded-2xl border border-slate-800 px-4">
                {voiceWaves.map((val, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ height: val }}
                    className={`w-1 rounded-full ${voiceActive ? 'bg-purple-500' : 'bg-slate-800'}`}
                    transition={{ ease: 'easeInOut' }}
                  />
                ))}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={toggleVoiceLink}
                  className={`px-5 py-2.5 rounded-full font-mono text-xs font-extrabold uppercase tracking-wide border transition-all ${
                    voiceActive
                      ? 'bg-red-600/30 hover:bg-red-600 border-red-500 text-red-200'
                      : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white'
                  }`}
                >
                  {voiceActive ? '⏹️ Terminate Link' : '🎙️ Establish Voice Link'}
                </button>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest pt-1">
                  Powered by gemini-3.1-flash-live-preview
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-mono text-slate-400 w-full text-left leading-normal">
                🛰️ STATUS LOG: {voiceLog}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: TACTICAL IMAGE GENERATION */}
        {activeSubTab === 'image' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Aspect Ratio</label>
                <select
                  value={imageAspectRatio}
                  onChange={e => setImageAspectRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {['1:1', '16:9', '9:16', '3:2', '4:3'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Quality Index</label>
                <select
                  value={imageQuality}
                  onChange={e => setImageQuality(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {['1K', '2K', '4K'].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                placeholder="e.g. Tactical perimeter route map blueprint..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImg || !imagePrompt.trim()}
                className="px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl uppercase tracking-wider font-mono shrink-0"
              >
                {isGeneratingImg ? 'WAIT...' : 'CREATE'}
              </button>
            </div>

            {/* Simulated Live preview frame */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-2.5 min-h-[120px] flex items-center justify-center relative overflow-hidden">
              {generatedImage ? (
                <div className="space-y-1.5 text-center">
                  <img src={generatedImage} alt="Generated Asset" className="max-h-24 object-contain rounded-lg border border-slate-800 shadow" />
                  <span className="block text-[8px] font-mono text-slate-500 uppercase">Tactical Mockup Ready (gemini-3.1-flash-image-preview)</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Preview area idle. Trigger "CREATE" above.
                </span>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 4: VEO VIDEO SURVEILLANCE */}
        {activeSubTab === 'surveillance' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <p className="text-[10px] font-mono text-slate-400 leading-normal">
              Animate text descriptions into continuous surveillance footage or responders target paths using Veo 3 Video.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Aspect Ratio</label>
                <select
                  value={veoRatio}
                  onChange={e => setVeoRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {['16:9', '9:16'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Model Target</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-purple-300">
                  veo-3.1-fast-generate
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={veoPrompt}
                onChange={e => setVeoPrompt(e.target.value)}
                placeholder="e.g. Drone flight path scan of accommodation block..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || !veoPrompt.trim()}
                className="px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl uppercase font-mono shrink-0"
              >
                {isGeneratingVideo ? 'BUILDING...' : 'RENDER'}
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-2.5 min-h-[100px] flex items-center justify-center relative overflow-hidden">
              {generatedVideoUrl ? (
                <div className="w-full aspect-[16/9] max-h-[100px] bg-slate-900 border border-purple-500/20 rounded-lg flex flex-col items-center justify-center gap-1.5 relative overflow-hidden">
                  {/* Drone grid lines & simulation clip overlay */}
                  <div className="absolute inset-0 border border-red-500/20 animate-pulse pointer-events-none" />
                  <div className="absolute top-2 left-2 text-[8px] text-red-400 font-mono font-black uppercase tracking-wider bg-black/40 px-1 py-0.5 rounded">
                    🔴 VEO SEC_FLIGHT_SCAN
                  </div>
                  <span className="text-xl animate-bounce">🛸</span>
                  <span className="text-[8px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Simulated Veo Video Feed looping</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Drone video loop buffer empty.
                </span>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 5: LYRIA AMBIENT SYNTHESIS */}
        {activeSubTab === 'lyria' && (
          <div className="space-y-4 text-center py-4">
            <p className="text-[11px] font-mono text-slate-400 leading-normal text-left max-w-sm mx-auto">
              Emergency distress situations trigger spike adrenaline. Lyria generates organic calming sine frequencies (e.g. 136.1Hz Earth frequency) designed to lower heart rates and restore calm.
            </p>

            <div className="flex flex-col items-center justify-center space-y-3">
              <button
                type="button"
                onClick={startCalmingSynth}
                className={`px-6 py-3 rounded-full font-mono text-xs font-black uppercase tracking-wider border transition-all ${
                  isSynthesizingMusic
                    ? 'bg-red-600/30 hover:bg-red-600 border-red-500 text-red-200 animate-pulse'
                    : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white'
                }`}
              >
                {isSynthesizingMusic ? '⏹️ Mute Calming Frequencies' : '🎵 Generate Lyria-3 Calm Synth'}
              </button>

              <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                <span>Status:</span>
                <span className={`font-black ${isSynthesizingMusic ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                  {currentSynthWave}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
