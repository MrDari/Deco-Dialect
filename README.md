# Deco Dialect

Juego de palabras por equipos con estética **Art Deco** (rojo · negro · dorado), reconstruido desde
cero como app web ultraligera (HTML5 + Canvas + WebAudio puro). De 2 a 20 jugadores, en local.

**Un solo código → dos destinos:**
- 🌐 **itch.io / navegador** — los archivos de la raíz se juegan directamente.
- 🤖 **Google Play (APK/AAB)** — los mismos archivos, empaquetados con **Capacitor** en una app
  nativa que corre **100 % offline** (no necesita internet ni hospedaje).

---

## Estructura

```
deco-dialect/
├─ index.html, css/, js/, icons/, sw.js, manifest.webmanifest   ← el JUEGO (fuente única)
├─ tools/
│  ├─ make_icons.py     # genera los iconos
│  └─ sync-www.js       # copia el juego a www/ para Android
├─ www/                 # (generado) lo que empaqueta Capacitor — NO editar a mano
├─ android/             # (generado por Capacitor) proyecto Android Studio
├─ package.json         # scripts de build
├─ capacitor.config.json
└─ twa-manifest.json    # (alternativa TWA, opcional)
```

> Edita siempre los archivos de la **raíz**. `www/` se regenera con `npm run sync:web`.

---

## 1) Probar / publicar en la web (itch.io)

Probar en local (el SW y la PWA requieren http/localhost, no `file://`):
```bash
python -m http.server 9090
# abre http://localhost:9090
```

Subir a **itch.io**: comprime en un ZIP `index.html`, `css/`, `js/`, `icons/`, `sw.js`,
`manifest.webmanifest`; en itch marca *"This file will be played in the browser"* y como
*Embed* apunta a `index.html`. Pesa una fracción de un build de Unity y carga al instante.

---

## 2) Generar el APK/AAB para Google Play (Capacitor)

### Requisitos (una sola vez)
- **Node.js** ✔ (ya instalado)
- **JDK 17+** ✔ (tienes JDK 21 en `C:\jdk-21`)
- **Android SDK** ❗ (falta). La forma más cómoda: instalar **Android Studio**
  (https://developer.android.com/studio) — trae el SDK y el `gradle` necesarios.
  Tras instalarlo, define las variables de entorno:
  ```bash
  setx JAVA_HOME "C:\jdk-21"
  setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
  ```

### Pasos
```bash
cd C:\Workspace\deco-dialect
npm install                 # instala Capacitor

# crear el proyecto Android la primera vez:
npx cap add android

# cada vez que cambies el juego:
npm run cap:sync            # sincroniza www/ y lo copia al proyecto Android

# abrir en Android Studio (recomendado para firmar y exportar):
npm run android:open
```

En Android Studio: **Build → Generate Signed Bundle / APK**
- **AAB** (Android App Bundle) → para subir a Play Store.
- **APK** → para instalar/probar en un móvil directamente.

La primera vez te pedirá crear un **keystore** (firma). Guárdalo bien: lo necesitas para
todas las actualizaciones futuras de la app.

> Alternativa por línea de comandos (sin abrir Studio):
> `npm run android:bundle` genera el `.aab` en `android/app/build/outputs/`.

### Subir a Play Console
1. Cuenta de desarrollador en [Google Play Console](https://play.google.com/console) (pago único 25 USD).
2. Crea la app, sube el `.aab`.
3. Ficha: descripción, capturas de móvil, icono 512×512 (`icons/icon-512.png`),
   gráfico destacado 1024×500, clasificación de contenido y política de privacidad.
4. Envía a revisión.

---

## Personalización rápida
- **Categorías / palabras**: `js/data.js`
- **Textos de interfaz**: `js/i18n.js` (Español e Inglés)
- **Colores / estética**: variables CSS al inicio de `css/style.css`
- **Iconos**: `python tools/make_icons.py`
- **ID de la app / nombre**: `capacitor.config.json`

## Por qué esta versión es mejor que el build Unity original
Peso ~45 KB de código (vs. varios MB), carga instantánea, audio sintetizado (0 archivos),
funciona offline, instalable, bajo consumo de batería, y el **mismo código vale para web y Android**.
