const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Pricing.tsx', 'utf8');

code = code.replace(
  '      </section>',
  '        </div>\n      </section>'
);

fs.writeFileSync('src/components/landing/Pricing.tsx', code);
