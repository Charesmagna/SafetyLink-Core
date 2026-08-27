const fs = require('fs');

const filesToFix = ['src/components/AdminPanel.tsx', 'src/components/AuthScreen.tsx'];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /import (\w+) from 'https:\/\/res\.cloudinary\.com[^']+';/g,
    "const $1 = 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';"
  );
  
  fs.writeFileSync(file, content);
});

