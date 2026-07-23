const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix SplashReveal
content = content.replace(
  /\{showSplash && \([\s\S]*?<SplashReveal onComplete=\{\(\) => setShowSplash\(false\)\} \/>[\s\S]*?<\/div>\s*\)\}/,
  '{showSplash && (\n        <SplashReveal onComplete={() => setShowSplash(false)} />\n      )}'
);

// Add BackgroundVideoLoop import if missing
if (!content.includes('import { BackgroundVideoLoop }')) {
  content = content.replace(
    "import { LocalNotificationService } from './services/LocalNotificationService';",
    "import { LocalNotificationService } from './services/LocalNotificationService';\nimport { BackgroundVideoLoop } from './components/BackgroundVideoLoop';"
  );
}

// Add PermissionGateOverlay import if missing
if (!content.includes('import { PermissionGateOverlay }')) {
  content = content.replace(
    "import { ForcedCountdownOverlay }",
    "import { PermissionGateOverlay } from './components/PermissionGateOverlay';\nimport { ForcedCountdownOverlay }"
  );
}

// Restore PermissionGateOverlay component
content = content.replace(
  "{/* High-Priority Emergency Overlay */}",
  "{/* Permissions Gate Requester */}\n      <PermissionGateOverlay />\n\n      {/* High-Priority Emergency Overlay */}"
);

// Restore BackgroundVideoLoop
content = content.replace(
  "{/* Background Video */}\n      {(activeTab === 'home' && !currentOrg) && (\n        <video\n          autoPlay\n          muted\n          loop\n          playsInline\n          className=\"absolute inset-0 w-full h-full object-cover z-0 pointer-events-none brightness-50\"\n        >\n          <source src=\"/media/petal_20260720_024055.mp4\" type=\"video/mp4\" />\n        </video>\n      )}",
  "{/* Global Background 3D Animated Mesh Loop */}\n      <BackgroundVideoLoop isHome={activeTab === 'home'} />"
);

fs.writeFileSync('src/App.tsx', content);
