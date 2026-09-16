const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

if (!content.includes('import { ASSETS } from')) {
  content = content.replace(
    /import React, \{ useState, useEffect \} from 'react';/,
    "import React, { useState, useEffect } from 'react';\nimport { ASSETS } from '../utils/cloudinary';"
  );
}

content = content.replace(
  /<img src="https:\/\/res\.cloudinary\.com\/qcp4fx2v\/image\/upload\/f_auto,q_auto\/Safety_Link_Logo_Black\.png"[^>]+>/,
  '<img src={ASSETS.logo} alt="SafetyLink" className="h-8 w-16 object-contain" onError={e => { (e.target as HTMLImageElement).style.display=\'none\'; }} />'
);

fs.writeFileSync('src/components/LandingPage.tsx', content, 'utf8');
console.log("Patched LandingPage");
