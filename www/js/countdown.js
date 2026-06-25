const Countdown = {
  timer:     null,
  seconds:   10,
  cancelled: false,

  start() {
    this.seconds   = 10;
    this.cancelled = false;
    const numEl    = document.getElementById('countdown-timer');
    const ring     = document.getElementById('cd-ring-fill');
    const statusEl = document.getElementById('countdown-status');
    const CIRCUM   = 339.3;

    if (numEl) numEl.textContent = this.seconds;
    if (ring)  ring.style.strokeDashoffset = '0';
    if (statusEl) statusEl.textContent = '';

    if (typeof navigator?.vibrate === 'function') navigator.vibrate([100,50,100]);

    this.timer = setInterval(() => {
      if (this.cancelled) return;
      this.seconds--;
      if (numEl) numEl.textContent = this.seconds;
      if (ring) {
        const progress = (10 - this.seconds) / 10;
        ring.style.strokeDashoffset = String(CIRCUM * progress);
      }
      if (this.seconds <= 0) {
        clearInterval(this.timer);
        this.dispatch();
      }
    }, 1000);
  },

  cancel() {
    this.cancelled = true;
    clearInterval(this.timer);
    App.toast('Alert cancelled');
    App.showScreen('screen-dashboard');
  },

  async dispatch() {
    const statusEl = document.getElementById('countdown-status');
    if (statusEl) statusEl.textContent = 'Getting location...';

    let lat = null, lon = null;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch {}

    if (statusEl) statusEl.textContent = 'Sending alert...';

    const clientId = 'cli_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const payload  = { latitude: lat, longitude: lon, isDrill: false, source: 'app', clientId };

    if (!navigator.onLine) {
      await Offline.queue('alerts_queue', { url: '/api/alerts', method: 'POST', body: payload });
      if (statusEl) statusEl.textContent = 'Alert queued (offline)';
      App.toast('Offline: Alert queued, will send when online');
      setTimeout(() => App.showScreen('screen-intel'), 2000);
      return;
    }

    try {
      const res  = await fetch(`${App.api}/alerts`, {
        method:  'POST',
        headers: Auth.headers(),
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (statusEl) statusEl.textContent = res.ok ? 'Alert sent! Help is coming.' : 'Send error — retry...';
      if (lat && lon) {
        setInterval(() => {
          navigator.geolocation.getCurrentPosition((p) => {
            fetch(`${App.api}/alerts/location/stream`, {
              method:  'POST',
              headers: Auth.headers(),
              body:    JSON.stringify({
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                accuracy: p.coords.accuracy,
                alertId: data.id,
              }),
            }).catch(() => {});
          }, () => {}, { timeout: 5000 });
        }, 60000);
      }
      setTimeout(() => App.showScreen('screen-intel'), 2500);
    } catch {
      if (statusEl) statusEl.textContent = 'Network error — queuing...';
      await Offline.queue('alerts_queue', { url: '/api/alerts', method: 'POST', body: payload });
      setTimeout(() => App.showScreen('screen-intel'), 2000);
    }
  },
};
