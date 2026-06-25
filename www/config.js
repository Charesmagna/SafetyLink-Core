const CFG = {
  apiBase:          '/api',
  socketPath:       '/socket.io',
  holdDuration:     2000,
  countdownSecs:    10,
  locationInterval: 30000,
  version:          '4.0.0',
};

window.CFG = CFG;

// Legacy alias
const CONFIG = {
  API:       CFG.apiBase,
  HOLD_TIME: CFG.holdDuration,
  ORG:       'DEFAULT',
};
window.CONFIG = CONFIG;
