import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { Contact } from '../types';

export const Contacts: React.FC = () => {
  const { contacts, addContact: storeAddContact, removeContact: storeRemoveContact } = useAppStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    await storeAddContact({
      label: name,
      name,
      phone,
      relation: 'Emergency Contact',
      priority: contacts.length + 1
    });
    setName('');
    setPhone('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-sans">
      <h2 className="text-xl font-bold text-emerald-400 mb-4 font-mono tracking-wider">EMERGENCY CONTACTS</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Contact Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
          required
        />
        <input
          type="tel"
          placeholder="Phone (+27...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-lg uppercase tracking-wider"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No emergency contacts registered.</p>
        ) : (
          contacts.map((c: Contact) => (
            <div
              key={c.id}
              className="flex justify-between items-center p-3 bg-slate-950/70 border border-slate-800 rounded-lg"
            >
              <div>
                <span className="font-bold text-sm text-slate-200 block">{c.name || c.label}</span>
                <span className="text-xs text-slate-400 font-mono">{c.phone}</span>
              </div>
              <button
                onClick={() => storeRemoveContact(c.id)}
                className="text-xs text-red-400 hover:text-red-300 font-mono uppercase"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Contacts;
