const fs = require('fs');
let content = fs.readFileSync('src/components/SimulatedNotificationPanel.tsx', 'utf8');

content = content.replace(
  /isOfflineMode,\n    floatingWidgetSize,\n    setFloatingWidgetSize,\n    decoyActive,\n    setDecoyActive,\n    silenceAlerts,\n    setSilenceAlerts\n  \} = useAppStore\(\);/g,
  `activeSOSState,
    bleDevices,
    userLocation,
    floatingWidgetSize,
    setFloatingWidgetSize,
    decoyActive,
    setDecoyActive,
    silenceAlerts,
    setSilenceAlerts
  } = useAppStore();`
);

content = content.replace(
  /const {\n    isSOSActive,\n    bluetoothConnected,\n    userLocation,\n    isOfflineMode\n  } = useAppStore\(\);/g,
  `const {
    activeSOSState,
    bleDevices,
    userLocation,
    floatingWidgetSize,
    setFloatingWidgetSize,
    decoyActive,
    setDecoyActive,
    silenceAlerts,
    setSilenceAlerts
  } = useAppStore();`
);

content = content.replace(
  /const {\n    activeSOSState,\n    bleDevices,\n    userLocation,\n    floatingWidgetSize,\n    setFloatingWidgetSize,\n    decoyActive,\n    setDecoyActive,\n    silenceAlerts,\n    setSilenceAlerts\n  } = useAppStore\(\);/g,
  `const {
    activeSOSState,
    bleDevices,
    userLocation,
    floatingWidgetSize,
    setFloatingWidgetSize,
    decoyActive,
    setDecoyActive,
    silenceAlerts,
    setSilenceAlerts
  } = useAppStore();
  
  const isSOSActive = activeSOSState !== 'IDLE';
  const bluetoothConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');`
);

// We should also remove Shield, Radio, AlertCircle from imports since they are unused
content = content.replace(/Shield, BellOff, EyeOff, Radio, AlertCircle/g, 'BellOff, EyeOff');

fs.writeFileSync('src/components/SimulatedNotificationPanel.tsx', content);
