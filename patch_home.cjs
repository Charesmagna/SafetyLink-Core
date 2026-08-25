const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

code = code.replace(
  '      {currentView === "home" && (<>\n</>)}\n{/* ══ DISPATCH SECTION ══ */}',
  '      </>)}\n      {currentView === "home" && (<>\n      {/* ══ DISPATCH SECTION ══ */}'
);

fs.writeFileSync('src/components/landing/Home.tsx', code);
