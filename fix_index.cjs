const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
`href="/official_safetylink_logo.svg"`,
`href="/media/new_logo/New_SafetyLink_Official_Logo.svg"`
);
code = code.replace(
`href="/official_safetylink_logo.svg"`,
`href="/media/new_logo/New_SafetyLink_Official_Logo.svg"`
);

fs.writeFileSync('index.html', code);
