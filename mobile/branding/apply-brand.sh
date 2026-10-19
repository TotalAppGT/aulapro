#!/usr/bin/env bash
# Aplica el branding (iconos, adaptive, splash) al proyecto Android generado por Capacitor.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
RES="$DIR/../android/app/src/main/res"

if [ ! -d "$RES" ]; then
  echo "No existe $RES. Ejecuta primero: npx cap add android"
  exit 1
fi

cp -R "$DIR/res/." "$RES/"
echo "Branding de AulaPro aplicado en $RES"
