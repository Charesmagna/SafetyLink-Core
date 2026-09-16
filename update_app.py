import sys

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    "import { PanicButton } from './components/PanicButton';",
    "import { PanicButton } from './components/PanicButton';\nimport { initFirebaseSync } from './services/FirebaseSyncService';"
)

content = content.replace(
    "checkAppUpdates();",
    "checkAppUpdates();\n    initFirebaseSync();"
)

with open(file_path, "w") as f:
    f.write(content)
