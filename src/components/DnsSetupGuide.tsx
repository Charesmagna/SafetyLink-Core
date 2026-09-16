import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface Props { onClose: () => void; }

const STEPS: Record<string, { title: string; steps: string[] }> = {
  android: {
    title: 'Android — Private DNS Setup',
    steps: [
      'Open Settings on your Android device',
      'Tap Network & Internet (or Connections on Samsung)',
      'Tap Advanced → Private DNS',
      'Select Private DNS provider hostname',
      'Type: dns.safetylink.online',
      'Tap Save',
      'The 🔑 key icon will appear in your status bar — SafetyLink DNS is active',
    ],
  },
  samsung: {
    title: 'Samsung — DNS Setup',
    steps: [
      'Open Settings → Connections',
      'Tap More connection settings',
      'Tap Private DNS',
      'Choose Private DNS provider hostname',
      'Enter: dns.safetylink.online',
      'Tap Save',
      '🔑 key icon confirms SafetyLink DNS is protecting your device',
    ],
  },
  windows: {
    title: 'Windows 11 — DNS over HTTPS',
    steps: [
      'Open Settings → Network & Internet',
      'Click your active connection (WiFi or Ethernet)',
      'Scroll to DNS server assignment → Edit',
      'Switch to Manual',
      'Enable IPv4, set Preferred DNS: 1.1.1.1',
      'Set DNS over HTTPS: On (automatic template)',
      'Set custom DoH template: https://dns.safetylink.online/dns-query',
      'Save — SafetyLink DNS filtering is now active',
    ],
  },
  ios: {
    title: 'iPhone / iPad — DNS Setup',
    steps: [
      'Download a DNS profile or use a DoH app (e.g. Cloudflare 1.1.1.1 app)',
      'Or: Open Settings → WiFi → tap your network → Configure DNS',
      'Switch to Manual',
      'Delete existing DNS servers',
      'Tap Add Server → enter: 1.1.1.1',
      'Note: iOS does not natively support custom DoH hostnames without a profile',
      'For full SafetyLink DNS on iOS, use a VPN-based DNS profile (contact support)',
    ],
  },
  router: {
    title: 'Router — Whole-Network DNS',
    steps: [
      'Open your router admin panel (usually 192.168.1.1 or 192.168.0.1)',
      'Find DNS settings (under WAN, Internet, or Advanced)',
      'Replace DNS servers with SafetyLink DoH-compatible IPs',
      'Primary DNS: 1.1.1.1 (Cloudflare)',
      'For DoH: configure DNS-over-HTTPS URL: https://dns.safetylink.online/dns-query',
      'Save and restart router',
      'Every device on your network is now protected',
    ],
  },
};

export function DnsSetupGuide({ onClose }: Props) {
  const defaultTab = Capacitor.isNativePlatform() ? 'android' : 'windows';
  const [tab, setTab] = useState(defaultTab);
  const current = STEPS[tab];

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-sm flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">SafetyLink</p>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">DNS Shield Setup</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        {/* What is this */}
        <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">What is SafetyLink DNS?</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                SafetyLink runs its own DNS resolver at <span className="text-emerald-400 font-mono">dns.safetylink.online</span>. When configured, your device routes DNS queries through SafetyLink's servers — blocking ads, trackers, and malware before they reach your device. The 🔑 icon in your status bar confirms it's active.
              </p>
            </div>
          </div>
        </div>

        {/* Device tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {Object.keys(STEPS).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                tab === k ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>
              {k === 'android' ? '📱 Android' : k === 'samsung' ? '📱 Samsung' : k === 'windows' ? '💻 Windows' : k === 'ios' ? '🍎 iPhone' : '📡 Router'}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
          <h3 className="text-sm font-black text-white mb-4">{current.title}</h3>
          <ol className="space-y-3">
            {current.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-slate-300 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* DoH endpoint */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">SafetyLink DNS Endpoints</p>
          <div className="space-y-2">
            {[
              { label: 'Private DNS (Android 9+)', value: 'dns.safetylink.online' },
              { label: 'DNS over HTTPS (DoH)', value: 'https://dns.safetylink.online/dns-query' },
              { label: 'DNS over TLS (DoT)', value: 'dns.safetylink.online:853' },
            ].map(e => (
              <div key={e.label} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">{e.label}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded-lg">{e.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="text-center space-y-2">
          <p className="text-[10px] text-slate-500 font-mono">Need help configuring?</p>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
            💬 WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}
