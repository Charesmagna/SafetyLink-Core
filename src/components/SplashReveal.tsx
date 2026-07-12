import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import slLogoMain from '../assets/images/sl_logomain.jpeg';

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

// Tactical Industrial Sound Engine — deep physical character, no sci-fi sweeps
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

  // Helper: white noise buffer source
  private makeNoise(duration: number): [AudioBufferSourceNode, AudioBuffer] {
    const ctx = this.ctx!;
    const size = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return [src, buf];
  }

  // Stage: initial power-on — deep electrical breath, distant relay click
  playSparkIgnite() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sub-bass power breath — sine 28Hz swells in like a generator starting
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(28, now);
    sub.frequency.linearRampToValueAtTime(48, now + 1.4);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.22, now + 0.6);
    subGain.gain.linearRampToValueAtTime(0.08, now + 1.4);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    sub.connect(subGain); subGain.connect(ctx.destination);
    sub.start(now); sub.stop(now + 1.8);

    // Filtered noise — air through a vent, low rumble texture
    const [noise] = this.makeNoise(1.6);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 80;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(0.07, now + 0.4);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    noise.connect(hp); hp.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
    noise.start(now);

    // Single relay click — sharp filtered transient
    const click = ctx.createOscillator();
    const cg = ctx.createGain();
    click.type = 'sine'; click.frequency.value = 1100;
    cg.gain.setValueAtTime(0.12, now + 0.9);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    click.connect(cg); cg.connect(ctx.destination);
    click.start(now + 0.9); click.stop(now + 0.96);
  }

  // Stage: armour layers locking — heavy bolt, metal resonance ring
  playLayerLock() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Heavy impact thud — sine at 55Hz decays fast like a vault door
    const thud = ctx.createOscillator();
    const tg = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(55, now);
    thud.frequency.exponentialRampToValueAtTime(22, now + 0.35);
    tg.gain.setValueAtTime(0.45, now);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    thud.connect(tg); tg.connect(ctx.destination);
    thud.start(now); thud.stop(now + 0.4);

    // Metal resonance ring — sine at 420Hz, long decay like struck steel plate
    const ring = ctx.createOscillator();
    const rg = ctx.createGain();
    ring.type = 'sine'; ring.frequency.value = 420;
    rg.gain.setValueAtTime(0.09, now + 0.02);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    ring.connect(rg); rg.connect(ctx.destination);
    ring.start(now + 0.02); ring.stop(now + 0.92);

    // Mechanical bolt snap — narrow bandpass noise burst
    const [boltNoise] = this.makeNoise(0.12);
    const bf = ctx.createBiquadFilter();
    bf.type = 'bandpass'; bf.frequency.value = 2200; bf.Q.value = 3;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.18, now + 0.04);
    bg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    boltNoise.connect(bf); bf.connect(bg); bg.connect(ctx.destination);
    boltNoise.start(now + 0.04);
  }

  // Stage: energy charging — deep electrical turbine swell, no pitch sweep
  playEnergySurge() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Turbine hum — two detuned sines create a beating low frequency rumble
    const f1 = ctx.createOscillator();
    const f2 = ctx.createOscillator();
    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    f1.type = 'sine'; f1.frequency.setValueAtTime(82, now); f1.frequency.linearRampToValueAtTime(88, now + 1.2);
    f2.type = 'sine'; f2.frequency.setValueAtTime(86, now); f2.frequency.linearRampToValueAtTime(92, now + 1.2);
    g1.gain.setValueAtTime(0, now); g1.gain.linearRampToValueAtTime(0.14, now + 0.3); g1.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(0.10, now + 0.4); g2.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    f1.connect(g1); g1.connect(ctx.destination);
    f2.connect(g2); g2.connect(ctx.destination);
    f1.start(now); f1.stop(now + 1.35);
    f2.start(now); f2.stop(now + 1.35);

    // Low filtered noise — electrical interference texture
    const [en] = this.makeNoise(1.2);
    const ef = ctx.createBiquadFilter();
    ef.type = 'bandpass'; ef.frequency.value = 150; ef.Q.value = 0.8;
    const eg = ctx.createGain();
    eg.gain.setValueAtTime(0, now); eg.gain.linearRampToValueAtTime(0.05, now + 0.5); eg.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    en.connect(ef); ef.connect(eg); eg.connect(ctx.destination);
    en.start(now);
  }

  // Stage: text reveal — low metal scrape, steel on concrete
  playTextReveal() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Steel scrape — bandpass noise, mid-low frequency, long fade
    const [scrape] = this.makeNoise(1.3);
    const sf = ctx.createBiquadFilter();
    sf.type = 'bandpass'; sf.frequency.setValueAtTime(600, now); sf.frequency.linearRampToValueAtTime(200, now + 1.0); sf.Q.value = 1.2;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.11, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    scrape.connect(sf); sf.connect(sg); sg.connect(ctx.destination);
    scrape.start(now);

    // Resonant sub thud underneath
    const sub2 = ctx.createOscillator();
    const s2g = ctx.createGain();
    sub2.type = 'sine'; sub2.frequency.setValueAtTime(42, now);
    s2g.gain.setValueAtTime(0.18, now);
    s2g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    sub2.connect(s2g); s2g.connect(ctx.destination);
    sub2.start(now); sub2.stop(now + 0.65);
  }

  // Stage: final reveal — concussive deep boom, air pressure, metal ring
  playFinalBurst() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Concussive sub boom — starts at 80Hz drops to 18Hz like a shockwave
    const boom = ctx.createOscillator();
    const bg = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(18, now + 0.8);
    bg.gain.setValueAtTime(0.5, now);
    bg.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    boom.connect(bg); bg.connect(ctx.destination);
    boom.start(now); boom.stop(now + 1.05);

    // Air pressure release — filtered noise, low frequency only
    const [air] = this.makeNoise(0.8);
    const af = ctx.createBiquadFilter();
    af.type = 'lowpass'; af.frequency.setValueAtTime(280, now); af.frequency.exponentialRampToValueAtTime(60, now + 0.7);
    const ag = ctx.createGain();
    ag.gain.setValueAtTime(0.28, now); ag.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    air.connect(af); af.connect(ag); ag.connect(ctx.destination);
    air.start(now);

    // Steel ring decay — 380Hz, long tail
    const ring2 = ctx.createOscillator();
    const rg2 = ctx.createGain();
    ring2.type = 'sine'; ring2.frequency.value = 380;
    rg2.gain.setValueAtTime(0.08, now + 0.05);
    rg2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    ring2.connect(rg2); rg2.connect(ctx.destination);
    ring2.start(now + 0.05); ring2.stop(now + 2.05);
  }

  // Stage: steady glow — ultra-low sine hum, barely audible ambient presence
  playSteadyHum() {
    this.initCtx();
    if (!this.ctx) return null;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const hum = ctx.createOscillator();
    const hf = ctx.createBiquadFilter();
    const hg = ctx.createGain();
    hum.type = 'sine'; hum.frequency.value = 48;
    hf.type = 'lowpass'; hf.frequency.value = 80;
    hg.gain.setValueAtTime(0.03, now);
    hum.connect(hf); hf.connect(hg); hg.connect(ctx.destination);
    hum.start(now);
    return {
      stop: () => {
        try {
          hg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          hum.stop(ctx.currentTime + 0.55);
        } catch (e) {}
      }
    };
  }

  // Outro — reverse: quick low pressure exhale
  playReverseFinalBurst() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const [outNoise] = this.makeNoise(0.5);
    const of2 = ctx.createBiquadFilter();
    of2.type = 'lowpass'; of2.frequency.setValueAtTime(180, now); of2.frequency.linearRampToValueAtTime(60, now + 0.45);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.001, now); og.gain.linearRampToValueAtTime(0.14, now + 0.3); og.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    outNoise.connect(of2); of2.connect(og); og.connect(ctx.destination);
    outNoise.start(now);
  }

  // Outro — reverse text: low metal scrape out
  playReverseTextReveal() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const [rs] = this.makeNoise(0.7);
    const rf = ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.setValueAtTime(200, now); rf.frequency.linearRampToValueAtTime(600, now + 0.6); rf.Q.value = 1.0;
    const rg3 = ctx.createGain();
    rg3.gain.setValueAtTime(0.001, now); rg3.gain.linearRampToValueAtTime(0.08, now + 0.5); rg3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    rs.connect(rf); rf.connect(rg3); rg3.connect(ctx.destination);
    rs.start(now);
  }

  // Outro — reverse energy: turbine winding down
  playReverseEnergySurge() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const wd = ctx.createOscillator();
    const wg = ctx.createGain();
    wd.type = 'sine';
    wd.frequency.setValueAtTime(88, now);
    wd.frequency.linearRampToValueAtTime(52, now + 0.8);
    wg.gain.setValueAtTime(0.10, now);
    wg.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    wd.connect(wg); wg.connect(ctx.destination);
    wd.start(now); wd.stop(now + 0.9);
  }

  // Outro — reverse layer unlock: single dull clunk
  playReverseLayerUnlock() {
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const ck = ctx.createOscillator();
    const ckg = ctx.createGain();
    ck.type = 'sine'; ck.frequency.setValueAtTime(52, now); ck.frequency.exponentialRampToValueAtTime(25, now + 0.3);
    ckg.gain.setValueAtTime(0.25, now); ckg.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    ck.connect(ckg); ckg.connect(ctx.destination);
    ck.start(now); ck.stop(now + 0.38);
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

              {/* Official Brand Logo — sl_logomain.jpeg */}
              <div className="relative w-72 h-72 flex items-center justify-center">
                <img
                  src={slLogoMain}
                  alt="SafetyLink Official Logo"
                  className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(52,211,153,0.6)] rounded-2xl"
                  style={{ filter: 'drop-shadow(0 0 24px rgba(52,211,153,0.8)) drop-shadow(0 0 8px rgba(52,211,153,1))' }}
                />
              </div>
              {/* Hidden original SVG div — kept for type safety */}
              <div className="hidden w-64 h-64 flex items-center justify-center scale-95">
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
