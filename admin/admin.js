import { initMap, upsertMarker, panTo, upsertResponderMarker } from './map.js';

let alerts     = {};
let auditRows  = [];
let currentOrg = 'DEFAULT';
let socket;
let adminToken = localStorage.getItem('admin_token');

/* ──────────────────────────────────────
   AUTH
────────────────────────────────────── */
function authHeader() {
  return adminToken ? { 'Authorization': 'Bearer ' + adminToken } : {};
}

async function verifySession() {
  if (!adminToken) return false;
  try {
    const r = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    if (!data.valid) return false;
    const allowedRoles = ['admin', 'supervisor'];
    if (!allowedRoles.includes(data.user?.role)) return false;
    currentOrg = data.user?.org_code || 'DEFAULT';
    return true;
  } catch { return false; }
}

window.adminLogin = async function() {
  const phone    = document.getElementById('lc-phone').value.trim();
  const password = document.getElementById('lc-password').value;
  const errEl    = document.getElementById('lc-error');
  errEl.style.display = 'none';

  try {
    const r = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, password }),
    });
    const data = await r.json();
    if (!r.ok) { errEl.textContent = data.error || 'Login failed'; errEl.style.display = 'block'; return; }
    if (!['admin', 'supervisor'].includes(data.user?.role)) {
      errEl.textContent = 'Admin or Supervisor access required.'; errEl.style.display = 'block'; return;
    }
    adminToken = data.token;
    localStorage.setItem('admin_token', adminToken);
    currentOrg = data.user.org_code;
    showApp();
  } catch (e) {
    errEl.textContent = 'Network error'; errEl.style.display = 'block';
  }
};

window.adminLogout = function() {
  localStorage.removeItem('admin_token');
  adminToken = null;
  document.getElementById('cc-layout').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
};

