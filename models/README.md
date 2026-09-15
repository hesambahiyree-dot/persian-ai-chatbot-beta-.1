# مدل Gemma 3 4B فارسی

این پوشه محل فایل وزن مدل است. **فایل GGUF را در Git commit نکنید.**

## فایل موردنیاز

```
gemma-3-4b-persian-v0.Q4_K_M.gguf
```

نام باید دقیقاً همین باشد تا `ModelLocator` و اسکریپت OBB آن را پیدا کنند.

## از کجا بیاید

مدل را از منبع رسمی/مجاز Gemma 3 4B Persian (نسخه GGUF با کوانت `Q4_K_M`) دانلود کنید و در این مسیر بگذارید:

```
models/gemma-3-4b-persian-v0.Q4_K_M.gguf
```

## ساخت OBB

```bash
python3 scripts/build-model-obb.py
```

خروجی:

```
native/android/app/build/outputs/obb/main.1.ai.nova.app.obb
```

اگر مدل نباشد، اسکریپت با کد ۰ خارج می‌شود و APK بدون مدل ساخته می‌شود. برنامه در این حالت «مدل نصب نشده» نشان می‌دهد و کرش نمی‌کند.

## نصب روی دستگاه

OBB را اینجا کپی کنید:

```
/Android/obb/ai.nova.app/main.1.ai.nova.app.obb
```

یا خودِ GGUF:

```
/Android/obb/ai.nova.app/gemma-3-4b-persian-v0.Q4_K_M.gguf
```

یا:

```
Android/data/ai.nova.app/files/models/gemma-3-4b-persian-v0.Q4_K_M.gguf
```

سپس در برنامه «بررسی دوباره» را بزنید.
