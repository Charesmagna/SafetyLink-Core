// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Smartphone, Users, MonitorSmartphone, Monitor, Globe, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, ChevronDown, Bluetooth, Bot, Lock, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Hardware() {
  return (
    <>
      {/* ══ HARDWARE CONFIG ═══════════════════════════════════════════════ */}
      <section id="hardware" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">YOUR HARDWARE. CONFIGURED IN MINUTES.</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed max-w-3xl">
              SafetyLink works with the iTAG Bluetooth Low Energy keyfob — available in Blue, White, Pink, Green, and Black. No proprietary hardware required. Standard CR2032 battery. Range: approximately 10–30 metres depending on environment.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Images Column */}
            <div className="flex-1 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-center items-center h-auto min-h-[300px]">
                <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020219883.jpg" alt="SafetyLink iTAG devices" className="w-full max-w-[400px] object-contain rounded-xl" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-center items-center">
                <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310010/Polish_20260819_020007723.jpg" alt="iTAG battery instructions" className="w-full max-w-[300px] object-contain rounded-xl" />
              </div>
            </div>

            {/* Steps & Specs Column */}
            <div className="flex-1 space-y-10">
              <div className="space-y-8">
                {[
                  { title: "Step 1 — Insert Battery", text: "Rotate the button cap on the iTAG to the open position. Remove the lid. Insert one CR2032 coin cell battery with the positive side facing up. Replace and rotate the lid to the closed position. The LED indicator will flash once to confirm power." },
                  { title: "Step 2 — Pair to SafetyLink Mobile", text: "Open the SafetyLink app. Navigate to DEVICES in the bottom navigation bar. Tap ADD DEVICE. Press the iTAG button once to make it discoverable. Your device will appear in the scan list as Native iTAG Keyfob. Tap to pair. RSSI signal strength will display once connected (typical value: –60 to –75 dBm)." },
                  { title: "Step 3 — Test Your Connection", text: "From the main SOS Actuator screen, confirm the iTAG status shows CONNECTED. Press the TEST 5S button to verify your alert chain without triggering a live response. The status bar will display: SAFETY SECURE STATUS: ARMED & ACTIVE." },
                  { title: "Step 4 — Configure Alert Behaviour", text: "In device settings, configure: single press (locate phone), double press (SOS trigger), long press (emergency escalation). Set your preferred escalation delay (recommended: 1.5 seconds for SOS activation)." },
                  { title: "Reconnecting a Lost Device", text: "If your iTAG shows RECONNECT status in the app, tap the RECONNECT button or press the iTAG button once. Auto-reconnect is enabled by default and will attempt to re-establish the BLE connection whenever the device comes within range." },
                  { title: "Supported Devices", text: "Any Bluetooth Low Energy iTAG clone device broadcasting a standard BLE advertisement packet is compatible with SafetyLink. Custom SafetyLink-branded iTAG units are available through authorised distributors." }
                ].map((item, idx) => (
                  <div key={idx}>
                    <h4 className="text-[15px] font-bold text-slate-900 mb-2 uppercase">{item.title}</h4>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Specs Box */}
              <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
                <h4 className="text-[13px] font-black text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Bluetooth size={16}/> Device Specifications
                </h4>
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div><span className="text-slate-500">Protocol:</span> <strong className="text-slate-900">BLE 4.0+</strong></div>
                  <div><span className="text-slate-500">Battery:</span> <strong className="text-slate-900">CR2032</strong></div>
                  <div><span className="text-slate-500">Range:</span> <strong className="text-slate-900">10–30m typical</strong></div>
                  <div><span className="text-slate-500">Colours:</span> <strong className="text-slate-900">Multi</strong></div>
                  <div><span className="text-slate-500">Dimensions:</span> <strong className="text-slate-900">38×27×8mm</strong></div>
                  <div><span className="text-slate-500">Weight:</span> <strong className="text-slate-900">7g</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </>
  );
}
