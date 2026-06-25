const SOS = {
  holdTimer:  null,
  holdStart:  null,
  HOLD_MS:    2000,

  startHold(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('sos-btn') || document.getElementById('sos-full-btn');
    btn?.classList.add('holding');
    if (typeof navigator?.vibrate === 'function') navigator.vibrate(50);
    this.holdStart = Date.now();
    this.holdTimer = setTimeout(() => {
      this.trigger();
    }, this.HOLD_MS);
  },

  cancelHold() {
    clearTimeout(this.holdTimer);
    this.holdTimer = null;
    const btn = document.getElementById('sos-btn') || document.getElementById('sos-full-btn');
    btn?.classList.remove('holding');
  },

  trigger() {
    this.cancelHold();
    if (typeof navigator?.vibrate === 'function') navigator.vibrate([200,100,200,100,200]);
    if (typeof cordova !== 'undefined' && cordova.plugins?.backgroundMode) {
      cordova.plugins.backgroundMode.wakeUp();
      cordova.plugins.backgroundMode.unlock();
    }
    Countdown.start();
    App.showScreen('screen-countdown');
  },
};
