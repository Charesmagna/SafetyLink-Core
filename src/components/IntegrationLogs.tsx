import React, { useState } from "react";
import { MessageSquare, PhoneCall, Database, RefreshCw, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { SMSLog, WhatsAppLog, VoiceLog } from "../types";

interface IntegrationLogsProps {
  smsLogs: SMSLog[];
  whatsappLogs: WhatsAppLog[];
  voiceLogs: VoiceLog[];
  onTriggerVoiceState: (id: string, status: "answered" | "no-answer" | "busy") => void;
  refreshData: () => void;
}

export default function IntegrationLogs({
  smsLogs,
  whatsappLogs,
  voiceLogs,
  onTriggerVoiceState,
  refreshData
}: IntegrationLogsProps) {
  const [activeTab, setActiveTab] = useState<"sms" | "whatsapp" | "voice">("sms");

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/80 text-indigo-400 border border-indigo-500/20 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider font-mono text-white">API Escapes & Gateway logs</h2>
            <p className="text-xs text-slate-400">Live transaction monitoring of Twilio SMS dispatch, Meta WhatsApp API, and automated voice escalation trees</p>
          </div>
        </div>

        <button 
          onClick={refreshData}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 transition uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Fetch Live Logs
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-4 font-mono">
        <button
          onClick={() => setActiveTab("sms")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
            activeTab === "sms" 
              ? "bg-indigo-950 text-indigo-400 border border-indigo-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Twilio SMS dispatches ({smsLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
            activeTab === "whatsapp" 
              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Send className="w-4 h-4" />
          Meta WhatsApp logs ({whatsappLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
            activeTab === "voice" 
              ? "bg-amber-950 text-amber-400 border border-amber-500/30" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Automated Voice Cascades ({voiceLogs.length})
        </button>
      </div>

      {/* Tables based on tabs */}
      <div className="overflow-x-auto min-h-[300px] font-mono">
        {activeTab === "sms" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Gateway Provider</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatch Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {smsLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                    No SMS dispatches registered. Trigger an SOS panic flow on the simulator to monitor.
                  </td>
                </tr>
              ) : (
                smsLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-mono text-slate-400">{log.id.slice(0, 12)}...</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{log.toNumber}</td>
                    <td className="py-3 px-4 text-indigo-400 font-semibold">{log.provider.toUpperCase()}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(log.sentAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "whatsapp" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Message ID</th>
                <th className="py-3 px-4">Destination ZA phone</th>
                <th className="py-3 px-4">API Port Response</th>
                <th className="py-3 px-4">Dispatch Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {whatsappLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 italic">No WhatsApp Meta API logs registered.</td>
                </tr>
              ) : (
                whatsappLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 text-slate-400">{log.messageId}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{log.toNumber}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {log.status.toUpperCase()} (Meta-200)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(log.sentAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "voice" && (
          <div className="space-y-4">
            <div className="text-xs text-amber-300 bg-amber-950/30 rounded-xl p-4 border border-amber-500/20 flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                <b>Interactive Automated Voice Escalation Desk:</b> Simulated automated phone triggers require responder confirmation callback loops. You can manually simulate contact response states (No-Answer / Answered) to test the cascading escalation chain.
              </span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Call Session</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Cascade Turn</th>
                  <th className="py-3 px-4">Line Status</th>
                  <th className="py-3 px-4">Initiated at</th>
                  <th className="py-3 px-4 text-right">Interactive Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {voiceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">No automated voice call cascades initiated.</td>
                  </tr>
                ) : (
                  voiceLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 text-slate-400">{log.id.slice(0, 12)}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-200">{log.contactName}</p>
                        <p className="text-[10px] text-slate-500">{log.contactNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-400">Step {log.attemptNumber} of 3</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === "answered" 
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" 
                            : log.status === "initiated" 
                              ? "bg-blue-950 text-blue-400 border border-blue-500/20 animate-pulse" 
                              : "bg-rose-950 text-rose-400 border border-rose-500/20"
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{new Date(log.initiatedAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-right">
                        {log.status === "initiated" ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => onTriggerVoiceState(log.id, "answered")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded-md text-[9px] uppercase tracking-wider"
                            >
                              Answered
                            </button>
                            <button
                              onClick={() => onTriggerVoiceState(log.id, "no-answer")}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2 rounded-md text-[9px] uppercase tracking-wider"
                            >
                              Decline / No-Ans
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] flex items-center justify-end gap-1 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
