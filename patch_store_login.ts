import fs from 'fs';
const content = fs.readFileSync('src/utils/store.ts', 'utf8');

const loginMatch = `
      set({
        currentUser: data.user,
        currentOrg: null,
        superAdminActive: isRealSuperAdmin
      });
`;

const loginReplace = `
      set({
        currentUser: data.user,
        currentOrg: data.org || null,
        superAdminActive: isRealSuperAdmin
      });
`;

if (content.includes(loginMatch)) {
  const newContent = content.replace(loginMatch, loginReplace);
  fs.writeFileSync('src/utils/store.ts', newContent);
  console.log("Patched store.ts successfully");
} else {
  console.log("Could not find the match string in store.ts");
}
