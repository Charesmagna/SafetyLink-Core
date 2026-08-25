const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

code = code.replace(
  '<img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="SafetyLink SOS Screen" />',
  '<img className="hero-phone" src="https://picsum.photos/seed/sl_sos/400/800?blur=2" alt="SafetyLink SOS Screen" />'
);

code = code.replace(
  '<img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="SafetyLink Command Login" />',
  '<img className="hero-phone" src="https://picsum.photos/seed/sl_login/400/800?blur=2" alt="SafetyLink Command Login" />'
);

code = code.replace(
  '<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink Offline-First Intelligent Dispatch System" />',
  '<img src="https://picsum.photos/seed/sl_dispatch/1200/800?blur=2" alt="SafetyLink Offline-First Intelligent Dispatch System" />'
);

fs.writeFileSync('src/components/landing/Home.tsx', code);
