const fs = require('fs');
const path = 'src/services/EmergencyBridgeService.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `    // Queue to offline storage if all retries failed
    console.warn('[Offline Dispatch] All immediate retries failed. Queuing to secure local DB.');
    // TODO: Write to offline SQLite queue for later synchronization
    return false;`;

const repl = `    // Queue to offline storage if all retries failed
    console.warn('[Offline Dispatch] All immediate retries failed. Queuing to secure local DB.');
    const { useAppStore } = await import('../utils/store');
    const store = useAppStore.getState();
    const offlineItem = {
      id: \`INC-\${Math.floor(1000 + Math.random() * 9000)}-SA\`,
      timestamp: Date.now(),
      description: 'Emergency Triggered via Hardware Button [Offline Cache]',
      lat: payload.latitude,
      lng: payload.longitude
    };
    const updatedQueue = [...store.localOfflineQueue, offlineItem];
    useAppStore.setState({ localOfflineQueue: updatedQueue });
    
    // In a real app we would persist this directly to SQLite. 
    // Here we leverage the zustand store which persists to localStorage.
    return false;`;

content = content.replace(target, repl);
fs.writeFileSync(path, content);
console.log('Patched EmergencyBridgeService.ts');
