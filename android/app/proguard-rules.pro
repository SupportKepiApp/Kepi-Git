# Keep Capacitor plugin classes (called via reflection)
-keep class com.kepi.app.plugins.** { *; }

# Keep Google Play Billing client classes
-keep class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# Keep Google Play Services Auth
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
