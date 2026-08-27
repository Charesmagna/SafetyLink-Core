const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import slide1 from 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';",
  "const slide1 = 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';"
);

content = content.replace(
  "import slide2 from 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';",
  "const slide2 = 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';"
);

content = content.replace(
  "import slLogoMain from './assetshttps://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';",
  "const slLogoMain = 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';"
);

content = content.replace(
  "import slLogoSet from 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';",
  "const slLogoSet = 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png';"
);

fs.writeFileSync('src/App.tsx', content);
