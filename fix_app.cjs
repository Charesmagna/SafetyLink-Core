const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /\{showSplash && \([\s\S]*?<SplashReveal onComplete=\{\(\) => setShowSplash\(false\)\} \/>[\s\S]*?<\/div>\s*\)\}/,
  '{showSplash && (\n        <SplashReveal onComplete={() => setShowSplash(false)} />\n      )}'
);

if (!content.includes('import { BackgroundVideoLoop }')) {
  content = content.replace(
    "import { LocalNotificationService } from './services/LocalNotificationService';",
    "import { LocalNotificationService } from './services/LocalNotificationService';\nimport { BackgroundVideoLoop } from './components/BackgroundVideoLoop';"
  );
}

if (!content.includes('import { PermissionGateOverlay }')) {
  content = content.replace(
    "import { ForcedCountdownOverlay }",
    "import { PermissionGateOverlay } from './components/PermissionGateOverlay';\nimport { ForcedCountdownOverlay }"
  );
}

content = content.replace(
  "{/* High-Priority Emergency Overlay */}",
  "{/* Permissions Gate Requester */}\n      <PermissionGateOverlay />\n\n      {/* High-Priority Emergency Overlay */}"
);

content = content.replace(
  /\{\/\* Background Video \*\/\}[\s\S]*?<\/video>\s*\)\}/,
  "{/* Global Background 3D Animated Mesh Loop */}\n      <BackgroundVideoLoop isHome={activeTab === 'home'} />"
);

fs.writeFileSync('src/App.tsx', content);
