const fs = require('fs');

let content = fs.readFileSync('src/config/brand.ts', 'utf8');

content = content.replace(
  "notificationIcon: `/media/app_icon/notification_icon.png`",
  "notificationIcon: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png`"
);

content = content.replace(
  "architectureDiagram: `/media/images/Safety_Response_System_Architecture.png`",
  "architectureDiagram: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg`"
);

content = content.replace(
  "anatomyDiagram: `/media/images/Emergency_System_Architecture_Anatomy.png`",
  "anatomyDiagram: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg`"
);

content = content.replace(
  "klevLogo: `/media/klev_ai_logo.png`",
  "klevLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png`"
);

fs.writeFileSync('src/config/brand.ts', content);

