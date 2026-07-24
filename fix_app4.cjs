const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 3000); return () => clearTimeout(timer); }, []);',
  '  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 7000); return () => clearTimeout(timer); }, []);'
);

fs.writeFileSync('src/App.tsx', content);
