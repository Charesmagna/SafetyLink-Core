import fs from 'fs';
const content = fs.readFileSync('src/utils/store.ts', 'utf8');

const loginMatch = `
      set({
        currentUser: data.user,
        token: data.token,
        superAdminActive: isRealSuperAdmin,
        currentOrg: null
      });
`;

const loginReplace = `
      const isOrgRole = ['Organization Administrator', 'Control Room Operator', 'Dispatcher'].includes(data.user.role);
      set({
        currentUser: data.user,
        token: data.token,
        superAdminActive: isRealSuperAdmin,
        currentOrg: (isOrgRole && data.org) ? data.org : null
      });
      if (data.org) {
        setStoredJSON('sl_current_org', (isOrgRole && data.org) ? data.org : null);
      }
`;

const newContent = content.replace(loginMatch.trim(), loginReplace.trim());
fs.writeFileSync('src/utils/store.ts', newContent);
console.log("Patched store.ts successfully");
