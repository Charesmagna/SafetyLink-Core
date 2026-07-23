const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const bootEffect = `
  useEffect(() => {
    // Auto-reconnect bound BLE devices on app start
    const store = useAppStore.getState();
    const boundDevices = store.bleDevices.filter(d => d.triggerServiceUuid && d.triggerCharacteristicUuid);
    boundDevices.forEach(d => {
      console.log('Auto-reconnecting to bound BLE device:', d.macAddress);
      store.connectBleDevice(d.macAddress);
    });
  }, []);
`;

if (!content.includes('Auto-reconnect bound BLE devices')) {
  content = content.replace("  // Synchronize state with actual phone", bootEffect + "\n  // Synchronize state with actual phone");
}

fs.writeFileSync('src/App.tsx', content);
