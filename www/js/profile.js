const Profile = {
  contacts: [],

  async load() {
    try {
      const res  = await fetch(`${App.api}/users/profile`, { headers: Auth.headers() });
      if (!res.ok) return;
      const data = await res.json();
      const set  = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      set('prof-name',  data.display_name);
      set('prof-bio',   data.bio);
      set('prof-phone', data.primary_phone);
      set('prof-ph2',   data.phone_2);
      set('prof-ph3',   data.phone_3);
      this.contacts = data.emergency_contacts || [];
      this.renderContacts();
    } catch {}
  },

  async save() {
    const body = {
      display_name:  document.getElementById('prof-name')?.value?.trim(),
      bio:           document.getElementById('prof-bio')?.value?.trim(),
      primary_phone: document.getElementById('prof-phone')?.value?.trim(),
      phone_2:       document.getElementById('prof-ph2')?.value?.trim(),
      phone_3:       document.getElementById('prof-ph3')?.value?.trim(),
    };
    try {
      await fetch(`${App.api}/users/profile`, { method: 'PUT', headers: Auth.headers(), body: JSON.stringify(body) });
      await fetch(`${App.api}/users/profile/contacts`, { method: 'PUT', headers: Auth.headers(), body: JSON.stringify({ contacts: this.contacts }) });
      const msg = document.getElementById('prof-save-msg');
      if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 2000); }
    } catch { App.toast('Save failed'); }
  },

  addContact() {
    if (this.contacts.length >= 5) { App.toast('Max 5 emergency contacts'); return; }
    this.contacts.push({ name: '', relationship: '', phone: '' });
    this.renderContacts();
  },

  renderContacts() {
    const el = document.getElementById('contacts-list');
    if (!el) return;
    el.innerHTML = this.contacts.map((c, i) => `
      <div class="contact-row" data-i="${i}">
        <input class="input" placeholder="Name" value="${c.name || ''}" oninput="Profile.contacts[${i}].name=this.value"/>
        <input class="input" placeholder="Phone" type="tel" value="${c.phone || ''}" oninput="Profile.contacts[${i}].phone=this.value"/>
        <button onclick="Profile.removeContact(${i})">&#x2715;</button>
      </div>`).join('');
  },

  removeContact(i) {
    this.contacts.splice(i, 1);
    this.renderContacts();
  },

  pickPhoto() {
    if (typeof navigator?.camera === 'undefined') { App.toast('Camera not available in browser'); return; }
    navigator.camera.getPicture(
      (data) => {
        const img = document.getElementById('prof-avatar');
        if (img) img.style.backgroundImage = `url(data:image/jpeg;base64,${data})`;
        fetch(`${App.api}/users/profile`, { method: 'PUT', headers: Auth.headers(), body: JSON.stringify({ photo_base64: data }) }).catch(() => {});
      },
      () => App.toast('Camera cancelled'),
      { quality: 50, destinationType: Camera.DestinationType.DATA_URL, sourceType: Camera.PictureSourceType.PHOTOLIBRARY }
    );
  },
};

document.getElementById('screen-profile')?.addEventListener('screen-show', () => Profile.load());
