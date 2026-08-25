const fs = require('fs');
let code = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');

// Update data object
code = code.replace(
  /price: 100/g,
  "price: 149"
);
code = code.replace(
  /price: 150/g,
  "price: 199"
);
code = code.replace(
  /price: 299/g,
  "price: 348"
);

// Update UI
code = code.replace(
  /<div className="text-lg font-bold text-white">R100<\/div>/,
  `<div className="text-lg font-bold text-white">R149</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>`
);
code = code.replace(
  /<div className="text-lg font-bold text-white">R150<\/div>/,
  `<div className="text-lg font-bold text-white">R199</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>`
);
code = code.replace(
  /<div className="text-lg font-bold text-white">R299<\/div>/,
  `<div className="text-lg font-bold text-white">R348</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>`
);
code = code.replace(
  /<div className="text-lg font-bold text-white">R450<\/div>/,
  `<div className="text-lg font-bold text-white">R499</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>`
);

fs.writeFileSync('src/components/PricingModal.tsx', code);
