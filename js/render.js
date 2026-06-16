/* Fondo animado Art Deco-Neón en Canvas. Optimizado para móvil:
   - respeta devicePixelRatio (capado a 2) para nitidez sin desperdicio
   - se pausa cuando la pestaña no es visible
   - respeta prefers-reduced-motion */
window.BG = (() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, raf = 0, t = 0;
  let rays = [], motes = [];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    rays = [];
    const cx = W / 2, n = 18;
    for (let i = 0; i < n; i++) rays.push({ a: (i / n) * Math.PI * 2, cx, cy: H * 0.5 });
    // partículas flotantes (densidad según área, cap para móvil)
    const count = Math.min(40, Math.round((W * H) / 26000));
    motes = [];
    for (let i = 0; i < count; i++) {
      motes.push({
        x: pseudo(i * 1.3) * W, y: pseudo(i * 2.7) * H,
        r: 0.6 + pseudo(i * 5.1) * 1.8,
        s: 0.1 + pseudo(i * 3.3) * 0.3,
        gold: pseudo(i * 7.7) > 0.5
      });
    }
  }
  // pseudo-aleatorio determinista (sin Math.random para estabilidad)
  function pseudo(x) { const v = Math.sin(x * 127.1) * 43758.5453; return v - Math.floor(v); }

  function draw() {
    t += 0.006;
    // fondo degradado radial (rojo profundo → negro)
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.85);
    g.addColorStop(0, '#2a0c12');
    g.addColorStop(0.5, '#140709');
    g.addColorStop(1, '#0b0607');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // rayos Art Deco que giran lentamente
    const cx = W / 2, cy = H * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.05);
    const len = Math.max(W, H);
    for (let i = 0; i < rays.length; i++) {
      const a = rays[i].a;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.04) * len, Math.sin(a - 0.04) * len);
      ctx.lineTo(Math.cos(a + 0.04) * len, Math.sin(a + 0.04) * len);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? 'rgba(212,33,58,0.030)' : 'rgba(232,185,90,0.026)';
      ctx.fill();
    }
    ctx.restore();

    // partículas
    for (const m of motes) {
      m.y -= m.s; if (m.y < -5) m.y = H + 5;
      const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 4 + m.x));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.gold
        ? `rgba(232,185,90,${0.5 * tw})`
        : `rgba(255,90,110,${0.45 * tw})`;
      ctx.shadowBlur = 8; ctx.shadowColor = m.gold ? '#e8b95a' : '#d4213a';
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (reduce) { draw(); cancelAnimationFrame(raf); return; } // un frame estático
    if (!raf) raf = requestAnimationFrame(draw);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  resize(); start();

  return { start, stop };
})();
