import React, { useState } from 'react';
import {
  ShoppingCart,
  ShieldAlert,
  Radio,
  Watch,
  Wifi,
  Search,
  Phone,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { PepxiOrderModal } from './PepxiOrderModal';
import { WebAdSlot } from './WebAdSlot';
import bleKeytagImg from '../assets/images/store_ble_keytag_1795639836673.jpg';
import watch4gImg from '../assets/images/store_4g_watch_1795639836635.jpg';
import hikvisionPanicImg from '../assets/images/store_hikvision_panic_1795639836920.jpg';
import nbiotButtonImg from '../assets/images/store_nbiot_button_1795639836790.jpg';

export interface Product {
  slug: string;
  name: string;
  tier: string;
  category: 'BLE Panic Keyfobs' | '4G GPS Wearables' | 'Commercial Wireless' | 'Standalone NB-IoT';
  price: number;
  connectivity: string;
  integrationMode: string;
  description: string;
  specs: string[];
  imageUrl: string;
  supplierUrl?: string;
  affiliateUrl: string;
}

export const STORE_PRODUCTS: Product[] = [
  {
    slug: 'itag-ble-panic-button',
    name: 'Altitude Tracker BLE Physical Panic Key Tag',
    tier: 'Tier 1 · Personal & Family',
    category: 'BLE Panic Keyfobs',
    price: 75,
    connectivity: 'Bluetooth 5.0 LE (Phone Companion)',
    integrationMode: 'Native Android ITagPlugin (Auto-Reconnect)',
    description:
      'Ultra-lightweight Bluetooth Low Energy panic keyfob (Brandability Altitude spec). Pairs natively with SafetyLink background BLE listener for lock-screen single/double-press SOS dispatch. Includes nationwide Pepxi delivery option.',
    specs: [
      'Direct native Android BLE GATT pairing',
      'Works with phone screen locked or in pocket',
      'Replaceable CR2032 coin battery (6–12 months)',
      '14-day free hardware pairing trial + Pepxi delivery',
    ],
    imageUrl: bleKeytagImg,
    supplierUrl: 'https://www.brandability.co.za/buy/altitude-tracker-key-tag',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20Altitude%20BLE%20Panic%20Key%20Tag',
  },
  {
    slug: 'luckyunion-4g-sos-smartwatch',
    name: 'Luckyunion 4G Elderly & Lone-Worker GPS SOS Smartwatch',
    tier: 'Tier 2 · Senior & Lone Worker',
    category: '4G GPS Wearables',
    price: 1299,
    connectivity: 'Standalone 4G LTE Nano-SIM + GPS / Wi-Fi / LBS',
    integrationMode: 'Webhook Relay (/api/webhook/iot-panic)',
    description:
      'Independent 4G cellular emergency smartwatch (Makro S8/S16H spec) with dedicated physical SOS button, live GPS positioning, two-way voice calling, heart-rate & blood-pressure telemetry, and fall alerts—no smartphone required.',
    specs: [
      'Standalone 4G SIM + real-time GPS tracking',
      'One-touch side SOS trigger + two-way voice',
      'Heart-rate, blood-pressure & medication reminders',
      'Streams alerts into SafetyLink FCM & Responder Map',
    ],
    imageUrl: watch4gImg,
    supplierUrl:
      'https://www.makro.co.za/luckyunion-4g-elderly-smart-phone-watch-gps-positioning-sos-reminder-heart-rate-blood-pressure-health-s8-bracelet-s16h-smartwatch/p/itm1999529487710',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20Luckyunion%204G%20SOS%20Smartwatch',
  },
  {
    slug: 'hikvision-ax-pro-panic-button',
    name: 'Hikvision DS-PDEBP1-EG2-WE AX PRO Wireless Panic Button',
    tier: 'Tier 3 · Estates, Campuses & Guards',
    category: 'Commercial Wireless',
    price: 549,
    connectivity: '868MHz Tri-X Encrypted RF (up to 1.2 km to AX PRO Hub)',
    integrationMode: 'AX PRO Hub → /api/webhook/iot-panic',
    description:
      'Commercial-grade IP54 waterproof wireless emergency button (Communica Hikvision AX PRO spec). Engineered for estates, schools, retail counters, and patrol teams with accidental-trigger protection and instant War Room escalation.',
    specs: [
      'AES-128 encrypted 868MHz Tri-X wireless link',
      'Up to 1,200 m open-space range to AX PRO Hub',
      'IP54 dust/water resistant with LED confirmation',
      'Up to 3-year battery life + tamper supervision',
    ],
    imageUrl: hikvisionPanicImg,
    supplierUrl: 'https://www.communica.co.za/products/hkv-ds-pdebp1-eg2-we',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20Hikvision%20AX%20PRO%20Panic%20Button',
  },
  {
    slug: 'jpl-nbiot-emergency-button',
    name: 'JPL Secure NB-IoT Intelligent Emergency Button',
    tier: 'Tier 4 · Zero-WiFi Standalone Cellular',
    category: 'Standalone NB-IoT',
    price: 1650,
    connectivity: 'Direct Cellular NB-IoT (No Phone, No Wi-Fi, No Hub)',
    integrationMode: 'Direct Cellular Push → /api/webhook/iot-panic',
    description:
      'Autonomous industrial-grade NB-IoT panic button (JPL Secure spec) that transmits directly over narrowband cellular towers even during load-shedding, fibre outages, or deep indoor environments with multi-year standby battery.',
    specs: [
      'Direct NB-IoT cellular uplink — works during blackouts',
      'No smartphone, Wi-Fi router, or local hub needed',
      'Deep indoor signal penetration + low-battery heartbeat',
      'Direct webhook integration into SafetyLink Dispatch',
    ],
    imageUrl: nbiotButtonImg,
    supplierUrl: 'https://jplsecure.com/product/nb-iot-intelligent-emergency-button/',
    affiliateUrl: 'https://wa.me/27680079911?text=Order%20JPL%20NB-IoT%20Emergency%20Button',
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'BLE Panic Keyfobs': <Radio className="w-4 h-4" />,
  '4G GPS Wearables': <Watch className="w-4 h-4" />,
  'Commercial Wireless': <ShieldAlert className="w-4 h-4" />,
  'Standalone NB-IoT': <Wifi className="w-4 h-4" />,
};

const SafetyWareStore: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingStock, setCheckingStock] = useState<string | null>(null);
  const [showPepxiModal, setShowPepxiModal] = useState<boolean>(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState<boolean>(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);

  const webhookUrl = 'https://api.safetylink.online/api/webhook/iot-panic';
  const categories = ['All', ...Array.from(new Set(STORE_PRODUCTS.map((p) => p.category)))];

  const filteredProducts = STORE_PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tier.toLowerCase().includes(q) ||
      p.connectivity.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } catch {}
  };

  const handleBuy = async (product: Product) => {
    if (product.slug === 'itag-ble-panic-button') {
      setShowPepxiModal(true);
      return;
    }

    setCheckingStock(product.slug);
    try {
      const res = await fetch(`/api/check-stock/${product.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: product.affiliateUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(
        `https://wa.me/27680079911?text=${encodeURIComponent(
          `Hi SafetyLink, I would like to order "${product.name}" (R${product.price}) with SafetyLink integration.`
        )}`,
        '_blank',
        'noopener,noreferrer'
      );
    } finally {
      setCheckingStock(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans pb-28 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              SafetyWare Hardware Store
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl text-sm">
              Certified physical panic hardware built for every tier—from everyday BLE key tags to standalone 4G wearables, commercial AX PRO buttons, and load-shedding-proof NB-IoT triggers.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hardware tiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </header>

        {/* IoT Hardware Webhook Integration Bar */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Direct Hardware-to-SafetyLink Dispatch Webhook
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Connect 4G Smartwatches, Hikvision AX PRO hubs, and NB-IoT buttons directly into your live SafetyLink FCM alarm &amp; incident pipeline.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowWebhookGuide((v) => !v)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-600/30 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors"
              >
                {showWebhookGuide ? 'Hide Integration Spec' : 'View Webhook Spec'}
              </button>
              <a
                href="https://wa.me/27680079911?text=Hi%20SafetyLink%2C%20I%20need%20bulk%20hardware%20pricing%20and%20setup"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Bulk Quote
              </a>
            </div>
          </div>

          {showWebhookGuide && (
            <div className="pt-3 border-t border-emerald-200 dark:border-emerald-500/20 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono">
                <span className="text-emerald-700 dark:text-emerald-400 break-all">
                  POST {webhookUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEndpoint ? 'Copied' : 'Copy URL'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`Header: X-IoT-Token: <YOUR_IOT_WEBHOOK_SECRET>
Body:   { "deviceId": "NBIOT-8821", "deviceType": "NB_IOT_BUTTON", "ownerPhone": "+27821234567", "lat": -26.2041, "lng": 28.0473, "battery": 94 }`}
              </pre>
            </div>
          )}
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeCategory === category
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {category !== 'All' && CATEGORY_ICONS[category]}
              {category}
            </button>
          ))}
        </div>

        {/* 4-Tier Studio Hardware Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <p className="text-slate-500 text-sm">No hardware matches your filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((product) => (
              <article
                key={product.slug}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col shadow-sm hover:shadow-xl"
              >
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg backdrop-blur-md">
                    {product.tier}
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shadow">
                    IN STOCK
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow space-y-3">
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {product.connectivity}
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug mt-1">
                      {product.name}
                    </h2>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    {product.description}
                  </p>

                  <ul className="space-y-1.5 pt-1 flex-grow">
                    {product.specs.map((spec) => (
                      <li key={spec} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Link: {product.integrationMode}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                        R{product.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">Est. SA Retail / Direct Order</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.supplierUrl && (
                        <a
                          href={product.supplierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="View reference hardware specification"
                          aria-label={`View spec for ${product.name}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleBuy(product)}
                        disabled={checkingStock === product.slug}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {checkingStock === product.slug ? (
                          <span>Checking...</span>
                        ) : (
                          <>
                            Order Now <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Web-only non-emergency AdSense banner (hidden on native APK, SOS, and org/paid accounts) */}
        <WebAdSlot label="Sponsored Safety Hardware & Partners" />
      </div>

      {/* PEPXI NATIONWIDE ITAG DELIVERY MODAL */}
      <PepxiOrderModal isOpen={showPepxiModal} onClose={() => setShowPepxiModal(false)} />
    </div>
  );
};

export default SafetyWareStore;
