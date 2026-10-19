# Publicar AulaPro en Play Store con TWA (Bubblewrap)

TWA (Trusted Web Activity) publica tu **PWA** en Play Store como una app liviana que muestra tu web. Es la vía más barata (solo USD 25 de la cuenta de desarrollador) y se actualiza sola con tu web.

## Requisitos
- La PWA ya está lista (`manifest.webmanifest` + `sw.js` + HTTPS).
- Java 17 + Android SDK (o usar una VM/CI).
- Cuenta de Google Play Developer (USD 25 pago único).

## Pasos
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://aulapro.totalappgt.com/manifest.webmanifest
bubblewrap build
```
- `packageId`: `com.totalappgt.aulapro`
- `appName`: `AulaPro`
- Genera un `.aab` para subir a Play Console.

## Vinculación (Digital Asset Links)
Bubblewrap te da un `assetlinks.json` con el **SHA-256** de tu firma. Debes servir ese archivo en:
```
https://aulapro.totalappgt.com/.well-known/assetlinks.json
```
Ya existe la ruta (`web/public/.well-known/assetlinks.json`); reemplaza `REEMPLAZA_CON_EL_SHA256_DE_TU_FIRMA` por tu huella real y vuelve a desplegar.

## Play Console
1. Crear app → subir `.aab` en **Internal testing**.
2. Completar ficha: nombre, descripción, ícono 512×512, gráfico 1024×500, capturas, **política de privacidad**, **Data safety**, clasificación de contenido.
3. Pasar a **Production**.

## App de cada sistema
Repite el proceso cambiando el `manifest`/URL y el `packageId`:
- `com.totalappgt.resident` → https://resident.totalappgt.com
- `com.totalappgt.contapro` → https://contapro.totalappgt.com
- etc.
