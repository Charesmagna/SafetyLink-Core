# ============================================================
# SafetyLink-Core — ProGuard/R8 Protection Rules
# © TM Media Solutions. All rights reserved.
# ============================================================

# --- Obfuscation & shrinking ---
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreskip
-verbose

# Strip source file names and line numbers from stack traces
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# Remove all logging (strips debug info from APK)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
    public static int wtf(...);
}

# --- Capacitor core (must not be obfuscated) ---
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.Permission class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}

# --- MainActivity (entry point) ---
-keep class com.aistudio.safetylink.vqnztp.MainActivity { *; }

# --- Native services (BLE, foreground, boot) ---
-keep class com.aistudio.safetylink.vqnztp.SafetyBackgroundService { *; }
-keep class com.aistudio.safetylink.vqnztp.** extends android.app.Service { *; }
-keep class com.aistudio.safetylink.vqnztp.** extends android.content.BroadcastReceiver { *; }
-keep class com.aistudio.safetylink.vqnztp.** extends androidx.work.Worker { *; }
-keep class com.aistudio.safetylink.vqnztp.** extends androidx.work.ListenableWorker { *; }

# --- Room DB entities (must keep field names for schema) ---
-keep class com.aistudio.safetylink.vqnztp.db.** { *; }
-keepclassmembers class com.aistudio.safetylink.vqnztp.db.** { *; }

# --- AndroidX / Jetpack ---
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# --- Firebase / Google services ---
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# --- WebView JS bridge (required for Capacitor) ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# --- Kotlin metadata ---
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings { *; }
-keepclassmembers class kotlin.Lazy { *; }

# --- Coroutines ---
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** { volatile <fields>; }

# --- Serialization (if used) ---
-keepattributes *Annotation*, Signature, Exception
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# --- Enum classes ---
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# --- Parcelable ---
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# --- Remove BuildConfig debug fields ---
-assumenosideeffects class com.aistudio.safetylink.vqnztp.BuildConfig {
    public static final boolean DEBUG;
}
