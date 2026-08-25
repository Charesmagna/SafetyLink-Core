const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

code = code.replace(
  /"https:\/\/picsum\.photos\/seed\/sl_sos\/400\/800\?blur=2"/g,
  `"https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png"`
);

code = code.replace(
  /"https:\/\/picsum\.photos\/seed\/sl_login\/400\/800\?blur=2"/g,
  `"https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png"`
);

code = code.replace(
  /"https:\/\/picsum\.photos\/seed\/sl_dispatch\/1200\/800\?blur=2"/g,
  `"https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313191/Gemini_Generated_Image_4jokgv4jokgv4jok.jpg"`
);

fs.writeFileSync('src/components/landing/Home.tsx', code);
