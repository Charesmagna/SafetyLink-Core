import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashRevealProps {
  onComplete: () => void;
}

type SplashStage = 
  // Intro Sequence
  | 'intro_spark'      // Sparks ignite in darkness, faint shield outline
  | 'layer_formation'  // Metallic plates slide and lock into place
  | 'energy_surge'     // Neon green light pulses through chain & arrow
  | 'text_reveal'      // "SAFETY LINK" text emerges from molten metal
  | 'final_burst'      // Plasma arcs & sparks explode, full logo glows
  | 'steady_glow'      // Logo glows steadily with smoke & reflections
  // Outro Sequence (Reverse)
  | 'outro_burst_rev'  // Implosion of plasma & sparks
  | 'outro_text_rev'   // Text heats up to molten and dissolves
  | 'outro_energy_rev' // Neon green drains from chain & arrow
  | 'outro_plates_rev' // Plates slide apart / unlock
  | 'outro_spark_rev'  // Sparks fade, returning to dark
  | 'done';            // Complete callback

// Web Audio API Synthesizer for high-fidelity physical sound effects
class SplashSoundGenerator {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playSparkIgnite() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Crackling friction electric sparks
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2500 + Math.random() * 1800, now + delay);
      
      gain.gain.setValueAtTime(0.03, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.04);
    }
    
    // Faint hum revealing shield outline
    const hum = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(60, now);
    hum.frequency.linearRampToValueAtTime(120, now + 1.2);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    hum.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    hum.start(now);
    hum.stop(now + 1.2);
  }

  playLayerLock() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 1. Hydraulic mechanical piston whir
    const oscPiston = this.ctx.createOscillator();
    const filterPiston = this.ctx.createBiquadFilter();
    const gainPiston = this.ctx.createGain();
    
    oscPiston.type = 'sawtooth';
    oscPiston.frequency.setValueAtTime(150, now);
    oscPiston.frequency.exponentialRampToValueAtTime(45, now + 0.4);
    
    filterPiston.type = 'lowpass';
    filterPiston.frequency.setValueAtTime(400, now);
    filterPiston.frequency.exponentialRampToValueAtTime(100, now + 0.4);
    
    gainPiston.gain.setValueAtTime(0.14, now);
    gainPiston.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    oscPiston.connect(filterPiston);
    filterPiston.connect(gainPiston);
    gainPiston.connect(this.ctx.destination);
    oscPiston.start(now);
    oscPiston.stop(now + 0.4);

    // 2. Heavy metallic thud clank
    const oscThud = this.ctx.createOscillator();
    const gainThud = this.ctx.createGain();
    oscThud.type = 'triangle';
    oscThud.frequency.setValueAtTime(80, now);
    oscThud.frequency.linearRampToValueAtTime(30, now + 0.3);
    
    gainThud.gain.setValueAtTime(0.2, now);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    oscThud.connect(gainThud);
    gainThud.connect(this.ctx.destination);
    oscThud.start(now);
    oscThud.stop(now + 0.3);

    // 3. Locking click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1400, now + 0.05);
    
    clickGain.gain.setValueAtTime(0.08, now + 0.05);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now + 0.05);
    clickOsc.stop(now + 0.12);
  }

  playEnergySurge() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Electric hum with vibrato charging effect
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const lfoGain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 1.2);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(15, now); // Rapid oscillations
    lfoGain.gain.setValueAtTime(35, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 1.2);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 1.3);
    lfo.stop(now + 1.3);
  }

  playTextReveal() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Molten metal sizzling hiss (high bandpass noise)
    const bufferSize = this.ctx.sampleRate * 1.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 1.1);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.07, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseNode.start(now);
    
    // Low metallic hum cooling thud
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(50, now);
    rumbleGain.gain.setValueAtTime(0.15, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    rumble.start(now);
    rumble.stop(now + 1.1);
  }

  playFinalBurst() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Deep heavy plasma explosion boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.9);
    
    subGain.gain.setValueAtTime(0.38, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 1.1);
    
    // Explosion debris noise crackle
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1100, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 0.6);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.24, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    
    // Crystal ringing sound
    const oscShine = this.ctx.createOscillator();
    const shineGain = this.ctx.createGain();
    oscShine.type = 'sine';
    oscShine.frequency.setValueAtTime(2800, now);
    shineGain.gain.setValueAtTime(0.14, now);
    shineGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    
    oscShine.connect(shineGain);
    shineGain.connect(this.ctx.destination);
    oscShine.start(now);
    oscShine.stop(now + 1.6);
  }

  playSteadyHum() {
    this.initCtx();
    if (!this.ctx) return null;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, now);
    
    gain.gain.setValueAtTime(0.04, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    return {
      stop: () => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.4);
          osc.stop(this.ctx!.currentTime + 0.5);
        } catch (e) {}
      }
    };
  }

  playReverseFinalBurst() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
    
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.45);
    gain.gain.setValueAtTime(0, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playReverseTextReveal() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.6);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.6);
    gain.gain.setValueAtTime(0, now + 0.7);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playReverseEnergySurge() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.7);
    
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  playReverseLayerUnlock() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);
    
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Particle class representing sparks and smoke arcs inside the canvas
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'friction' | 'plasma' | 'molten' | 'smoke' | 'electric';
  angle?: number;
  speed?: number;

  constructor(
    x: number, 
    y: number, 
    type: 'friction' | 'plasma' | 'molten' | 'smoke' | 'electric',
    colorOverride?: string
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.maxLife = type === 'smoke' ? 60 + Math.random() * 40 : 30 + Math.random() * 30;
    this.life = this.maxLife;

    if (type === 'friction') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1; // Slight upward bias
      this.size = 1.5 + Math.random() * 2;
      this.color = colorOverride || `hsl(${25 + Math.random() * 20}, 100%, ${55 + Math.random() * 25}%)`; // Hot orange sparks
    } else if (type === 'molten') {
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = -(1 + Math.random() * 2); // Drift upwards
      this.size = 2 + Math.random() * 2.5;
      this.color = `hsl(${15 + Math.random() * 15}, 100%, ${50 + Math.random() * 20}%)`; // Sizzling molten orange-red
    } else if (type === 'electric') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = 1 + Math.random() * 1.5;
      this.color = '#34d399'; // Bright emerald green energy spark
    } else if (type === 'plasma') {
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = (Math.random() - 0.5) * 6;
      this.size = 2 + Math.random() * 3;
      this.color = '#60a5fa'; // Bright cyan/blue plasma burst
    } else {
      // Smoke
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = -0.3 - Math.random() * 0.6;
      this.size = 10 + Math.random() * 15;
      this.color = `rgba(30, 41, 59, ${0.15 + Math.random() * 0.15})`; // Slate dark smoke
    }
  }

  update(gravity = 0.08, vacuumMode = false, targetX = 0, targetY = 0) {
    if (vacuumMode) {
      // Outro vacuum mode: particles are sucked back into the center
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.vx += (dx / dist) * 0.4;
        this.vy += (dy / dist) * 0.4;
        // Dampen velocity to prevent wild orbiting
        this.vx *= 0.88;
        this.vy *= 0.88;
      }
      this.x += this.vx;
      this.y += this.vy;
    } else {
      this.x += this.vx;
      this.y += this.vy;
      if (this.type === 'friction' || this.type === 'molten') {
        this.vy += gravity; // Gravity pull
      }
    }
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.type === 'smoke') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    } else {
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<SplashStage>('intro_spark');
  const [interactiveReady, setInteractiveReady] = useState<boolean>(false);
  const [userTapped, setUserTapped] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthRef = useRef<SplashSoundGenerator | null>(null);
  const ambientHumRef = useRef<{ stop: () => void } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const stageRef = useRef<SplashStage>('intro_spark');

  // Sync stage to ref so canvas physics knows current stage
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // Handle lazy initialization of synthesizer
  const getSynth = (): SplashSoundGenerator => {
    if (!synthRef.current) {
      synthRef.current = new SplashSoundGenerator();
    }
    return synthRef.current;
  };

  // Timeline orchestration matching the specified storyboard
  useEffect(() => {
    // 1. Intro Spark: Sparks ignite in darkness
    getSynth().playSparkIgnite();
    triggerSparkExplosion(25, 'friction');

    // 2. Layer Formation: Metallic plates slide & lock
    const tPlate = setTimeout(() => {
      setStage('layer_formation');
      getSynth().playLayerLock();
      triggerSparkExplosion(30, 'friction', '#94a3b8'); // Gray metal friction sparks
    }, 1500);

    // 3. Energy Surge: Neon green pulses through arrow and links
    const tSurge = setTimeout(() => {
      setStage('energy_surge');
      getSynth().playEnergySurge();
      triggerSparkExplosion(20, 'electric');
    }, 3200);

    // 4. Text Reveal: "SAFETY LINK" emerges from molten hot metal
    const tText = setTimeout(() => {
      setStage('text_reveal');
      getSynth().playTextReveal();
      triggerSparkExplosion(40, 'molten');
    }, 4700);

    // 5. Final Burst: Massive plasma explosion
    const tBurst = setTimeout(() => {
      setStage('final_burst');
      getSynth().playFinalBurst();
      triggerSparkExplosion(80, 'plasma');
      triggerSparkExplosion(40, 'electric');
    }, 6200);

    // 6. Outro / Steady Glow: glows steadily with subtle smoke & reflections
    const tSteady = setTimeout(() => {
      setStage('steady_glow');
      setInteractiveReady(true);
      ambientHumRef.current = getSynth().playSteadyHum();
    }, 7400);

    // Auto-transition to exit reverse sequence after glowing steadily for 3.5 seconds
    const tAutoExit = setTimeout(() => {
      initiateExitSequence();
    }, 10900);

    return () => {
      clearTimeout(tPlate);
      clearTimeout(tSurge);
      clearTimeout(tText);
      clearTimeout(tBurst);
      clearTimeout(tSteady);
      clearTimeout(tAutoExit);
      if (ambientHumRef.current) {
        ambientHumRef.current.stop();
      }
    };
  }, []);

  // Storyboard reversed exit/outro sequences
  const initiateExitSequence = () => {
    if (stageRef.current.startsWith('outro_') || stageRef.current === 'done') return;
    setUserTapped(true);
    
    if (ambientHumRef.current) {
      ambientHumRef.current.stop();
    }

    // A. Outro Burst Reverse (Implosion)
    setStage('outro_burst_rev');
    getSynth().playReverseFinalBurst();
    triggerVacuumImplosion(50, 'plasma');

    // B. Outro Text Reverse (Text heats and dissolves)
    setTimeout(() => {
      setStage('outro_text_rev');
      getSynth().playReverseTextReveal();
      triggerVacuumImplosion(30, 'molten');
    }, 600);

    // C. Outro Energy Reverse (Neon green drains)
    setTimeout(() => {
      setStage('outro_energy_rev');
      getSynth().playReverseEnergySurge();
      triggerVacuumImplosion(20, 'electric');
    }, 1200);

    // D. Outro Plates Reverse (Plates slide apart)
    setTimeout(() => {
      setStage('outro_plates_rev');
      getSynth().playReverseLayerUnlock();
      triggerSparkExplosion(25, 'friction', '#475569');
    }, 1800);

    // E. Outro Spark Reverse (Sparks fade, black screen)
    setTimeout(() => {
      setStage('outro_spark_rev');
      triggerSparkExplosion(10, 'friction');
    }, 2400);

    // F. Done! Complete callback unmounts splash screen
    setTimeout(() => {
      setStage('done');
      onComplete();
    }, 3000);
  };

  // Spark helpers
  const triggerSparkExplosion = (
    count: number, 
    type: 'friction' | 'plasma' | 'molten' | 'electric',
    colorOverride?: string
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(cx, cy, type, colorOverride));
    }
  };

  const triggerVacuumImplosion = (
    count: number, 
    type: 'friction' | 'plasma' | 'molten' | 'electric'
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < count; i++) {
      // Spawn particles along the outer rim or boundary and pull them inward
      const angle = Math.random() * Math.PI * 2;
      const radius = 200 + Math.random() * 150;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      const p = new Particle(px, py, type);
      // Give initial velocity heading away slightly so vacuum captures them elegantly
      p.vx = -Math.cos(angle) * 2;
      p.vy = -Math.sin(angle) * 2;
      particlesRef.current.push(p);
    }
  };

  // Particles animation frame loops running on HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const curStage = stageRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Spawn ambient smoke/ember particles during appropriate stages
      if (curStage === 'steady_glow' && Math.random() < 0.08) {
        particlesRef.current.push(new Particle(cx + (Math.random() - 0.5) * 160, cy + 60, 'smoke'));
        particlesRef.current.push(new Particle(cx + (Math.random() - 0.5) * 120, cy + 40, 'molten'));
      }
      if (curStage === 'intro_spark' && Math.random() < 0.15) {
        particlesRef.current.push(new Particle(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, 'friction'));
      }

      // Update and draw all particles
      const isVacuum = curStage.startsWith('outro_');
      particlesRef.current.forEach((p, idx) => {
        p.update(0.06, isVacuum, cx, cy);
        p.draw(ctx);
        if (p.life <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // Render custom branching lightning plasma arcs during Final Burst stage
      if (curStage === 'final_burst' && Math.random() < 0.3) {
        ctx.save();
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
        ctx.lineWidth = 1.5 + Math.random() * 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#60a5fa';

        ctx.beginPath();
        let ax = cx;
        let ay = cy;
        ctx.moveTo(ax, ay);

        const segments = 5;
        const angle = Math.random() * Math.PI * 2;
        const distance = 120 + Math.random() * 80;

        for (let j = 0; j < segments; j++) {
          const ratio = (j + 1) / segments;
          const targetX = cx + Math.cos(angle) * distance * ratio;
          const targetY = cy + Math.sin(angle) * distance * ratio;
          const jitterX = (Math.random() - 0.5) * 25;
          const jitterY = (Math.random() - 0.5) * 25;
          
          ax = targetX + (ratio < 1 ? jitterX : 0);
          ay = targetY + (ratio < 1 ? jitterY : 0);
          ctx.lineTo(ax, ay);
        }
        ctx.stroke();
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div 
      id="splash-reveal-container" 
      onClick={interactiveReady ? initiateExitSequence : undefined}
      className={`fixed inset-0 bg-[#06080c] text-white flex flex-col items-center justify-center z-[99999] overflow-hidden select-none scanlines transition-all duration-1000 ${
        stage === 'outro_spark_rev' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background Interactive Particle Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-10 mix-blend-screen"
      />

      {/* Cybernetic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40 z-0" />
      
      {/* Background radial neon vignette glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,rgba(59,130,246,0.08)_50%,rgba(6,8,12,0.95)_100%)] pointer-events-none z-0" />

      {/* The Central Cinematic Animation Assembly Stage */}
      <div className="relative flex flex-col items-center justify-center z-20 w-[420px] h-[420px]">
        
        {/* Outline Shield Vector (Stage 1: Faint outlines pulsing Cyan/Blue) */}
        <AnimatePresence>
          {['intro_spark', 'layer_formation', 'energy_surge', 'text_reveal', 'outro_plates_rev', 'outro_spark_rev'].includes(stage) && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: stage === 'intro_spark' ? [0.2, 0.45, 0.35] : 0.15,
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: 'easeOut',
                opacity: { repeat: stage === 'intro_spark' ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }
              }}
              className="absolute pointer-events-none"
            >
              <svg className="w-64 h-64 text-blue-500/40 fill-none stroke-current" viewBox="0 0 100 100" strokeWidth="1" strokeDasharray="4 4">
                {/* Shield Outline shape */}
                <path d="M 50 10 C 75 12, 85 20, 85 45 C 85 75, 50 90, 50 90 C 50 90, 15 75, 15 45 C 15 20, 25 12, 50 10 Z" />
                <circle cx="50" cy="50" r="32" className="animate-pulse" style={{ animationDuration: '4s' }} />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Moving Metallic Plates (Stage 2: Slide and Snap/Lock) */}
        <AnimatePresence>
          {['layer_formation', 'energy_surge', 'text_reveal', 'outro_energy_rev'].includes(stage) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              
              {/* Top Plate */}
              <motion.div
                initial={{ y: -300, opacity: 0, rotateX: -60 }}
                animate={{ y: 0, opacity: 0.85, rotateX: 0 }}
                exit={{ y: -350, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className="absolute w-48 h-16 bg-slate-800/80 border border-slate-700/60 rounded-t-3xl shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center"
                style={{ transformStyle: 'preserve-3d', top: '15%' }}
              >
                <div className="w-16 h-1 bg-blue-500/50 rounded-full animate-pulse" />
              </motion.div>

              {/* Left Plate */}
              <motion.div
                initial={{ x: -300, opacity: 0, rotateY: 60 }}
                animate={{ x: 0, opacity: 0.85, rotateY: 0 }}
                exit={{ x: -350, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className="absolute w-20 h-44 bg-slate-800/80 border border-slate-700/60 rounded-l-3xl shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                style={{ transformStyle: 'preserve-3d', left: '10%' }}
              />

              {/* Right Plate */}
              <motion.div
                initial={{ x: 300, opacity: 0, rotateY: -60 }}
                animate={{ x: 0, opacity: 0.85, rotateY: 0 }}
                exit={{ x: 350, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className="absolute w-20 h-44 bg-slate-800/80 border border-slate-700/60 rounded-r-3xl shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                style={{ transformStyle: 'preserve-3d', right: '10%' }}
              />

              {/* Bottom Plate */}
              <motion.div
                initial={{ y: 300, opacity: 0, rotateX: 60 }}
                animate={{ y: 0, opacity: 0.85, rotateX: 0 }}
                exit={{ y: 350, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className="absolute w-48 h-16 bg-slate-800/80 border border-slate-700/60 rounded-b-3xl shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                style={{ transformStyle: 'preserve-3d', bottom: '15%' }}
              />

            </div>
          )}
        </AnimatePresence>

        {/* Neon Energy surge overlays (Stage 3: Green light pulses) */}
        <AnimatePresence>
          {['energy_surge', 'text_reveal', 'outro_text_rev'].includes(stage) && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.05, opacity: [0.3, 0.9, 0.6] }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.0, opacity: { repeat: Infinity, duration: 1.0, ease: 'easeInOut' } }}
              className="absolute z-20 pointer-events-none flex flex-col items-center justify-center gap-2"
            >
              {/* Vibrant glowing neon chain and arrow */}
              <svg className="w-40 h-40 text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.95)] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                {/* Arrow head */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h6v6" />
                {/* diagonal arrow tail and chain loops */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7L10 16m-2-1H5a3 3 0 00-3 3v2a1 1 0 001 1h2a3 3 0 003-3v-1" />
              </svg>
              <div className="text-[9px] font-mono text-emerald-300 tracking-[0.25em] uppercase font-black bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                ⚡ SECURE LINK ACTIVE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Molten metal text reveal "SAFETY LINK" (Stage 4) */}
        <AnimatePresence>
          {stage === 'text_reveal' && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="absolute bottom-4 flex flex-col items-center z-30 pointer-events-none"
            >
              <span 
                className="text-3xl font-mono font-black tracking-[0.3em] uppercase select-none animate-pulse"
                style={{
                  background: 'linear-gradient(to bottom, #ff9900, #ff3300, #b3b3b3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 10px rgba(255,51,0,0.85))'
                }}
              >
                SAFETY LINK
              </span>
              <span className="text-[8px] text-slate-400 font-mono tracking-widest mt-1 uppercase font-semibold">
                COOLING STEEL ALLOY FORMATION...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Finished Premium Logo (Stage 5, 6 & Outro Steady State) */}
        <AnimatePresence>
          {['final_burst', 'steady_glow', 'outro_burst_rev', 'outro_text_rev'].includes(stage) && (
            <motion.div
              initial={{ scale: 0.15, opacity: 0, rotateY: 180 }}
              animate={{ 
                scale: stage === 'final_burst' ? 1.15 : 1, 
                opacity: 1, 
                rotateY: 0 
              }}
              exit={{ scale: 0.1, opacity: 0, filter: 'blur(10px)' }}
              transition={{
                type: 'spring',
                stiffness: 110,
                damping: 12,
                duration: 0.7
              }}
              className="relative p-12 rounded-[2.5rem] bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-[0_35px_80px_rgba(0,0,0,0.98),0_0_60px_rgba(59,130,246,0.25)] flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Cinematic sweeping metallic lighting reflections */}
              <motion.div
                animate={{
                  x: ['-200%', '300%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none z-10"
              />

              {/* Subtly moving smoke/reflection overlay inside card */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.02)_0%,rgba(59,130,246,0.06)_60%,transparent_100%)] mix-blend-screen pointer-events-none" />

              {/* Vector Core Logo component */}
              <div className="relative w-64 h-64 flex items-center justify-center scale-95">
                <svg 
                  version="1.0" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 600 327" 
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full drop-shadow-[0_4px_24px_rgba(52,211,153,0.3)]"
                >
                  <defs>
                    {/* Vivid Multi-stop Neon Green Gradient */}
                    <linearGradient id="logoSplashGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#047857" />
                      <stop offset="20%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#34d399" />
                      <stop offset="80%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#064e3b" />
                    </linearGradient>

                    {/* Polished Steel Chrome Gradient */}
                    <linearGradient id="logoSplashSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="15%" stopColor="#475569" />
                      <stop offset="30%" stopColor="#8f9fae" />
                      <stop offset="45%" stopColor="#cbd5e1" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="55%" stopColor="#cbd5e1" />
                      <stop offset="70%" stopColor="#475569" />
                      <stop offset="85%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>

                    {/* High-contrast Bevel Reflection Filter */}
                    <filter id="splashBevelReflection">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
                      <feSpecularLighting in="blur" surfaceScale="7" specularConstant="1.4" specularExponent="30" lightingColor="#fff" result="spec">
                        <feDistantLight azimuth="225" elevation="45" />
                      </feSpecularLighting>
                      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
                      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                    </filter>

                    {/* Dual Layer Neon Green Glow Filter */}
                    <filter id="neonGreenGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#10b981" floodOpacity="0.85" />
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="1" />
                    </filter>
                  </defs>
                  
                  {/* Outer Shield Frame (Polished Steel) */}
                  <g fill="url(#logoSplashSteelGrad)" filter="url(#splashBevelReflection)" transform="translate(0,327) scale(0.100000,-0.100000)" stroke="none">
                    {/* Top peak accent */}
                    <path d="M3880 3263 c-19 -2 -135 -17 -257 -33 -121 -17 -225 -30 -230 -30 -4 -1 28 -34 72 -75 l80 -75 -224 -221 c-122 -121 -221 -221 -220 -223 2 -1 24 -11 49 -22 25 -10 58 -31 75 -45 l30 -27 212 208 211 208 84 -76 c45 -41 101 -93 124 -114 l41 -39 1 83 c2 130 12 357 18 426 6 68 12 63 -66 55z" />
                    {/* Shield upper shell */}
                    <path d="M2919 3068 c-194 -139 -395 -221 -627 -259 -37 -5 -70 -15 -74 -22 -12 -18 -10 -390 3 -487 11 -95 37 -229 47 -247 5 -7 36 16 85 63 l77 74 -10 43 c-6 23 -14 123 -17 223 l-6 181 89 22 c152 38 342 121 462 202 24 16 48 29 53 29 6 0 29 -13 52 -28 23 -16 66 -42 94 -58 l53 -29 69 69 70 69 -97 54 c-54 30 -130 78 -169 107 l-71 53 -83 -59z" />
                    {/* Outer mechanical brace */}
                    <path d="M3481 2493 c-295 -289 -327 -313 -391 -294 -20 6 -49 24 -65 41 -40 42 -70 38 -129 -15 l-50 -44 40 -47 c22 -26 64 -61 94 -78 50 -28 63 -31 140 -31 67 0 94 5 130 23 44 21 340 294 340 313 0 21 -23 3 -157 -126 -78 -74 -146 -135 -152 -135 -6 0 -11 -3 -11 -8 0 -4 -19 -15 -42 -25 -60 -27 -166 -24 -223 4 -51 26 -115 83 -115 103 0 19 57 66 80 66 10 0 37 -16 60 -35 36 -30 49 -35 92 -35 59 0 75 11 228 160 52 51 128 124 168 163 39 39 72 74 72 79 0 4 5 8 11 8 16 0 3 -203 -22 -352 -32 -197 -108 -380 -212 -515 -65 -85 -181 -191 -279 -256 l-86 -58 -72 47 c-39 25 -87 59 -106 76 l-34 30 -37 -30 c-21 -17 -53 -46 -71 -65 l-33 -34 48 -40 c68 -57 189 -136 253 -168 l55 -27 80 46 c399 224 617 545 691 1016 21 139 25 469 5 493 -7 10 -16 17 -20 17 -4 0 -130 -120 -280 -267z" />
                    {/* Underlayer frame anchor */}
                    <path d="M2886 2504 c-71 -22 -90 -37 -327 -260 -118 -111 -227 -212 -244 -226 l-29 -26 18 -58 c32 -100 147 -309 167 -302 4 2 35 30 69 62 l62 59 -21 36 c-12 20 -36 64 -54 99 -29 58 -31 65 -15 76 9 7 100 91 203 187 102 96 194 177 203 181 27 11 81 9 105 -3 12 -7 37 -25 55 -40 18 -16 40 -29 48 -29 9 0 38 21 65 48 l50 47 -26 37 c-33 48 -97 92 -165 112 -65 19 -100 19 -164 0z" />
                    {/* Central core node */}
                    <path d="M2750 1824 c-320 -302 -323 -304 -379 -304 -120 0 -175 141 -88 227 l35 35 -28 62 c-15 33 -31 72 -36 84 -9 23 -11 23 -72 -33 -86 -79 -117 -145 -116 -245 1 -91 28 -154 92 -218 61 -62 120 -86 212 -86 59 -1 85 4 121 22 28 14 155 123 324 279 l278 257 -59 13 c-32 8 -73 22 -92 33 -18 11 -34 20 -35 20 -1 0 -72 -66 -157 -146z" />
                  </g>
                  
                  {/* Central Chain and Arrow (Neon Green Alloy with double glow) */}
                  <g fill="url(#logoSplashGreenGrad)" filter="url(#neonGreenGlow)" transform="translate(0,327) scale(0.100000,-0.100000)" stroke="none">
                    {/* Chain loop core */}
                    <path d="M1900 1300 c-50 -50 -100 -120 -120 -160 c-30 -50 -40 -110 -20 -170 c20 -60 70 -110 130 -130 c60 -20 120 -10 170 20 c40 20 110 70 160 120 l90 90 l-50 50 l-50 50 l-90 -90 c-30 -30 -80 -70 -110 -80 c-50 -20 -110 0 -140 40 c-30 40 -30 100 0 140 c30 30 180 180 210 210 c40 40 100 40 140 0 c30 -30 90 -90 120 -120 l50 -50 l50 50 l50 50 l-50 50 c-30 30 -90 90 -120 120 c-70 70 -170 70 -240 0 l-90 -90 z" />
                    {/* Arrow head diagonal */}
                    <path d="M3400 2800 l0 -400 l120 120 l280 -280 l140 140 l-280 280 l120 120 l-380 0 z" />
                    {/* Arrow stem diagonal connector */}
                    <path d="M2300 1700 l900 900 l-140 140 l-900 -900 l140 -140 z" />
                  </g>

                  {/* Polished Metal Text "SAFETY LINK" */}
                  <g fill="url(#logoSplashSteelGrad)" filter="url(#splashBevelReflection)" transform="translate(0,327) scale(0.100000,-0.100000)" stroke="none">
                    {/* Letter S */}
                    <path d="M177 980 c-125 -32 -194 -136 -154 -233 22 -51 78 -83 191 -111 119 -30 148 -47 144 -84 -5 -40 -40 -54 -124 -49 -48 3 -88 12 -129 31 -32 14 -59 25 -59 24 -1 -2 -11 -24 -24 -51 l-22 -47 33 -20 c52 -32 132 -52 216 -52 129 -1 207 37 243 119 44 99 -11 185 -138 218 -185 46 -223 69 -187 114 36 44 154 47 236 6 17 -8 31 -15 32 -15 3 0 45 97 45 104 0 2 -25 14 -57 26 -64 24 -189 34 -246 20z" />
                    {/* Letter A */}
                    <path d="M772 918 c-16 -35 -77 -166 -136 -291 -58 -126 -106 -229 -106 -230 0 -1 34 0 76 3 l76 5 23 55 23 55 144 3 143 3 26 -60 27 -59 76 -4 c42 -2 76 0 76 3 0 4 -30 69 -66 145 -37 77 -97 204 -135 284 l-69 145 -75 3 -74 3 -29 -63z M954 905 c12 -22 41 -83 65 -135" />
                    {/* Letter F */}
                    <path d="M1290 691 l0 -289 75 -4 75 -3 0 108 0 107 140 0 140 0 0 55 0 55 -140 0 -140 0 0 76 0 75 160 -3 160 -3 0 58 0 57 -235 0 -235 0 0 -289z" />
                    {/* Letter E */}
                    <path d="M1890 691 l0 -289 235 0 235 0 0 57 0 58 -160 -3 -160 -3 0 75 0 76 140 0 140 0 0 55 0 55 -140 0 -140 0 0 107 0 108 160 0 160 0 0 57 0 58 -235 0 -235 0 0 -289z" />
                    {/* Letter T */}
                    <path d="M2490 918 l0 -57 140 0 140 0 0 -232 0 -233 75 -3 75 -3 0 233 0 232 140 0 140 0 0 57 0 58 -355 0 -355 0 0 -57z" />
                    {/* Letter Y */}
                    <path d="M3090 918 c-16 -35 -77 -166 -136 -291 l-69 -145 0 -232 0 -233 75 -3 75 -3 0 233 0 232 140 0 140 0 0 -232 0 -233 75 -3 75 -3 0 233 0 232 c42 2 76 0 76 -3 0 -4 -30 -69 -66 -145" />
                  </g>
                </svg>
              </div>

              {/* Text Label cooled into polished display alloy style */}
              <div className="text-center mt-3 select-none">
                <span 
                  className="text-3xl font-mono font-black tracking-[0.25em] uppercase"
                  style={{
                    background: 'linear-gradient(to bottom, #ffffff, #cbd5e1, #64748b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.85))'
                  }}
                >
                  SAFETY LINK
                </span>
                <span className="block text-[8.5px] font-mono font-black text-emerald-400 tracking-[0.35em] uppercase mt-1 animate-pulse">
                  📡 HIGH-FIDELITY ACTIVE MESH SECURITY SECURED
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Futuristic steady-state biometric scanning feedback action button */}
      <AnimatePresence>
        {stage === 'steady_glow' && (
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={initiateExitSequence}
            className="absolute bottom-16 z-50 px-6 py-3.5 bg-slate-950/80 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)] group active:scale-95 transition-all duration-300 pointer-events-auto"
          >
            {/* Cyber biometric scanner ring indicator */}
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <span className="absolute w-full h-full rounded-full border border-emerald-500/40 animate-ping" />
              <span className="absolute w-5 h-5 rounded-full border border-emerald-400/60 animate-pulse" />
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
            </div>
            
            <div className="text-left font-mono">
              <span className="text-[10px] font-extrabold text-slate-100 block uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
                {userTapped ? 'INITIALIZING DECK BRIDGE...' : 'ACCESS SECURITY DECKS'}
              </span>
              <span className="text-[7.5px] text-slate-500 block uppercase tracking-widest mt-0.5">
                Biometric Finger-Scan or click to bridge
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating System Log Tickers */}
      <div className="absolute bottom-6 left-8 right-8 font-mono text-[7px] text-slate-600 tracking-wider flex justify-between uppercase pointer-events-none z-10">
        <span>[ NODE: SL-PRE-CORE ]</span>
        <span>[ STATUS: {stage.replace('_', ' ')} ]</span>
        <span>[ FREQ: 2.4GHZ MESH ]</span>
      </div>
    </div>
  );
};
