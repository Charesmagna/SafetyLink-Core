const Intel = {
  currentFilter: 'all',

  async load(filter) {
    if (filter) this.currentFilter = filter;
    const listEl = document.getElementById('intel-list');
    if (!listEl) return;
    listEl.innerHTML = '<p class="muted center">Loading...</p>';
    try {
      const url  = `${App.api}/alerts${this.currentFilter !== 'all' ? '?status=' + this.currentFilter : ''}`;
      const res  = await fetch(url, { headers: Auth.headers() });
      if (!res.ok) { listEl.innerHTML = '<p class="muted center">Failed to load alerts</p>'; return; }
      const list = await res.json();
      if (!list.length) { listEl.innerHTML = '<p class="muted center">No alerts found</p>'; return; }
      listEl.innerHTML = list.map(a => this.renderCard(a)).join('');
    } catch {
      listEl.innerHTML = '<p class="muted center">Network error</p>';
    }
  },

  filter(f) {
    this.currentFilter = f;
    document.querySelectorAll('#intel-filter .filter-btn').forEach((b, i) => {
      b.classList.toggle('active', ['all','active','resolved'][i] === f);
    });
    this.load();
  },

  renderCard(a) {
    const time   = new Date(a.created_at).toLocaleString();
    const badge  = a.status === 'active'
      ? '<span class="badge badge-active">ACTIVE</span>'
      : a.status === 'resolved'
      ? '<span class="badge badge-resolved">RESOLVED</span>'
      : '<span class="badge badge-amber">ESCALATED</span>';
    const loc    = (a.latitude && a.longitude)
      ? `<a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:var(--blue);font-size:12px">View on map</a>`
      : '<span class="alert-loc">Location unavailable</span>';
    const accept = a.status === 'active' && ['responder','supervisor','org_admin','org_owner'].includes(Auth.user?.role)
      ? `<button class="btn btn-ghost" style="width:auto;padding:6px 12px;font-size:12px;margin-top:8px" onclick="Intel.accept('${a.id}')">Accept</button>`
      : '';
    return `<div class="alert-card ${a.status}">
      <div class="alert-head"><span class="alert-name">${a.operator_name || 'Unknown'}</span>${badge}</div>
      <div class="alert-time">${time}</div>
      ${loc}
      ${accept}
      ${a.is_drill ? '<span class="badge badge-amber">DRILL</span>' : ''}
    </div>`;
  },

  async accept(id) {
    try {
      const res = await fetch(`${App.api}/alerts/${id}/accept`, { method: 'POST', headers: Auth.headers() });
      App.toast(res.ok ? 'Alert accepted' : 'Could not accept');
      this.load();
    } catch { App.toast('Network error'); }
  },
};

document.getElementById('screen-intel')?.addEventListener('screen-show', () => Intel.load());
