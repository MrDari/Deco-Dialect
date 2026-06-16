# Generar el .aab para Google Play en ESTA PC (ruta ligera, sin Android Studio)

> Objetivo: producir `app-release.aab` firmado, listo para subir a Play Console.
> Ya tienes: JDK 21 (`C:\jdk-21`), proyecto Capacitor (`android/`), Node + Capacitor.
> Falta solo: el Android SDK (command-line tools) y un keystore de firma.
> **Unity NO se usa** (no puede abrir este juego); solo instalamos el SDK mínimo.

Todos los comandos son para **Git Bash** salvo donde diga PowerShell/CMD.

---

## Paso 1 — Descargar las Command-line Tools del Android SDK (~150 MB)

1. Ve a https://developer.android.com/studio#command-line-tools-only
2. Descarga **"Command line tools only"** para Windows (un .zip).
3. Descomprime de forma que quede EXACTAMENTE esta estructura:
   ```
   C:\Users\ESE563694\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat
   ```
   ⚠️ El zip trae una carpeta `cmdline-tools/`. Debes meter su contenido dentro de
   `...\Sdk\cmdline-tools\latest\` (renombra la carpeta interna a `latest`).

---

## Paso 2 — Variables de entorno (una vez)

En **CMD** o PowerShell (no en bash, por `setx`):
```cmd
setx JAVA_HOME "C:\jdk-21"
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
```
Cierra y reabre la terminal para que tomen efecto.

---

## Paso 3 — Instalar los componentes del SDK (~1.5 GB)

```bash
cd "$LOCALAPPDATA/Android/Sdk/cmdline-tools/latest/bin"
./sdkmanager.bat --licenses          # acepta todo (escribe 'y' varias veces)
./sdkmanager.bat "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

---

## Paso 4 — Crear el keystore de firma (una vez, ¡GUÁRDALO PARA SIEMPRE!)

```bash
cd "C:/Workspace/deco-dialect/android"
/c/jdk-21/bin/keytool.exe -genkeypair -v \
  -keystore deco-dialect.jks \
  -alias decodialect \
  -keyalg RSA -keysize 2048 -validity 10000
```
- Te pedirá una **contraseña** (apúntala) y unos datos (nombre, organización...).
- Genera el archivo `android/deco-dialect.jks`.
- ⚠️ **Sin este archivo y su contraseña NO podrás volver a actualizar la app nunca.**
  Haz una copia de seguridad fuera del PC.

Luego crea `android/keystore.properties` (copia de `keystore.properties.example`)
y rellénalo con la contraseña que pusiste:
```properties
storeFile=deco-dialect.jks
storePassword=LA_QUE_PUSISTE
keyAlias=decodialect
keyPassword=LA_QUE_PUSISTE
```
(El `build.gradle` ya está preparado para leer este archivo y firmar el release.)

---

## Paso 5 — Compilar el .aab firmado

```bash
cd "C:/Workspace/deco-dialect"
npm run android:bundle
```
Esto sincroniza el juego a `www/`, lo copia al proyecto Android y compila.
La **primera vez** Gradle descarga dependencias (varios minutos).

Resultado:
```
android/app/build/outputs/bundle/release/app-release.aab
```
Ese es el archivo que subes a Google Play. ✅

> ¿Solo quieres probar en un móvil físico, sin Play Store? Usa
> `npm run android:build` → genera un `.apk` en
> `android/app/build/outputs/apk/release/`.

---

## Paso 6 — Subir a Google Play Console

1. Cuenta de desarrollador (pago único 25 USD): https://play.google.com/console
2. Crear app → subir `app-release.aab`.
3. Ficha de tienda (pendiente de preparar):
   - Descripción corta y larga.
   - 2+ capturas de móvil.
   - Icono 512×512 → `icons/icon-512.png` ✔
   - Gráfico destacado 1024×500 (falta crear).
   - Cuestionario de clasificación de contenido.
   - URL de política de privacidad (obligatoria aunque no recojas datos).
4. Enviar a revisión.

---

## Notas
- Si cambias el juego, vuelve a correr `npm run android:bundle` (regenera www/ solo).
- Para cada actualización en Play sube `versionCode` (y `versionName`) en
  `android/app/build.gradle`.
- targetSdk/compileSdk ya están en **35** (requisito de Play para apps nuevas en 2025+).
