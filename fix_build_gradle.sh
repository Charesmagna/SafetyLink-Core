awk '
/defaultConfig \{/ {
    print
    print "        multiDexEnabled true"
    next
}
/dependencies \{/ {
    print
    print "    implementation \"androidx.multidex:multidex:2.0.1\""
    next
}
{print}
' android/app/build.gradle > temp.gradle && mv temp.gradle android/app/build.gradle
