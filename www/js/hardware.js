const HardwareScreen = {
  async load() {
    const listEl = document.getElementById('hw-list');
    if (!listEl) return;
    listEl.innerHTML = '<p class="muted center">Loading...</p>';
    try {
      const res  = await fetch(`${App.api}/hardware`, { headers: Auth.headers() });
      const list = await res.json();
      if (!list.length) { listEl.innerHTML = '<p class="muted center">No registered devices</p>'; return; }
      listEl.innerHTML = list.map(d => this.renderCard(d)).join('');
    } catch {
      listEl.innerHTML = '<p class="muted center">Failed to load</p>';
    }
  },

  renderCard(d) {
    const rssi   = d.rssi_baseline || -80;
    const pct    = Math.max(0, Math.min(100, Math.round((rssi + 100) / 60 * 100)));
    const colour = pct > 60 ? 'var(--green)' : pct > 30 ? 'var(--amber)' : 'var(--red)';
    return `<div class="hw-card">
      <div class="hw-card-head">
        <span class="hw-name">${d.friendly_name}</span>
        <div class="rssi-bar"><div class="rssi-fill" style="width:${pct}%;background:${colour}"></div></div>
      </div>
      <div style="font-size:11px;color:var(--muted)">${d.device_address} &bull; ${d.service_uuid}/${d.characteristic_uuid}</div>
      ${d.assigned_name ? `<div style="font-size:12px">Assigned: ${d.assigned_name}</div>` : ''}
      <div class="hw-actions">
        <button class="btn btn-ghost" onclick="HardwareScreen.calibrate('${d.device_address}')">Calibrate</button>
        <button class="btn btn-danger" onclick="HardwareScreen.remove('${d.id}')">Remove</button>
      </div>
    </div>`;
  },

  startScan() {
    const scanEl    = document.getElementById('hw-scan-status');
    const resultsEl = document.getElementById('hw-scan-results');
    scanEl?.classList.remove('hidden');
    resultsEl?.classList.remove('hidden');
    resultsEl.innerHTML = '';

    if (typeof bluetoothle === 'undefined') {
      App.toast('BLE not available in browser — use mobile app');
      scanEl?.classList.add('hidden');
      return;
    }

    bluetoothle.startScan((result) => {
      if (result.status !== 'scanResult') return;
      const existing = resultsEl.querySelector(`[data-addr="${result.address}"]`);
      if (existing) return;
      const el = document.createElement('div');
      el.className          = 'hw-card';
      el.dataset.addr       = result.address;
      el.innerHTML = `<div class="hw-card-head"><span class="hw-name">${result.name || 'Unknown'}</span><span style="font-size:11px;color:var(--muted)">${result.address}</span></div>
        <button class="btn btn-primary" onclick="HardwareScreen.pair('${result.address}','${result.name || 'iTAG Button'}')">Pair Device</button>`;
      resultsEl.appendChild(el);
    }, (err) => {
      App.toast('Scan error: ' + err.message);
      scanEl?.classList.add('hidden');
    }, { services: ['FFE0'], allowDuplicates: false });

    setTimeout(() => {
      bluetoothle.stopScan(() => {}, () => {});
      scanEl?.classList.add('hidden');
      if (!resultsEl.children.length) resultsEl.innerHTML = '<p class="muted center">No devices found</p>';
    }, 10000);
  },

  async pair(address, name) {
    try {
      const res = await fetch(`${App.api}/hardware/register`, {
        method:  'POST',
        headers: Auth.headers(),
        body:    JSON.stringify({
          device_address:      address,
          friendly_name:       name,
          service_uuid:        'FFE0',
          characteristic_uuid: 'FFE1',
          trigger_value:       '01',
        }),
      });
      App.toast(res.ok ? `${name} registered` : 'Registration failed');
      this.load();
    } catch { App.toast('Network error'); }
  },

  async calibrate(address) {
    App.toast('Collecting 5 RSSI samples...');
    const samples = [];
    const collect = () => {
      bluetoothle.rssi((result) => {
        samples.push(result.rssi);
        if (samples.length < 5) setTimeout(collect, 500);
        else {
          fetch(`${App.api}/hardware/calibrate`, {
            method:  'POST',
            headers: Auth.headers(),
            body:    JSON.stringify({ device_address: address, rssi_samples: samples }),
          }).then(() => App.toast('Calibration saved')).catch(() => App.toast('Save failed'));
        }
      }, () => App.toast('RSSI read error'), { address });
    };
    if (typeof bluetoothle !== 'undefined') collect();
    else App.toast('BLE not available');
  },

  async remove(id) {
    if (!confirm('Remove this device?')) return;
    await fetch(`${App.api}/hardware/${id}`, { method: 'DELETE', headers: Auth.headers() });
    this.load();
  },
};

document.getElementById('screen-hardware')?.addEventListener('screen-show', () => HardwareScreen.load());
