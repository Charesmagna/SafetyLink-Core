import React, { useState } from 'react';
import { ShoppingCart, ShieldAlert, Zap, Truck, Camera, Lock, Search, AlertCircle, Phone, ArrowRight } from 'lucide-react';

export interface Product {
  slug: string;
  name: string;
  category: 'Security Cameras' | 'Access Control' | 'Tactical Gear' | 'Vehicle Security' | 'Power & Sensors';
  price: number;
  description: string;
  imageUrl?: string;
  affiliateUrl?: string;
}

export const STORE_PRODUCTS: Product[] = [
  {
    slug: 'itag-ble-panic-button',
    name: 'SafetyLink iTAG BLE Physical Panic Button',
    category: 'Tactical Gear',
    price: 189,
    description: 'Ultra-durable Bluetooth Low Energy hardware panic keyfob with configurable 1-press SOS, 2-press find phone, 3-press walk timeout, and pocket disarm.',
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20iTAG%20BLE%20Keyfob'
  },
  {
    slug: 'gsm-tactical-relay-node',
    name: 'SafetyLink GSM Mesh Tactical Relay Node',
    category: 'Power & Sensors',
    price: 1250,
    description: 'Autonomous micro-base station with dual SIM fallback, internal battery backup, and long-range BLE beacon aggregator.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20GSM%20Relay%20Node'
  },
  {
    slug: 'ai-solar-ptz-security-camera',
    name: '4G AI Solar PTZ Perimeter Surveillance Camera',
    category: 'Security Cameras',
    price: 2490,
    description: 'Solar-powered 4G LTE PTZ camera with human intrusion detection, night vision, and autonomous webhook alerts directly to SafetyLink War Room.',
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20AI%20Solar%20Camera'
  },
  {
    slug: 'tactical-body-worn-camera',
    name: 'Patrol Grade Body-Worn Camera 1440p',
    category: 'Tactical Gear',
    price: 1850,
    description: 'Rugged law-enforcement grade body camera with continuous GPS logging, tamper-proof internal storage, and one-touch distress stream.',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?w=600&auto=format&fit=crop&q=80',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20Bodycam'
  },
  {
    slug: 'smart-biometric-deadbolt-lock',
    name: 'Heavy-Duty Biometric Bluetooth Smart Deadbolt',
    category: 'Access Control',
    price: 1450,
    description: 'Anti-tamper fingerprint deadbolt lock with temporary visitor codes, emergency physical key override, and remote lockdown link.',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20Smart%20Lock'
  },
  {
    slug: 'obd2-gps-kill-switch-tracker',
    name: 'OBD2 Real-Time Vehicle Tracker with Remote Kill-Switch',
    category: 'Vehicle Security',
    price: 980,
    description: 'Plug-and-play vehicle telemetry tracker with crash detection, geo-fence alerts, and remote ignition disablement on distress.',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20Vehicle%20Tracker'
  }
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Security Cameras': <Camera className="w-5 h-5" />,
  'Access Control': <Lock className="w-5 h-5" />,
  'Tactical Gear': <ShieldAlert className="w-5 h-5" />,
  'Vehicle Security': <Truck className="w-5 h-5" />,
  'Power & Sensors': <Zap className="w-5 h-5" />
};

const SafetyWareStore: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingStock, setCheckingStock] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(STORE_PRODUCTS.map(p => p.category)))];

  const filteredProducts = STORE_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuy = async (product: Product) => {
    setCheckingStock(product.slug);
    try {
      const res = await fetch(`/api/check-stock/${product.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: product.affiliateUrl })
      });
      const data = await res.json();
      
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error("Stock check failed:", err);
      window.open(`https://wa.me/27680079911?text=${encodeURIComponent(`Hi SafetyLink, I am looking to purchase "${product.name}" (R${product.price}). Please assist with direct checkout.`)}`, '_blank');
    } finally {
      setCheckingStock(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <ShoppingCart className="w-10 h-10 text-emerald-500" />
              SafetyWare Store
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm md:text-base">
              Enterprise-grade hardware integrations for SafetyLink-Core. Secure your perimeter, equip your responders, and harden your infrastructure.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search hardware..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </header>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-amber-500 font-bold text-sm">Exclusive SA Import Pricing</h3>
              <p className="text-amber-500/70 text-xs mt-0.5">Direct integration support available for all hardware purchased through SafetyWare.</p>
            </div>
          </div>
          <button className="shrink-0 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <Phone className="w-3 h-3" /> Contact Sales
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === category 
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {category !== 'All' && CATEGORY_ICONS[category]}
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800/50 border-dashed">
            <p className="text-slate-500">No hardware found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.slug} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col h-full shadow-lg">
                {/* Real Hardware Image with Category Icon Fallback */}
                <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-900 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                  
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-icon');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}

                  <div className={`fallback-icon w-full h-full items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
                    {CATEGORY_ICONS[product.category] ? (
                      React.cloneElement(CATEGORY_ICONS[product.category] as React.ReactElement<any>, { className: 'w-16 h-16 text-slate-800 group-hover:text-slate-700 transition-colors' })
                    ) : (
                      <ShoppingCart className="w-16 h-16 text-slate-800" />
                    )}
                  </div>

                  <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20 backdrop-blur-sm z-20 font-mono">
                    IN STOCK
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <div className="text-xs text-slate-500 font-medium mb-2">{product.category}</div>
                  <h3 className="text-slate-200 font-bold leading-snug mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-slate-400 text-xs line-clamp-3 mb-6 flex-grow">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-lg font-black text-emerald-400">
                      R{product.price}
                    </div>
                    <button 
                      onClick={() => handleBuy(product)}
                      disabled={checkingStock === product.slug}
                      className="bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-transparent"
                    >
                      {checkingStock === product.slug ? (
                        <span className="animate-pulse">Checking...</span>
                      ) : (
                        <>Buy Now <ArrowRight className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyWareStore;
