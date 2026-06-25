const Auth = {
  token:        null,
  refreshToken: null,
  user:         null,

  async login() {
    const email    = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const errEl    = document.getElementById('login-error');
    if (errEl) errEl.classList.add('hidden');
    if (!email || !password) { if (errEl) { errEl.textContent = 'Email and password required'; errEl.classList.remove('hidden'); } return; }
    try {
      const res  = await fetch(`${App.api}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { if (errEl) { errEl.textContent = data.error || 'Login failed'; errEl.classList.remove('hidden'); } return; }
      this.setSession(data);
      await this.postLoginSetup(data.user);
    } catch {
      if (errEl) { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); }
    }
  },

  async register() {
    const name     = document.getElementById('reg-name')?.value?.trim();
    const email    = document.getElementById('reg-email')?.value?.trim();
    const password = document.getElementById('reg-password')?.value;
    const role     = document.getElementById('reg-role')?.value;
    const errEl    = document.getElementById('reg-error');
    const orgCode  = localStorage.getItem('sl_org_code');
    if (errEl) errEl.classList.add('hidden');
    if (!name || !email || !password) { if (errEl) { errEl.textContent = 'All fields required'; errEl.classList.remove('hidden'); } return; }
    try {
      const res  = await fetch(`${App.api}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ display_name: name, email, password, org_code: orgCode, role }),
      });
      const data = await res.json();
      if (!res.ok) { if (errEl) { errEl.textContent = data.error || 'Registration failed'; errEl.classList.remove('hidden'); } return; }
      App.toast('Registration submitted. Awaiting admin approval.', 5000);
      App.showScreen('screen-login');
    } catch {
      if (errEl) { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); }
    }
  },

  async logout() {
    if (this.token) {
      await fetch(`${App.api}/auth/logout`, { method: 'POST', headers: this.headers() }).catch(() => {});
    }
    this.clearSession();
    App.showScreen('screen-provision');
  },

  setSession(data) {
    this.token        = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user         = data.user;
    localStorage.setItem('sl_token',   data.accessToken);
    localStorage.setItem('sl_refresh', data.refreshToken);
    localStorage.setItem('sl_user',    JSON.stringify(data.user));
  },

  clearSession() {
    this.token = this.refreshToken = this.user = null;
    ['sl_token','sl_refresh','sl_user'].forEach(k => localStorage.removeItem(k));
  },

  async checkSession() {
    const token   = localStorage.getItem('sl_token');
    const refresh = localStorage.getItem('sl_refresh');
    const userStr = localStorage.getItem('sl_user');
    const orgCode = localStorage.getItem('sl_org_code');

    if (!orgCode) { App.showScreen('screen-provision'); return; }
    document.getElementById('login-org-name').textContent = orgCode;

    if (!token) { App.showScreen('screen-login'); return; }
    this.token        = token;
    this.refreshToken = refresh;
    this.user         = userStr ? JSON.parse(userStr) : null;

    const me = await this.fetchMe();
    if (me) {
      this.user = me;
      await this.postLoginSetup(me);
    } else {
      const refreshed = await this.tryRefresh();
      if (!refreshed) { App.showScreen('screen-login'); }
    }
  },

  async tryRefresh() {
    if (!this.refreshToken) return false;
    try {
      const res  = await fetch(`${App.api}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.token        = data.accessToken;
      this.refreshToken = data.refreshToken;
      localStorage.setItem('sl_token',   data.accessToken);
      localStorage.setItem('sl_refresh', data.refreshToken);
      const me = await this.fetchMe();
      if (me) { this.user = me; await this.postLoginSetup(me); return true; }
    } catch {}
    return false;
  },

  async fetchMe() {
    try {
      const res = await fetch(`${App.api}/auth/me`, { headers: this.headers() });
      if (res.status === 401) return null;
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  async postLoginSetup(user) {
    localStorage.setItem('sl_user', JSON.stringify(user));
    Dashboard.populate(user);
    this.registerFCM();
    if (user.status === 'pending') {
      document.getElementById('dash-pending-banner')?.classList.remove('hidden');
    }
    App.showScreen('screen-dashboard');
    Dashboard.loadStats();
    Socket.connect();
  },

  headers() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
  },

  async registerFCM() {
    if (typeof PushNotification === 'undefined') return;
    const push = PushNotification.init({
      android: { senderID: localStorage.getItem('sl_fcm_sender') || '' },
    });
    push.on('registration', async (data) => {
      await fetch(`${App.api}/auth/fcm-token`, {
        method:  'POST',
        headers: this.headers(),
        body:    JSON.stringify({ token: data.registrationId }),
      }).catch(() => {});
    });
    push.on('notification', (data) => {
      const screen = data.additionalData?.screen;
      if (screen) App.showScreen(screen);
    });
  },
};
