import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const AIHub: React.FC = () => {
  const { addAuditLog, triggerPanic } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'voice' | 'image' | 'surveillance' | 'lyria' | 'research'>('chat');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const latestResult = event.results[event.results.length - 1];
      if (latestResult.isFinal) {
        const transcript = latestResult[0].transcript.trim().toLowerCase();
        if (transcript.includes('execute emergency protocol') || transcript.includes('help me now')) {
           triggerPanic('Triggered via Voice Command');
           addAuditLog('SYSTEM', 'SEVERE', 'Emergency protocol initiated via covert voice command');
        }
      }
    };

    recognition.onend = () => {
      try {
        recognition.start(); // Auto-restart
      } catch(e) {}
    };

    try {
      recognition.start();
    } catch(e) {}

    return () => {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch(e) {}
    };
  }, [triggerPanic, addAuditLog]);

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

  const [researchQuery, setResearchQuery] = useState('');
  const [researchStatus, setResearchStatus] = useState<'IDLE' | 'RESEARCHING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [researchResult, setResearchResult] = useState('');
  const researchIntervalRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuery.trim() || researchStatus === 'RESEARCHING') return;

    setResearchStatus('RESEARCHING');
    setResearchResult('Starting deep research...');
    try {
      const startRes = await fetch('/api/gemini/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: researchQuery })
      });
      const { interactionId } = await startRes.json();
      if (!interactionId) throw new Error("No interaction ID returned");

      setResearchResult('Research started... polling for progress.');
      researchIntervalRef.current = setInterval(async () => {
         try {
            const pollRes = await fetch(`/api/gemini/research/${interactionId}`);
            const data = await pollRes.json();
            if (data.status === 'completed') {
               setResearchStatus('COMPLETED');
               setResearchResult(data.text);
               clearInterval(researchIntervalRef.current);
            } else if (data.status === 'failed' || data.status === 'cancelled') {
               setResearchStatus('FAILED');
               setResearchResult('Research failed or cancelled.');
               clearInterval(researchIntervalRef.current);
            } else {
               setResearchResult(`Researching... (${data.status})`);
            }
         } catch(err) {
            console.error(err);
         }
      }, 5000);
    } catch(err: any) {
      setResearchStatus('FAILED');
      setResearchResult('Failed to start research: ' + err.message);
    }
  };

  useEffect(() => {
    return () => {
       if (researchIntervalRef.current) clearInterval(researchIntervalRef.current);
    }
  }, []);

  // Handle Chat Submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      let lat, lng;
      // Try to get location for grounding
      if (navigator.geolocation) {
         try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
               navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
         } catch(err) {
            console.warn("Could not get location for grounding:", err);
         }
      }

      const response = await fetch(`/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           prompt: userMsg, 
           useThinking: false, 
           useGrounding: 'maps', // Always use Maps grounding for tactical queries
           lat, 
           lng 
        })
      });
      
      if (!response.ok) {
        throw new Error('AI request failed');
      }
      
      const data = await response.json();
      let reply = data.text || 'I could not process your request at this time.';
      
      // If there are maps grounding chunks, append links to the UI
      if (data.chunks && Array.isArray(data.chunks)) {
         const links = data.chunks.map((chunk: any) => {
            const place = chunk.web?.title || "Map Location";
            const uri = chunk.web?.uri;
            if (uri) return `<a href="${uri}" target="_blank" class="text-emerald-400 underline">${place}</a>`;
            return null;
         }).filter(Boolean);
         
         if (links.length > 0) {
            reply += `<br/><br/>📍 <b>Relevant Map Data:</b><br/>` + links.join('<br/>');
         }
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: Date.now() }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Error: Could not connect to AI services. Check console.', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info processed chat request', `Query: ${userMsg.substring(0, 30)}`);
    }
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

      fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: reader.result?.toString().split(',')[1], mimeType: file.type, prompt: "Analyze this image for safety hazards, security parameters, or tactical anomalies." })
      }).then(r => r.json()).then(data => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `⚠️ EVIDENCE ANALYZED (gemini-3.1-pro-preview): ${data.text}`,
            timestamp: Date.now()
          }
        ]);
        setIsTyping(false);
        addAuditLog('SECURITY', 'INFO', 'K\'leva.info analyzed evidence image', file.name);
      }).catch(() => setIsTyping(false));
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

  const wsRef = useRef<WebSocket | null>(null);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);
  const voiceProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<any>(null);

  const toggleVoiceLink = async () => {
    if (voiceActive) {
      setVoiceActive(false);
      setVoiceLog('Voice link terminated.');
      addAuditLog('SYSTEM', 'INFO', 'K\'leva.info voice chat disconnected');
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'end' }));
        wsRef.current.close();
        wsRef.current = null;
      }
      if (voiceProcessorRef.current) {
        voiceProcessorRef.current.disconnect();
        voiceProcessorRef.current = null;
      }
      if (voiceAudioCtxRef.current) {
        voiceAudioCtxRef.current.close();
        voiceAudioCtxRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach((t: any) => t.stop());
        mediaRecorderRef.current = null;
      }
    } else {
      setVoiceActive(true);
      setVoiceLog('Connecting to gemini-3.1-flash-live-preview...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
        // Start WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/live`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
        voiceAudioCtxRef.current = outputAudioCtx;
        
        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        voiceProcessorRef.current = processor;

        mediaRecorderRef.current = { stream } as any;

        ws.onopen = () => {
          setVoiceLog('Live audio link established! Speak to transmit.');
          addAuditLog('SYSTEM', 'INFO', 'K\'leva.info voice chat connected', 'Using Live audio processing');

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            const bytes = new Uint8Array(pcm16.buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'audio', data: base64 }));
            }
          };

          source.connect(processor);
          processor.connect(inputAudioCtx.destination);
        };

        let nextStartTime = 0;

        ws.onmessage = async (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'audio' && msg.data) {
              const binary = atob(msg.data);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                 float32[i] = pcm16[i] / 0x7FFF;
              }
              
              const audioBuffer = outputAudioCtx.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);
              
              const bufSource = outputAudioCtx.createBufferSource();
              bufSource.buffer = audioBuffer;
              bufSource.connect(outputAudioCtx.destination);
              
              if (nextStartTime < outputAudioCtx.currentTime) {
                 nextStartTime = outputAudioCtx.currentTime;
              }
              bufSource.start(nextStartTime);
              nextStartTime += audioBuffer.duration;

              setVoiceLog('Receiving transmission...');
            } else if (msg.type === 'interrupted') {
              nextStartTime = outputAudioCtx.currentTime;
            }
          } catch (err) {
            console.error(err);
          }
        };

        ws.onerror = () => {
          setVoiceLog('WebSocket connection failed.');
        };

        ws.onclose = () => {
          if (voiceActive) toggleVoiceLink();
        };
      } catch (err) {
        setVoiceActive(false);
        setVoiceLog('Microphone access denied or unavailable.');
        addAuditLog('SYSTEM', 'SEVERE', 'Microphone access failed');
      }
    }
  };

  // Image Generator using gemini-3.1-flash-image-preview & gemini-3-pro-image-preview
  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImg(true);

    fetch('/api/gemini/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imagePrompt, aspectRatio: imageAspectRatio })
    }).then(res => res.json()).then(data => {
      if (data.imageBase64) {
        setGeneratedImage(`data:image/jpeg;base64,${data.imageBase64}`);
        addAuditLog('SYSTEM', 'INFO', 'K\'leva.info generated tactical safety mockup', imagePrompt);
      }
      setIsGeneratingImg(false);
    }).catch(() => setIsGeneratingImg(false));
  };

  // Veo Video Loop generation
  const handleGenerateVideo = async () => {
    if (!veoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: veoPrompt, aspectRatio: veoRatio })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedVideoUrl('ACTIVE');
        addAuditLog('SYSTEM', 'INFO', 'K\'leva.info triggered Veo 3 Video drone loop', veoPrompt);
      }
    } catch (e) {
      addAuditLog('SYSTEM', 'SEVERE', 'Veo generation failed');
    } finally {
      setIsGeneratingVideo(false);
    }
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
      
      // Ping backend Lyria endpoint to initialize logging
      fetch('/api/gemini/generate-lyria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: "Generate a calming 136.1Hz earth frequency ambient track" })
      }).catch(() => {});
      
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
          { id: 'lyria', label: 'Lyria Music', icon: '🎵' },
          { id: 'research', label: 'Research', icon: '🔍' }
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
                  <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }} />
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
        {activeSubTab === 'research' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <p className="text-[10px] font-mono text-slate-400 leading-normal">
              Deep Research Agent (deep-research-preview-04-2026). Initiates a comprehensive, multi-step analysis across broad data sources.
            </p>

            <form onSubmit={handleResearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter deep research query..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                value={researchQuery}
                onChange={e => setResearchQuery(e.target.value)}
                disabled={researchStatus === 'RESEARCHING'}
              />
              <button
                type="submit"
                disabled={researchStatus === 'RESEARCHING'}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest transition-colors"
              >
                {researchStatus === 'RESEARCHING' ? 'Running' : 'Start'}
              </button>
            </form>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 max-h-48 overflow-y-auto text-xs font-mono text-slate-300">
              {researchStatus === 'IDLE' && !researchResult && (
                <div className="text-slate-600 text-center py-4">Awaiting research query.</div>
              )}
              {researchResult && (
                <div className={`whitespace-pre-wrap ${researchStatus === 'RESEARCHING' ? 'animate-pulse text-purple-300' : ''}`} dangerouslySetInnerHTML={{ __html: researchResult.replace(/\n/g, '<br/>') }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
