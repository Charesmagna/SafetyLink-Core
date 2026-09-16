const fs = require('fs');

function modifyFile(filepath, searchRegex, replacement) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(searchRegex, replacement);
  fs.writeFileSync(filepath, content);
}

modifyFile('src/components/AdvancedOfflineSyncManager.tsx', /\bShieldCheck\b\s*,?/, '');
modifyFile('src/components/IncidentReportingTemplates.tsx', /const\s*\[\s*activeTemplate,\s*setActiveTemplate\s*\]/, 'const [, setActiveTemplate]');
modifyFile('src/components/AdvancedSubsystems.tsx', /const _triggerTuyaIoT = async \(\) => \{[\s\S]*?\};\n/, '');
modifyFile('src/components/AdvancedSubsystems.tsx', /import \{ tuyaIoTService \} from '\.\.\/services\/TuyaIoTService';\n/, '');
modifyFile('src/services/FirebaseAuthService.ts', /\bUser\b\s*,?/, '');
modifyFile('src/services/FirebaseAuthService.ts', /\bserverTimestamp\b\s*,?/, '');
modifyFile('src/utils/store.ts', /import \{ firebaseRegisterUser, firebaseRegisterOrg \} from '\.\/firebase';\n/, '');
