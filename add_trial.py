import sys

file_path = "src/utils/store.ts"
with open(file_path, "r") as f:
    content = f.read()

# Interface
content = content.replace(
    "interface AppState {\n  globalTheme",
    "interface AppState {\n  isTrialEnabled: boolean;\n  setTrialEnabled: (enabled: boolean) => void;\n  globalTheme"
)

# Implementation
content = content.replace(
    "superAdminActive: getStoredJSON<boolean>('sl_super_admin', false),",
    "superAdminActive: getStoredJSON<boolean>('sl_super_admin', false),\n  isTrialEnabled: getStoredJSON<boolean>('sl_trial_enabled', true),\n  setTrialEnabled: (enabled: boolean) => {\n    setStoredJSON('sl_trial_enabled', enabled);\n    set({ isTrialEnabled: enabled });\n  },"
)

with open(file_path, "w") as f:
    f.write(content)
