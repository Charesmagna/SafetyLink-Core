import re

with open('android/app/src/main/java/com/aistudio/safetylink/vqnztp/EmergencyDispatchPlugin.java', 'r') as f:
    content = f.read()

replacement = """    private void doSendSms(PluginCall call, String phone, String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phone, null, message, null, null);
            JSObject ret = new JSObject();
            ret.put("sent", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("sent", false);
            ret.put("error", "SMS send exception: " + e.getMessage());
            call.resolve(ret);
        }
    }"""

content = re.sub(r'    private void doSendSms\(PluginCall call, String phone, String message\) \{.*?^    \}', replacement, content, flags=re.MULTILINE|re.DOTALL)

with open('android/app/src/main/java/com/aistudio/safetylink/vqnztp/EmergencyDispatchPlugin.java', 'w') as f:
    f.write(content)

