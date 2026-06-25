const API = window.location.origin + '/api';
const token = () => localStorage.getItem('adm_token');
const headers = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${token()}` });

const AdminAuth = {
  async login() {
    const email    = document.getElementById('adm-email')?.value?.trim();
    const password = document.getElementById('adm-password')?.value;
    const errEl    = document.getElementById('adm-err');
    if (errEl) errEl.classList.add('hidden');
    try {
      const res  = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) { if (errEl) { errEl.textContent = data.error || 'Login failed'; errEl.classList.remove('hidden'); } return; }
      const role = data.user?.role || '';
      const allowed = ['supervisor','org_admin','org_owner','platform_owner'];
      if (!allowed.includes(role)) { if (errEl) { errEl.textContent = 'Insufficient permissions'; errEl.classList.remove('hidden'); } return; }
      localStorage.setItem('adm_token', data.accessToken);
      localStorage.setItem('adm_user',  JSON.stringify(data.user));
      document.getElementById('login-overlay')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      const orgLabel = document.getElementById('org-label');
      if (orgLabel) orgLabel.textContent = data.user.organization_name || '';
      CC.init();
    } catch { if (errEl) { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); } }
  },
  check(mode) {
    const t = token();
    if (!t) return;
    const user = JSON.parse(localStorage.getItem('adm_user') || '{}');
    document.getElementById('login-overlay')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
    const orgLabel = document.getElementById('org-label');
    if (orgLabel) orgLabel.textContent = user.organization_name || '';
    if (mode === 'org') OrgDash.init();
    else CC.init();
  },
  logout() {
    localStorage.removeItem('adm_token');
    localStorage.removeItem('adm_user');
    location.reload();
  },
};

const OwnerAuth = {
  async login() {
    const email    = document.getElementById('adm-email')?.value?.trim();
    const password = document.getElementById('adm-password')?.value;
    const errEl    = document.getElementById('adm-err');
    if (errEl) errEl.classList.add('hidden');
    try {
      const res  = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok || data.user?.role !== 'platform_owner') {
        if (errEl) { errEl.textContent = 'Platform Owner access required'; errEl.classList.remove('hidden'); } return;
      }
      localStorage.setItem('adm_token', data.accessToken);
      localStorage.setItem('adm_user',  JSON.stringify(data.user));
      document.getElementById('login-overlay')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      OwnerDash.init();
    } catch { if (errEl) { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); } }
  },
  check() {
    const t = token();
    if (!t) return;
    document.getElementById('login-overlay')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
    OwnerDash.init();
  },
  logout() { localStorage.removeItem('adm_token'); localStorage.removeItem('adm_user'); location.reload(); },
};

const CC = {
  map:         null,
  markers:     {},
  respMarkers: {},
  filter:      'active',
  socket:      null,
  soundOn:     true,

  init() {
    if (!document.getElementById('map')) return;
    this.map = L.map('map').setView([-26.3085, 27.8344], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
    }).addTo(this.map);
    this.loadAlerts();
    this.loadResponders();
    this.connectSocket();
    setInterval(() => { this.loadAlerts(); this.loadResponders(); }, 30000);
  },

  tab(t) {
    ['alerts','responders','pending'].forEach(id => {
      const el = document.getElementById('tab-' + id);
      if (el) el.classList.toggle('hidden', id !== t);
    });
    document.querySelectorAll('.stab').forEach((b, i) => {
      b.classList.toggle('active', ['alerts','responders','pending'][i] === t);
    });
    if (t === 'responders') this.loadResponders();
    if (t === 'pending')    this.loadPending();
  },

  filter(f) {
    this.filter = f;
    document.querySelectorAll('.fbtn').forEach((b, i) => {
      b.classList.toggle('active', ['active','all','resolved'][i] === f);
    });
    this.loadAlerts();
  },

  async loadAlerts() {
    const url = `${API}/alerts${this.filter !== 'all' ? '?status=' + this.filter : ''}`;
    try {
      const res  = await fetch(url, { headers: headers() });
      if (!res.ok) return;
      const list = await res.json();
      document.getElementById('active-count').textContent = list.filter(a => a.status === 'active').length + ' active';
      const listEl = document.getElementById('alert-list');
      if (listEl) listEl.innerHTML = list.length
        ? list.map(a => this.renderAlertCard(a)).join('')
        : '<p style="color:var(--muted);text-align:center;padding:20px;font-size:13px">No alerts</p>';
      list.forEach(a => this.placeMarker(a));
    } catch {}
  },

  renderAlertCard(a) {
    const time  = new Date(a.created_at).toLocaleString();
    const badge = a.status === 'active'
      ? '<span class="badge badge-red">ACTIVE</span>'
      : a.status === 'resolved'
      ? '<span class="badge badge-green">RESOLVED</span>'
      : '<span class="badge badge-amber">ESCALATED</span>';
    const actions = a.status === 'active'
      ? `<div class="a-actions">
           <button class="accept"   onclick="CC.accept('${a.id}')">Accept</button>
           <button class="escalate" onclick="CC.escalate('${a.id}')">Escalate</button>
           <button class="resolve"  onclick="CC.resolve('${a.id}')">Resolve</button>
         </div>` : '';
    return `<div class="a-card ${a.status}" onclick="CC.showDetail('${a.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="a-name">${a.operator_name || 'Unknown'}</span>${badge}
      </div>
      <div class="a-time">${time}</div>
      ${a.is_drill ? '<span class="badge badge-amber">DRILL</span>' : ''}
      ${actions}
    </div>`;
  },

  placeMarker(a) {
    const colours = { active:'#e63946', escalated:'#f4a261', resolved:'#2dc653' };
    const colour  = colours[a.status] || '#8b949e';
    if (!a.latitude || !a.longitude) return;
    if (this.markers[a.id]) { this.markers[a.id].remove(); }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${colour};border:2px solid #fff;${a.status==='active'?'box-shadow:0 0 0 4px rgba(230,57,70,.3)':''}"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    const m = L.marker([a.latitude, a.longitude], { icon }).addTo(this.map);
    m.bindPopup(`<b>${a.operator_name || 'Unknown'}</b><br>${new Date(a.created_at).toLocaleString()}<br><a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank">Google Maps</a>`);
    this.markers[a.id] = m;
    if (a.status === 'active') this.map.setView([a.latitude, a.longitude], 15);
  },

  async showDetail(id) {
    const panel = document.getElementById('detail-panel');
    const cont  = document.getElementById('detail-content');
    try {
      const res  = await fetch(`${API}/alerts/${id}`, { headers: headers() });
      const a    = await res.json();
      cont.innerHTML = `
        <h3 style="margin-bottom:12px">${a.operator_name || 'Unknown'}</h3>
        <div class="detail-row"><div class="lbl">Status</div><div class="val">${a.status?.toUpperCase()}</div></div>
        <div class="detail-row"><div class="lbl">Time</div><div class="val">${new Date(a.created_at).toLocaleString()}</div></div>
        <div class="detail-row"><div class="lbl">Phone</div><div class="val">${a.operator_phone || '—'}</div></div>
        ${a.latitude ? `<div class="detail-row"><div class="lbl">GPS</div><div class="val"><a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:var(--blue)">${a.latitude.toFixed(5)}, ${a.longitude.toFixed(5)}</a></div></div>` : ''}
        ${a.blood_type ? `<div class="detail-row"><div class="lbl">Blood</div><div class="val">${a.blood_type}</div></div>` : ''}
        ${a.allergies  ? `<div class="detail-row"><div class="lbl">Allergies</div><div class="val">${a.allergies}</div></div>` : ''}
        ${a.conditions ? `<div class="detail-row"><div class="lbl">Conditions</div><div class="val">${a.conditions}</div></div>` : ''}
        ${a.status === 'active' ? `<div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-red" style="flex:1" onclick="CC.resolve('${id}')">Resolve</button>
          <button class="btn" style="flex:1;background:var(--amber);color:#000" onclick="CC.escalate('${id}')">Escalate</button>
        </div>` : ''}
      `;
      panel.classList.remove('hidden');
    } catch {}
  },

  closeDetail() { document.getElementById('detail-panel')?.classList.add('hidden'); },

  async accept(id) {
    await fetch(`${API}/alerts/${id}/accept`, { method:'POST', headers:headers() });
    this.loadAlerts();
  },
  async escalate(id) {
    await fetch(`${API}/alerts/${id}/escalate`, { method:'POST', headers:headers() });
    this.loadAlerts();
    this.closeDetail();
  },
  async resolve(id) {
    await fetch(`${API}/alerts/${id}/resolve`, { method:'POST', headers:headers(), body:JSON.stringify({ resolution:'Resolved by command centre' }) });
    this.loadAlerts();
    this.closeDetail();
  },

  async loadResponders() {
    try {
      const res  = await fetch(`${API}/users`, { headers:headers() });
      const list = (await res.json()).filter(u => ['responder','supervisor'].includes(u.role));
      const el   = document.getElementById('responder-list');
      if (!el) return;
      el.innerHTML = list.length
        ? list.map(u => `<div class="a-card"><span class="a-name">${u.display_name || u.email}</span><div class="a-time">${u.role}</div></div>`).join('')
        : '<p style="color:var(--muted);text-align:center;padding:20px;font-size:13px">No responders</p>';
    } catch {}
  },

  async loadPending() {
    try {
      const res  = await fetch(`${API}/users/pending`, { headers:headers() });
      const list = await res.json();
      const el   = document.getElementById('pending-list');
      if (!el) return;
      el.innerHTML = list.length
        ? list.map(u => `<div class="a-card"><div style="display:flex;justify-content:space-between"><span class="a-name">${u.display_name || u.email}</span><button class="btn-sm" onclick="CC.approve('${u.id}')">Approve</button></div><div class="a-time">${u.email} &bull; ${u.role}</div></div>`).join('')
        : '<p style="color:var(--muted);text-align:center;padding:20px;font-size:13px">No pending members</p>';
    } catch {}
  },

  async approve(userId) {
    await fetch(`${API}/users/${userId}/approve`, { method:'PUT', headers:headers() });
    this.loadPending();
  },

  connectSocket() {
    if (typeof io === 'undefined') return;
    this.socket = io(window.location.origin, { auth: { token: token() }, transports:['websocket','polling'] });
    const dot = document.getElementById('ws-dot');
    this.socket.on('connect',    () => { if (dot) { dot.className = 'status-dot green'; } });
    this.socket.on('disconnect', () => { if (dot) { dot.className = 'status-dot red';   } });
    this.socket.on('new_alert',  (a) => {
      this.loadAlerts();
      if (this.soundOn) { const s = document.getElementById('alert-sound'); s?.play(); }
    });
    this.socket.on('alert_updated', () => this.loadAlerts());
    this.socket.on('location_update', (d) => {
      if (!d.lat || !d.lon) return;
      if (this.respMarkers[d.userId]) this.respMarkers[d.userId].remove();
      const icon = L.divIcon({ className:'', html:`<div style="width:12px;height:12px;border-radius:50%;background:#457b9d;border:2px solid #fff"></div>`, iconSize:[12,12], iconAnchor:[6,6] });
      const m = L.marker([d.lat, d.lon], { icon }).addTo(this.map);
      m.bindTooltip(d.displayName || 'Responder');
      this.respMarkers[d.userId] = m;
    });
  },

  toggleSound() {
    this.soundOn = !this.soundOn;
    const btn = document.getElementById('alert-sound-btn');
    if (btn) btn.textContent = this.soundOn ? '&#x1F514; Sound: ON' : '&#x1F515; Sound: OFF';
  },
};

const OwnerDash = {
  async init() {
    await this.loadStats();
    await this.loadOrgs();
  },
  async loadStats() {
    try {
      const res  = await fetch(`${API}/organizations`, { headers:headers() });
      const orgs = await res.json();
      const grid = document.getElementById('platform-stats');
      if (!grid) return;
      const totalMembers = orgs.reduce((a, o) => a + parseInt(o.active_members || 0), 0);
      grid.innerHTML = `
        <div class="stat-card"><div class="big">${orgs.length}</div><div class="lbl">Organisations</div></div>
        <div class="stat-card"><div class="big">${totalMembers}</div><div class="lbl">Active Members</div></div>
        <div class="stat-card"><div class="big">${orgs.filter(o=>o.status==='active').length}</div><div class="lbl">Active Orgs</div></div>
        <div class="stat-card"><div class="big">${orgs.filter(o=>o.subscription_plan!=='free').length}</div><div class="lbl">Paid Plans</div></div>
      `;
    } catch {}
  },
  async loadOrgs() {
    try {
      const res  = await fetch(`${API}/organizations`, { headers:headers() });
      const orgs = await res.json();
      const tbody = document.getElementById('org-tbody');
      if (!tbody) return;
      tbody.innerHTML = orgs.map(o => `<tr>
        <td>${o.organization_name}</td>
        <td><code>${o.organization_code}</code></td>
        <td>${o.plan || o.subscription_plan}</td>
        <td>${o.active_members || 0}</td>
        <td><span class="badge ${o.status==='active'?'badge-green':'badge-amber'}">${o.status}</span></td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn-sm" onclick="OwnerDash.suspend('${o.id}','${o.status==='active'?'suspended':'active'}')">
            ${o.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </td>
      </tr>`).join('');
    } catch {}
  },
  async suspend(id, status) {
    await fetch(`${API}/organizations/${id}/status`, { method:'PUT', headers:headers(), body:JSON.stringify({ status }) });
    this.loadOrgs();
  },
};

const OrgDash = {
  async init() {
    await this.loadStats();
    await this.loadMembers();
    await this.loadHardware();
  },
  async loadStats() {
    try {
      const res  = await fetch(`${API}/organizations/mine/analytics`, { headers:headers() });
      const d    = await res.json();
      const grid = document.getElementById('org-stats-grid');
      if (!grid) return;
      grid.innerHTML = `
        <div class="stat-card"><div class="big">${d.stats?.total||0}</div><div class="lbl">Total Alerts</div></div>
        <div class="stat-card"><div class="big">${d.stats?.active||0}</div><div class="lbl">Active</div></div>
        <div class="stat-card"><div class="big">${d.members?.active||0}</div><div class="lbl">Active Members</div></div>
        <div class="stat-card"><div class="big">${d.smsStats?.sent||0}</div><div class="lbl">SMS Sent</div></div>
      `;
    } catch {}
  },
  async loadMembers() {
    try {
      const res   = await fetch(`${API}/users`, { headers:headers() });
      const list  = await res.json();
      const tbody = document.getElementById('members-tbody');
      if (!tbody) return;
      tbody.innerHTML = list.map(u => `<tr>
        <td>${u.display_name || '—'}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td><span class="badge ${u.status==='active'?'badge-green':'badge-amber'}">${u.status}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
          ${u.status==='pending'?`<button class="btn-sm" onclick="OrgDash.approve('${u.id}')">Approve</button>`:''}
          <button class="btn-sm" onclick="OrgDash.changeRole('${u.id}')">Role</button>
        </td>
      </tr>`).join('');
    } catch {}
  },
  async loadHardware() {
    try {
      const res   = await fetch(`${API}/hardware`, { headers:headers() });
      const list  = await res.json();
      const tbody = document.getElementById('hw-tbody');
      if (!tbody) return;
      tbody.innerHTML = list.map(d => `<tr>
        <td>${d.friendly_name}</td>
        <td><code>${d.device_address}</code></td>
        <td>${d.assigned_name || '—'}</td>
        <td><button class="btn-sm" onclick="OrgDash.removeHw('${d.id}')">Remove</button></td>
      </tr>`).join('');
    } catch {}
  },
  async approve(id) {
    await fetch(`${API}/users/${id}/approve`, { method:'PUT', headers:headers() });
    this.loadMembers();
  },
  async changeRole(id) {
    const role = prompt('New role (member/responder/operator/supervisor/org_admin):');
    if (!role) return;
    await fetch(`${API}/users/${id}/role`, { method:'PUT', headers:headers(), body:JSON.stringify({ role }) });
    this.loadMembers();
  },
  async removeHw(id) {
    if (!confirm('Remove device?')) return;
    await fetch(`${API}/hardware/${id}`, { method:'DELETE', headers:headers() });
    this.loadHardware();
  },
  async saveSettings() {
    const provider = document.getElementById('sms-provider')?.value;
    let config;
    try { config = JSON.parse(document.getElementById('sms-config-json')?.value || '{}'); } catch { alert('Invalid JSON'); return; }
    await fetch(`${API}/organizations/mine/settings`, {
      method:'PUT', headers:headers(),
      body: JSON.stringify({ sms_provider: provider, sms_config: config }),
    });
    alert('Saved');
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) AdminAuth.check();
});
