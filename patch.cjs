const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

const replacement = `
  startWatchMeTimer: (minutes: number) => {
    set({ watchMeTimerSeconds: minutes * 60 });
    get().addAuditLog('SYSTEM', 'INFO', 'Watch Me Timer Started', \`Timer set for \${minutes} minutes.\`);
  },
  cancelWatchMeTimer: (pin: string) => {
    if (get().userPin === pin) {
      set({ watchMeTimerSeconds: null });
      get().addAuditLog('SYSTEM', 'INFO', 'Watch Me Timer Cancelled', 'Timer cancelled securely.');
      return true;
    }
    return false;
  },
  attemptCancelSOS: (pin: string) => {
    if (get().userPin === pin) {
      set({ activeSOSState: 'IDLE' });
      get().addAuditLog('SYSTEM', 'INFO', 'SOS Cancelled', 'SOS cancelled securely.');
      return true;
    }
    if (get().duressPin && get().duressPin === pin) {
      // Duress: pretend to cancel, but keep it active silently
      get().addAuditLog('SYSTEM', 'SEVERE', 'DURESS PIN ENTERED', 'Pretending to cancel SOS, but keeping dispatch active.');
      return true; // Return true to trick the UI
    }
    return false;
  },
  setUserPin: (pin: string) => {
    set({ userPin: pin });
    localStorage.setItem('sl_user_pin', JSON.stringify(pin));
  },
  setDuressPin: (pin: string) => {
    set({ duressPin: pin });
    localStorage.setItem('sl_duress_pin', JSON.stringify(pin));
  },
  setMedicalPassport: (data) => {
    set(state => {
      const updated = { ...state.medicalPassport, ...data };
      localStorage.setItem('sl_medical_passport', JSON.stringify(updated));
      return { medicalPassport: updated };
    });
  },

  // Background service states
`;

code = code.replace(/\/\/ Background service states/g, replacement);

fs.writeFileSync('src/utils/store.ts', code);
