const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/EmergencyService.java', 'utf8');

const targetSms = `            int code = conn.getResponseCode();
            return code >= 200 && code < 300;
        } catch (Exception e) {
            Log.e(TAG, "Backend SMS dispatch error", e);
            return false;
        } finally {`;
        
const replaceSms = `            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) return true;
        } catch (Exception e) {
            Log.e(TAG, "Backend SMS dispatch error, falling back to offline SMS", e);
        } finally {
            if (conn != null) conn.disconnect();
        }
        
        // Offline Fallback
        try {
            android.telephony.SmsManager smsManager = android.telephony.SmsManager.getDefault();
            smsManager.sendTextMessage(toNumber, null, body, null, null);
            Log.i(TAG, "Offline SMS sent successfully to " + toNumber);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Offline SMS dispatch error", e);
            return false;
        }
        
        /*`;

code = code.replace(targetSms, replaceSms);
code = code.replace(`            if (conn != null) conn.disconnect();\n        }\n    }`, `    }`);

fs.writeFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/EmergencyService.java', code);
console.log("EmergencyService patched for offline fallback");
