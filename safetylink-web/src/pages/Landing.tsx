import React, { useState, useEffect } from 'react';
import { Shield, Headphones, MapPin, PersonStanding, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Landing({ onLogin, onSignup, onLaunchWeb }: { onLogin: () => void; onSignup: () => void; onLaunchWeb?: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900 shadow-xl py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <span className={`text-2xl font-black tracking-tight ${scrolled ? 'text-white' : 'text-white'}`}>SafetyLink</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {['How It Works', 'Solutions', 'Pricing', 'Support'].map(link => (
              <a key={link} href="#" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                {link}
              </a>
            ))}
            <button onClick={onSignup} className="bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-md font-bold text-sm transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-48 lg:pt-48 lg:pb-64 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2940&auto=format&fit=crop" 
            alt="Woman hiking" 
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 uppercase">
              Peace of mind,<br />always connected.
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-xl leading-relaxed">
              Instant access to help, GPS location sharing, and emergency response for you and your loved ones. Explore our personal safety solutions today.
            </p>
            <button onClick={onLaunchWeb} className="bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-4 rounded-md font-bold text-lg transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/30">
              Shop SafetyLink Devices
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES FLOATING CARD */}
      <section className="relative z-20 -mt-24 md:-mt-32 max-w-7xl mx-auto px-6 mb-24">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          <div className="flex flex-col items-center text-center pt-8 md:pt-0">
            <div className="w-16 h-16 mb-6 flex items-center justify-center">
              <Headphones className="w-10 h-10 text-slate-700" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold mb-4">24/7 Monitoring</h3>
            <p className="text-slate-600 leading-relaxed">
              Our dedicated response team is always available when you press the SOS button.
            </p>
          </div>

          <div className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
            <div className="w-16 h-16 mb-6 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-slate-700" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold mb-4">GPS Tracking</h3>
            <p className="text-slate-600 leading-relaxed">
              Real-time location sharing with designated contacts in an emergency.
            </p>
          </div>

          <div className="flex flex-col items-center text-center pt-8 md:pt-0 md:pl-8">
            <div className="w-16 h-16 mb-6 flex items-center justify-center">
              <PersonStanding className="w-10 h-10 text-slate-700" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold mb-4">Falls Detection</h3>
            <p className="text-slate-600 leading-relaxed">
              Automatic alerts sent if a fall is detected (on select devices).
            </p>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 max-w-7xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Sarah J.", text: "SafetyLink gives me confidence when I'm out running alone. Highly recommend!", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" },
            { name: "Michael R.", text: "SafetyLink gives me confidence when I'm out running alone. Highly recommend!", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" },
            { name: "Elena M.", text: "SafetyLink gives me confidence when I'm out running alone. Highly recommend!", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" }
          ].map((t, i) => (
            <div key={i} className="flex gap-4 items-start">
              <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              <div>
                <p className="text-sm text-slate-600 italic mb-2">"{t.text}"</p>
                <p className="text-xs font-bold text-slate-900">- {t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BUSINESS SECTION */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="bg-[#0f172a] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
          <div className="p-12 md:p-16 flex-1 flex flex-col justify-center items-start">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">SafetyLink for Businesses</h2>
            <p className="text-slate-300 mb-8 max-w-md leading-relaxed">
              Learn more about business workings, working and consume enterprise solutions.
            </p>
            <button onClick={onLogin} className="bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-3.5 rounded-md font-bold text-sm transition-colors">
              Learn More About Enterprise Solutions
            </button>
          </div>
          <div className="w-full md:w-1/2 min-h-[300px]">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356f12?q=80&w=2000&auto=format&fit=crop" 
              alt="Construction workers" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1e293b] text-slate-300 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div>
            <h4 className="text-white font-bold mb-6">Company Information</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Partners</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Company</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Solutions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal Disclaimers</h4>
            <div className="flex flex-col space-y-3 text-sm mb-4">
              <a href="#" className="hover:text-white transition-colors">Legal</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              This disclaimer copies all scroll, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This content is for demonstration purposes.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Social Media</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-700/50 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2024 SafetyLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
