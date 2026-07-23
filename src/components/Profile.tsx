import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  fcm_token: string;
}

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      
      if (data) {
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Must be logged in');

      const updates = {
        user_id: user.id,
        name,
        phone,
      };

      if (profile) {
        const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert([updates]);
        if (error) throw error;
      }

      alert('Profile updated');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden group mb-8">
      <h3 className="text-xl font-bold text-white mb-4">My Profile</h3>
      
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <form onSubmit={updateProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">
            Save Profile
          </button>
        </form>
      )}
    </div>
  );
};
