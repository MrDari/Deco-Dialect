# Deco Dialect — Progreso de la sesión

> Estado al cerrar la sesión (para retomar tras el update). Fecha: 2026-06-15.

## Qué es
Recreación desde cero del juego **Deco Dialect** (originalmente Unity WebGL en
https://sh4rkdev.itch.io/deco-dialect) como **app web HTML5 pura** (Canvas + WebAudio),
ultraligera (~45 KB de código). Juego de palabras por equipos, estética **Art Deco
rojo · negro · dorado**. Carpeta: `C:\Workspace\deco-dialect`.

**Doble destino con un solo código:**
- 🌐 **itch.io / navegador**: archivos de la raíz, listos.
- 🤖 **Google Play**: empaquetado con **Capacitor** (proyecto `android/` ya generado).

## Cómo arrancar / probar
```bash
cd C:\Workspace\deco-dialect
python -m http.server 9090      # (el 8080 lo necesita el usuario, NO usarlo)
# abrir http://localhost:9090  (en móvil: http://IP-del-PC:9090)
```
- **IMPORTANTE — service worker**: cada cambio sube la versión de caché en `sw.js`
  (`deco-dialect-vN`). Para ver cambios hay que **recarga dura** (Ctrl+Shift+R) o
  cerrar/reabrir en móvil. Versión actual del SW: **v16**.
- **Audio**: arranca con el PRIMER gesto del usuario (toque/click) — los navegadores
  bloquean audio sin interacción. El botón ♪ (menú, arriba izq.) activa/desactiva.

## Estructura
```
index.html, css/style.css, js/{i18n,data,audio,render,game}.js, icons/, sw.js,
manifest.webmanifest         <- el JUEGO (fuente única, esto va a itch.io)
tools/{make_icons.py, make_android_icons.py, sync-www.js}
www/                         <- generado por sync-www.js (lo empaqueta Capacitor)
android/                     <- proyecto Capacitor (appId dev.sh4rkdev.decodialect)
package.json, capacitor.config.json
```
Editar SIEMPRE la raíz; `www/` se regenera con `node tools/sync-www.js`.

## Estado de cada cosa (HECHO ✅)
- Diseño fiel a las capturas reales del usuario: neón Art Deco rojo, pero **limpio/moderno**.
- Pantalla de juego: placas TURNO/RONDA, timer MM:SS, scorebar, panel CATEGORÍA
  (5 categorías, la activa en dorado), panel LETRA (2 cartas normales +1 dorada),
  botones ¡Acierto!(+1) / MENÚ / ¡Dorada!(+2), menú de pausa (Continuar/Reiniciar/Salir).
- Mecánica: al pulsar Acierto/Dorada suma y salen letras nuevas (juego continuo).
- Cartas modernas con profundidad, brillo y shimmer en la dorada.
- Layout que LLENA la pantalla verticalmente (paneles flex 1 1 0), sin huecos. Verificado
  en 412×915, 400×720, 360×640.
- Solo 2 idiomas: **Español (España)** e **Inglés**, con banderas SVG (no emoji).
- Splash de presentación **"DE IA SOLUTIONS"** (óvalo rojo neón + logo hexágonos), se
  desvanece solo (~1.5s).
- Carteles: **FIN DEL TURNO** (dorado, "Sigue: equipo"), **FIN DE LA RONDA N** (rojo),
  **FIN DE LA PARTIDA** (pantalla ganador con trofeo + empate). Cada uno con su audio.
- Timer en **rojo + pulso** y barra roja en los últimos 10s.
- Transiciones optimizadas (de .3s a .16s; al acertar solo se actualiza la carta que cambia).
- **Música de fondo = TENSIÓN/SUSPENSE de concurso**, ahora **dos piezas DISTINTAS**
  (v12, ambas en `js/audio.js`, motor `SFX.music.play('menu'|'game')`):
  · MENÚ/INICIO -> tensión LENTA de anticipación: latido grave lub-dub (tiempos 0 y 4),
    drone que respira y notas altas suspendidas que "cuelgan". `tickMenu()`, beat 0.52.
  · PARTIDA -> **SIN música de fondo** (v15, decisión del usuario). Solo efectos:
    botones, aciertos, y tic-tac de reloj en los últimos 10s. `beginTurn` llama
    `SFX.music.stop(true)`; "Continuar" no rearranca música. El motor `tickGame()`
    sigue existiendo en audio.js pero ya no se invoca (se puede reactivar si se quiere).
- Iconos web (tools/make_icons.py) y Android en todas las densidades (make_android_icons.py).
- **MARCO NEÓN Art Deco** (v14, rasgo estrella del original que faltaba): borde rojo
  con glow + esquinas doradas en ángulo (`#deco-frame` en index.html + CSS). Headers
  CATEGORÍA/LETRA ahora rojo sólido vibrante con texto blanco; placas TURNO/RONDA con
  tinte rojo. Comparado contra las 5 capturas reales del usuario (OneDrive/images);
  muy fiel pero conservando el estilo limpio/moderno.

- **Optimización web (v16)**: fuentes Cinzel/Rajdhani AUTO-HOSPEDADas en `fonts/`
  (subset latin, 4 woff2 ~72 KB) con `@font-face` → **100% offline real, sin CDN de
  Google** (clave para Android y RGPD). `theme_color` del manifest unificado a #0b0607.
  Preferencias (idioma/equipos/rondas/duración/nombres/sonido) persisten en localStorage.
  Scripts con `defer`. Código muerto eliminado (motor de música de partida `tickGame`).
  Accesibilidad: aria-labels en steppers + `:focus-visible`. IMPORTANTE: `sync-www.js`
  ahora incluye `fonts/` (sin esto la app Android perdería las fuentes).

## PENDIENTE / próximos pasos
1. **Confirmar con el usuario** si le gusta la música de tensión v11 (lo estaba probando).
2. **Generar el APK/AAB para Play Store** — RUTA LIGERA elegida (sin Android Studio):
   guía completa paso a paso en **BUILD_AAB.md**. Resumen de lo que falta hacer:
   a) Descargar "command-line tools only" del Android SDK (~150 MB) a
      `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\`.
   b) `setx JAVA_HOME C:\jdk-21` y `setx ANDROID_HOME %LOCALAPPDATA%\Android\Sdk`.
   c) `sdkmanager` → platform-tools, platforms;android-35, build-tools;35.0.0.
   d) Crear keystore con keytool (alias `decodialect`) + `android/keystore.properties`.
   e) `npm run android:bundle` → `android/app/build/outputs/bundle/release/app-release.aab`.
   YA PREPARADO de mi lado: targetSdk/compileSdk subidos a 35; signing config en
   `android/app/build.gradle` que lee `keystore.properties`; plantilla
   `keystore.properties.example`; .gitignore protege .jks/.keystore/keystore.properties.
   NOTA: Unity está en OTRA PC y NO sirve (no abre un juego HTML5); se descartó.
   Capacitor 6.2.1 ya instalado. JDK 21 en `C:\jdk-21`.
3. (Opcional) Cuenta Google Play Console (25 USD) y subir el .aab.

## Decisiones tomadas (no rehacer)
- NO usar Unity para el APK (peor en todo); Capacitor es lo óptimo.
- Música sintetizada (sin archivos MP3), elegido por el usuario.
- El usuario NO tiene el código fuente original; todo se reconstruyó desde capturas.
- Red corporativa (Zscaler) bloquea descargar imágenes de itch.io.

## Verificación visual
Se usa Chrome headless para capturas:
`"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu
--no-sandbox --hide-scrollbars --window-size=412,915 --virtual-time-budget=4000
--screenshot="C:/Workspace/deco-dialect/shots/x.png" "http://localhost:9090/"`
(Para forzar una pantalla se añadía temporalmente un hook `if(location.hash===...)` en el
init de game.js y se quitaba después. Existían hashes #play, #endturn, #endround, #warn.)
