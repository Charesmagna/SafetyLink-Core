import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { Contact } from '../types';

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
    <div className="flex flex-col gap-5 p-5 bg-slate-900 border border-slate-900/60 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />

      <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
        <div className="text-left">
          <h3 className="text-base font-black text-slate-100 tracking-tight font-mono">
            EMERGENCY CONTACTS
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential alert cascade chain
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 transition-all flex items-center gap-1 shadow-md shadow-blue-900/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            ADD
          </button>
        )}
      </div>

      {/* Add Contact Form Inline */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 space-y-3.5 text-left">
          <h4 className="text-xs font-bold text-blue-400 font-mono tracking-wider">
            PROVISION NEW SEQUENTIAL CONTACT
          </h4>
          <div className="space-y-3">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Name / Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Armed Backup Duty"
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +27829110000"
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Channel Type</label>
              <select
                value={channelType}
                onChange={e => setChannelType(e.target.value as Contact['channelType'])}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="CALL">Cellular Direct Voice Call</option>
                <option value="SMS">Automated SMS Broadcast</option>
                <option value="WHATSAPP">WhatsApp Secure Payload</option>
                <option value="GROUP">Community Broadcaster Channel</option>
                <option value="POLICE">SAPS Police Center</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 mb-1 font-mono uppercase">Custom SOS Message Template</label>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              placeholder="Use {LAT}, {LNG} to inject real-time GPS coordinates"
              className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 h-16 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-full text-xs hover:bg-blue-500 transition-colors shadow-md shadow-blue-900/20"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts Dispatch List */}
      <div className="space-y-3 text-left">
        {contacts.map((contact, index) => {
          const isEditing = editingId === contact.id;
          const isLiveActive = activeSOSState !== 'IDLE' && activeSOSState !== 'RESOLVED';
          const avatarLetter = contact.label ? contact.label.charAt(0).toUpperCase() : 'E';

          // Assign distinct pastel colors to contact letters
          const colors = [
            'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
          ];
          const colorClass = colors[index % colors.length];

          return (
            <div
              key={contact.id}
              className={`p-4 rounded-2xl border transition-all ${
                isLiveActive && index === 1
                  ? 'bg-slate-950 border-orange-500/40 shadow-md scale-[1.01]'
                  : 'bg-slate-950/70 border-slate-900 hover:border-slate-800'
              }`}
            >
              {isEditing ? (
                // Edit Interface
                <div className="space-y-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 w-full"
                    />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 w-full font-mono"
                    />
                  </div>
                  <select
                    value={channelType}
                    onChange={e => setChannelType(e.target.value as Contact['channelType'])}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 w-full"
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
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 w-full h-12 font-mono"
                  />
                  <div className="flex justify-end gap-2 text-xs font-bold pt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(contact.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // Regular Display Mode
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {/* Google Style Avatar Indicator */}
                    <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 font-mono ${colorClass}`}>
                      {avatarLetter}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-100">{contact.label}</span>
                        <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-blue-400 tracking-wider">
                          {contact.channelType}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono">#{contact.priority}</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">{contact.phone}</p>
                      <p className="text-[10px] text-slate-500 italic leading-relaxed mt-1 pl-2 border-l border-slate-800">
                        "{contact.template}"
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {!isLiveActive && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(contact)}
                        className="p-1 text-[10px] text-slate-400 hover:text-slate-100 font-mono"
                      >
                        EDIT
                      </button>
                      <span className="text-slate-800 text-[10px]">|</span>
                      <button
                        onClick={() => removeContact(contact.id)}
                        className="p-1 text-[10px] text-red-500 hover:text-red-400 font-mono"
                      >
                        DEL
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
