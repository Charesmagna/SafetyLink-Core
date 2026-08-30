const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

const regex = /startWatchMeTimer: \(minutes: number\) => {\n    set\({ watchMeTimerSeconds: minutes \* 60 }\);\n    get\(\).addAuditLog\('SYSTEM', 'INFO', 'Watch Me Timer Started', `Timer set for \${minutes} minutes.`\);\n  },\n  cancelWatchMeTimer: \(pin: string\) => {\n    if \(get\(\).userPin === pin\) {\n      set\({ watchMeTimerSeconds: null }\);\n      get\(\).addAuditLog\('SYSTEM', 'INFO', 'Watch Me Timer Cancelled', 'Timer cancelled securely.'\);\n      return true;\n    }\n    return false;\n  },\n  attemptCancelSOS: \(pin: string\) => {\n    if \(get\(\).userPin === pin\) {\n      set\({ activeSOSState: 'IDLE' }\);\n      get\(\).addAuditLog\('SYSTEM', 'INFO', 'SOS Cancelled', 'SOS cancelled securely.'\);\n      return true;\n    }\n    if \(get\(\).duressPin && get\(\).duressPin === pin\) {\n      \/\/ Duress: pretend to cancel, but keep it active silently\n      get\(\).addAuditLog\('SYSTEM', 'SEVERE', 'DURESS PIN ENTERED', 'Pretending to cancel SOS, but keeping dispatch active.'\);\n      return true; \/\/ Return true to trick the UI\n    }\n    return false;\n  },\n  setUserPin: \(pin: string\) => {\n    set\({ userPin: pin }\);\n    localStorage.setItem\('sl_user_pin', JSON.stringify\(pin\)\);\n  },\n  setDuressPin: \(pin: string\) => {\n    set\({ duressPin: pin }\);\n    localStorage.setItem\('sl_duress_pin', JSON.stringify\(pin\)\);\n  },\n  setMedicalPassport: \(data\) => {\n    set\(state => {\n      const updated = { ...state.medicalPassport, ...data };\n      localStorage.setItem\('sl_medical_passport', JSON.stringify\(updated\)\);\n      return { medicalPassport: updated };\n    }\);\n  },\n/g;

code = code.replace(regex, '');

// Now we need to insert it correctly in the `create` function.
// Let's find `syncStrategy: ` and put it after it inside the create() block.

const insertStr = `
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
`;

code = code.replace("syncStrategy: (localStorage.getItem('sl_sync_strategy') as 'immediate' | 'batch' | 'wifi-only') || 'batch',", 
"syncStrategy: (localStorage.getItem('sl_sync_strategy') as 'immediate' | 'batch' | 'wifi-only') || 'batch'," + insertStr);

fs.writeFileSync('src/utils/store.ts', code);
