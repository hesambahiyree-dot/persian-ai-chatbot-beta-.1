-keep class ai.nova.app.LlamaNative { *; }
-keep class ai.nova.app.LlamaBridge { *; }
-keep class ai.nova.app.PaymentBridge { *; }
-keepclasseswithmembernames class * {
    native <methods>;
}
