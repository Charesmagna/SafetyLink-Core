const fs = require('fs');
let content = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

const target = `  const [loginReferralCode, setLoginReferralCode] = useState('');`;
const replacement = `  const [loginReferralCode, setLoginReferralCode] = useState(() => {
    return localStorage.getItem('sl_pending_referral') || '';
  });
  
  useEffect(() => {
    if (localStorage.getItem('sl_pending_referral')) {
      setShowReferralInput(true);
    }
  }, []);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AuthScreen.tsx', content);
  console.log("AuthScreen.tsx referral prefill patched successfully");
} else {
  console.log("Target not found in AuthScreen.tsx");
}
