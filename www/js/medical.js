const Medical = {
  async load() {
    try {
      const res  = await fetch(`${App.api}/users/profile`, { headers: Auth.headers() });
      if (!res.ok) return;
      const data = await res.json();
      const m    = data.medical || {};
      const set  = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      set('med-blood',      m.blood_type);
      set('med-conditions', m.conditions);
      set('med-meds',       m.medications);
      set('med-allergies',  m.allergies);
      set('med-notes',      m.emergency_notes);
    } catch {}
  },

  async save() {
    const body = {
      blood_type:      document.getElementById('med-blood')?.value,
      conditions:      document.getElementById('med-conditions')?.value?.trim(),
      medications:     document.getElementById('med-meds')?.value?.trim(),
      allergies:       document.getElementById('med-allergies')?.value?.trim(),
      emergency_notes: document.getElementById('med-notes')?.value?.trim(),
    };
    try {
      await fetch(`${App.api}/users/profile/medical`, { method: 'PUT', headers: Auth.headers(), body: JSON.stringify(body) });
      const msg = document.getElementById('med-save-msg');
      if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 2000); }
    } catch { App.toast('Save failed'); }
  },
};

document.getElementById('screen-medical')?.addEventListener('screen-show', () => Medical.load());
