# Publicar Deco Dialect en Google Play — guía paso a paso

> Todo lo técnico ya está hecho. Esta guía cubre lo que tienes que hacer TÚ en
> Google Play Console. El archivo a subir es **`DecoDialect-release.aab`** (raíz del repo).

---

## ✅ Ya preparado (no tienes que hacer nada)
- **`DecoDialect-release.aab`** — bundle firmado, listo para subir (2,85 MB).
- **applicationId:** `dev.sharkdev.decodialect` (único e inmutable; ya configurado).
- **targetSdk 35** (requisito de Google 2025).
- **Keystore de firma:** `android/deco-dialect.jks` — ver "Seguridad del keystore" abajo.
- **Imágenes:** en `press/` (icono, gráfico destacado, capturas).
- **Política de privacidad:** `docs/privacy-policy.html` (ver "Publicar la política").

---

## ⚠️ Seguridad del keystore — LÉELO
La app está firmada con `android/deco-dialect.jks`. Credenciales actuales:

```
Archivo:   android/deco-dialect.jks
Alias:     decodialect
Contraseña (store y key): DecoDialect2026!
```

- **GUARDA una copia de `deco-dialect.jks` y la contraseña en un lugar seguro**
  (gestor de contraseñas + copia en la nube privada). Si los pierdes, **no podrás
  publicar actualizaciones de la app NUNCA** — tendrías que crear una app nueva.
- El keystore y `keystore.properties` están **excluidos del repositorio** (`.gitignore`).
  No se suben a GitHub a propósito.
- Recomendado: cuando subas el primer .aab, activa **Play App Signing** (Google guarda
  una copia de seguridad de la clave de firma; muy recomendable).

---

## Paso 1 — Crear la cuenta de desarrollador
1. Entra en <https://play.google.com/console>.
2. Paga la cuota única de **25 USD**.
3. Verifica tu identidad (DNI/pasaporte). Puede tardar 1-2 días en aprobarse.

## Paso 2 — Publicar la política de privacidad (obtener URL)
Google exige una URL pública de política de privacidad.
1. En el repo de GitHub: **Settings → Pages**.
2. En "Source" elige la rama `main` y la carpeta `/docs`. Guarda.
3. En 1-2 min tendrás la URL:
   `https://mrdari.github.io/Deco-Dialect/privacy-policy.html`
4. Esa es la URL que pegarás en Play Console (paso 4).

## Paso 3 — Crear la app
1. Play Console → **Crear app**.
2. Nombre: **Deco Dialect** · Idioma predeterminado: Español (España).
3. Tipo: **Juego** · Gratis o de pago: **De pago** (precio 1,99 € — o gratis si prefieres).
4. Acepta las declaraciones.

## Paso 4 — Ficha de Play Store (Presencia en la tienda → Ficha principal)
| Campo | Valor |
|---|---|
| Nombre | Deco Dialect |
| Descripción breve (80 car.) | Juego de palabras por equipos. Categoría + letras, ¡contra el reloj! |
| Descripción completa | Usa el texto de `press/FICHA_ITCHIO.md` (sección descripción) |
| Icono (512×512) | `icons/icon-512.png` |
| Gráfico destacado (1024×500) | `press/feature-1024x500.png` |
| Capturas de teléfono (mín. 2) | `press/shots/1-menu.png` … `5-setup.png` |
| Categoría de la app | Juegos → Palabras / Educativo |
| Política de privacidad | La URL del Paso 2 |

## Paso 5 — Cuestionarios obligatorios (Contenido de la app)
- **Clasificación de contenido (IARC):** responde el cuestionario → saldrá PEGI 3 / Para todos.
- **Seguridad de los datos:** declara **"No se recopilan ni comparten datos"**
  (coincide con la política: la app no recoge nada).
- **Público objetivo:** todas las edades (o 13+ si prefieres evitar requisitos de menores).
- **Anuncios:** declara que la app **NO contiene anuncios**.

## Paso 6 — Subir el .aab y lanzar
1. Ve a **Producción → Crear nueva versión** (o **Pruebas internas** primero, recomendado).
2. Sube **`DecoDialect-release.aab`**.
3. Si te lo ofrece, **activa Play App Signing**.
4. Pon notas de la versión (ej. "Primera versión").
5. Revisa y **envía a revisión**.

> **Recomendación:** empieza por **Pruebas internas** (te das de alta tú mismo como tester
> y compruebas que todo va bien antes de Producción). Es más rápido de aprobar.

## Paso 7 — Revisión
- La primera revisión de Google puede tardar de **unas horas a varios días**.
- Cuando se apruebe, la app estará disponible en Play.

---

## Para futuras actualizaciones
1. Sube `versionCode` y `versionName` en `android/app/build.gradle`.
2. `npm run android:bundle` (o el comando de gradle bundleRelease).
3. Sube el nuevo `.aab` a una nueva versión en Play Console.
   *(Recuerda: con el MISMO keystore. De ahí la importancia de guardarlo.)*
