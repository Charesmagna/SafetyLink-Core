import re

def modify_file(filepath, pattern, replacement):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

modify_file('src/components/AdvancedOfflineSyncManager.tsx', r'\bShieldCheck\b\s*,?', '')
modify_file('src/components/IncidentReportingTemplates.tsx', r'const \[activeTemplate, setActiveTemplate\]', 'const [, setActiveTemplate]')

# AdvancedSubsystems - just remove the whole function _triggerTuyaIoT
modify_file('src/components/AdvancedSubsystems.tsx', r'const _triggerTuyaIoT = async \(\) => \{.*?\};\n', '/* unused triggerTuyaIoT */\n')
modify_file('src/components/AdvancedSubsystems.tsx', r"import \{ tuyaIoTService \} from '\.\./services/TuyaIoTService';\n", "")

modify_file('src/services/FirebaseAuthService.ts', r'\bUser\b\s*,?', '')
modify_file('src/services/FirebaseAuthService.ts', r'\bserverTimestamp\b\s*,?', '')

modify_file('src/utils/store.ts', r'import \{ firebaseRegisterUser, firebaseRegisterOrg \} from '\''\./firebase'\'';\n', '')

print("Done")
