const Analytics = {
  async load() {
    const body = document.getElementById('analytics-body');
    if (!body) return;
    body.innerHTML = '<p class="muted center">Loading...</p>';
    try {
      const res  = await fetch(`${App.api}/organizations/mine/analytics`, { headers: Auth.headers() });
      if (!res.ok) { body.innerHTML = '<p class="muted center">Failed to load</p>'; return; }
      const d    = await res.json();
      const s    = d.stats || {};
      const bars = (d.alertsByDay || []).slice(0, 14).reverse();
      const max  = Math.max(...bars.map(b => parseInt(b.cnt) || 0), 1);
      body.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="big">${s.total || 0}</div><div class="lbl">Total Alerts</div></div>
          <div class="stat-card"><div class="big">${s.active || 0}</div><div class="lbl">Active</div></div>
          <div class="stat-card"><div class="big">${s.resolved || 0}</div><div class="lbl">Resolved</div></div>
          <div class="stat-card"><div class="big">${s.avg_resolve_min || 0}m</div><div class="lbl">Avg Resolve</div></div>
          <div class="stat-card"><div class="big">${d.smsStats?.sent || 0}</div><div class="lbl">SMS Sent</div></div>
          <div class="stat-card"><div class="big">${d.waStats?.sent || 0}</div><div class="lbl">WA Sent</div></div>
        </div>
        <div class="section-header" style="margin-top:16px">Alerts (last 14 days)</div>
        <div class="timeline-bar">
          ${bars.map(b => {
            const h = Math.max(4, Math.round((parseInt(b.cnt) / max) * 56));
            return `<div class="bar" style="height:${h}px;flex:1" title="${b.day}: ${b.cnt}"></div>`;
          }).join('')}
        </div>
        <div style="font-size:11px;color:var(--muted);text-align:right;margin-top:4px">${bars[0]?.day || ''} → ${bars[bars.length-1]?.day || ''}</div>
        <div class="section-header" style="margin-top:16px">Members</div>
        <div class="stat-card"><div class="big">${d.members?.active || 0} / ${d.members?.total || 0}</div><div class="lbl">Active / Total</div></div>
      `;
    } catch {
      body.innerHTML = '<p class="muted center">Error loading analytics</p>';
    }
  },
};

document.getElementById('screen-analytics')?.addEventListener('screen-show', () => Analytics.load());
