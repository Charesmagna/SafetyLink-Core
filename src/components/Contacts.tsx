import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  enable_push: boolean;
  enable_sms: boolean;
  enable_whatsapp: boolean;
}

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [enablePush, setEnablePush] = useState(true);
  const [enableSms, setEnableSms] = useState(true);
  const [enableWhatsapp, setEnableWhatsapp] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Must be logged in');

      const newContact = {
        user_id: user.id,
        name,
        phone,
        enable_push: enablePush,
        enable_sms: enableSms,
        enable_whatsapp: enableWhatsapp
      };

      const { error } = await supabase.from('emergency_contacts').insert([newContact]);
      if (error) throw error;

      setName('');
      setPhone('');
      setEnablePush(true);
      setEnableSms(true);
      setEnableWhatsapp(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (error) throw error;
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden group mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Emergency Contacts</h3>
      
      <form onSubmit={addContact} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />
        
        <div className="flex flex-col gap-2 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enablePush} onChange={e => setEnablePush(e.target.checked)} />
            Enable Push Notification
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enableSms} onChange={e => setEnableSms(e.target.checked)} />
            Enable SMS
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enableWhatsapp} onChange={e => setEnableWhatsapp(e.target.checked)} />
            Enable WhatsApp
          </label>
        </div>

        <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
          Add Contact
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <p className="text-white font-bold">{c.name}</p>
                <p className="text-slate-400 text-sm">{c.phone}</p>
                <div className="flex gap-2 text-xs mt-1 text-slate-500">
                  {c.enable_push && <span>Push</span>}
                  {c.enable_sms && <span>SMS</span>}
                  {c.enable_whatsapp && <span>WhatsApp</span>}
                </div>
              </div>
              <button onClick={() => deleteContact(c.id)} className="text-red-500 hover:text-red-400 font-bold px-3 py-1">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
