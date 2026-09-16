const fs = require('fs');
function removeImport(file, name) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(`import.*?${name}.*?;\\n?`), '');
    content = content.replace(new RegExp(`import {.*?${name}.*?} from '.*?';\\n?`), '');
    fs.writeFileSync(file, content);
}
try {
  removeImport('src/components/landing/Enterprise.tsx', 'React');
  removeImport('src/providers/bland/index.ts', 'env');
  removeImport('src/providers/infobip/index.ts', 'env');
  removeImport('src/providers/telegram/index.ts', 'env');
  removeImport('src/utils/store.ts', 'Capacitor');
  removeImport('src/utils/store.ts', 'NativeDispatchService');
  removeImport('src/utils/store.ts', 'OrgSyncService');
} catch (e) {
  console.log(e);
}
