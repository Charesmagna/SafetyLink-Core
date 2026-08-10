import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Smartphone, Monitor, MapPin, Bell, Users, Download,
  ArrowRight, Zap, Lock, Radio, ChevronRight, Menu, X,
  CheckCircle, Phone, Mail, Star, Play, ChevronDown,
  AlertTriangle, BarChart2, Cpu, Eye, Wifi, Activity
} from 'lucide-react';

const APK_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink.apk';
const EXE_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink-OrgConsole-Setup-1.0.0.exe';

const FEATURES = [
  {
    icon: <AlertTriangle />, title: 'Incident Management',
    items: ['Workflow board — alert to resolution', 'Guard patrol GPS tracking', 'Emergency dispatch coordination', 'Escalation policies & SLA'],
    color: 'text-red-400', bg: 'bg-red-900/10 border-red-900/20',
  },
  {
    icon: <Smartphone />, title: 'Field Operations',
    items: ['Mobile guard reporting', 'One-tap panic button', 'Personal alarms & BLE keyfobs', 'Offline mesh network'],
    color: 'text-blue-400', bg: 'bg-blue-900/10 border-blue-900/20',
  },
  {
    icon: <Wifi />, title: 'Integrations',
    items: ['IoT sensors — motion, smoke, vibration', 'CCTV live feed monitoring', 'API & Webhooks', 'Dual SIM 4G support'],
    color: 'text-purple-400', bg: 'bg-purple-900/10 border-purple-900/20',
  },
  {
    icon: <Bell />, title: 'Multi-Channel Alerts',
    items: ['Push, SMS, WhatsApp & Voice', 'On-call scheduling & duty rosters', 'Acknowledgement tracking', 'AI false-positive filtering'],
    color: 'text-yellow-400', bg: 'bg-yellow-900/10 border-yellow-900/20',
  },
  {
    icon: <BarChart2 />, title: 'Analytics & Monitoring',
    items: ['Crime heatmaps', 'Compliance & audit reports', 'Community feedback loops', 'Monthly reliability testing'],
    color: 'text-green-400', bg: 'bg-green-900/10 border-green-900/20',
  },
  {
    icon: <Cpu />, title: 'Modern Enhancements',
    items: ['AI video analytics', 'BLE/NFC smart wearables', 'Cloud microservices', 'Edge computing & local IoT'],
    color: 'text-orange-400', bg: 'bg-orange-900/10 border-orange-900/20',
  },
];

