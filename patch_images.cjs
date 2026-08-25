const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

const replacements = [
  // Poster for video
  {
    target: `poster="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png"`,
    replacement: `poster="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310050/Polish_20260809_035827088.png"`
  },
  // Family Safety
  {
    target: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Family Safety" />`,
    replacement: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310215/Gemini_Generated_Image_viirg9viirg9viir.png" alt="Family Safety" />`
  },
  // Estate Security
  {
    target: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Estate Security" />`,
    replacement: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1786916979200.png" alt="Estate Security" />`
  },
  // SafetyLink Admin
  {
    target: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink Admin" />`,
    replacement: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="SafetyLink Admin" />`
  },
  // tactical poster
  {
    target: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink tactical poster" /><div className="gal-caption">SafetyLink Tactical Deployment</div></div>`,
    replacement: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309980/Gemini_Generated_Image_k9vgu9k9vgu9k9vg.png" alt="SafetyLink tactical poster" /><div className="gal-caption">SafetyLink Tactical Deployment</div></div>`
  },
  // System diagram
  {
    target: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="System diagram" /><div className="gal-caption">Intelligent Dispatch Architecture</div></div>`,
    replacement: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309942/Gemini_Generated_Image_swlp4kswlp4kswlp_1.jpg" alt="System diagram" /><div className="gal-caption">Intelligent Dispatch Architecture</div></div>`
  },
  // Drone minutes matter
  {
    target: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Drone minutes matter" /><div className="gal-caption">Minutes Matter. Drones Act Now.</div></div>`,
    replacement: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309940/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg" alt="Drone minutes matter" /><div className="gal-caption">Minutes Matter. Drones Act Now.</div></div>`
  },
  // SafetyLink business card
  {
    target: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="SafetyLink business card" /><div className="gal-caption">SafetyLink Brand Identity</div></div>`,
    replacement: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_s8bl6ps8bl6ps8bl.jpg" alt="SafetyLink business card" /><div className="gal-caption">SafetyLink Brand Identity</div></div>`
  },
  // UI screenshot
  {
    target: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="UI screenshot" /><div className="gal-caption">Command Dashboard Interface</div></div>`,
    replacement: `<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309942/Gemini_Generated_Image_283s3m283s3m283s.jpg" alt="UI screenshot" /><div className="gal-caption">Command Dashboard Interface</div></div>`
  },
  // Windows Command Deck
  {
    target: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313199/Gemini_Generated_Image_.png" alt="Windows Command Deck"/>`,
    replacement: `<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310062/copilot_image_1783201115036.png" alt="Windows Command Deck"/>`
  }
];

replacements.forEach(r => {
  code = code.replace(r.target, r.replacement);
});

fs.writeFileSync('src/components/landing/Home.tsx', code);
