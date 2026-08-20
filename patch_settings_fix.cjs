const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Ensure useAppStore is imported and called correctly.
if (!code.includes('const globalTheme = useAppStore(state => state.globalTheme);')) {
  code = code.replace(
    /const auditLogs = useAppStore\(state => state.auditLogs\);/,
    'const auditLogs = useAppStore(state => state.auditLogs);\n  const globalTheme = useAppStore(state => state.globalTheme);\n  const setGlobalTheme = useAppStore(state => state.setGlobalTheme);'
  );
  
  // Replace the bad rendering logic
  code = code.replace(/useAppStore\.getState\(\)\.globalTheme/g, 'globalTheme');
  code = code.replace(/useAppStore\.getState\(\)\.setGlobalTheme/g, 'setGlobalTheme');

  fs.writeFileSync('src/components/Settings.tsx', code);
  console.log('Fixed useAppStore bindings in Settings.tsx');
}
