const fs = require('fs');
const file = 'src/utils/store.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /updateUserProfile: \(id: string, updated: Partial<UserProfile>\) => void;/;

const replacement = `  updateUserPassword: (id: string, newPassword: string) => { success: boolean };\n  updateUserProfile: (id: string, updated: Partial<UserProfile>) => void;`;

if (content.includes('updateUserPassword: (id: string')) {
    // already there?
} else {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('patched interface');
}
