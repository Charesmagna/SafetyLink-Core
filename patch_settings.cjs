const fs = require('fs');
const file = 'src/components/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state for newPassword
if (!content.includes('const [newPassword, setNewPassword] = useState(\'\')')) {
  content = content.replace('const [orgIdInput, setOrgIdInput] = useState(\'\');', 'const [orgIdInput, setOrgIdInput] = useState(\'\');\n  const [newPassword, setNewPassword] = useState(\'\');');
}

// Replace the input field and button
content = content.replace(/<input\s+type="password"\s+placeholder="New Password"\s+id="newAccountPassword"[^>]*>/m, 
`<input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
/>`);

content = content.replace(/const newPwd = \(document\.getElementById\('newAccountPassword'\) as HTMLInputElement\)\.value;/, 'const newPwd = newPassword;');
content = content.replace(/useAppStore\.getState\(\)\.addToast\('Account password updated successfully\.', 'success'\);/, `useAppStore.getState().addToast('Account password updated successfully.', 'success');\n                           setNewPassword('');`);

fs.writeFileSync(file, content);
