const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure globalTheme is extracted in App
if (!code.includes('const globalTheme = useAppStore(state => state.globalTheme);')) {
  code = code.replace(
    /const \{ language \} = useAppStore\(\);/,
    'const { language } = useAppStore();\n  const globalTheme = useAppStore(state => state.globalTheme);'
  );
  
  code = code.replace(
    /const getThemeClass = \(\) => \{[\s\S]*?return 'theme-personal';\n  \};/,
    `const getThemeClass = () => {
    let base = 'theme-personal';
    if (activeTab === 'deck') {
      base = currentUser?.orgCode ? 'theme-responder' : 'theme-personal';
    }
    return globalTheme === 'light' ? \`\${base} theme-light\` : base;
  };`
  );

  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx');
}
