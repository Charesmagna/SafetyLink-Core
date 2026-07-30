const fs = require('fs');
let content = fs.readFileSync('src/components/OrgDashboard.tsx', 'utf8');

const target1 = `              {(orgReferralCode || currentOrg?.referralCode) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-[9px] text-amber-400/80 font-mono leading-relaxed">
                    📋 Share this code with your agents. Clients enter it in the <strong>"Have a Referral Code?"</strong> section on the login screen. Total referrals tracked: <strong className="text-amber-300">{currentOrg?.referralCount ?? 0}</strong>
                  </p>
                </div>
              )}`;

const replacement1 = `              {(orgReferralCode || currentOrg?.referralCode) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
                  <p className="text-[9px] text-amber-400/80 font-mono leading-relaxed">
                    📋 Share this code with your agents. Clients enter it in the <strong>"Have a Referral Code?"</strong> section on the login screen. Total referrals tracked: <strong className="text-amber-300">{currentOrg?.referralCount ?? 0}</strong>
                  </p>
                  <div className="flex items-center justify-between p-2 bg-black/30 border border-amber-500/20 rounded-lg">
                    <span className="text-[9px] font-mono text-amber-200/50 truncate pr-2 select-all">
                      safetylink://join?ref={orgReferralCode || currentOrg?.referralCode}
                    </span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(\`safetylink://join?ref=\${orgReferralCode || currentOrg?.referralCode}\`)}
                      className="shrink-0 text-[8px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/30 transition-colors uppercase font-bold tracking-wider"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}`;

const target2 = `              <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">Referred Clients</h3>
                  <p className="text-[10px] text-slate-500 mt-1">All users who registered using your referral code.</p>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono font-black text-xs">
                  {users.filter(u => u.referredByCode && u.referredByCode === (currentOrg?.referralCode || orgReferralCode)).length} clients
                </span>
              </div>`;

const replacement2 = `              <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">Referred Clients & Earnings</h3>
                  <p className="text-[10px] text-slate-500 mt-1">20% commission per active subscriber (Estimated $2.00/mo).</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono font-black text-xs text-center w-full">
                    {users.filter(u => u.referredByCode && u.referredByCode === (currentOrg?.referralCode || orgReferralCode)).length} clients
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono font-black text-xs text-center w-full">
                    \${(users.filter(u => u.referredByCode && u.referredByCode === (currentOrg?.referralCode || orgReferralCode)).length * 2).toFixed(2)}/mo
                  </span>
                </div>
              </div>`;

if (content.includes(target1) && content.includes(target2)) {
  content = content.replace(target1, replacement1);
  content = content.replace(target2, replacement2);
  fs.writeFileSync('src/components/OrgDashboard.tsx', content);
  console.log("OrgDashboard.tsx patched successfully");
} else {
  console.log("Target not found in OrgDashboard.tsx");
}
