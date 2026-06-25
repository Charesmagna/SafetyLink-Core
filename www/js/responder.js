const Responder = {
  currentTab: 'active',

  tab(t) {
    this.currentTab = t;
    document.querySelectorAll('#screen-responder .filter-btn').forEach((b, i) => {
      b.classList.toggle('active', ['active','pending'][i] === t);
    });
    this.load();
  },

  async load() {
    const listEl = document.getElementById('responder-list');
    if (!listEl) return;
    listEl.innerHTML = '<p class="muted center">Loading...</p>';
    try {
      if (this.currentTab === 'active') {
        const res  = await fetch(`${App.api}/alerts?status=active`, { headers: Auth.headers() });
        const list = await res.json();
        if (!list.length) { listEl.innerHTML = '<p class="muted center">No active alerts</p>'; return; }
        listEl.innerHTML = list.map(a => `
          <div class="alert-card active">
            <div class="alert-head">
              <span class="alert-name">${a.operator_name || 'Member'}</span>
              <span class="badge badge-active">ACTIVE</span>
            </div>
            <div class="alert-time">${new Date(a.created_at).toLocaleString()}</div>
            ${a.latitude ? `<a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:var(--blue);font-size:12px">Open in Maps</a>` : ''}
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-primary" style="flex:1" onclick="Responder.accept('${a.id}')">Accept</button>
              <button class="btn btn-ghost"   style="flex:1" onclick="Responder.escalate('${a.id}')">Escalate</button>
              <button class="btn btn-ghost"   style="flex:1" onclick="Responder.resolve('${a.id}')">Resolve</button>
            </div>
          </div>`).join('');
      } else {
        const res  = await fetch(`${App.api}/users/pending`, { headers: Auth.headers() });
        if (!res.ok) { listEl.innerHTML = '<p class="muted center">Insufficient permissions</p>'; return; }
        const list = await res.json();
        if (!list.length) { listEl.innerHTML = '<p class="muted center">No pending members</p>'; return; }
        listEl.innerHTML = list.map(u => `
          <div class="alert-card">
            <div class="alert-head">
              <span class="alert-name">${u.display_name || u.email}</span>
              <span class="badge badge-amber">PENDING</span>
            </div>
            <div class="alert-time">${u.email} &bull; ${u.role}</div>
            <button class="btn btn-primary" style="margin-top:8px" onclick="Responder.approve('${u.id}')">Approve</button>
          </div>`).join('');
      }
    } catch { listEl.innerHTML = '<p class="muted center">Error loading</p>'; }
  },

  async accept(id) {
    const res = await fetch(`${App.api}/alerts/${id}/accept`, { method: 'POST', headers: Auth.headers() });
    App.toast(res.ok ? 'Alert accepted' : 'Error');
    this.load();
  },

  async escalate(id) {
    const res = await fetch(`${App.api}/alerts/${id}/escalate`, { method: 'POST', headers: Auth.headers() });
    App.toast(res.ok ? 'Alert escalated' : 'Error');
    this.load();
  },

  async resolve(id) {
    const res = await fetch(`${App.api}/alerts/${id}/resolve`, { method: 'POST', headers: Auth.headers(), body: JSON.stringify({ resolution: 'Resolved by responder' }) });
    App.toast(res.ok ? 'Alert resolved' : 'Error');
    this.load();
  },

  async approve(userId) {
    const res = await fetch(`${App.api}/users/${userId}/approve`, { method: 'PUT', headers: Auth.headers() });
    App.toast(res.ok ? 'Member approved' : 'Error');
    this.load();
  },
};

document.getElementById('screen-responder')?.addEventListener('screen-show', () => Responder.load());
