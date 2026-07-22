const fs = require('fs');
const file = 'src/components/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = /<label className="text-\[9px\] font-bold text-slate-400 block uppercase">Safe PIN \(Cancels Alert\)<\/label>/;

const injection = `
                <div className="pt-2 pb-3 border-b border-slate-900/60 mb-2">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Account Password</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="New Password"
                      id="newAccountPassword"
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPwd = (document.getElementById('newAccountPassword') as HTMLInputElement).value;
                        if (!newPwd) return useAppStore.getState().addToast('Password cannot be empty', 'warn');
                        if (currentUser) {
                           useAppStore.getState().updateUserPassword(currentUser.id, newPwd);
                           useAppStore.getState().addToast('Account password updated successfully.', 'success');
                           (document.getElementById('newAccountPassword') as HTMLInputElement).value = '';
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase px-3 rounded-xl border border-blue-500/20 whitespace-nowrap"
                    >
                      Update
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-500 mt-1">Change your login password (active in demo mode).</p>
                </div>
                `;

content = content.replace(target, injection + '\n                <label className="text-[9px] font-bold text-slate-400 block uppercase">Safe PIN (Cancels Alert)</label>');
fs.writeFileSync(file, content);
