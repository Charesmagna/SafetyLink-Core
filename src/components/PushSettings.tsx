import React, { useState } from "react";
import { Sliders, Bell, Volume2, ShieldAlert } from "lucide-react";
import { PushNotificationChannelSettings } from "../types_enterprise";

export default function PushSettings() {
  const [channels, setChannels] = useState<PushNotificationChannelSettings[]>([
    {
      channelId: "crit-alert",
      name: "Critical Alerts",
      enabled: true,
      sound: "siren",
      vibration: true,
      priority: "high",
      silentModeOverride: true
    },
    {
      channelId: "med-alert",
      name: "Medical Emergency Alerts",
      enabled: true,
      sound: "siren",
      vibration: true,
      priority: "high",
      silentModeOverride: true
    },
    {
      channelId: "disp-alert",
      name: "Dispatch Alerts",
      enabled: true,
      sound: "chime",
      vibration: true,
      priority: "high",
      silentModeOverride: false
    },
    {
      channelId: "hw-alert",
      name: "Hardware Fault Alerts",
      enabled: true,
      sound: "default",
      vibration: false,
      priority: "default",
      silentModeOverride: false
    },
    {
      channelId: "shift-alert",
      name: "Shift & Patrol Alerts",
      enabled: true,
      sound: "default",
      vibration: true,
      priority: "default",
      silentModeOverride: false
    },
    {
      channelId: "sys-alert",
      name: "System & Heartbeat Alerts",
      enabled: false,
      sound: "silent",
      vibration: false,
      priority: "low",
      silentModeOverride: false
    }
  ]);

  const toggleChannel = (id: string) => {
    setChannels(prev =>
      prev.map(c => (c.channelId === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateSound = (id: string, sound: "default" | "siren" | "chime" | "silent") => {
    setChannels(prev =>
      prev.map(c => (c.channelId === id ? { ...c, sound } : c))
    );
  };

  const updatePriority = (id: string, priority: "high" | "default" | "low") => {
    setChannels(prev =>
      prev.map(c => (c.channelId === id ? { ...c, priority } : c))
    );
  };

  const toggleOverride = (id: string) => {
    setChannels(prev =>
      prev.map(c => (c.channelId === id ? { ...c, silentModeOverride: !c.silentModeOverride } : c))
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="push-notif-settings-mgr">
      <div className="border-b border-slate-800 pb-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-pink-400 font-mono flex items-center gap-2">
          <Sliders className="w-5 h-5 text-pink-400" />
          Notification Management Centre
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5">Configure individual alert notification channels & high-priority ring overrides</p>
      </div>

      <div className="space-y-3.5">
        {channels.map(chan => (
          <div
            key={chan.channelId}
            className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3.5 hover:border-slate-800 transition"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${chan.enabled ? "text-pink-400" : "text-slate-600"}`} />
                <span className="font-bold text-xs text-slate-200">{chan.name}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chan.enabled}
                  onChange={() => toggleChannel(chan.channelId)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            {/* Config Sub-panel */}
            {chan.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-900 text-[11px]">
                {/* Sound Selector */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider font-bold">Alert Ring Sound</span>
                  <select
                    value={chan.sound}
                    onChange={e => updateSound(chan.channelId, e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-300 font-medium focus:border-pink-500 outline-none"
                  >
                    <option value="default">Default Beep</option>
                    <option value="siren">🚨 Continuous Siren</option>
                    <option value="chime">🔔 Soft Chime</option>
                    <option value="silent">🔕 Silent</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider font-bold">Android Channel Priority</span>
                  <select
                    value={chan.priority}
                    onChange={e => updatePriority(chan.channelId, e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-300 font-medium focus:border-pink-500 outline-none"
                  >
                    <option value="high">HIGH (Immediate Screen Takeover)</option>
                    <option value="default">DEFAULT (Notification Drawer)</option>
                    <option value="low">LOW (Quiet Tray)</option>
                  </select>
                </div>

                {/* Silent Override Switch */}
                <div className="flex flex-col justify-center">
                  <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider font-bold">DND Silent Bypass</span>
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chan.silentModeOverride}
                      onChange={() => toggleOverride(chan.channelId)}
                      className="rounded border-slate-800 bg-slate-900 text-pink-500 focus:ring-pink-500 w-3.5 h-3.5"
                    />
                    <span className="text-[10.5px] text-slate-300 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-pink-500" />
                      Override Silent/DND
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
