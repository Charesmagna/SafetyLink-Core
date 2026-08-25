// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Smartphone, Users, MonitorSmartphone, Monitor, Globe, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, ChevronDown, Bluetooth, Bot, Lock, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Platform() {
  return (
    <>
      {/* ══ PLATFORM FEATURES ════════════════════════════════════════════ */}
      <section id="platform" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">ONE PLATFORM. TOTAL SITUATIONAL AWARENESS.</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              SafetyLink is not a single app. It is a three-layer intelligent emergency response platform built for South African conditions — offline-first, BLE mesh-connected, and deployable without internet infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Layer 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#15803d] mb-6">
                <Smartphone size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 uppercase">Layer 1 — SafetyLink Mobile (Citizen)</h3>
              <p className="text-sm text-slate-500 mb-6">The personal safety hub for residents, individuals, and family members.</p>
              
              <ul className="space-y-4">
                {[
                  "Mission-Control SOS Actuator — hold 1.5 seconds to initiate sequential security escalation chain",
                  "Watch-Me Timer — proactive protection that triggers an alert if you fail to check in",
                  "Native iTAG Keyfob — BLE wearable panic button pairs directly to your phone",
                  "Live Security Armed status — real-time confirmation your protection is active",
                  "Sequential escalation chain — alert escalates automatically through contacts if unacknowledged",
                  "Offline SMS fallback — alerts fire even when mobile data is unavailable",
                  "TEST mode — safely verify your alert chain without triggering a real response",
                  "LIVE PROTOCOL mode — activate full emergency dispatch",
                  "11 South African languages supported"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-slate-700 leading-relaxed">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#15803d] shrink-0"></div>
                    <span dangerouslySetInnerHTML={{ __html: item.replace(/^([^—]+)—/, '<strong>$1</strong> —') }} />
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Powered by: SafetyLink® · ©TM Media Solutions · Reg: 2018/500191/07</p>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="bg-[#0f172a] rounded-3xl p-8 border border-slate-800 shadow-xl text-white relative overflow-hidden transform lg:-translate-y-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#15803d] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-[#15803d] mb-6">
                  <MonitorSmartphone size={28} />
                </div>
                <h3 className="text-lg font-black text-white mb-2 uppercase">Layer 2 — SafetyLink Command (Responder / Security Company)</h3>
                <p className="text-sm text-slate-400 mb-6">The operator control deck for armed response companies, estate security, and neighbourhood watch commanders.</p>
                
                <ul className="space-y-4">
                  {[
                    "Secure Command Gateway — authorised access via Username/Callsign + Organisational Mesh Code",
                    "Organisational Mesh Code format: SL-ORG-XXXX",
                    "Real-time active alert feed with GPS coordinates and unit identification",
                    "Responder dispatch and status tracking",
                    "Multi-node visibility — monitor all residents and beacons in your network simultaneously",
                    "Evidence Ledger — immutable log of every alert, acknowledgement, and response action",
                    "Demo Showcase Mode — instantly populates mock networks and active supervisor nodes for client presentations",
                    "Control room integration — compatible with existing CCTV and dispatch infrastructure"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-[13px] text-slate-300 leading-relaxed">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#15803d] shrink-0"></div>
                      <span dangerouslySetInnerHTML={{ __html: item.replace(/^([^—]+)—/, '<strong class="text-white">$1</strong> —') }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#15803d] mb-6">
                <Server size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 uppercase">Layer 3 — SafetyLink Admin (Organisation / Estate Manager)</h3>
              <p className="text-sm text-slate-500 mb-6">The administration and configuration panel for property managers and organisation administrators.</p>
              
              <ul className="space-y-4">
                {[
                  "Onboard and manage residents under your organisational node",
                  "Assign and configure SL-ORG-XXXX mesh codes",
                  "View audit logs and compliance reports",
                  "Configure alert escalation chains per unit",
                  "Manage hardware device inventory (iTAG keyfobs, beacons)",
                  "Billing and subscription management — R49/month per resident + R149 once-off registration",
                  "Multi-estate support — one admin panel managing multiple properties simultaneously"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-slate-700 leading-relaxed">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#15803d] shrink-0"></div>
                    <span dangerouslySetInnerHTML={{ __html: item.replace(/^([^—]+)—/, '<strong>$1</strong> —') }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      {/* ══ AI CO-PILOT ═══════════════════════════════════════════════════ */}
      <section id="ai-copilot" className="py-24 bg-[#0f172a] text-white border-t-[8px] border-[#15803d] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-[#0f172a] to-[#0f172a] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left Col */}
            <div className="flex-[1.2]">
              <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-8">
                <Bot size={14} className="text-[#15803d]" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Powered by Google Gemini</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight">DEEPMIND SECURITY INTELLIGENCE. ALWAYS ON.</h2>
              <p className="text-slate-400 text-[15px] leading-relaxed mb-10">
                SafetyLink integrates an AI Co-Pilot powered by Google Gemini — a purely additive intelligence layer that enhances situational awareness without modifying or interfering with the core emergency dispatch logic. The platform works without it. With it, it thinks ahead.
              </p>

              <h4 className="text-[13px] font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#15803d]" /> What the AI Co-Pilot does:
              </h4>
              <ul className="space-y-4 mb-10">
                {[
                  "Analyses active alert patterns across your network and identifies anomalies",
                  "Suggests optimal responder routing based on real-time location data",
                  "Generates incident summaries for the Evidence Ledger automatically",
                  "Translates alerts and communications into any of South Africa's 11 official languages instantly",
                  "Monitors Watch-Me Timer compliance across your resident network and flags unusual patterns",
                  "Provides natural language query access to your alert history — ask \"how many alerts came from Unit 14 last month\" and get an instant answer",
                  "Assists commanders with incident classification — distinguishing false alarms from genuine emergencies using historical pattern data"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-slate-300 leading-relaxed">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#15803d] shrink-0 shadow-[0_0_8px_#15803d]"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Col */}
            <div className="flex-1">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl">
                <h4 className="text-[13px] font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" /> What the AI Co-Pilot does NOT do:
                </h4>
                <ul className="space-y-4 mb-8">
                  {[
                    "It does not make dispatch decisions",
                    "It does not modify alert thresholds or escalation chains",
                    "It does not access any data outside your organisational mesh node",
                    "It does not require internet to function at its core — AI features degrade gracefully when offline, core safety functions remain 100% operational"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-[13px] text-slate-400 leading-relaxed">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-slate-700 shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h4 className="text-[12px] font-black text-white mb-3 uppercase tracking-widest flex items-center gap-2 border-t border-slate-800 pt-8">
                  <Lock size={14} className="text-slate-400" /> Privacy:
                </h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  All AI processing runs through a secure server-side proxy. Your Gemini API key is never exposed in the app or on device. All data remains within your SL-ORG-XXXX node boundary.
                </p>
              </div>
              
              <div className="text-[9px] font-bold tracking-[0.2em] text-slate-600 space-y-1.5 uppercase bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                <p>Google Gemini · SafetyLink AI Co-Pilot v2.0 · SECURE ACTIVE NODE</p>
                <p>SECURE ENCRYPTED MESH MATRIX // DEEPMIND SECURITY BLUEPRINTS</p>
                <p className="text-[#15803d]">POWERED BY TM MEDIA SOLUTIONS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </>
  );
}
