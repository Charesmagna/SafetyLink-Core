const Settings = {
  togglePush(enabled) {
    localStorage.setItem('sl_push_enabled', enabled ? '1' : '0');
    App.toast(enabled ? 'Push notifications enabled' : 'Push notifications disabled');
  },

  load() {
    const orgCode = localStorage.getItem('sl_org_code');
    const codeEl  = document.getElementById('set-org-code');
    if (codeEl && orgCode) codeEl.textContent = 'Org Code: ' + orgCode;
    const pushEl  = document.getElementById('set-push');
    if (pushEl) pushEl.checked = localStorage.getItem('sl_push_enabled') !== '0';
  },
};

document.getElementById('screen-settings')?.addEventListener('screen-show', () => Settings.load());
