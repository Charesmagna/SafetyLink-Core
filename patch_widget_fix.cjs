const fs = require('fs');
let content = fs.readFileSync('src/components/FloatingPanicWidget.tsx', 'utf8');

// Replace useAppStore call and properties
content = content.replace(
  /const {\n    isFloatingWidgetDeployed,\n    setIsFloatingWidgetDeployed,\n    isSOSActive,\n    bluetoothConnected,\n    isOfflineMode,\n    isSurvivalMode\n  } = useAppStore\(\);/g,
  `const {
    activeSOSState,
    bleDevices,
    isSurvivalMode,
    startMultiStagePanic,
    panicCountdown,
    isFloatingWidgetDeployed,
    setIsFloatingWidgetDeployed
  } = useAppStore();
  
  const isSOSActive = activeSOSState !== 'IDLE';
  const bluetoothConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');
  const isCountdownActive = panicCountdown !== null;
  const isOfflineMode = false; // Mocking offline mode since it doesn't exist in AppStore`
);

// Remove useEmergencyListener
content = content.replace(
  /const { startMultiStagePanic, isCountdownActive, panicCountdown } = useEmergencyListener\(\);\n/g,
  ''
);

// Remove unused imports
content = content.replace(
  /import { useEmergencyListener } from '\.\.\/hooks\/useEmergencyListener';\n/g,
  ''
);
content = content.replace(
  /import { Wifi, WifiOff, Bluetooth, RefreshCw, AlertCircle } from 'lucide-react';/g,
  `import { Wifi, WifiOff, Bluetooth, RefreshCw } from 'lucide-react';`
);

content = content.replace(
  /import { motion, AnimatePresence } from 'motion\/react';/g,
  `import { motion } from 'motion/react';`
);

fs.writeFileSync('src/components/FloatingPanicWidget.tsx', content);
