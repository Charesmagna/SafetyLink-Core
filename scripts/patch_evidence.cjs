const fs = require('fs');
let ledger = fs.readFileSync('src/components/EvidenceLedger.tsx', 'utf8');
ledger = ledger.replace(
  `currentUser?.role === 'super_admin'`,
  `currentUser?.username === 'SL-admin-0000'`
);
fs.writeFileSync('src/components/EvidenceLedger.tsx', ledger);
