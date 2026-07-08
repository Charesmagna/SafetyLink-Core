import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { Contact } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const DispatchChain: React.FC = () => {
  const { contacts, updateContact, addContact, removeContact, activeSOSState } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [template, setTemplate] = useState('');
  const [channelType, setChannelType] = useState<Contact['channelType']>('SMS');

  const handleEditClick = (contact: Contact) => {
    setEditingId(contact.id);
    setLabel(contact.label);
    setPhone(contact.phone);
    setTemplate(contact.template);
    setChannelType(contact.channelType);
  };

  const handleSaveEdit = (id: string) => {
    updateContact(id, { label, phone, template, channelType });
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !phone) return;
    addContact({
      label,
      phone,
      template: template || 'EMERGENCY: Distress beacon active near {LAT}, {LNG}',
      channelType,
      priority: contacts.length + 1
    });
    // Reset Form
    setLabel('');
    setPhone('');
    setTemplate('');
    setChannelType('SMS');
    setShowAddForm(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5 shadow-2xl w-full max-w-md mx-auto relative overflow-hidden scanlines"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 neon-glow-blue" />
      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />

      <div className="flex justify-between items-center border-b border-slate-900 pb-3.5 relative z-10">
        <div className="text-left">
          <h3 className="text-xs font-black text-slate-100 tracking-[0.2em] font-display uppercase">
            Sequential Alerts Cascade
          </h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            Emergency dispatch routing contacts
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-1.5 text-[9px] font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/20 rounded-full transition-all flex items-center gap-1 shadow-lg shadow-blue-950/40"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            ADD NODE
          </button>
        )}
      </div>

      {/* Add Contact Form Inline */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSubmit} 
            className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 space-y-3.5 text-left mt-4 relative z-10"
          >
            <h4 className="text-[10px] font-black text-blue-400 font-display tracking-widest uppercase">
              PROVISION DISPATCH NODE
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Name / Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Armed Patrol Duty"
                  className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Phone / Gateway</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+27829110000"
                  className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Channel Pathway</label>
              <select
                value={channelType}
                onChange={e => setChannelType(e.target.value as Contact['channelType'])}
                className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="CALL">Cellular Direct Voice Call</option>
                <option value="SMS">Automated SMS Broadcast</option>
                <option value="WHATSAPP">WhatsApp Secure Payload</option>
                <option value="GROUP">Community Broadcaster Channel</option>
                <option value="POLICE">SAPS Police Center</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-slate-500 mb-1 font-mono uppercase">Custom Alert SMS Message Template</label>
              <textarea
                value={template}
                onChange={e => setTemplate(e.target.value)}
                placeholder="Use {LAT}, {LNG} to inject real-time GPS coordinates"
                className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 h-16 focus:outline-none focus:border-blue-500 font-mono resize-none"
              />
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
        {contacts.map((contact, index) => {
          const isEditing = editingId === contact.id;
          const isLiveActive = activeSOSState !== 'IDLE' && activeSOSState !== 'RESOLVED';
          const avatarLetter = contact.label ? contact.label.charAt(0).toUpperCase() : 'E';

          const colors = [
            'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
          ];
          const colorClass = colors[index % colors.length];

          return (
            <motion.div
              layout
              key={contact.id}
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isLiveActive && index === 0
                  ? 'bg-slate-950 border-orange-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.01]'
                  : 'bg-slate-950/40 border-slate-900/80 hover:border-slate-800'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      className="bg-slate-950 border border-slate-900 rounded-xl p-2 text-xs text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="bg-slate-950 border border-slate-900 rounded-xl p-2 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <select
                    value={channelType}
                    onChange={e => setChannelType(e.target.value as Contact['channelType'])}
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2 text-xs text-slate-100 font-mono"
                  >
                    <option value="CALL">Cellular Direct Voice Call</option>
                    <option value="SMS">Automated SMS Broadcast</option>
                    <option value="WHATSAPP">WhatsApp Secure Payload</option>
                    <option value="GROUP">Community Broadcaster Channel</option>
                    <option value="POLICE">SAPS Police Center</option>
                  </select>
                  <textarea
                    value={template}
                    onChange={e => setTemplate(e.target.value)}
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2 text-xs text-slate-100 w-full h-12 font-mono resize-none"
                  />
                  <div className="flex justify-end gap-2 text-[10px] font-mono font-bold pt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-300 uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(contact.id)}
                      className="px-3.5 py-1 bg-blue-600 text-white rounded-xl border border-blue-500/20 hover:bg-blue-500 uppercase"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 font-mono ${colorClass}`}>
                      {avatarLetter}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-100">{contact.label}</span>
                        <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 bg-slate-950 border border-slate-900 rounded-full text-blue-400 tracking-wider">
                          {contact.channelType}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono">PRIOR #{contact.priority}</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 font-bold">{contact.phone}</p>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed pl-2 border-l border-slate-800 font-sans">
                        "{contact.template}"
                      </p>
                    </div>
                  </div>

                  {!isLiveActive && (
                    <div className="flex items-center gap-1.5 shrink-0 text-[9px] font-mono">
                      <button
                        onClick={() => handleEditClick(contact)}
                        className="text-slate-500 hover:text-slate-300 font-bold uppercase p-1"
                      >
                        EDIT
                      </button>
                      <span className="text-slate-900">|</span>
                      <button
                        onClick={() => removeContact(contact.id)}
                        className="text-red-500/70 hover:text-red-500 font-bold uppercase p-1"
                      >
                        DEL
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
