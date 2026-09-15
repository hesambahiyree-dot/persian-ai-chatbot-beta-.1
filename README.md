# NOVA AI

دستیار هوشمند فارسی برای اندروید. مدل **Gemma 3 4B Persian** با **llama.cpp** روی CPU و فقط ABI **arm64-v8a** اجرا می‌شود. رابط چت با React ساخته شده و از طریق JNI به موتور نیتیو وصل است.

| | |
|---|---|
| بسته | `ai.nova.app` |
| مدل | `gemma-3-4b-persian-v0.Q4_K_M.gguf` |
| موتور | llama.cpp / CPU / JNI |
| UI | React + TypeScript، راست‌چین |

---

## ساخت APK

مدل داخل APK نمی‌آید (حجم). اگر GGUF موجود باشد اسکریپت OBB می‌سازد؛ اگر نباشد APK باز هم ساخته می‌شود و برنامه «مدل نصب نشده» نشان می‌دهد.

### ۱) پیش‌نیاز

- Node 22، JDK 17
- Android SDK 35، NDK `27.2.12479018`، CMake `3.22.1`
- اختیاری: فایل مدل در `models/gemma-3-4b-persian-v0.Q4_K_M.gguf`

### ۲) وب و کپی به Android

```bash
npm ci
npm run build
node scripts/prepare-android-assets.mjs
```

### ۳) llama.cpp

```bash
mkdir -p native/android/third_party
git clone --depth 1 https://github.com/ggml-org/llama.cpp.git native/android/third_party/llama.cpp
```

اگر این پوشه نباشد، CMake هنگام ساخت نیتیو خودش llama.cpp را Fetch می‌کند (نیاز به شبکه).

### ۴) OBB مدل (اختیاری)

```bash
python3 scripts/build-model-obb.py
```

خروجی: `native/android/app/build/outputs/obb/main.1.ai.nova.app.obb`

### ۵) Gradle

```bash
echo "sdk.dir=$ANDROID_HOME" > native/android/local.properties
cd native/android
gradle :app:assembleRelease
```

APK:

```
native/android/app/build/outputs/apk/release/app-release.apk
```

ساخت CI همین مراحل را در `.github/workflows/android.yml` اجرا می‌کند. Artifact با نام `nova-ai-apk` آپلود می‌شود.

### نصب مدل روی گوشی

یکی از این مسیرها:

```
/Android/obb/ai.nova.app/main.1.ai.nova.app.obb
/Android/obb/ai.nova.app/gemma-3-4b-persian-v0.Q4_K_M.gguf
/Android/data/ai.nova.app/files/models/gemma-3-4b-persian-v0.Q4_K_M.gguf
```

برنامه را باز کنید و «بررسی دوباره» را بزنید. بدون مدل کرش نمی‌شود.

### امضای انتشار

کلید امضا را commit نکنید. در CI می‌توانید `BAZAAR_RSA_PUBLIC_KEY` و `PLAY_LICENSE_KEY` را به‌صورت GitHub Secret بگذارید (کلید **عمومی** درگاه، نه کلید خصوصی). برای keystore انتشار، از GitHub Secrets جدا استفاده کنید و `signingConfig` را عوض کنید. ساخت فعلی در نبود keystore با پیکربندی debug امضا می‌شود تا APK قابل نصب باشد.

---

## Capacitor

`capacitor.config.ts` با `appId: ai.nova.app` و `webDir` روی assets اندروید تنظیم شده. مسیر نیتیو از قبل در `native/android` است؛ `npx cap sync android` اختیاری است. مسیر اصلی ساخت APK همان Gradle بالا است.

---

## پل JS ↔ Native

| متد | کار |
|---|---|
| `initializeModel` | پیدا کردن GGUF/OBB و `llama_model_load_from_file` |
| `isModelReady` | آیا context آماده است |
| `generateResponse` | قالب Gemma + decode روی CPU |
| `releaseModel` | آزاد کردن مدل و context |

پیاده‌سازی: `native/android/app/src/main/cpp/nova_llama.cpp` و `LlamaBridge.kt`.

تنظیمات دما، سقف توکن و context در `src/lib/inference/config.ts` (و کپی Kotlin در `InferenceConfig`) است.

---

## پرداخت

UI فقط با `src/lib/payment` حرف می‌زند. سمت اندروید `StoreBillingClient` است:

- `UnconfiguredBillingClient` — تا وقتی SDK فروشگاه اضافه نشده
- `CafeBazaarBillingClient` / `PlayBillingClient` — وقتی کلید عمومی از CI تزریق شود

هیچ API Key یا کلید خصوصی در مخزن نیست.

---

## مجوز مدل

وزن Gemma تابع مجوز Google/منبع توزیع است. این پروژه فقط کد اجرا را دارد؛ فایل GGUF را خودتان و مطابق مجوز تهیه کنید.
