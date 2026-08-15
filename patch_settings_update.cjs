const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!code.includes('import { checkForUpdate, openDownloadUrl }')) {
  code = code.replace(
    'import { useState } from "react";',
    'import { useState } from "react";\nimport { checkForUpdate, openDownloadUrl } from "../services/UpdateService";'
  );
}

const target = `  const handleCheckForUpdates = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      useAppStore.getState().addToast("Fetching latest SafetyLink APK build...", "success");
      // Fallback/direct link to GitHub releases or a known APK endpoint
      window.open("https://github.com/Charesmagna/SafetyLink-Core/releases/latest", "_system");
    }, 2000);
  };`;

const replacement = `  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const updateInfo = await checkForUpdate();
      if (updateInfo.available && updateInfo.apkUrl) {
        useAppStore.getState().addToast(\`Version \${updateInfo.version} found! Downloading...\`, "success");
        openDownloadUrl(updateInfo.apkUrl);
      } else {
        useAppStore.getState().addToast("You are already on the latest version.", "info");
      }
    } catch (e) {
      useAppStore.getState().addToast("Failed to check for updates.", "error");
    } finally {
      setIsCheckingUpdate(false);
    }
  };`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Settings.tsx', code);
