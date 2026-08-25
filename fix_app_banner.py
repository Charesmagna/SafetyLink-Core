import sys

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

banner_jsx = """      {updateInfo?.available && (
        <div className="w-full bg-emerald-600/90 text-white text-[10px] font-bold text-center py-2 px-4 tracking-wider uppercase flex items-center justify-center gap-2 relative z-50 backdrop-blur-md cursor-pointer" onClick={() => window.open(updateInfo.apkUrl || 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest', '_blank')}>
          <span>🚀 Update Available: v{updateInfo.version} - Click to Download</span>
        </div>
      )}"""

content = content.replace(
    "{trialExpired && <TrialLockOverlay />}",
    f"{{trialExpired && <TrialLockOverlay />}}\n{banner_jsx}"
)

with open(file_path, "w") as f:
    f.write(content)
