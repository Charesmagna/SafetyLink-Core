awk '
/public int onStartCommand/ {
    print
    getline
    print
    print "        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_ONGOING)"
    print "            .setSmallIcon(R.drawable.ic_safetylink)"
    print "            .setContentTitle(\"SafetyLink Active\")"
    print "            .setContentText(\"Service + Ghost Engine Running\")"
    print "            .setStyle(new NotificationCompat.BigTextStyle()"
    print "                .bigText(\"BLE Linked: Standby\\nGPS: Acquiring\"))"
    print "            .setOngoing(true);"
    print ""
    print "        startForeground(NOTIF_ID_ONGOING, builder.build());"
    print "        return START_STICKY;"
    print "    }"
    
    # Skip the next 13 lines (the messed up part)
    for(i=0; i<15; i++) getline
    next
}
{print}
' android/app/src/main/java/com/aistudio/safetylink/vqnztp/SafelinkForegroundService.java > temp.java && mv temp.java android/app/src/main/java/com/aistudio/safetylink/vqnztp/SafelinkForegroundService.java
