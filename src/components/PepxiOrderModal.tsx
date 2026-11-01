import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Sparkles, MapPin, Phone, User } from 'lucide-react';
import { useAppStore } from '../utils/store';

interface PepxiOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial?: () => void;
}

export const PepxiOrderModal: React.FC<PepxiOrderModalProps> = ({ isOpen, onClose, onStartTrial }) => {
  const { currentUser, addToast, addAuditLog } = useAppStore();
  const [recipientName, setRecipientName] = useState(currentUser?.fullName || currentUser?.username || '');
  const [recipientPhone, setRecipientPhone] = useState(currentUser?.phone || '');
  const [pepStoreLocation, setPepStoreLocation] = useState(currentUser?.homeAddress || '');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const itagPrice = 75;
  const shippingPrice = deliverySpeed === 'standard' ? 100 : 130;
  const totalPrice = itagPrice + shippingPrice;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !pepStoreLocation.trim()) {
      addToast('Please complete all delivery details for Pepxi collection.', 'error');
      return;
    }

    const orderPayload = {
      product: 'SafetyLink iTAG BLE Physical Panic Button',
      recipientName,
      recipientPhone,
      pepStore: pepStoreLocation,
      speed: deliverySpeed === 'standard' ? 'Standard PAXI (7-9 days)' : 'Express PAXI (3-5 days)',
      totalZar: totalPrice,
      includesTrial: '14-Day Free Hardware Pairing Trial',
      timestamp: new Date().toISOString()
    };

    addAuditLog('SYSTEM', 'INFO', 'Pepxi iTAG Order Placed', `Order for ${recipientName} to ${pepStoreLocation} (R${totalPrice})`);
    addToast(`Order logged! Opening WhatsApp dispatch gateway with Pepxi waybill details...`, 'success');

    // Build pre-formatted WhatsApp text
    const message = encodeURIComponent(
      `🚨 *SafetyLink iTAG Order (Pepxi PAXI Delivery)*\n` +
      `-----------------------------------------\n` +
      `👤 *Recipient:* ${recipientName}\n` +
      `📱 *Mobile Phone:* ${recipientPhone}\n` +
      `🏪 *Nearest PEP Store:* ${pepStoreLocation}\n` +
      `🚚 *Service:* ${orderPayload.speed} (R${shippingPrice})\n` +
      `🏷️ *Hardware:* 1x SafetyLink BLE iTAG (R${itagPrice})\n` +
      `💰 *Total Amount:* R${totalPrice}\n` +
      `✨ *Plan:* SafetyLink is Free + 14-Day Hardware Pairing Trial\n` +
      `-----------------------------------------\n` +
      `Please confirm stock dispatch and send PAXI tracking code.`
    );

    window.open(`https://wa.me/27680079911?text=${message}`, '_blank', 'noopener,noreferrer');
    setOrderSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl max-w-lg w-full relative overflow-hidden text-left my-8"
        >
          {/* Header gradient banner */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>

          {!orderSubmitted ? (
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> 14-Day Free Trial Included
                </span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3 h-3" /> Pepxi (PAXI) Nationwide
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Package className="w-6 h-6 text-emerald-400" />
                Order Your SafetyLink iTAG
              </h2>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <strong>SafetyLink is 100% free to use.</strong> Get an authentic Bluetooth physical panic button delivered to your nearest <strong>PEP / Pep Home store</strong> anywhere in South Africa with Pepxi counter-to-counter collection.
              </p>

              {/* Pricing Cards */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Hardware Unit</span>
                  <div className="text-lg font-black text-white mt-0.5">R{itagPrice}</div>
                  <span className="text-[10px] text-emerald-400 font-mono">Brandability / iTAG spec</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Pepxi Delivery</span>
                  <div className="text-lg font-black text-white mt-0.5">R{shippingPrice}</div>
                  <span className="text-[10px] text-amber-400 font-mono">Nationwide Counter-to-Counter</span>
                </div>
              </div>

              {/* Free Trial Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 mb-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-emerald-300 block font-bold">14-Day Free Hardware Pairing Trial</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    When your tag arrives, pair it instantly in the app. Full silent panic pocket triggering is free for 14 days. Zero upfront card fees.
                  </p>
                </div>
              </div>

              {/* Order Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Recipient Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Lerato Khumalo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Cellphone Number (for Pepxi SMS PIN)
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. 082 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Nearest PEP Store / Branch Code
                  </label>
                  <input 
                    type="text" 
                    required
                    value={pepStoreLocation}
                    onChange={(e) => setPepStoreLocation(e.target.value)}
                    placeholder="e.g. PEP Johannesburg South (P1234) or PEP Soweto Mall"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    You will receive an SMS from PAXI with an OTP code when the parcel is ready for collection at your chosen PEP store.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Delivery Speed
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('standard')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        deliverySpeed === 'standard'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="font-mono text-emerald-400">R100 Standard</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">7–9 Business Days</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('express')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        deliverySpeed === 'express'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="font-mono text-amber-400">R130 Express</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">3–5 Business Days</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
                  >
                    Dispatch via Pepxi (R{totalPrice} Total) <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Already have a tag alternative */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-400">
                  Already bought a tag from Brandability or another store?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartTrial) onStartTrial();
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline mt-1 inline-block"
                >
                  Pair it now with your Free 14-Day Trial →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Order Details Logged</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your Pepxi counter-to-counter waybill has been prepared for <strong>{pepStoreLocation}</strong>. Our logistics hub will SMS you the PAXI tracking number shortly.
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left max-w-sm mx-auto text-xs space-y-1.5 font-mono">
                <div className="text-slate-400">Recipient: <span className="text-white">{recipientName}</span></div>
                <div className="text-slate-400">Mobile: <span className="text-white">{recipientPhone}</span></div>
                <div className="text-slate-400">Total: <span className="text-emerald-400 font-bold">R{totalPrice}</span></div>
                <div className="text-slate-400">Benefit: <span className="text-amber-400">14-Day Free Pairing Included</span></div>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    onClose();
                    if (onStartTrial) onStartTrial();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all"
                >
                  Activate 14-Day Trial in App
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
