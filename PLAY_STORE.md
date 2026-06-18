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

---

# 💰 Modelo freemium (gratis + desbloqueo único)

> Implementado en el código desde la v1.4 (versionCode 6). La app se descarga
> **gratis** con contenido limitado; una **compra única** desbloquea todo para siempre.

## Qué limita la versión gratuita (solo en Android)
| | Gratis | Premium (comprado) |
|---|---|---|
| Categorías | **15** (de 90) | **90** |
| Equipos | **2** | hasta **20** |
| Rondas | **3** | hasta **20** |

- En **web/itch.io** no hay límites (no hay tienda): la versión navegador es completa.
- El producto es **no consumible** (se compra una vez y queda para siempre).
- Funciona **offline**: tras comprar, la condición premium se cachea en el dispositivo.

## Datos técnicos (ya configurados en el código — no tocar)
- **ID del producto:** `unlock_full`  ← debe coincidir EXACTO en Play Console.
- Plugin: `cordova-plugin-purchase` (Google Play Billing). Sin backend propio.
- `minSdkVersion` subido a **23** (lo exige la librería de billing).
- Incluye **"Restaurar compra"** (obligatorio para Google).

---

## ✍️ Textos del producto (copiar/pegar en Play Console)

**ID de producto** (campo "Product ID", inmutable):
```
unlock_full
```

**Nombre** (Name):
```
Versión completa
```

**Descripción** (Description):
```
Desbloquea para siempre las 90 categorías, hasta 20 equipos y hasta 20 rondas por partida. Pago único, sin anuncios y sin conexión.
```

**Precio:** `1,99 €`

> Versión en inglés (si añades la traducción del producto):
> - Name: `Full version`
> - Description: `Unlock all 90 categories, up to 20 teams and up to 20 rounds per game, forever. One-time purchase, no ads, works offline.`

---

## 📋 PASOS para activar la venta (hazlo TÚ en Play Console)

### Paso A — Subir el nuevo .aab (versionCode 6 / v1.4)
1. **Producción** (o tu pista de prueba) → **Crear nueva versión**.
2. Sube **`DecoDialect-release.aab`** (raíz del repo). Ya incluye el permiso de
   facturación (`com.android.vending.BILLING`) y el plugin de compras.
3. Notas de la versión: ej. *"Versión gratuita con desbloqueo de la versión completa."*
4. Guarda / envía a revisión según tu pista.

> ⚠️ La app debe estar subida **con el permiso de billing** (este .aab lo tiene)
> ANTES de poder crear/activar el producto. Por eso este paso va primero.

### Paso B — Crear el producto integrado
1. Menú lateral: **Monetización → Productos → Productos integrados en la aplicación**
   *(Monetize → Products → In-app products)*.
2. **Crear producto**.
3. Rellena con los textos de arriba:
   - **ID de producto:** `unlock_full` (¡exacto!).
   - **Nombre:** Versión completa.
   - **Descripción:** (la de arriba).
   - **Precio:** 1,99 €.
4. **Guardar** y luego **Activar** (estado debe quedar *Activo*; si está inactivo, la compra falla).

### Paso C — Cambiar la app a GRATIS
1. **Monetización → Configuración de precios de la app** *(App pricing)*.
2. Cambia el precio de la app a **Gratis**.
3. ⚠️ **IRREVERSIBLE**: una app gratis no puede volver a ser de pago. Es lo que
   queremos (gratis + compra dentro), pero confírmalo conscientemente.

### Paso D — Probar la compra SIN pagar (license testing)
1. **Configuración → Pruebas de licencias** *(Setup → License testing)*.
2. Añade tu email de Google a la lista de testers de licencias.
3. Instala la versión de prueba en tu móvil, pulsa **Desbloquear** y comprueba:
   - Se abre el diálogo de pago de Google.
   - Tras "comprar" (de prueba), se activan las 90 categorías / 20 equipos / 20 rondas.
   - Cierra y reabre: sigue premium (cacheado).
   - Reinstala y pulsa **"Restaurar compra"**: recupera el premium.

### Paso E — Seguir el camino a producción
- Esto **NO cambia** tu proceso actual (14 días de prueba cerrada → solicitar acceso
  a producción → aprobación de Google → promover a producción).
- El producto y el modelo gratis ya quedan listos para cuando salgas a producción.

---

## ⚠️ Importante / límites
- El cobro real solo funciona sobre una build **firmada y subida a Play** (no en
  emulador ni navegador). Pruébalo siempre vía **license testing** (Paso D).
- Comisión de Google: **15%** (cuentas con <1M USD/año). De 1,99 € recibes ~1,69 €
  menos impuestos.
- Si cambias el ID `unlock_full`, hay que cambiarlo también en `js/billing.js`
  (constante `PRODUCT_ID`). Mejor no tocarlo.
