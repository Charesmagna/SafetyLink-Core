const fs = require('fs');
const file = 'src/utils/store.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /updateUserProfile: \(id, updated\) => \{/;

const replacement = `
  updateUserPassword: (id, newPassword) => {
    const users = get().users;
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, password: newPassword } : u
    );
    set({ users: updatedUsers as any });
    setStoredJSON('sl_users', updatedUsers);
    
    const realUsers = getStoredJSON('sl_real_users', []);
    const updatedReal = realUsers.map((u: any) => 
      u.id === id ? { ...u, password: newPassword } : u
    );
    setStoredJSON('sl_real_users', updatedReal);
    
    get().addAuditLog('SECURITY', 'INFO', 'User Password Changed', \`Password updated for \${id}\`);
    return { success: true };
  },
  updateUserProfile: (id, updated) => {`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
