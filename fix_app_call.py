import sys

file_path = "src/App.tsx"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
called = False
for line in lines:
    if "initFirebaseSync();" in line:
        if not called:
            new_lines.append(line)
            called = True
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
