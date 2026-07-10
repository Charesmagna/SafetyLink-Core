# SafetyLink R8/ProGuard Rules

# Capacitor bridge
-keep class com.getcapacitor.** { *; }
-keep class com.aistudio.safetylink.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }

# JavaScript interface
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }

# Bluetooth
-keep class android.bluetooth.** { *; }

# WorkManager
-keep class androidx.work.** { *; }

# SafetyLink native services
-keep class com.aistudio.safetylink.SafelinkForegroundService { *; }
-keep class com.aistudio.safetylink.PanicService { *; }
-keep class com.aistudio.safetylink.PanicWidgetProvider { *; }
-keep class com.aistudio.safetylink.SafelinkWidgetProvider { *; }
-keep class com.aistudio.safetylink.BootReceiver { *; }

# Stack traces readable in crash logs
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Cordova SMS plugin
-keep class com.cordova.plugins.sms.** { *; }
