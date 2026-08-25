import sys

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
imported = False
for line in lines:
    if "import { initFirebaseSync } from './services/FirebaseSyncService';" in line:
        if not imported:
            new_lines.append(line)
            imported = True
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
