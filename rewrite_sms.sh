awk '
/ArrayList<String> parts = smsManager.divideMessage\(message\);/ {
    print "            final String SENT_ACTION = \"com.aistudio.safetylink.SMS_SENT_\" + java.util.UUID.randomUUID().toString();"
    print "            int pendingFlags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;"
    print "            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {"
    print "                pendingFlags |= android.app.PendingIntent.FLAG_IMMUTABLE;"
    print "            }"
    print "            android.app.PendingIntent sentIntent = android.app.PendingIntent.getBroadcast(getContext(), 0, new Intent(SENT_ACTION), pendingFlags);"
    print "            "
    print "            BroadcastReceiver receiver = new BroadcastReceiver() {"
    print "                @Override"
    print "                public void onReceive(Context context, Intent intent) {"
    print "                    JSObject ret = new JSObject();"
    print "                    if (getResultCode() == Activity.RESULT_OK) {"
    print "                        ret.put(\"sent\", true);"
    print "                        call.resolve(ret);"
    print "                    } else {"
    print "                        ret.put(\"sent\", false);"
    print "                        ret.put(\"error\", \"SMS failed to send. Code: \" + getResultCode());"
    print "                        call.resolve(ret);"
    print "                    }"
    print "                    getContext().unregisterReceiver(this);"
    print "                }"
    print "            };"
    print "            if (android.os.Build.VERSION.SDK_INT >= 33) {"
    print "                getContext().registerReceiver(receiver, new android.content.IntentFilter(SENT_ACTION), Context.RECEIVER_EXPORTED);"
    print "            } else {"
    print "                getContext().registerReceiver(receiver, new android.content.IntentFilter(SENT_ACTION));"
    print "            }"
    print "            "
    print "            smsManager.sendTextMessage(phone, null, message, sentIntent, null);"
    skip = 1
    next
}
skip && /\}/ {
    braceCount++
    if (braceCount == 11) {
        skip = 0
    }
    next
}
skip { next }
{print}
' android/app/src/main/java/com/aistudio/safetylink/vqnztp/EmergencyDispatchPlugin.java > temp.java && mv temp.java android/app/src/main/java/com/aistudio/safetylink/vqnztp/EmergencyDispatchPlugin.java