/* ──────────────────────────────────────
   INIT
────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const valid = await verifySession();
  if (valid) {
    showApp();
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('cc-layout').classList.add('hidden');
  }
});

async function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('cc-layout').classList.remove('hidden');
  initMap();
  await loadAlerts();
  await loadAnalytics();
  connectSocket();
  setInterval(loadAlerts, 30000);
}

/* ──────────────────────────────────────
   PANELS
────────────────────────────────────── */
window.showPanel = function(name) {
  ['map', 'hardware', 'analytics'].forEach(p => {
    document.getElementById(`panel-${p}`).classList.toggle('hidden', p !== name);
  });
  document.querySelectorAll('.cc-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  if (name === 'hardware') loadHardware();
  if (name === 'analytics') loadAnalytics();
};

/* ──────────────────────────────────────
   SOCKET.IO
────────────────────────────────────── */
function connectSocket() {
  const wsEl = document.getElementById('ws-status');
  if (!window.io) { wsEl.textContent = '● NO WS'; return; }

  socket = window.io({ path: '/socket.io', auth: { token: adminToken } });

  socket.on('connect', () => {
    wsEl.textContent = '● LIVE'; wsEl.classList.add('connected');
    socket.emit('subscribe', currentOrg);
    socket.emit('subscribe', 'ADMIN');
  });
  socket.on('disconnect', () => {
    wsEl.textContent = '● DISCONNECTED'; wsEl.classList.remove('connected');
  });
  socket.on('new_alert', a => {
    alerts[a.id] = a; upsertMarker(a); renderSidebar(); panTo(a);
    notify(`🚨 ALERT #${a.id} — ${a.operator_name || a.operator_phone || 'Unknown'}`);
  });
  socket.on('alert_updated', a => {
    alerts[a.id] = a; upsertMarker(a); renderSidebar();
  });
  socket.on('location_update', loc => {
    upsertResponderMarker(loc);
  });
}

function notify(text) {
  if (Notification?.permission === 'granted') {
    new Notification('Safety-Link Command Center', { body: text });
  }
}

/* ──────────────────────────────────────
   DATA
────────────────────────────────────── */
async function loadAlerts() {
  try {
    const r = await fetch(`/api/alerts?limit=200`, { headers: authHeader() });
    if (!r.ok) return;
    const list = await r.json();
    alerts = {};
    list.forEach(a => { alerts[a.id] = a; upsertMarker(a); });
    renderSidebar();
    updateHeaderStats();
  } catch { }
}

async function loadAnalytics() {
  try {
    const r = await fetch(`/api/analytics?org=${currentOrg}`, { headers: authHeader() });
    if (!r.ok) return;
    const data = await r.json();
    updateHeaderStats(data.stats);
    auditRows = data.auditLog || [];

    const s = data.stats || {};
    document.getElementById('an-total').textContent    = s.total    || 0;
    document.getElementById('an-resolved').textContent = s.resolved || 0;
    document.getElementById('an-active').textContent   = s.active   || 0;
    document.getElementById('an-drills').textContent   = s.drills   || 0;
    document.getElementById('an-avgtime').textContent  = s.avg_resolution_minutes || '—';
    document.getElementById('an-sms').textContent      = data.smsStats?.sent || 0;

    const respEl = document.getElementById('an-responders');
    if (data.topResponders?.length) {
      respEl.innerHTML = data.topResponders.map(r =>
        `<div class="audit-row"><span class="audit-time">${r.responses}</span><span class="audit-act">${r.responder_name || r.responder_phone}</span></div>`
      ).join('');
    } else {
      respEl.innerHTML = '<div class="empty">No responder data.</div>';
    }

    renderAudit(data.auditLog || []);
  } catch { }
}

function updateHeaderStats(stats) {
  const all = Object.values(alerts);
  document.getElementById('hs-total').childNodes[0].textContent    = (stats?.total    ?? all.length) + ' ';
  document.getElementById('hs-active').childNodes[0].textContent   = (stats?.active   ?? all.filter(a => a.status === 'active').length) + ' ';
  document.getElementById('hs-resolved').childNodes[0].textContent = (stats?.resolved ?? all.filter(a => a.status === 'resolved').length) + ' ';
  document.getElementById('hs-drills').childNodes[0].textContent   = (stats?.drills   ?? all.filter(a => a.is_drill).length) + ' ';
}

/* ──────────────────────────────────────
   RENDER
────────────────────────────────────── */
function renderSidebar() {
  const el   = document.getElementById('alert-list');
  const list = Object.values(alerts).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (!list.length) { el.innerHTML = '<div class="empty">No alerts.</div>'; return; }

  el.innerHTML = list.map(a => {
    const badge = a.is_drill
      ? '<span class="badge badge-yellow">DRILL</span>'
      : a.status === 'resolved'
        ? '<span class="badge badge-green">OK</span>'
        : `<span class="badge badge-red">T${a.tier}</span>`;
    const time = new Date(a.created_at).toLocaleTimeString();
    const loc  = (a.latitude && a.longitude)
      ? `${parseFloat(a.latitude).toFixed(4)}, ${parseFloat(a.longitude).toFixed(4)}`
      : 'No GPS';
    return `
      <div class="alert-card ${a.is_drill ? 'drill' : a.status}" onclick="showDetail(${a.id})">
        <div class="alert-id">ALERT #${a.id} ${badge}</div>
        <div class="alert-time">${time}</div>
        <div class="alert-loc">📍 ${loc}</div>
        ${a.operator_name ? `<div class="alert-tier">👤 ${a.operator_name}</div>` : ''}
      </div>`;
  }).join('');
}

function renderAudit(rows) {
  const el = document.getElementById('audit-list');
  const an = document.getElementById('an-audit');
  if (!rows.length) {
    el.innerHTML = '<div class="empty">No audit entries.</div>';
    if (an) an.innerHTML = '<div class="empty">No audit entries.</div>';
    return;
  }
  const html = rows.slice(0, 50).map(r => {
    const t = new Date(r.created_at).toLocaleTimeString();
    return `<div class="audit-row"><span class="audit-time">${t}</span><span class="audit-act">${r.action}: ${r.detail || ''}</span></div>`;
  }).join('');
  el.innerHTML = html;
  if (an) an.innerHTML = html;
}

/* ──────────────────────────────────────
   HARDWARE
────────────────────────────────────── */
window.loadHardware = async function() {
  const el = document.getElementById('hardware-list');
  el.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const r = await fetch('/api/hardware', { headers: authHeader() });
    const list = await r.json();
    if (!list.length) { el.innerHTML = '<div class="empty">No devices registered.</div>'; return; }
    el.innerHTML = list.map(d => `
      <div class="hw-card">
        <div class="hw-name">${d.friendly_name}</div>
        <div class="hw-addr">${d.device_address}</div>
        <div class="hw-meta">SVC: ${d.service_uuid} · CHR: ${d.characteristic_uuid}</div>
        <div class="hw-meta">RSSI Baseline: ${d.rssi_baseline != null ? d.rssi_baseline + ' dBm' : 'Not calibrated'}</div>
        <div class="hw-meta">Assigned: ${d.assigned_to_phone || '—'}</div>
        <button onclick="deleteHardware(${d.id})" style="margin-top:8px;padding:4px 10px;background:#7f1d1d;border:none;color:#fca5a5;font-family:monospace;font-size:0.6rem;border-radius:4px;cursor:pointer">REMOVE</button>
      </div>`).join('');
  } catch {
    el.innerHTML = '<div class="empty">Failed to load hardware.</div>';
  }
};

