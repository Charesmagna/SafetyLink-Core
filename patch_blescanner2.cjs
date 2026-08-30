const fs = require('fs');
let code = fs.readFileSync('src/components/BLEScanner.tsx', 'utf8');

const replacement = `
  const handleStartNativeScan = async () => {
    // If not premium/active, show upgrade gate
    if (currentUser?.subscriptionStatus !== 'active' && currentUser?.subscriptionStatus !== 'trial') {
      setShowUpgradeGate(true);
      return;
    }
    setLocationWarning(false);
`;

code = code.replace(
  /const handleStartNativeScan = async \(\) => \{\s*setLocationWarning\(false\);/,
  replacement
);

fs.writeFileSync('src/components/BLEScanner.tsx', code);
console.log("Patched BLEScanner.tsx again");
