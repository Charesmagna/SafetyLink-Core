const fs = require('fs');
let content = fs.readFileSync('src/utils/store.ts', 'utf8');

const replacement = `  startMultiStagePanic: (description, durationSec) => {
    const duration = durationSec !== undefined ? durationSec : get().sosCountdownDuration;
    if (duration === 0) {
      get().triggerPanic(description);
      return;
    }

    set({ panicCountdown: duration });

    const timerId = setInterval(() => {
      const currentCountdown = get().panicCountdown;
      if (currentCountdown === null) {
        clearInterval(timerId);
        return;
      }

      if (currentCountdown <= 1) {
        clearInterval(timerId);
        set({ panicCountdown: null });
        get().triggerPanic(description);
      } else {
        set({ panicCountdown: currentCountdown - 1 });
      }
    }, 1000);
  },

  syncOfflineQueue:`;

content = content.replace(/syncOfflineQueue:/, replacement);
fs.writeFileSync('src/utils/store.ts', content, 'utf8');
console.log("Restored startMultiStagePanic");
