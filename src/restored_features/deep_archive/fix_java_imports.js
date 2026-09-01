import fs from 'fs';
const path = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/MainActivity.java';
let content = fs.readFileSync(path, 'utf8');

const importStr = `
import android.provider.Settings;
import android.text.TextUtils;
import android.content.Context;
import android.content.ComponentName;
`;

if (!content.includes('android.provider.Settings')) {
    content = content.replace('import android.view.WindowManager;', 'import android.view.WindowManager;\n' + importStr);
}

// Also fix try catch double
content = content.replace('try { try { startSafelinkService(); } catch (Exception e) { Log.e(TAG, "Failed to start service without permissions", e); } } catch (Exception e) { Log.e(TAG, "Failed to start service without permissions", e); }', 'try { startSafelinkService(); } catch (Exception e) { Log.e(TAG, "Failed to start service without permissions", e); }');

fs.writeFileSync(path, content);
