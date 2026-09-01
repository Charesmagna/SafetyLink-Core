// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Smartphone, Users, MonitorSmartphone, Monitor, Globe, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, ChevronDown, Bluetooth, Bot, Lock, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function UseCases() {
  return (
    <>
      {/* ══ USE CASES ═════════════════════════════════════════════════════ */}
      <section id="use-cases" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">BUILT FOR REAL SOUTH AFRICAN CONDITIONS</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              SafetyLink was designed in Johannesburg South. Every feature exists because of a real security challenge faced by real South African communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Use Case 1 — Residential Estate",
                content: "Deploy panic buttons and BLE wearables across every unit. Residents trigger alerts via app or iTAG keyfob. The estate security commander sees every alert on the Command Deck with GPS location and unit ID. Response is dispatched in under 3 seconds. Every action is logged in the Evidence Ledger for body corporate compliance."
              },
              {
                title: "Use Case 2 — Armed Response Company",
                content: "Give your control room operators a live feed of every client alert, responder location, and BLE beacon in your network. SafetyLink charges only its flat platform fee — zero interference in how you price your own services. Your brand, your rates, our infrastructure."
              },
              {
                title: "Use Case 3 — Informal Settlement / Neighbourhood Watch",
                content: "No internet infrastructure required. SafetyLink's BLE mesh and offline SMS fallback means the platform works in areas where mobile data is unreliable or unaffordable. Local unemployed youth can be enrolled as patrol agents, receiving alerts and reporting back through the same mesh network."
              },
              {
                title: "Use Case 4 — Individual Resident",
                content: "No estate required. Register as a standalone individual. Pair your iTAG keyfob. Add your emergency contacts. Your Watch-Me Timer and SOS button are active from day one. R49/month. R149 once-off registration."
              },
              {
                title: "Use Case 5 — Property Management Company",
                content: "Manage multiple estates from a single Admin panel. Each estate runs as a separate SL-ORG-XXXX node. Residents, devices, and alert histories are fully isolated per property. One invoice, one dashboard, complete visibility."
              },
              {
                title: "Use Case 6 — Security Technology Integrator",
                content: "Embed SafetyLink's BLE mesh and dispatch layer into your existing control room infrastructure. API access available for enterprise integrations. Compatible with CCTV, access control, and third-party monitoring platforms."
              }
            ].map((useCase, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-[#15803d] hover:shadow-lg transition-all group">
                <div className="text-[#15803d] mb-4 opacity-50 group-hover:opacity-100 transition-opacity"><ShieldCheck size={24}/></div>
                <h4 className="text-[15px] font-black text-slate-900 mb-3 uppercase" dangerouslySetInnerHTML={{ __html: useCase.title.replace('—', '<span class="text-slate-400 mx-1">—</span>') }} />
                <p className="text-[13px] text-slate-600 leading-relaxed">{useCase.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
    </>
  );
}
