const fs = require('fs');
let content = fs.readFileSync('src/components/SimulatedNotificationPanel.tsx', 'utf8');

content = content.replace(
  /const \[floatingWidgetSize, setFloatingWidgetSize\] = useState\(100\);\n  const \[opacity, setOpacity\] = useState\(1\.0\);\n  const \[silenceAlerts, setSilenceAlerts\] = useState\(false\);\n  const \[decoyActive, setDecoyActive\] = useState\(false\);/g,
  ''
);

content = content.replace(
  /isOfflineMode\n  \} = useAppStore\(\);/g,
  `isOfflineMode,
    floatingWidgetSize,
    setFloatingWidgetSize,
    decoyActive,
    setDecoyActive,
    silenceAlerts,
    setSilenceAlerts
  } = useAppStore();
  const [opacity, setOpacity] = useState(1.0); // local UI state for opacity`
);

fs.writeFileSync('src/components/SimulatedNotificationPanel.tsx', content);