const PLANS = [
  {
    name: 'Basic', price: 'R299', period: '/month',
    description: 'Small teams and individuals',
    features: ['Up to 10 users', 'One-tap SOS panic button', 'Live GPS tracking', 'Push & SMS alerts', 'Email support'],
    highlight: false,
  },
  {
    name: 'Professional', price: 'R799', period: '/month',
    description: 'Security companies & estates',
    features: ['Up to 50 users', 'Everything in Basic', 'BLE keyfob integration', 'Windows org console', 'Offline mesh network', 'WhatsApp & Voice alerts', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    description: 'Large organisations & government',
    features: ['Unlimited users', 'Everything in Professional', 'White-label option', 'Anti-hijack Safety Ride', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee'],
    highlight: false,
  },
];

const TESTIMONIALS = [
  { name: 'Johan van der Merwe', role: 'Security Manager, Midrand Estate', text: 'SafetyLink transformed how we respond to incidents. Our reaction time dropped from 8 minutes to under 90 seconds.', rating: 5 },
  { name: 'Nomsa Dlamini', role: 'Operations Director, Gauteng Security', text: 'The offline mesh network is a game changer. Guards stay connected even in basement parkings with no signal.', rating: 5 },
  { name: 'Pieter Botha', role: 'Campus Safety, Pretoria University', text: 'BLE keyfobs mean students can trigger SOS without even unlocking their phones. Remarkable.', rating: 5 },
];

export default function Landing({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const playVideo = () => {
    if (videoRef.current) { videoRef.current.play(); setVideoPlaying(true); }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      setContactSent(true);
    } catch (_) { setContactSent(true); }
  };

  return (
    <div className="min-h-screen bg-sl-dark text-white overflow-x-hidden">

      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-sl-navy/95 backdrop-blur-xl border-b border-sl-border shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/sl-icon.png" alt="SafetyLink" className="w-9 h-9 rounded-xl object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="font-black text-xl tracking-tight">SafetyLink</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            {[['#features','Features'],['#how-it-works','How it Works'],['#pricing','Pricing'],['#contact','Contact']].map(([h,l]) => (
              <a key={h} href={h} className="text-slate-400 hover:text-white transition-colors">{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin} className="text-slate-300 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-all">Org Login</button>
            <button onClick={onSignup} className="bg-sl-red hover:bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/20">Register Organisation</button>
          </div>

          <button className="md:hidden text-slate-400 p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-sl-navy border-t border-sl-border px-6 py-5 space-y-4">
            {[['#features','Features'],['#how-it-works','How it Works'],['#pricing','Pricing'],['#contact','Contact']].map(([h,l]) => (
              <a key={h} href={h} className="block text-slate-300 py-1.5" onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <div className="pt-3 border-t border-sl-border space-y-3">
              <button onClick={() => { onLogin(); setMenuOpen(false); }} className="block w-full text-left text-slate-300 py-2">Org Login</button>
              <button onClick={() => { onSignup(); setMenuOpen(false); }} className="w-full bg-sl-red text-white font-bold py-3 rounded-xl">Register Organisation</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 hero-grid overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-10">
          <source src="/media/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-sl-red/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sl-red/10 border border-sl-red/20 text-sl-red text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <div className="w-2 h-2 bg-sl-red rounded-full animate-pulse" />
            South Africa's #1 Emergency Mesh Network
          </div>

          <div className="flex justify-center mb-8">
            <div className="relative float">
              <img src="/sl-icon.png" alt="SafetyLink" className="w-36 h-36 object-contain drop-shadow-2xl rounded-[2rem]"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }} />
              <div className="hidden w-36 h-36 items-center justify-center bg-sl-red/10 border-2 border-sl-red/30 rounded-[2rem]">
                <Shield className="w-16 h-16 text-sl-red" />
              </div>
              <div className="absolute -inset-6 bg-sl-red/5 rounded-full blur-3xl" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none mb-6">
            <span className="gradient-text">Protect</span> Your People.<br />
            <span className="text-slate-300 text-4xl sm:text-5xl md:text-6xl font-bold">Even When Networks Fail.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto mb-6 leading-relaxed">
            SafetyLink is a private emergency mesh network for South African security companies, residential estates, schools, and corporates.
            One-tap SOS. Live GPS tracking. BLE keyfob support. Works 100% offline.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500 mb-12">
            {['Works offline', 'BLE keyfob support', 'Multi-organisation', 'Android 8+', 'Built in SA'].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <a href={APK_URL} className="group flex items-center gap-4 bg-sl-red hover:bg-red-600 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-red-900/40 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              <Smartphone className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs font-normal opacity-75">Free Download</div>
                <div>Android APK</div>
              </div>
              <Download className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <a href={EXE_URL} className="group flex items-center gap-4 bg-sl-card hover:bg-sl-border border border-sl-border text-white font-bold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              <Monitor className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs text-slate-400 font-normal">Windows Console</div>
                <div>Org EXE</div>
              </div>
              <Download className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <button onClick={onSignup} className="group flex items-center gap-3 border-2 border-sl-red/40 hover:border-sl-red hover:bg-sl-red text-sl-red hover:text-white font-bold px-8 py-4 rounded-2xl transition-all w-full sm:w-auto justify-center">
              <Users className="w-5 h-5" />
              Register Your Organisation
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <p className="text-slate-600 text-xs">Enable "Install from unknown sources" on Android · Windows 10/11 for EXE</p>
          <div className="mt-16 animate-bounce"><ChevronDown className="w-6 h-6 text-slate-600 mx-auto" /></div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y border-sl-border bg-sl-navy/40">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '< 1s', label: 'SOS trigger time' },
            { val: '100m+', label: 'BLE mesh range' },
            { val: '5', label: 'iTag devices per user' },
            { val: '100%', label: 'Offline capable' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-black text-white mb-1">{s.val}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HERO IMAGE GRID */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Deployed across South Africa.</h2>
            <p className="text-slate-400 text-lg">From estates and campuses to corporate sites and rural communities.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { src: '/media/hero-officer.jpg', label: 'Field Deployment', sub: 'Officer tracking in real-time', span: 'md:col-span-2 md:row-span-2' },
              { src: '/media/hero-campus.jpg', label: 'Campus Safety', sub: 'University patrols' },
              { src: '/media/hero-control.jpg', label: 'Control Center', sub: 'Live monitoring dashboard' },
              { src: '/media/hero-team.jpg', label: 'Team Coordination', sub: 'Multi-user response' },
              { src: '/media/hero-app.jpg', label: 'Mobile App', sub: 'One-tap SOS interface' },
            ].map((img, i) => (
              <div key={img.src} className={`relative rounded-2xl overflow-hidden bg-sl-card border border-sl-border ${img.span || ''} ${i === 0 ? 'aspect-[4/3]' : 'aspect-square'}`}>
                <img src={img.src} alt={img.label} className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }} />
                <div className="hidden absolute inset-0 items-center justify-center bg-sl-card">
                  <div className="text-center text-slate-700 p-6">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-mono">{img.src.split('/').pop()}</p>
                    <p className="text-xs mt-1 opacity-50">Add to /media/</p>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
                  <p className="text-white text-sm font-semibold">{img.label}</p>
                  <p className="text-slate-400 text-xs">{img.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4 bg-sl-navy/20 border-y border-sl-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sl-red text-xs font-bold uppercase tracking-widest mb-4">
              <Zap className="w-3.5 h-3.5" /> Platform Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Everything you need. Nothing you don't.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Built specifically for the South African security landscape — from solo guards to enterprise operations centers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className={`border rounded-2xl p-6 hover:scale-[1.01] transition-all duration-300 card-glow ${f.bg}`}>
                <div className={`${f.color} mb-4 w-11 h-11 flex items-center justify-center bg-white/5 rounded-xl border border-white/5`}>
                  {React.cloneElement(f.icon as React.ReactElement, { className: 'w-5 h-5' })}
                </div>
                <h3 className="font-black text-white mb-3 text-lg">{f.title}</h3>
                <ul className="space-y-2">
                  {f.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-slate-400 text-sm">
                      <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${f.color}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">See it in action.</h2>
          <p className="text-slate-400 mb-12 text-lg">Watch SafetyLink handle a real emergency response in under 90 seconds.</p>
          <div className="relative rounded-3xl overflow-hidden bg-sl-card border border-sl-border aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" controls={videoPlaying} poster="/media/video-poster.jpg">
              <source src="/media/demo-video.mp4" type="video/mp4" />
            </video>
            {!videoPlaying && (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer" onClick={playVideo}>
                  <div className="w-20 h-20 bg-sl-red rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 text-left pointer-events-none">
                  <p className="text-white font-bold text-lg">SafetyLink Demo</p>
                  <p className="text-slate-300 text-sm">Emergency response in under 90 seconds</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 bg-sl-navy/30 border-y border-sl-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Two ways to use SafetyLink.</h2>
            <p className="text-slate-400 text-lg">Field users on Android. Organisations on web or Windows desktop.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-sl-card border border-sl-border rounded-3xl p-8 hover:border-sl-red/30 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-sl-red/10 border border-sl-red/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-sl-red" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Field Users</h3>
                  <p className="text-slate-500 text-sm">Android Mobile App — Free</p>
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {['Download the Android APK for free', 'Register as User, Responder, or join your Org with the Org ID', 'Pair your iTag BLE keyfob for hands-free SOS', 'One tap or one squeeze sends your GPS location immediately', 'Stays connected via BLE mesh even without mobile data'].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sl-red/10 text-sl-red text-xs font-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-sl-red/20">{i + 1}</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
              <a href={APK_URL} className="flex items-center justify-center gap-2 bg-sl-red hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all w-full hover:shadow-lg hover:shadow-red-900/30">
                <Download className="w-4 h-4" /> Download Free APK
              </a>
            </div>

            <div className="bg-sl-card border border-sl-border rounded-3xl p-8 hover:border-blue-700/30 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-900/30 border border-blue-800/20 rounded-2xl flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Organisations</h3>
                  <p className="text-slate-500 text-sm">Web Portal + Windows Console</p>
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {['Register your organisation here — takes 2 minutes', 'Get your unique Organisation ID (e.g. SL-ACME-1234)', 'Share the ID with your field users so they can join', 'Monitor everyone live — map, SOS alerts, incident log', 'Download the Windows console for full desktop experience'].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-900/30 text-blue-400 text-xs font-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-800/30">{i + 1}</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={onSignup} className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all">
                  <ArrowRight className="w-4 h-4" /> Register Organisation
                </button>
                <a href={EXE_URL} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-sl-border text-white font-semibold px-5 rounded-2xl transition-all">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sl-red text-xs font-bold uppercase tracking-widest mb-4">
              <Zap className="w-3.5 h-3.5" /> Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Simple, transparent pricing.</h2>
            <p className="text-slate-400 text-lg">No hidden fees. Cancel anytime. Android APK always free for field users.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative rounded-3xl p-8 border transition-all ${plan.highlight ? 'bg-sl-red/5 border-sl-red/40 shadow-2xl shadow-red-900/20 scale-[1.02]' : 'bg-sl-card border-sl-border'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sl-red text-white text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-wider">Most Popular</div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-sl-red' : 'text-green-400'}`} />
                      <span className="text-slate-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => plan.name === 'Enterprise' ? document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) : onSignup()}
                  className={`w-full py-3.5 rounded-2xl font-bold transition-all ${plan.highlight ? 'bg-sl-red hover:bg-red-600 text-white shadow-lg shadow-red-900/30' : 'bg-white/5 hover:bg-white/10 border border-sl-border text-white'}`}>
                  {plan.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-sm mt-8">All plans include the Android APK for field users at no extra cost. Pricing in ZAR excl. VAT.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 bg-sl-navy/30 border-y border-sl-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Trusted by security professionals.</h2>
            <p className="text-slate-400 text-lg">Real feedback from organisations across South Africa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-sl-card border border-sl-border rounded-2xl p-6 hover:border-sl-red/20 transition-all card-glow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Get in touch.</h2>
            <p className="text-slate-400 text-lg">Enterprise pricing, custom deployments, or just want to know more?</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                { icon: <Mail className="w-5 h-5 text-sl-red" />, label: 'Email', value: 'tshilidzi.mukwevho54@gmail.com', href: 'mailto:tshilidzi.mukwevho54@gmail.com' },
                { icon: <Phone className="w-5 h-5 text-sl-red" />, label: 'Phone / WhatsApp', value: '+27 68 007 9911', href: 'tel:+27680079911' },
                { icon: <MapPin className="w-5 h-5 text-sl-red" />, label: 'Location', value: 'Vlakfontein, Gauteng, South Africa', href: null },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sl-red/10 border border-sl-red/20 rounded-2xl flex items-center justify-center flex-shrink-0">{c.icon}</div>
                  <div>
                    <p className="text-white font-semibold">{c.label}</p>
                    {c.href ? <a href={c.href} className="text-slate-400 text-sm hover:text-white transition-colors">{c.value}</a>
                      : <p className="text-slate-400 text-sm">{c.value}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-sl-card border border-sl-border rounded-2xl p-6">
              {contactSent ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
                  <p className="text-white font-bold text-lg">Message sent!</p>
                  <p className="text-slate-400 text-sm mt-2">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <input type="text" placeholder="Your name" value={contactForm.name}
                    onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
                  <input type="email" placeholder="Email address" value={contactForm.email}
                    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
                  <textarea rows={4} placeholder="Tell us about your organisation and what you need..." value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm resize-none" />
                  <button type="submit" className="flex items-center justify-center gap-2 bg-sl-red hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all w-full">
                    Send Message <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-4 text-center relative overflow-hidden border-t border-sl-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-sl-red/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="float mb-8 inline-block">
            <img src="/sl-icon.png" alt="" className="w-24 h-24 rounded-3xl mx-auto shadow-2xl"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4">Protect your people. <span className="gradient-text">Today.</span></h2>
          <p className="text-slate-400 mb-10 text-xl">Join security companies, estates, and communities across South Africa.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onSignup} className="bg-sl-red hover:bg-red-600 text-white font-black px-10 py-5 rounded-2xl transition-all hover:shadow-2xl hover:shadow-red-900/40 hover:-translate-y-0.5 text-lg">
              Register Your Organisation →
            </button>
            <a href={APK_URL} className="bg-sl-card hover:bg-sl-border border border-sl-border text-white font-semibold px-10 py-5 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
              <Download className="w-5 h-5" /> Download APK Free
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-sl-border py-12 px-4 bg-sl-navy/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src="/sl-icon.png" alt="" className="w-9 h-9 rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="font-black text-lg">SafetyLink</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">Private emergency mesh network for South African communities, estates, and security companies.</p>
              <p className="text-slate-600 text-xs mt-3">TM Media Solutions · Vlakfontein, Gauteng</p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white font-semibold mb-3">Product</p>
                <div className="space-y-2 text-slate-500">
                  <a href="#features" className="block hover:text-white transition-colors">Features</a>
                  <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
                  <a href={APK_URL} className="block hover:text-white transition-colors">Download APK</a>
                  <a href={EXE_URL} className="block hover:text-white transition-colors">Download EXE</a>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Organisation</p>
                <div className="space-y-2 text-slate-500">
                  <button onClick={onLogin} className="block hover:text-white transition-colors">Sign In</button>
                  <button onClick={onSignup} className="block hover:text-white transition-colors">Register</button>
                  <a href="#how-it-works" className="block hover:text-white transition-colors">How it Works</a>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Contact</p>
                <div className="space-y-2 text-slate-500">
                  <a href="mailto:tshilidzi.mukwevho54@gmail.com" className="block hover:text-white transition-colors">Email Us</a>
                  <a href="tel:+27680079911" className="block hover:text-white transition-colors">+27 68 007 9911</a>
                  <a href="#contact" className="block hover:text-white transition-colors">Enterprise</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-sl-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-600 text-xs">
            <p>© 2026 TM Media Solutions. All rights reserved.</p>
            <p>SafetyLink is a product of TM Media Solutions, Gauteng, South Africa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
