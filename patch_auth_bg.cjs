const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

code = code.replace(
  'src="/media/videos/How_SafetyLink_Automates_Emergency_Responses.mp4"',
  'src="/media/videos/SafetyLink 3D Animation Logo.mp4"'
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
