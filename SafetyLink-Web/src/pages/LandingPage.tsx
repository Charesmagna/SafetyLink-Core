import { Shield, Smartphone, Globe, Download, ChevronRight, Activity, Zap, Server, MapPin, CheckCircle2, Monitor } from 'lucide-react';

export default function LandingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const scrollToDownloads = () => {
    document.getElementById('download-hub')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
            <Shield className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-lg tracking-wide">SafetyLink</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={scrollToDownloads}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Downloads
            </button>
            <button 
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Login / Register
            </button>
            <button 
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2"
            >
              Commander Deck <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero & Mission Statement Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-sm font-medium mb-8">
              <Activity className="w-4 h-4" />
              <span>Sequential Emergency Alert Network</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Offline-Capable, Hyper-Local <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Community Panic Systems
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              SafetyLink provides private emergency mesh networks tailored for campus safety, security patrols, and corporate sites. Operate seamlessly even under restrictive offline or distress scenarios.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Access Commander Deck <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollToDownloads}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                Download Hub <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* 2. Visual Gallery & Tactical Preview */}
        <section className="py-16 px-6 bg-slate-900/50 border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Motherboard Response Console</h2>
              <p className="text-slate-400">High-fidelity tactical preview of the SafetyLink Commander Deck in action.</p>
            </div>
            
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
              {/* Abstract representation of the dashboard */}
              <div className="absolute inset-0 bg-slate-900 grid grid-cols-12 gap-1 p-2 md:p-4">
                {/* Sidebar */}
                <div className="col-span-2 hidden md:flex bg-slate-950 rounded border border-slate-800 p-4 flex-col gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"><Shield className="w-4 h-4 text-emerald-500"/></div>
                  <div className="w-full h-8 bg-slate-800/50 rounded" />
                  <div className="w-full h-8 bg-slate-800/50 rounded" />
                  <div className="w-full h-8 bg-slate-800/50 rounded" />
                </div>
                {/* Main Map */}
                <div className="col-span-12 md:col-span-7 bg-slate-950 rounded border border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_default_map_style_-_London.png')] opacity-20 bg-cover bg-center" />
                  {/* Ping Markers */}
                  <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-red-500 rounded-full border-2 border-slate-950 shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"/>
                  </div>
                </div>
                {/* Threat Queue */}
                <div className="col-span-12 md:col-span-3 bg-slate-950 rounded border border-slate-800 p-4 flex flex-col gap-3">
                  <div className="h-6 w-1/2 bg-slate-800 rounded mb-2" />
                  <div className="w-full h-24 border border-red-500/30 bg-red-500/5 rounded p-3 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                    <div className="h-4 w-3/4 bg-red-500/80 rounded" />
                    <div className="h-3 w-1/2 bg-slate-700 rounded" />
                    <div className="h-3 w-full bg-slate-700 rounded mt-auto" />
                  </div>
                  <div className="w-full h-20 border border-slate-800 bg-slate-900 rounded p-3 flex flex-col gap-2">
                    <div className="h-4 w-2/3 bg-slate-700 rounded" />
                    <div className="h-3 w-1/2 bg-slate-800 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. About & Ecosystem Overview */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Built for extreme reliability.</h2>
                <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                  Traditional safety apps fail when data networks go down or in restricted environments. 
                  SafetyLink's unified mesh architecture is designed to function seamlessly using simulated 
                  Bluetooth Low Energy (BLE) beacons and background location telemetry, operating as a true 
                  single source of truth.
                </p>
                <ul className="space-y-4">
                  {[
                    'Works without relying on traditional airtime footprints.',
                    'Hardware integration with physical keychain tokens.',
                    'Role-based access routing (Command Center vs Node Viewer).',
                    'Zero unused variables, strict Material 3 design harmony.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 h-full transform sm:translate-y-8">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center"><Server className="w-6 h-6 text-emerald-500"/></div>
                  <h3 className="font-bold text-lg">Siloed Tenants</h3>
                  <p className="text-sm text-slate-400">Isolated database schemas ensure strict privacy between different security groups.</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 h-full">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center"><Zap className="w-6 h-6 text-blue-500"/></div>
                  <h3 className="font-bold text-lg">BLE Beacons</h3>
                  <p className="text-sm text-slate-400">Simulated beacons feed directly into the central state to replicate physical hardware.</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 h-full transform sm:translate-y-8">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center"><MapPin className="w-6 h-6 text-amber-500"/></div>
                  <h3 className="font-bold text-lg">GIS Telemetry</h3>
                  <p className="text-sm text-slate-400">Background location polling synchronizes precise coordinates instantly.</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 h-full">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center"><Monitor className="w-6 h-6 text-purple-500"/></div>
                  <h3 className="font-bold text-lg">Command Deck</h3>
                  <p className="text-sm text-slate-400">Master user control with real-time alert logs and live GIS mapping.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Pricing Tiers & Deployment Models */}
        <section className="py-24 px-6 bg-slate-900 border-y border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Deployment Models</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">Transparent subscription structures tailored for local communities, security groups, and enterprises.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Tier 1 */}
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 flex flex-col">
                <h3 className="text-xl font-bold text-slate-300 mb-2">Community Watch</h3>
                <div className="text-4xl font-extrabold mb-6">$49<span className="text-lg font-normal text-slate-500">/mo</span></div>
                <p className="text-slate-400 mb-8 flex-grow">Perfect for neighborhood watch groups and small communities.</p>
                <ul className="space-y-4 mb-8">
                  {['Up to 50 active nodes', 'Basic GIS mapping', 'Community panic alerts', 'Standard email support'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {feat}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold transition-colors">Start Trial</button>
              </div>

              {/* Tier 2 */}
              <div className="bg-slate-900 p-8 rounded-2xl border-2 border-emerald-500 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-full">Most Popular</div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Security Patrol</h3>
                <div className="text-4xl font-extrabold mb-6">$199<span className="text-lg font-normal text-slate-500">/mo</span></div>
                <p className="text-slate-400 mb-8 flex-grow">Designed for private security agencies and university campuses.</p>
                <ul className="space-y-4 mb-8">
                  {['Up to 500 active nodes', 'Advanced Motherboard Console', 'BLE beacon integration', 'Priority threat triage', '24/7 Phone Support'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {feat}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors">Deploy Network</button>
              </div>

              {/* Tier 3 */}
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 flex flex-col">
                <h3 className="text-xl font-bold text-slate-300 mb-2">Enterprise / Gov</h3>
                <div className="text-4xl font-extrabold mb-6">Custom</div>
                <p className="text-slate-400 mb-8 flex-grow">For large-scale corporate environments and municipal responders.</p>
                <ul className="space-y-4 mb-8">
                  {['Unlimited nodes', 'On-premise deployment options', 'API integrations', 'Custom hardware binding', 'Dedicated account manager'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {feat}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold transition-colors">Contact Sales</button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Dual-Platform Download Hub */}
        <section id="download-hub" className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none" />
          <div className="max-w-5xl mx-auto relative z-10 text-center">
            <h2 className="text-4xl font-bold mb-6">Dual-Platform Download Hub</h2>
            <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">Secure download portals for command center operators and field personnel.</p>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors group">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Smartphone className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Mobile Safety APK</h3>
                <p className="text-slate-400 mb-8">
                  Direct link for field personnel, guards, and residents to download the Android safety companion app. Includes background polling service.
                </p>
                <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors">
                  <Download className="w-5 h-5" /> Download .APK (v2.4.1)
                </a>
              </div>
              
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors group">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Monitor className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Desktop Dashboard</h3>
                <p className="text-slate-400 mb-8">
                  Secure executable for command center operators needing the native desktop workstation build with multi-monitor support.
                </p>
                <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors">
                  <Download className="w-5 h-5" /> Download .EXE (Win64)
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Contact, Addresses, & Support */}
        <section className="py-24 px-6 bg-slate-900 border-t border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
                <p className="text-slate-400 mb-8">
                  Ready to set up your private safety mesh? Contact our integration team to discuss custom deployments, hardware binding, and ecosystem integration.
                </p>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">Headquarters</h4>
                      <p className="text-slate-400 text-sm mt-1">SafetyLink Core Systems<br/>Innovation District, Building A<br/>Pretoria, South Africa</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">General Inquiries</h4>
                      <p className="text-slate-400 text-sm mt-1">hello@safetylink.online<br/>sales@safetylink.online</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Organization Name</label>
                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Acme Security Corp" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                    <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="admin@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
                    <textarea rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="How can we help you deploy your mesh?" />
                  </div>
                  <button type="button" className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors">
                    Send Inquiry
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 text-center text-slate-500 border-t border-slate-900 bg-slate-950">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="font-bold text-slate-300">SafetyLink Core</span>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} SafetyLink Core Systems. All rights reserved.</p>
        <p className="text-xs mt-2 opacity-50">DeepMind Secure Gateway Integrations</p>
      </footer>
    </div>
  );
}
