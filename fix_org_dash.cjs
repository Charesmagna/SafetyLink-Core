const fs = require('fs');
let content = fs.readFileSync('src/components/OrgDashboard.tsx', 'utf8');

// Replace the video block with BackgroundVideoLoop
content = content.replace(
  /\{\s*activeSubTab === 'dispatch' \? \(\s*<GlobalRadarBackground \/>\s*\) : \(\s*<video[\s\S]*?<\/video>\s*\)\s*\}/,
  "{activeSubTab === 'dispatch' ? <GlobalRadarBackground /> : <BackgroundVideoLoop />}"
);

// Import BackgroundVideoLoop if missing
if (!content.includes('import { BackgroundVideoLoop }')) {
  content = content.replace(
    "import { GlobalRadarBackground } from './GlobalRadarBackground';",
    "import { GlobalRadarBackground } from './GlobalRadarBackground';\nimport { BackgroundVideoLoop } from './BackgroundVideoLoop';"
  );
}

fs.writeFileSync('src/components/OrgDashboard.tsx', content);
