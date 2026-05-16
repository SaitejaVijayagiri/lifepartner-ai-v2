# ============================================================
# LifePartner AI — ProGuard / R8 Rules
# ============================================================

# Keep line numbers in stack traces (useful for crash reports)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor Bridge ─────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-dontwarn com.getcapacitor.**

# ── Our JavaScript Interface (AndroidBridge in MainActivity) ─
-keepclassmembers class com.lifepartner.ai.MainActivity$NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Firebase Messaging ───────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Our own classes (receivers + service) ────────────────────
-keep class com.lifepartner.ai.MyFirebaseMessagingService { *; }
-keep class com.lifepartner.ai.NotificationReplyReceiver { *; }
-keep class com.lifepartner.ai.NotificationLikeReceiver { *; }

# ── JSON (org.json) ──────────────────────────────────────────
-keep class org.json.** { *; }

# ── WebView / JavaScript ─────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Coroutines / Kotlin (if transitively included) ───────────
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ── OkHttp / Retrofit (if included via Capacitor plugins) ────
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
