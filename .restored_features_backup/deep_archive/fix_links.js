const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Replace "https://app.safetylink.online" with onClick onLogin
code = code.replace(
  /<a href="https:\/\/app\.safetylink\.online"[^>]*>([\s\S]*?)<\/a>/g,
  `<a href="#" onClick={(e) => { e.preventDefault(); onLogin(); }} className="btn-hero-secondary">$1</a>`
);

// We have one that is `<a href="https://app.safetylink.online" className="dl-btn outline">`
// The regex above will replace class with `btn-hero-secondary`, which is wrong for the `dl-btn outline`.
// Let's do it safely:
