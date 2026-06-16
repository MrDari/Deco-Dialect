<div align="center">

# 🎴 DECO DIALECT

### El juego de palabras por equipos · estética Art Decó · Rojo · Negro · Dorado

[![Plataforma](https://img.shields.io/badge/Plataforma-Web%20%7C%20Android-e23048?style=flat-square)](#)
[![PWA](https://img.shields.io/badge/PWA-100%25%20offline-e9c270?style=flat-square)](#)
[![Tamaño](https://img.shields.io/badge/Tama%C3%B1o-~140%20KB-success?style=flat-square)](#)
[![Idiomas](https://img.shields.io/badge/Idiomas-ES%20%C2%B7%20EN-blue?style=flat-square)](#)
[![Licencia](https://img.shields.io/badge/Licencia-Propietaria-lightgrey?style=flat-square)](LICENSE)

*Reúne a tus amigos, divídete en equipos y demuestra quién tiene más vocabulario.*

</div>

---

## 🎮 ¿Qué es Deco Dialect?

Un **juego de palabras social, rápido y elegante** para jugar en local con amigos y familia.
Dos o más equipos compiten contra el reloj: aparece una **categoría** y unas **letras**, y hay
que decir en voz alta una palabra que encaje. Cuantas más aciertes, más puntos. La **letra dorada**
vale el doble. Sin instalar nada pesado, sin esperas, sin conexión.

> Pensado para reuniones, viajes, clase de idiomas o romper el hielo. De **2 a 20 jugadores**.

---

## ✨ Características

- 🎯 **Partidas dinámicas** — categoría + letras al azar, puntuación en vivo y juego continuo.
- 🥇 **Letra dorada** — multiplica los puntos y añade tensión a cada turno.
- ⏱️ **Tres duraciones** — 30 / 60 / 90 s por turno; rondas configurables.
- 👥 **De 2 a 20 equipos** — con nombres y colores personalizables.
- 🌐 **Bilingüe** — Español (España) e Inglés, con cientos de combinaciones de categorías.
- 🎨 **Estética Art Decó Neón** — marco rojo, oro y cartas con brillo, todo dibujado a mano en código.
- 🔊 **Audio 100 % sintetizado** — música de tensión y efectos generados con WebAudio (cero archivos).
- 📱 **PWA instalable y offline** — funciona sin internet una vez cargada.
- 🪶 **Ultraligero** — ~140 KB en total. Carga al instante, no gasta batería.

---

## 🚀 Jugar

| Plataforma | Cómo |
|---|---|
| 🌐 **Navegador** | Disponible en itch.io *(próximamente)* — se juega al instante. |
| 🤖 **Android** | Próximamente en Google Play. |
| 💻 **Local** | `python -m http.server 9090` → abre `http://localhost:9090` |

> El juego es una app web pura (HTML5 + Canvas + WebAudio), empaquetada con **Capacitor**
> para Android. El mismo código vale para la web y la tienda.

---

## 🛠️ Para desarrolladores

<details>
<summary>Estructura del proyecto</summary>

```
deco-dialect/
├─ index.html, css/, js/, fonts/, icons/, sw.js, manifest.webmanifest   ← el JUEGO (fuente única)
├─ tools/
│  ├─ make_icons.py        # genera los iconos web
│  ├─ make_android_icons.py# genera los iconos Android
│  ├─ sync-www.js          # copia el juego a www/ para Android
│  └─ zip-itch.js          # empaqueta el build web para itch.io
├─ www/                     # (generado) lo que empaqueta Capacitor — NO editar a mano
├─ android/                 # (generado) proyecto Android Studio / Capacitor
├─ package.json, capacitor.config.json
└─ BUILD_AAB.md             # guía para generar el .aab de Google Play
```

> Edita siempre los archivos de la **raíz**. `www/` se regenera con `node tools/sync-www.js`.

</details>

<details>
<summary>Comandos</summary>

```bash
# Web
python -m http.server 9090     # servir en local (requiere http, no file://)
node tools/zip-itch.js         # empaquetar build web para itch.io

# Android (requiere Android SDK — ver BUILD_AAB.md)
npm install
npm run cap:sync               # sincroniza el juego al proyecto Android
npm run android:bundle         # genera el .aab para Google Play
```

</details>

### Tecnología
HTML5 · Canvas 2D · WebAudio API · CSS puro · JavaScript vanilla (sin frameworks) · Service Worker · Capacitor

---

## 📜 Licencia

© 2026 **DE IA SOLUTIONS**. Todos los derechos reservados.

Este es un proyecto **propietario y comercial**. El código se publica solo con fines de consulta y
transparencia; **no** se concede permiso para usarlo, copiarlo, modificarlo, redistribuirlo ni
comercializarlo. Consulta el archivo [LICENSE](LICENSE) para los términos completos.

---

<div align="center">
<sub>Hecho con ❤️ por DE IA SOLUTIONS</sub>
</div>
