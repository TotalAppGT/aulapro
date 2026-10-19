# App móvil de AulaPro (Capacitor)

Este proyecto genera una **APK instalable** de AulaPro (y de cualquier otro sistema cambiando las variables).

## Requisitos (solo para compilar)
- Node 18+
- Java 17 (JDK)
- Android SDK (o Android Studio)

## Compilar la APK (local)
```bash
cd mobile
npm install
npx cap add android     # solo la primera vez
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

La APK **debug** se instala directo en el teléfono (activando "instalar apps de origen desconocido").
Para **Play Store** necesitas un **AAB firmado** con tu keystore:
```bash
cd mobile/android
./gradlew bundleRelease
# AAB: app/build/outputs/bundle/release/app-release.aab
```

## Generar la app de OTRO sistema
La app es un shell que carga tu sistema en línea. Cámbialo con variables:
```bash
APP_ID=com.totalappgt.resident APP_NAME=Resident APP_URL=https://resident.totalappgt.com npx cap sync android
```
O edita `capacitor.config.ts`.

## Sin PC con Android: GitHub Actions
El workflow `.github/workflows/build-apk.yml` compila la APK en la nube y la deja como **artifact** descargable (Actions → Build Android APK → Run workflow).

## Publicar en Play Store (TWA, alternativa más liviana)
Ver `mobile/TWA.md`.
