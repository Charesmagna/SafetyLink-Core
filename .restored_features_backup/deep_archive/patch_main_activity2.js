import fs from 'fs';
const path = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/MainActivity.java';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('startSafelinkService();', 'try { startSafelinkService(); } catch (Exception e) { Log.e(TAG, "Failed to start service without permissions", e); }');

fs.writeFileSync(path, content);
