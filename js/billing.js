/* ============================================================
   Compras dentro de la app (Google Play Billing) — desbloqueo único.
   ------------------------------------------------------------
   - En WEB (itch.io) no hay tienda: todo queda DESBLOQUEADO (premium = true),
     para que la versión de navegador sea completa.
   - En ANDROID el contenido va limitado (free) hasta que el usuario compra el
     producto no consumible 'unlock_full'. La compra se gestiona con el plugin
     cordova-plugin-purchase (global window.CdvPurchase); Google cobra y nos
     dice si el usuario es propietario. No requiere backend propio.
   - La condición premium se cachea en localStorage para que funcione OFFLINE
     una vez comprada (la app es offline-first).
   ============================================================ */
window.Billing = (() => {
  const PRODUCT_ID = 'unlock_full';      // mismo ID que crearás en Play Console
  const KEY = 'deco-dialect:premium';
  const PRICE_FALLBACK = '1,99 €';

  let premium = false;
  let priceStr = PRICE_FALLBACK;
  const changeCbs = [];

  const platform = (window.Capacitor && typeof window.Capacitor.getPlatform === 'function')
    ? window.Capacitor.getPlatform() : 'web';
  const isAndroid = platform === 'android';

  if (!isAndroid) {
    premium = true;                      // web/itch.io: experiencia completa
  } else {
    try { premium = localStorage.getItem(KEY) === '1'; } catch (_) { /* sin storage */ }
  }

  function notify() { changeCbs.forEach(cb => { try { cb(premium); } catch (_) {} }); }
  function setPremium(v) {
    const was = premium;
    premium = !!v;
    if (premium) { try { localStorage.setItem(KEY, '1'); } catch (_) {} }
    if (premium !== was) notify();
  }

  // Conecta con Google Play y registra el producto. Idempotente y a prueba de fallos:
  // si el plugin no está presente, no rompe nada (la app sigue funcionando).
  let started = false;
  function initStore() {
    if (started || !isAndroid || !window.CdvPurchase) return;
    started = true;
    try {
      const { store, ProductType, Platform } = window.CdvPurchase;
      store.register([{ id: PRODUCT_ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }]);
      // ¿La transacción incluye nuestro producto? (señal fiable de compra)
      const ownsUnlock = t => !!(t && t.products && t.products.some(p => p.id === PRODUCT_ID));
      store.when()
        .productUpdated(p => {
          if (p && p.id === PRODUCT_ID && p.pricing && p.pricing.price) { priceStr = p.pricing.price; notify(); }
        })
        // approved llega nada más confirmar el pago: activamos YA premium (rápido) y verificamos.
        .approved(t => { if (ownsUnlock(t)) setPremium(true); t.verify(); })
        .verified(r => { setPremium(true); r.finish(); })
        // respaldo: cualquier actualización del recibo donde ya conste como propietario
        .receiptUpdated(() => { if (store.owned(PRODUCT_ID)) setPremium(true); });
      store.initialize([Platform.GOOGLE_PLAY]).then(() => {
        const p = store.get(PRODUCT_ID);
        if (p && p.pricing && p.pricing.price) priceStr = p.pricing.price;
        if (store.owned(PRODUCT_ID)) setPremium(true);
        notify();
      }).catch(() => {});
    } catch (_) { /* plugin ausente o error de init: se ignora */ }
  }

  // Lanza el diálogo de pago nativo de Google. Devuelve true si quedó comprado.
  async function purchase() {
    if (premium) return true;
    if (!isAndroid || !window.CdvPurchase) return false;
    try {
      const { store } = window.CdvPurchase;
      const p = store.get(PRODUCT_ID);
      const offer = p && p.getOffer && p.getOffer();
      if (offer && offer.order) await offer.order();
      if (store.owned(PRODUCT_ID)) setPremium(true);   // por si receiptUpdated no saltó aún
      return premium;
    } catch (_) { return false; }
  }

  // Restaura la compra (reinstalación / móvil nuevo). Google la exige como opción.
  async function restore() {
    if (!isAndroid || !window.CdvPurchase) return premium;
    try {
      const { store } = window.CdvPurchase;
      if (store.restorePurchases) await store.restorePurchases();
      if (store.owned(PRODUCT_ID)) setPremium(true);
    } catch (_) {}
    return premium;
  }

  // El plugin puede estar listo en distintos momentos según la versión de Capacitor.
  document.addEventListener('deviceready', initStore, { once: true });
  if (isAndroid) {
    window.addEventListener('load', () => setTimeout(initStore, 800));
    setTimeout(initStore, 2000);   // respaldo final
  }

  return {
    isPremium: () => premium,
    price: () => priceStr,
    isStoreAvailable: () => isAndroid,
    purchase,
    restore,
    onChange: cb => { if (typeof cb === 'function') changeCbs.push(cb); },
    PRODUCT_ID
  };
})();
