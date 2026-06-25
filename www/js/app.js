const LANG = {
  en: {
    'provision.title': 'Join Your Organisation',
    'provision.sub':   'Enter the Organisation Code provided by your group administrator.',
    'provision.btn':   'Verify Code',
    'login.title':     'Sign In',
    'login.btn':       'Sign In',
    'login.register':  'Create Account',
    'reg.title':       'Create Account',
    'reg.btn':         'Submit Registration',
    'sos.hold':        'HOLD FOR SOS',
    'sos.hint':        'Hold 2 seconds to trigger emergency',
    'dash.pending':    'Account pending admin approval',
    'cd.title':        'EMERGENCY ALERT',
    'cd.sub':          'Sending in...',
    'intel.title':     'Alert Intel',
    'hw.title':        'BLE Devices',
    'prof.title':      'My Profile',
    'med.title':       'Medical Profile',
    'anl.title':       'Analytics',
    'resp.title':      'Responder Feed',
    'set.title':       'Settings',
  },
  zu: {
    'provision.title': 'Joyina Inhlangano Yakho',
    'provision.sub':   'Faka ikhodi enikiwe ngumlawuli womhlophe wakho.',
    'provision.btn':   'Qinisekisa Ikhodi',
    'login.title':     'Ngena',
    'login.btn':       'Ngena',
    'login.register':  'Dala I-akhawunti',
    'reg.title':       'Dala I-akhawunti',
    'reg.btn':         'Thumela',
    'sos.hold':        'BAMBA UKUZE UTHUMELE ISICELO',
    'sos.hint':        'Bamba imizuzwana emi-2 ukuze uthume isexwayiso',
    'dash.pending':    'I-akhawunti ilinda imvume yomphathi',
    'cd.title':        'ISEXWAYISO ESIPHUTHUMAYO',
    'cd.sub':          'Iyathunywa ku...',
    'intel.title':     'Ulwazi Lwezexwayiso',
    'hw.title':        'Amadivayisi e-BLE',
    'prof.title':      'Iphrofayela Yami',
    'med.title':       'Iphrofayela Yezokwelapha',
    'anl.title':       'Ukuhlaziywa',
    'resp.title':      'Umgudle Wabaphenduli',
    'set.title':       'Izisetho',
  },
  af: {
    'provision.title': 'Sluit Aan By Jou Organisasie',
    'provision.sub':   'Voer die Organisasiekode in wat deur jou groepbestuurder verskaf word.',
    'provision.btn':   'Verifieer Kode',
    'login.title':     'Teken In',
    'login.btn':       'Teken In',
    'login.register':  'Skep Rekening',
    'reg.title':       'Skep Rekening',
    'reg.btn':         'Dien Registrasie In',
    'sos.hold':        'HOU VIR NOODOPROEP',
    'sos.hint':        'Hou 2 sekondes om noodgeval te aktiveer',
    'dash.pending':    'Rekening wag op admin-goedkeuring',
    'cd.title':        'NOODWAARSKUWING',
    'cd.sub':          'Stuur in...',
    'intel.title':     'Waarskuwing Intel',
    'hw.title':        'BLE Toestelle',
    'prof.title':      'My Profiel',
    'med.title':       'Mediese Profiel',
    'anl.title':       'Analise',
    'resp.title':      'Responder Voer',
    'set.title':       'Instellings',
  },
};

const App = {
  lang: localStorage.getItem('sl_lang') || 'en',
  api:  (localStorage.getItem('sl_api') || '') + '/api',

  init() {
    this.applyLang();
    Offline.init();
    Auth.checkSession();
    this.bindNetworkEvents();
    if (typeof cordova !== 'undefined') this.requestPermissions();
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      el.dispatchEvent(new CustomEvent('screen-show'));
    }
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navMap = {
      'screen-dashboard': 0, 'screen-sos': 0,
      'screen-intel':     1,
      'screen-hardware':  2,
      'screen-profile':   3, 'screen-medical': 3, 'screen-settings': 3,
    };
    const idx = navMap[id];
    const navBtns = el?.querySelectorAll('.nav-btn');
    if (navBtns && idx !== undefined) navBtns[idx]?.classList.add('active');
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('sl_lang', lang);
    this.applyLang();
    App.toast(lang === 'en' ? 'Language: English' : lang === 'zu' ? 'Ulimi: isiZulu' : 'Taal: Afrikaans');
  },

  applyLang() {
    const dict = LANG[this.lang] || LANG.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
  },

  t(key) {
    return (LANG[this.lang] || LANG.en)[key] || key;
  },

  toast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden', 'show');
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => t.classList.add('hidden'), duration);
  },

  bindNetworkEvents() {
    const dot = document.getElementById('dash-status-dot');
    const update = (online) => {
      if (!dot) return;
      dot.className = 'status-dot ' + (online ? 'green' : 'red');
    };
    window.addEventListener('online',  () => { update(true);  Offline.flush(); });
    window.addEventListener('offline', () => update(false));
    update(navigator.onLine);
  },

  requestPermissions() {
    if (!window.cordova?.plugins?.permissions) return;
    const perms = window.cordova.plugins.permissions;
    const list  = [
      perms.ACCESS_FINE_LOCATION,
      perms.ACCESS_BACKGROUND_LOCATION,
      perms.BLUETOOTH_SCAN,
      perms.BLUETOOTH_CONNECT,
      perms.CALL_PHONE,
      perms.POST_NOTIFICATIONS,
      perms.READ_PHONE_STATE,
    ];
    const request = (i) => {
      if (i >= list.length) {
        if (typeof cordova !== 'undefined' && cordova.plugins?.backgroundMode) {
          cordova.plugins.backgroundMode.enable();
          cordova.plugins.backgroundMode.disableBatteryOptimizations();
        }
        return;
      }
      perms.checkPermission(list[i], (s) => {
        if (s.hasPermission) { request(i + 1); return; }
        perms.requestPermission(list[i], () => request(i + 1), () => request(i + 1));
      });
    };
    request(0);
  },
};

const Provision = {
  verify() {
    const code = document.getElementById('prov-code')?.value?.trim()?.toUpperCase();
    if (!code) return App.toast('Enter your organisation code');
    const errEl = document.getElementById('prov-error');
    errEl?.classList.add('hidden');

    fetch(`${App.api}/organizations/mine`, {
      method:  'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.json()).catch(() => null).then(async () => {
      const res = await fetch(`${App.api}/health`).catch(() => null);
      if (!res?.ok) { if (errEl) { errEl.textContent = 'Cannot reach server'; errEl.classList.remove('hidden'); } return; }
      localStorage.setItem('sl_org_code', code);
      document.getElementById('login-org-name').textContent = code;
      document.getElementById('set-org-code').textContent   = 'Org: ' + code;
      App.showScreen('screen-login');
    });
  },
};
