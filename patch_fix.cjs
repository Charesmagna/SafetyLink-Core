const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

code = code.replace(
  /<\/div>\n          <PricingCalculator \/>\n        <\/div>\n      <\/section>/,
  '<PricingCalculator />\n        </div>\n      </section>'
);

fs.writeFileSync('src/components/landing/Home.tsx', code);
