const fs = require('fs');
let content = fs.readFileSync('src/types/index.ts', 'utf8');

if (!content.includes('moya?: {')) {
  content = content.replace("twilio?: {", "moya?: { turnApiToken?: string; enabled?: boolean };\n  twilio?: {");
  fs.writeFileSync('src/types/index.ts', content);
}
