# ألغاز أوروك — تطبيق الهاتف

هذا المجلد يحوّل اللعبة الموجودة في `games/alghaz/` إلى تطبيق أندرويد (APK) باستخدام Capacitor.

## الطريقة الأسهل (تلقائياً عبر GitHub)

كل تعديل يُرفع على `games/alghaz/` أو هذا المجلد يشغّل سير العمل
`.github/workflows/alghaz-android.yml`، فيبني التطبيق وينشر الملف
`alghaz-urukqi.apk` في صفحة الإصدار **alghaz-android-latest** في قسم Releases.
يمكن تشغيله يدوياً من تبويب Actions ← Alghaz Android APK ← Run workflow.

## البناء على جهازك

يتطلب Node.js 20 و JDK 17 و Android Studio (أو Android SDK).

```bash
cd mobile/alghaz
npm install
npm run build:android      # ينسخ اللعبة، ينشئ مشروع android، يولّد الأيقونات وشاشة البداية
npx cap open android       # يفتح المشروع في Android Studio
# أو مباشرة:
cd android && ./gradlew assembleDebug
```

## الأيقونة وشاشة البداية

الصور المصدرية في `assets/`:
- `icon-only.png` — الأيقونة كاملة (1024×1024)
- `icon-foreground.png` و `icon-background.png` — طبقتا الأيقونة المتكيّفة في أندرويد
- `splash.png` و `splash-dark.png` — شاشة البداية (2732×2732)

غيّرها ثم أعد تشغيل `npm run build:android`.

## النشر على Google Play

ملف APK المبني هنا موقَّع بمفتاح تجريبي (debug) ويصلح للتثبيت المباشر والتجربة.
للنشر على المتجر تحتاج ملف AAB موقَّعاً بمفتاحك الخاص:
`./gradlew bundleRelease` مع إعداد مفتاح التوقيع (keystore) في Android Studio.
