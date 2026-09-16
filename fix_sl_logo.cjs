const fs = require('fs');

let content = fs.readFileSync('src/components/SafetyLinkLogo.tsx', 'utf8');

if (!content.includes('import Brand')) {
  content = content.replace("import { useAppStore } from '../utils/store';", "import { useAppStore } from '../utils/store';\nimport Brand from '../config/brand';");
}

content = content.replace(
  "{/* Slices or displays the high-fidelity branding logo, swapping conditionally during emergency panic states */}",
  `<img src={Brand.primaryLogo} alt="SafetyLink Logo" className="w-full h-full object-contain pointer-events-none drop-shadow-2xl" />`
);

fs.writeFileSync('src/components/SafetyLinkLogo.tsx', content);

