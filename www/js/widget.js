const Widget = {
  init() {
    if (typeof cordova === 'undefined') return;
    if (window.homeWidget) {
      this.update();
    }
  },

  update() {
    if (!window.homeWidget) return;
    const user   = Auth.user;
    const orgName = user?.organization_name || localStorage.getItem('sl_org_code') || 'Safety-Link';
    const online  = navigator.onLine;

    homeWidget.setItem('org_name',     orgName,          () => {}, () => {});
    homeWidget.setItem('is_online',    online ? '1':'0', () => {}, () => {});
    homeWidget.setItem('user_name',    user?.display_name || '', () => {}, () => {});
    homeWidget.updateWidget(() => {}, () => {});
  },

  onWidgetTap() {
    App.showScreen('screen-countdown');
    SOS.trigger();
  },
};
