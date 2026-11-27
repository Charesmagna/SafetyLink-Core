import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../utils/store';
import { Contact, EmergencyProfileType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { syncProfile } from '../services/ProfileSync';
import {
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react';

interface ContactFcmStatus {
  inputPhone: string;
  phone: string;
  registered: boolean;
  deviceCount: number;
  lastUpdated: number | null;
}

const DEFAULT_API_BACKENDS = [
  'https://api.safetylink.online',
  'https://safetylink-api.tshilidzi-mukwevho54.workers.dev',
];

function normalizePhoneKey(raw: string): string {
  let n = String(raw || '').replace(/[^0-9+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0') && n.length === 10) n = '27' + n.slice(1);
  if (n.length === 9 && /^[6-8]/.test(n)) n = '27' + n;
  return n ? '+' + n : '';
}

function formatRelativeTime(ts: number | null | undefined): string {
  if (!ts) return 'Never';
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const DispatchChain: React.FC = () => {
  const {
    contacts,
    currentUser,
    customBackendUrl,
    updateContact,
    addContact,
    removeContact,
    activeSOSState,
    addToast,
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add/Edit form states
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [template, setTemplate] = useState('');
  const [channelType, setChannelType] = useState<Contact['channelType']>('SMS');
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [fcmEnabled, setFcmEnabled] = useState(true);
  const [triggerTypes, setTriggerTypes] = useState<EmergencyProfileType[]>([]);

  // Search, filter & per-contact FCM config drawer state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL');
  const [expandedFcmContactId, setExpandedFcmContactId] = useState<string | null>(null);
  const [showFcmSummaryPanel, setShowFcmSummaryPanel] = useState(true);

  // Live FCM server & per-contact status state
  const [fcmStatusMap, setFcmStatusMap] = useState<Record<string, ContactFcmStatus>>({});
  const [fcmServerLive, setFcmServerLive] = useState<boolean | null>(null);
  const [fcmServerConfigured, setFcmServerConfigured] = useState<boolean | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [ringingContactId, setRingingContactId] = useState<string | null>(null);
  const [ringFeedback, setRingFeedback] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  const apiCandidates = useMemo(() => {
    const list: string[] = [];
    const custom = String(customBackendUrl || '').trim().replace(/\/+$/, '');
    if (custom && /^https?:\/\//i.test(custom) && !custom.includes('d089bef8b0b58c5d9506b512ec2f63dc.workers.dev')) {
      list.push(custom);
    }
    for (const url of DEFAULT_API_BACKENDS) {
      if (!list.includes(url)) list.push(url);
    }
    return list;
  }, [customBackendUrl]);

  const checkLiveFcmStatuses = useCallback(
    async (silent = false) => {
      setIsCheckingStatus(true);
      setStatusError(null);

      const phonesToQuery = Array.from(
        new Set(
          [
            ...contacts.map((c) => c.phone),
            ...(currentUser?.phone ? [currentUser.phone] : []),
          ]
            .map((p) => String(p || '').trim())
            .filter(Boolean),
        ),
      );

      let succeeded = false;
      let lastErr = 'Unable to reach SafetyLink FCM status server.';

      for (const base of apiCandidates) {
        try {
          const res = await fetch(`${base}/api/device/tokens/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phones: phonesToQuery }),
          });
          if (res.ok) {
            const data: any = await res.json().catch(() => ({}));
            if (data?.ok) {
              const nextMap: Record<string, ContactFcmStatus> = {};
              for (const st of Array.isArray(data.statuses) ? data.statuses : []) {
                const key = normalizePhoneKey(st.phone || st.inputPhone || '');
                if (key) nextMap[key] = st;
              }
              setFcmStatusMap(nextMap);
              setFcmServerLive(true);
              setFcmServerConfigured(Boolean(data.fcmConfigured));
              setLastCheckedAt(Number(data.checkedAt) || Date.now());
              succeeded = true;
              if (!silent) {
                addToast(
                  `FCM live check complete: ${data.linkedCount || 0} linked phone(s), ${data.totalDevices || 0} active device(s).`,
                  'success',
                );
              }
              break;
            }
          }
          // Fallback to per-phone GET /api/device/token/status if worker hasn't deployed batch route yet
          if (res.status === 404) {
            const nextMap: Record<string, ContactFcmStatus> = {};
            let configured = false;
            const probePhones = phonesToQuery.length > 0 ? phonesToQuery : ['+27000000000'];
            for (const raw of probePhones) {
              const r = await fetch(`${base}/api/device/token/status?phone=${encodeURIComponent(raw)}`);
              if (!r.ok) continue;
              const d: any = await r.json().catch(() => ({}));
              if (d?.ok) {
                configured = configured || Boolean(d.fcmConfigured);
                const key = normalizePhoneKey(d.phone || raw);
                if (key && phonesToQuery.length > 0) {
                  nextMap[key] = {
                    inputPhone: raw,
                    phone: d.phone || key,
                    registered: Boolean(d.registered),
                    deviceCount: Number(d.deviceCount || 0),
                    lastUpdated: d.lastUpdated || null,
                  };
                }
              }
            }
            setFcmStatusMap(nextMap);
            setFcmServerLive(true);
            setFcmServerConfigured(configured);
            setLastCheckedAt(Date.now());
            succeeded = true;
            if (!silent) {
              addToast('FCM live status check completed.', 'success');
            }
            break;
          }
          lastErr = `Server returned HTTP ${res.status}`;
        } catch (err: any) {
          lastErr = err?.message || 'Network unavailable';
        }
      }

      if (!succeeded) {
        setFcmServerLive(false);
        setStatusError(lastErr);
        if (!silent) {
          addToast(`FCM status check failed: ${lastErr}`, 'error');
        }
      }

      setIsCheckingStatus(false);
    },
    [apiCandidates, contacts, currentUser?.phone, addToast],
  );

  // Automatically check live FCM statuses on mount and whenever contact count changes
  useEffect(() => {
    void checkLiveFcmStatuses(true);
  }, [contacts.length, currentUser?.phone, checkLiveFcmStatuses]);

  const handleSendTestRing = async (contact: Contact) => {
    setRingingContactId(contact.id);
    setRingFeedback((prev) => {
      const next = { ...prev };
      delete next[contact.id];
      return next;
    });

    let delivered = false;
    let finalMsg = 'Could not reach FCM server.';

    for (const base of apiCandidates) {
      try {
        const res = await fetch(`${base}/api/fcm/test-ring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: contact.phone,
            callerName: currentUser?.fullName || currentUser?.username || 'SafetyLink User',
            callerNumber: currentUser?.phone || '',
            location: `FCM Contact Configuration Ring Check (${contact.label || contact.name || contact.phone})`,
          }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (res.ok && data?.ok) {
          delivered = true;
          finalMsg = `Loud FCM alarm accepted by Firebase for ${data.registeredDevices || 1} device(s).`;
          addToast(`Live FCM test ring sent to ${contact.label || contact.phone}!`, 'success');
          break;
        }
        finalMsg = data?.error || `HTTP ${res.status}`;
        // Don't retry another backend on a definitive 404/429/400 business error
        if (res.status === 404 || res.status === 429 || res.status === 400) {
          break;
        }
      } catch (err: any) {
        finalMsg = err?.message || 'Network error';
      }
    }

    setRingFeedback((prev) => ({
      ...prev,
      [contact.id]: { ok: delivered, message: finalMsg },
    }));
    if (!delivered) {
      addToast(`FCM test ring for ${contact.label || contact.phone}: ${finalMsg}`, 'error');
    }
    setRingingContactId(null);
  };

  const handleSyncNow = async () => {
    setIsSyncingProfile(true);
    try {
      await syncProfile(true);
      await checkLiveFcmStatuses(true);
      addToast('Contacts & FCM registration synced with SafetyLink server.', 'success');
    } catch (err: any) {
      addToast(`Sync failed: ${err?.message || err}`, 'error');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  const getStatusForPhone = (rawPhone: string): ContactFcmStatus | undefined => {
    const key = normalizePhoneKey(rawPhone);
    return key ? fcmStatusMap[key] : undefined;
  };

  const myOwnStatus = currentUser?.phone ? getStatusForPhone(currentUser.phone) : undefined;

  const fcmStats = useMemo(() => {
    let linkedPeople = 0;
    let willRingPeople = 0;
    let willRingDevices = 0;
    const linkedNames: string[] = [];

    for (const c of contacts) {
      const st = getStatusForPhone(c.phone);
      const isLinked = Boolean(st?.registered);
      const isEnabled = c.fcmEnabled !== false;
      if (isLinked) {
        linkedPeople++;
        linkedNames.push(c.label || c.name || c.phone);
        if (isEnabled) {
          willRingPeople++;
          willRingDevices += st?.deviceCount || 1;
        }
      }
    }

    return { linkedPeople, willRingPeople, willRingDevices, linkedNames };
  }, [contacts, fcmStatusMap]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contacts.filter((c) => {
      const st = getStatusForPhone(c.phone);
      const isLinked = Boolean(st?.registered);
      if (filterMode === 'LINKED' && !isLinked) return false;
      if (filterMode === 'UNLINKED' && isLinked) return false;
      if (!q) return true;
      const hay = `${c.label || ''} ${c.name || ''} ${c.phone || ''} ${c.relation || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, searchQuery, filterMode, fcmStatusMap]);

  const toggleTriggerType = (t: EmergencyProfileType) => {
    setTriggerTypes((prev) => (prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t]));
  };

  const handleEditClick = (contact: Contact) => {
    setEditingId(contact.id);
    setLabel(contact.label || contact.name || '');
    setPhone(contact.phone);
    setTemplate(contact.template || '');
    setChannelType(contact.channelType || 'SMS');
    setHasWhatsApp(Boolean(contact.hasWhatsApp || contact.channelType === 'WHATSAPP'));
    setFcmEnabled(contact.fcmEnabled !== false);
    setTriggerTypes(contact.triggerTypes || []);
  };

  const handleSaveEdit = (id: string) => {
    updateContact(id, {
      label,
      name: label,
      phone,
      template,
      channelType,
      hasWhatsApp: hasWhatsApp || channelType === 'WHATSAPP',
      fcmEnabled,
      triggerTypes,
    });
    setEditingId(null);
    setTimeout(() => void checkLiveFcmStatuses(true), 400);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !phone.trim()) return;
    addContact({
      label: label.trim(),
      name: label.trim(),
      phone: phone.trim(),
      template: template || 'EMERGENCY: Distress beacon active near {LAT}, {LNG}',
      channelType,
      hasWhatsApp: hasWhatsApp || channelType === 'WHATSAPP',
      fcmEnabled,
      triggerTypes,
      priority: contacts.length + 1,
    });
    setLabel('');
    setPhone('');
    setTemplate('');
    setChannelType('SMS');
    setHasWhatsApp(false);
    setFcmEnabled(true);
    setTriggerTypes([]);
    setShowAddForm(false);
    addToast(`Added ${label.trim()} — checking live FCM link status...`, 'info');
  };

  const isLiveActive = activeSOSState !== 'IDLE' && activeSOSState !== 'RESOLVED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5 shadow-2xl w-full max-w-2xl mx-auto relative overflow-hidden scanlines"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 neon-glow-blue" />
      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3.5 relative z-10 gap-2 flex-wrap">
        <div className="text-left">
          <h3 className="text-xs font-black text-slate-100 tracking-[0.2em] font-display uppercase">
            Contacts &amp; FCM Loud Ring Network
          </h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            Sequential alerts cascade + live Firebase Cloud Messaging alarm links
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void checkLiveFcmStatuses(false)}
            disabled={isCheckingStatus}
            className="px-3 py-1.5 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            {isCheckingStatus ? 'CHECKING...' : 'STATUS CHECK'}
          </button>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-3.5 py-1.5 text-[9px] font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/20 rounded-full transition-all flex items-center gap-1 shadow-lg shadow-blue-950/40"
            >
              <Plus className="w-3 h-3" />
              ADD CONTACT
            </button>
          )}
        </div>
      </div>

      {/* FCM Live Connection & Ring Configuration Summary Panel */}
      <div className="mt-4 relative z-10 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 text-left space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowFcmSummaryPanel((v) => !v)}
            className="flex items-center gap-2 text-[10px] font-mono font-black text-slate-100 uppercase tracking-wider"
          >
            <Radio className={`w-3.5 h-3.5 ${fcmServerLive && fcmServerConfigured ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>FCM Configurations &amp; Live Status</span>
            {showFcmSummaryPanel ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          <div className="flex items-center gap-2">
            {fcmServerLive === null ? (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
                CONNECTING...
              </span>
            ) : fcmServerLive && fcmServerConfigured ? (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" />
                LIVE CONNECTED
              </span>
            ) : fcmServerLive && !fcmServerConfigured ? (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                FCM KEY PENDING
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/40 flex items-center gap-1">
                <WifiOff className="w-2.5 h-2.5" />
                OFFLINE
              </span>
            )}
          </div>
        </div>

        {showFcmSummaryPanel && (
          <div className="space-y-3 pt-1">
            {/* 3 Key FCM Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-[8px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-emerald-400" />
                  FCM Will Ring
                </div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {fcmStats.willRingPeople}{' '}
                  <span className="text-[9px] font-normal text-slate-400">
                    {fcmStats.willRingPeople === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="text-[8px] font-mono text-slate-500">
                  {fcmStats.willRingDevices} active device{fcmStats.willRingDevices === 1 ? '' : 's'}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-[8px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  Linked With
                </div>
                <div className="text-base font-black text-blue-300 font-mono mt-0.5">
                  {fcmStats.linkedPeople}
                  <span className="text-[10px] font-normal text-slate-500"> / {contacts.length}</span>
                </div>
                <div className="text-[8px] font-mono text-slate-500">
                  {contacts.length - fcmStats.linkedPeople} SMS/Call only
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <div className="text-[8px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  Your Device
                </div>
                <div className={`text-xs font-black font-mono mt-1 ${myOwnStatus?.registered ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {!currentUser?.phone
                    ? 'NO PHONE'
                    : myOwnStatus?.registered
                      ? `LINKED (${myOwnStatus.deviceCount})`
                      : 'NOT SYNCED'}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSyncNow()}
                  disabled={isSyncingProfile}
                  className="text-[8px] font-mono text-blue-400 hover:text-blue-300 underline mt-0.5 disabled:opacity-50"
                >
                  {isSyncingProfile ? 'Syncing...' : 'Sync device now'}
                </button>
              </div>
            </div>

            {/* Who You Are Linked With */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[8.5px] font-mono">
                <span className="text-slate-400 uppercase font-bold">Who You Are Linked With (Live FCM)</span>
                <span className="text-slate-500">
                  Checked: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : 'Not yet'}
                </span>
              </div>
              {fcmStats.linkedNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {contacts
                    .filter((c) => Boolean(getStatusForPhone(c.phone)?.registered))
                    .map((c) => {
                      const st = getStatusForPhone(c.phone);
                      const enabled = c.fcmEnabled !== false;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setExpandedFcmContactId(expandedFcmContactId === c.id ? null : c.id)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono border flex items-center gap-1 transition-all ${
                            enabled
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                              : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span>{c.label || c.name || c.phone}</span>
                          <span className="text-[8px] opacity-70">({st?.deviceCount || 1})</span>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <p className="text-[9px] font-mono text-slate-500">
                  No contacts currently have an active SafetyLink Android FCM token registered. Have your contacts install SafetyLink and sign in with their phone number, then tap <strong className="text-emerald-400">STATUS CHECK</strong>.
                </p>
              )}
              {statusError && (
                <p className="text-[9px] font-mono text-red-400 pt-1">
                  Live check error: {statusError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-3.5 relative z-10 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name or phone..."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <div className="flex gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-[9px] font-mono">
          {([
            { id: 'ALL', label: `All (${contacts.length})` },
            { id: 'LINKED', label: `FCM Live (${fcmStats.linkedPeople})` },
            { id: 'UNLINKED', label: `Not Linked (${Math.max(0, contacts.length - fcmStats.linkedPeople)})` },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterMode === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Contact Form Inline */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSubmit}
            className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3.5 text-left mt-4 relative z-10"
          >
            <h4 className="text-[10px] font-black text-blue-400 font-display tracking-widest uppercase">
              PROVISION DISPATCH &amp; FCM CONTACT
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Name / Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Mom / Armed Patrol"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Phone / Gateway</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27829110000"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Channel Pathway</label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value as Contact['channelType'])}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="CALL">Cellular Direct Voice Call</option>
                <option value="SMS">Automated SMS Broadcast</option>
                <option value="WHATSAPP">WhatsApp Secure Payload</option>
                <option value="GROUP">Community Broadcaster Channel</option>
                <option value="POLICE">SAPS Police Center</option>
              </select>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="flex items-center gap-2 text-[9px] font-mono text-emerald-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fcmEnabled}
                    onChange={(e) => setFcmEnabled(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Ring via FCM Loud Alarm (high-priority emergency wake ring)</span>
                </label>
                <label className="flex items-center gap-2 text-[9px] font-mono text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasWhatsApp || channelType === 'WHATSAPP'}
                    onChange={(e) => setHasWhatsApp(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Contact uses WhatsApp (enables Priority 5 WhatsApp fallback)</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Custom Alert SMS Message Template</label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Use {LAT}, {LNG} to inject real-time GPS coordinates"
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 h-16 focus:outline-none focus:border-blue-500 font-mono resize-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-slate-500 mb-1.5 font-mono uppercase">Alert Scenario — pre-select which contacts receive each alert type</label>
              <div className="flex flex-wrap gap-1.5">
                {(['Medical', 'Hijacking', 'Vehicle Accident', 'Fire', 'Domestic Violence', 'Clock In', 'Clock Out', 'Guard Patrol', 'Custom'] as EmergencyProfileType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTriggerType(t)}
                    className={[
                      'text-[9px] px-2.5 py-1 rounded-lg font-mono border transition-all',
                      triggerTypes.includes(t)
                        ? 'bg-blue-600 border-blue-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {triggerTypes.length === 0 && (
                <p className="text-[8px] text-slate-600 mt-1 font-mono">Leave empty to receive ALL alert types</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white border border-blue-500/20 font-bold rounded-xl text-[10px] hover:bg-blue-500 transition-all font-mono uppercase"
              >
                Save Contact
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Contacts Dispatch List */}
      <div className="space-y-3.5 text-left mt-4 relative z-10">
        {filteredContacts.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
            <p className="text-xs font-mono text-slate-400">
              {contacts.length === 0
                ? 'No emergency contacts added yet.'
                : 'No contacts match your current search or filter.'}
            </p>
            {contacts.length === 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-1.5 text-[10px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase"
              >
                + Add First Emergency Contact
              </button>
            )}
          </div>
        ) : (
          filteredContacts.map((contact, index) => {
            const isEditing = editingId === contact.id;
            const isFcmExpanded = expandedFcmContactId === contact.id;
            const st = getStatusForPhone(contact.phone);
            const isLinked = Boolean(st?.registered);
            const isContactFcmOn = contact.fcmEnabled !== false;
            const displayName = contact.label || contact.name || 'Emergency Contact';
            const avatarLetter = displayName.charAt(0).toUpperCase();
            const feedback = ringFeedback[contact.id];

            const colors = [
              'bg-blue-500/10 text-blue-400 border-blue-500/20',
              'bg-orange-500/10 text-orange-400 border-orange-500/20',
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              'bg-purple-500/10 text-purple-400 border-purple-500/20',
              'bg-amber-500/10 text-amber-400 border-amber-500/20',
            ];
            const colorClass = colors[index % colors.length];

            return (
              <motion.div
                layout
                key={contact.id}
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isLiveActive && index === 0
                    ? 'bg-slate-950 border-orange-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.01]'
                    : 'bg-slate-950/50 border-slate-900/90 hover:border-slate-800'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono"
                      />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <select
                      value={channelType}
                      onChange={(e) => setChannelType(e.target.value as Contact['channelType'])}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono w-full"
                    >
                      <option value="CALL">Cellular Direct Voice Call</option>
                      <option value="SMS">Automated SMS Broadcast</option>
                      <option value="WHATSAPP">WhatsApp Secure Payload</option>
                      <option value="GROUP">Community Broadcaster Channel</option>
                      <option value="POLICE">SAPS Police Center</option>
                    </select>
                    <label className="flex items-center gap-2 text-[9px] font-mono text-emerald-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fcmEnabled}
                        onChange={(e) => setFcmEnabled(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <span>Include in FCM Loud Alarm Ring</span>
                    </label>
                    <div className="flex flex-col mt-2">
                      <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Triggers (Pre-selected conditions)</label>
                      <div className="flex flex-wrap gap-1">
                        {['Medical', 'Hijacking', 'Vehicle Accident', 'Fire', 'Domestic Violence', 'Custom'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTriggerType(t as EmergencyProfileType)}
                            className={`text-[9px] px-2 py-1 rounded font-mono border ${
                              triggerTypes.includes(t as EmergencyProfileType)
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 w-full h-12 font-mono resize-none"
                    />
                    <div className="flex justify-end gap-2 text-[10px] font-mono font-bold pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-300 uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(contact.id)}
                        className="px-3.5 py-1 bg-blue-600 text-white rounded-xl border border-blue-500/20 hover:bg-blue-500 uppercase"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 font-mono ${colorClass}`}>
                          {avatarLetter}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          {/* Contact Name + Live FCM Status Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-100">{displayName}</span>

                            {isLinked && isContactFcmOn ? (
                              <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                FCM LIVE · {st?.deviceCount || 1} {st?.deviceCount === 1 ? 'DEVICE' : 'DEVICES'}
                              </span>
                            ) : isLinked && !isContactFcmOn ? (
                              <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1">
                                <BellOff className="w-2.5 h-2.5" />
                                FCM PAUSED
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                NOT FCM LINKED
                              </span>
                            )}

                            <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 bg-slate-950 border border-slate-900 rounded-full text-blue-400 tracking-wider">
                              {contact.channelType || 'SMS'}
                            </span>
                            {contact.triggerTypes && contact.triggerTypes.length > 0 && (
                              <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-emerald-400 tracking-wider">
                                {contact.triggerTypes.join(', ')}
                              </span>
                            )}
                            <span className="text-[8px] text-slate-500 font-mono">PRIOR #{contact.priority}</span>
                          </div>

                          <p className="text-[10px] font-mono text-slate-400 font-bold">{contact.phone}</p>
                          {contact.template && (
                            <p className="text-[10px] text-slate-400 italic leading-relaxed pl-2 border-l border-slate-800 font-sans">
                              "{contact.template}"
                            </p>
                          )}
                        </div>
                      </div>

                      {!isLiveActive && (
                        <div className="flex items-center gap-1.5 shrink-0 text-[9px] font-mono">
                          <button
                            type="button"
                            onClick={() => setExpandedFcmContactId(isFcmExpanded ? null : contact.id)}
                            className={`px-2 py-1 rounded-lg border font-bold uppercase transition-all flex items-center gap-1 ${
                              isFcmExpanded
                                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300'
                            }`}
                          >
                            <Bell className="w-2.5 h-2.5" />
                            FCM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditClick(contact)}
                            className="text-slate-500 hover:text-slate-300 font-bold uppercase p-1"
                          >
                            EDIT
                          </button>
                          <span className="text-slate-800">|</span>
                          <button
                            type="button"
                            onClick={() => removeContact(contact.id)}
                            className="text-red-500/70 hover:text-red-400 font-bold uppercase p-1"
                          >
                            DEL
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Per-Contact Extra FCM Configuration Drawer */}
                    <AnimatePresence>
                      {isFcmExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-[10px] font-mono">
                            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/80 pb-2">
                              <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Radio className="w-3 h-3" />
                                FCM Configuration — {displayName}
                              </span>
                              <span className="text-[8.5px] text-slate-400">
                                Last Active: <strong className="text-slate-200">{formatRelativeTime(st?.lastUpdated)}</strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px]">
                              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                                <div className="text-slate-500 uppercase text-[8px]">Live Link Status</div>
                                <div className={`font-bold mt-0.5 ${isLinked ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  {isLinked ? 'CONNECTED LIVE' : 'NOT REGISTERED'}
                                </div>
                              </div>
                              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                                <div className="text-slate-500 uppercase text-[8px]">Registered Devices</div>
                                <div className="font-bold text-slate-200 mt-0.5">
                                  {st?.deviceCount || 0} Android / App
                                </div>
                              </div>
                              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 col-span-2 sm:col-span-1">
                                <div className="text-slate-500 uppercase text-[8px]">Link Type</div>
                                <div className="font-bold text-blue-300 mt-0.5 truncate">
                                  {contact.relation || 'Emergency Contact'}
                                </div>
                              </div>
                            </div>

                            {/* Toggle FCM Loud Ring for this contact */}
                            <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2">
                              <div>
                                <div className="text-[9px] font-bold text-slate-200">Ring This Contact via FCM Loud Alarm</div>
                                <div className="text-[8px] text-slate-500">
                                  Wakes screen &amp; plays insistent alarm tone when you trigger SOS
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isContactFcmOn}
                                onChange={(e) => {
                                  updateContact(contact.id, { fcmEnabled: e.target.checked });
                                  addToast(
                                    e.target.checked
                                      ? `FCM loud ring enabled for ${displayName}.`
                                      : `FCM loud ring paused for ${displayName}.`,
                                    'info',
                                  );
                                }}
                                className="accent-emerald-500 w-4 h-4 cursor-pointer"
                              />
                            </div>

                            {/* Action Row: Test Ring, Status Check, Remove */}
                            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  disabled={ringingContactId === contact.id || !isLinked}
                                  onClick={() => void handleSendTestRing(contact)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-black font-black text-[9px] uppercase flex items-center gap-1.5 transition-all"
                                >
                                  <Bell className="w-3 h-3" />
                                  {ringingContactId === contact.id ? 'Ringing...' : 'Send Live Test Ring'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isCheckingStatus}
                                  onClick={() => void checkLiveFcmStatuses(false)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[9px] uppercase flex items-center gap-1"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                                  Check Status
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeContact(contact.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-bold text-[9px] uppercase flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>

                            {feedback && (
                              <div
                                className={`p-2 rounded-lg text-[9px] border ${
                                  feedback.ok
                                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                                    : 'bg-red-950/60 border-red-500/40 text-red-200'
                                }`}
                              >
                                {feedback.message}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
