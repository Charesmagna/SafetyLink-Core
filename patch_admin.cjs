const fs = require('fs');
const file = 'src/components/AdminPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const useAppStoreMatch = code.match(/  const \{[^}]+} = useAppStore\(\);/s);
const useMemoMatch = code.match(/  const userCountsByOrg = useMemo\(\(\) => \{[\s\S]*?\}, \[users\]\);/s);

code = code.replace(useAppStoreMatch[0], '');
code = code.replace(useMemoMatch[0], useAppStoreMatch[0] + '\n\n' + useMemoMatch[0]);

fs.writeFileSync(file, code);
