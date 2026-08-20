const fs = require('fs');

// 1. Update LandingPage
let landing = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Facebook
landing = landing.replace(/href="https:\/\/facebook\.com"/g, 'href="https://facebook.com/SafetyLink"');

// WhatsApp
landing = landing.replace(/href="https:\/\/wa\.me\/27000000000"/g, 'href="https://wa.me/27739441222"');

// Phone
landing = landing.replace(/href="tel:\+27000000000"/g, 'href="tel:+27739441222"');

// Email
landing = landing.replace(/href="mailto:tshilidzi@tmmediasolutions\.co\.za"/g, 'href="mailto:info@safetylink.online"');

fs.writeFileSync('src/components/LandingPage.tsx', landing);
console.log('Updated LandingPage');

// 2. Update App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/href="mailto:sales@safetylink\.online"/g, 'href="mailto:info@safetylink.online"');
fs.writeFileSync('src/App.tsx', app);
console.log('Updated App.tsx');

