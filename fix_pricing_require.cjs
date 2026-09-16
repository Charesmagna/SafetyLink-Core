const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Pricing.tsx', 'utf8');

code = code.replace(
  "import { Smartphone, Monitor, Globe, Check, XCircle } from 'lucide-react';",
  "import { Smartphone, Monitor, Globe, Check, XCircle } from 'lucide-react';\nimport { useAppStore } from '../../utils/store';"
);

code = code.replace(
  "const { useAppStore } = require('../utils/store');",
  ""
);

fs.writeFileSync('src/components/landing/Pricing.tsx', code);