window.registerHardware = async function() {
  const payload = {
    device_address:     document.getElementById('hw-address').value.trim().toUpperCase(),
    friendly_name:      document.getElementById('hw-name').value.trim(),
    service_uuid:       document.getElementById('hw-service').value.trim() || 'FFE0',
    characteristic_uuid: document.getElementById('hw-char').value.trim() || 'FFE1',
    trigger_value:      document.getElementById('hw-trigger').value.trim() || '01',
  };
  if (!payload.device_address || !payload.friendly_name) { alert('Address and name required'); return; }
  const r = await fetch('/api/hardware/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body:    JSON.stringify(payload),
  });
  if (r.ok) {
    ['hw-address', 'hw-name'].forEach(id => { document.getElementById(id).value = ''; });
    loadHardware();
  } else {
    const err = await r.json();
    alert('Error: ' + (err.error || r.status));
  }
};

window.deleteHardware = async function(id) {
  if (!confirm('Remove device from registry?')) return;
  await fetch(`/api/hardware/${id}`, { method: 'DELETE', headers: authHeader() });
  loadHardware();
};

/* ──────────────────────────────────────
   ALERT DETAIL
────────────────────────────────────── */
window.showDetail = function(id) {
  const a = alerts[id];
  if (!a) return;
  if (a.latitude && a.longitude) panTo(a);

  const time = new Date(a.created_at).toLocaleString();
  const loc  = (a.latitude && a.longitude)
    ? `<a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:#3b82f6">${a.latitude}, ${a.longitude}</a>`
    : 'No GPS';

  document.getElementById('detail-content').innerHTML = `
    <h3 style="margin-bottom:12px">ALERT #${a.id}</h3>
    <div class="detail-row"><strong>Status:</strong> ${a.status?.toUpperCase()} ${a.is_drill ? '(DRILL)' : ''}</div>
    <div class="detail-row"><strong>Tier:</strong> ${a.tier}</div>
    <div class="detail-row"><strong>Operator:</strong> ${a.operator_name || '—'}</div>
    <div class="detail-row"><strong>Phone:</strong> ${a.operator_phone || '—'}</div>
    <div class="detail-row"><strong>Organisation:</strong> ${a.org_code}</div>
    <div class="detail-row"><strong>Time:</strong> ${time}</div>
    <div class="detail-row"><strong>Location:</strong> ${loc}</div>
    ${a.status === 'active' ? `
      <button class="action-btn escalate" onclick="adminEscalate(${a.id})">↑ ESCALATE TIER</button>
      <button class="action-btn resolve"  onclick="adminResolve(${a.id})">✓ MARK RESOLVED</button>
    ` : ''}
  `;
  document.getElementById('alert-detail-overlay').classList.remove('hidden');
};

window.closeDetail = function() {
  document.getElementById('alert-detail-overlay').classList.add('hidden');
};

window.adminEscalate = async function(id) {
  await fetch(`/api/alerts/${id}/escalate`, { method: 'POST', headers: authHeader() });
  await loadAlerts();
  window.closeDetail();
};

window.adminResolve = async function(id) {
  await fetch(`/api/alerts/${id}/resolve`, { method: 'POST', headers: authHeader() });
  await loadAlerts();
  window.closeDetail();
};

/* ──────────────────────────────────────
   ORG FILTER
────────────────────────────────────── */
window.setOrg = function(org) {
  currentOrg = org;
  loadAlerts();
  loadAnalytics();
  if (socket) socket.emit('subscribe', org);
};

/* ── Browser notifications permission ── */
if (Notification?.permission === 'default') {
  Notification.requestPermission().catch(() => {});
}
