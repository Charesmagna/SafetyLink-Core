import re
with open("src/components/AIHub.tsx", "r") as f:
    content = f.read()

content = content.replace("const { userLocation, addAuditLog } = useAppStore();", "const { addAuditLog } = useAppStore();")

with open("src/components/AIHub.tsx", "w") as f:
    f.write(content)

