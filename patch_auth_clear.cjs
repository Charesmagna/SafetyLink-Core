const fs = require('fs');
let content = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

const target = `        applyReferralCode(loginReferralCode.trim(), user.id);
        setReferralApplied(true);`;
const replacement = `        applyReferralCode(loginReferralCode.trim(), user.id);
        setReferralApplied(true);
        localStorage.removeItem('sl_pending_referral');`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AuthScreen.tsx', content);
  console.log("AuthScreen.tsx clear patched successfully");
} else {
  console.log("Target not found in AuthScreen.tsx");
}
