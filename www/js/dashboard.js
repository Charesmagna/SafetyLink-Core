const Dashboard = {
  populate(user) {
    const nameEl = document.getElementById('dash-name');
    const roleEl = document.getElementById('dash-role-badge');
    const orgEl  = document.getElementById('dash-org-name');
    if (nameEl) nameEl.textContent = user.display_name || user.email || 'Member';
    if (roleEl) roleEl.textContent = (user.role || 'member').replace(/_/g,' ').toUpperCase();
    if (orgEl)  orgEl.textContent  = user.organization_name || localStorage.getItem('sl_org_code') || 'Safety-Link';
  },

  async loadStats() {
    try {
      const res  = await fetch(`${App.api}/organizations/mine/analytics`, { headers: Auth.headers() });
      if (!res.ok) return;
      const data = await res.json();
      const aEl  = document.getElementById('stat-active');
      const rEl  = document.getElementById('stat-resolved');
      if (aEl) aEl.textContent   = data.stats?.active   || 0;
      if (rEl) rEl.textContent   = data.stats?.resolved || 0;
    } catch {}

    try {
      const hwRes = await fetch(`${App.api}/hardware`, { headers: Auth.headers() });
      if (hwRes.ok) {
        const hw  = await hwRes.json();
        const hEl = document.getElementById('stat-hw');
        if (hEl) hEl.textContent = hw.length || 0;
      }
    } catch {}

    const user = Auth.user;
    if (user && ['org_admin','org_owner','supervisor'].includes(user.role)) {
      try {
        const pr = await fetch(`${App.api}/users/pending`, { headers: Auth.headers() });
        if (pr.ok) {
          const pending = await pr.json();
          const banner  = document.getElementById('pending-users-banner');
          const countEl = document.getElementById('pending-count');
          if (pending.length > 0) {
            if (countEl) countEl.textContent = pending.length;
            if (banner)  banner.classList.remove('hidden');
          }
        }
      } catch {}
    }
  },
};

const Socket = {
  io: null,

  connect() {
    if (typeof io === 'undefined') return;
    const base = (localStorage.getItem('sl_api') || window.location.origin);
    this.io    = io(base, { auth: { token: Auth.token }, transports: ['websocket','polling'] });

    this.io.on('connect', () => console.log('[WS] connected'));
    this.io.on('disconnect', () => console.log('[WS] disconnected'));

    this.io.on('new_alert', (alert) => {
      App.toast(`ALERT: ${alert.status?.toUpperCase()} — ${new Date(alert.created_at).toLocaleTimeString()}`);
      Dashboard.loadStats();
      if (document.getElementById('screen-intel')?.classList.contains('active')) Intel.load();
      if (document.getElementById('screen-responder')?.classList.contains('active')) Responder.load();
    });

    this.io.on('alert_updated', () => {
      Dashboard.loadStats();
      if (document.getElementById('screen-intel')?.classList.contains('active')) Intel.load();
    });

    this.io.on('location_update', () => {});
  },

  disconnect() {
    this.io?.disconnect();
  },
};
