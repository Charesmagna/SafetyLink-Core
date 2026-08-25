import sys

file_path = "src/components/Settings.tsx"
with open(file_path, "r") as f:
    content = f.read()

new_update_check = """  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      await useAppStore.getState().checkAppUpdates();
      const { updateInfo } = useAppStore.getState();
      if (updateInfo && updateInfo.available) {
        useAppStore.getState().addToast(`Version ${updateInfo.version} found! Downloading...`, "success");
        // For Capacitor/Android
        if (Capacitor.getPlatform() === 'android' && updateInfo.apkUrl) {
          window.open(updateInfo.apkUrl, '_blank');
        } else if (updateInfo.exeUrl && Capacitor.getPlatform() !== 'android') {
           // Desktop Web/Electron
           window.open(updateInfo.exeUrl, '_blank');
        } else {
           window.open('https://github.com/Charesmagna/SafetyLink-Core/releases/latest', '_blank');
        }
      } else {
        useAppStore.getState().addToast("You are already on the latest version.", "info");
      }
    } catch (e) {
      useAppStore.getState().addToast("Failed to check for updates.", "error");
    } finally {
      setIsCheckingUpdate(false);
    }
  };"""

content = content.replace(
"""  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const updateInfo = { available: false, apkUrl: "", version: "1.0" };
      if (updateInfo.available && updateInfo.apkUrl) {
        useAppStore.getState().addToast(`Version ${updateInfo.version} found! Downloading...`, "success");
        window.open(updateInfo.apkUrl);
      } else {
        useAppStore.getState().addToast("You are already on the latest version.", "info");
      }
    } catch (e) {
      useAppStore.getState().addToast("Failed to check for updates.", "error");
    } finally {
      setIsCheckingUpdate(false);
    }
  };""", new_update_check)

with open(file_path, "w") as f:
    f.write(content)
