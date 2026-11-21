import React from 'react';
import { ShieldAlert, Lock, Trash2, X, FileText } from 'lucide-react';

interface PopiaLegalModalProps {
  open: boolean;
  onClose: () => void;
}

export const PopiaLegalModal: React.FC<PopiaLegalModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="SafetyLink POPIA Privacy Policy and Emergency Terms"
    >
      <div className="w-full max-w-xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-xs font-black font-mono uppercase tracking-wider text-white">
                POPIA Privacy Policy &amp; Emergency Terms
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                TM Media Solutions (Pty) Ltd · Reg: 2018/500191/07 · South Africa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Close legal notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
          <section className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-[11px] uppercase">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Important Emergency Service Disclaimer</span>
            </div>
            <p className="text-[11px] text-slate-200">
              SafetyLink is a supplemental emergency notification and coordination tool. It{' '}
              <strong className="text-white">does not replace official South African emergency services</strong>.
              In any life-threatening emergency, always dial <strong className="text-white">10111</strong> (SAPS),{' '}
              <strong className="text-white">112</strong> (Mobile Emergency), or <strong className="text-white">10177</strong> (Ambulance).
              Alert delivery depends on cellular coverage, SIM status, battery power, and third-party network carriers.
            </p>
          </section>

          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[11px] uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>1. Information Processed Under POPIA (Act 4 of 2013)</span>
            </div>
            <p className="text-[11px] text-slate-300">
              When you register and enable protection, SafetyLink processes only the minimum personal information required to
              deliver emergency alerts:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300">
              <li>Identity &amp; contact details: name, phone number, email address, and organization code (if linked).</li>
              <li>Emergency contact roster: names and phone numbers you explicitly save to receive SOS alerts.</li>
              <li>Location &amp; incident telemetry: GPS coordinates and optional alert notes captured during active SOS events or profile sync.</li>
              <li>Optional security hardware: paired Bluetooth iTAG identifiers and organization-authorized CCTV stream endpoints.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-slate-100 font-mono font-bold text-[11px] uppercase">
              2. Purpose Limitation &amp; Organization Scoping
            </h3>
            <p className="text-[11px] text-slate-300">
              Your personal data is never sold or shared with advertisers. Emergency telemetry is shared strictly with your
              nominated emergency contacts and, where you join a security company or organization node, that organization&apos;s
              authorized dispatchers.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-slate-100 font-mono font-bold text-[11px] uppercase">
              3. Zero-Airtime &quot;Please Call Me&quot; Relay
            </h3>
            <p className="text-[11px] text-slate-300">
              To support offline alerts, your phone number, name, last synced coordinates, and up to 5 emergency contacts are
              synced to SafetyLink&apos;s encrypted backend database so an incoming Please Call Me from your number can alert
              your nominated contacts without requiring mobile data or airtime.
            </p>
          </section>

          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-[11px] uppercase">
              <Trash2 className="w-3.5 h-3.5" />
              <span>4. Your POPIA Rights &amp; Data Deletion</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Under POPIA you may request access to, correction of, or permanent deletion of your account, profile, emergency
              contacts, and incident records at any time by contacting our Information Officer at{' '}
              <a href="mailto:info@safetylink.online?subject=POPIA%20Data%20Deletion%20Request" className="text-sky-400 underline">
                info@safetylink.online
              </a>{' '}
              or WhatsApp <span className="font-mono text-emerald-400">+27 68 007 9911</span>. Requests are actioned within 7 business days.
            </p>
          </section>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <a
            href="mailto:info@safetylink.online?subject=POPIA%20Privacy%20%2F%20Deletion%20Request"
            className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline"
          >
            Request Data Deletion / Export
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
