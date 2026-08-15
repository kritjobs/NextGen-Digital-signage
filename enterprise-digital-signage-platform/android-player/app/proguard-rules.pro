# Signage Player ProGuard Rules
-keep class com.signage.player.bridge.** { *; }
-keepclassmembers class com.signage.player.bridge.** { *; }

# Keep WebView JavaScript interfaces
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
