const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Add state to LandingPage for download modal
if (!code.includes('showDownloadHub')) {
  code = code.replace(
    /export const LandingPage: React\.FC<LandingPageProps> = \(\{ onLogin \}\) => \{/,
    `import { DownloadHub } from './DownloadHub';\n\nexport const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {\n  const [showDownloadHub, setShowDownloadHub] = React.useState(false);`
  );
  
  // Replace the download link
  code = code.replace(
    /<a href="#download" className="btn-hero-primary">[\s\S]*?<\/a>/,
    `<button onClick={() => setShowDownloadHub(true)} className="btn-hero-primary">\n          <i className="fa-brands fa-android"></i> Download APK\n        </button>`
  );

  // Add modal to render tree
  code = code.replace(
    /<\/div>\n\n<\/body>/,
    `\n  {showDownloadHub && <DownloadHub onClose={() => setShowDownloadHub(false)} />}\n\n</div>\n\n</body>`
  );

  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log("Patched LandingPage for Download Hub again");
}
