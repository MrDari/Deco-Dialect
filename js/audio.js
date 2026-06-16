/* Sonido 100% sintetizado con WebAudio: cero archivos.
   Música estilo jazz/lounge de concurso (acordes 7ª, bajo caminante, swing,
   ondas suaves filtradas + delay para calidez). Cero "8-bit".
   - SFX.*            -> efectos
   - SFX.music.play('menu'|'game') / stop()
   - SFX.music.duck() -> baja el volumen (cuenta atrás) */
window.SFX = (() => {
  let ctx = null, enabled = true, _tock = false;
  let masterSfx = null, musicBus = null, musicGain = null, delay = null, delayFb = null, lp = null;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
      // SFX directos
      masterSfx = ctx.createGain(); masterSfx.gain.value = 1; masterSfx.connect(ctx.destination);
      // Bus de música: voces -> lowpass (calidez) -> musicGain -> destino (+ delay)
      musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(ctx.destination);
      lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.6;
      lp.connect(musicGain);
      // delay sutil (sensación de sala/lounge)
      delay = ctx.createDelay(); delay.delayTime.value = 0.26;
      delayFb = ctx.createGain(); delayFb.gain.value = 0.25;
      const delayMix = ctx.createGain(); delayMix.gain.value = 0.35;
      lp.connect(delay); delay.connect(delayFb); delayFb.connect(delay); delay.connect(delayMix); delayMix.connect(musicGain);
      musicBus = lp;
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
    if (!enabled) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(masterSfx);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  // ============================================================
  //  MÚSICA (jazz/lounge)
  // ============================================================
  const music = (() => {
    let current = null, timer = null, step = 0;
    const semitone = n => 220 * Math.pow(2, n / 12); // A3 = 0

    // MENÚ/INICIO -> tensión LENTA de anticipación de concurso (tonalidad menor):
    // latido grave (lub-dub), drone que respira y notas suspendidas que "cuelgan".
    // La PARTIDA va sin música (solo efectos). Offsets de semitono respecto a A3.
    const MENU_ROOTS = [0, 0, 0, -3];                 // raíz estable y sombría
    const MENU_HANG = [7, 10, 8, 5];                  // notas altas que se sostienen

    function pluck(freq, dur, vol, when, type = 'triangle') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g).connect(musicBus);
      o.start(when); o.stop(when + dur + 0.03);
    }
    // acorde tenso sostenido (menor con 2ª/tritono leve) que da "fondo de suspense"
    function drone(rootSemi, dur, vol, when) {
      [rootSemi, rootSemi + 3, rootSemi + 7].forEach((n, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i === 0 ? 'sawtooth' : 'sine';
        o.frequency.value = semitone(n);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(vol * (i === 0 ? 0.5 : 1), when + dur * 0.4);
        g.gain.linearRampToValueAtTime(0.0001, when + dur);
        o.connect(g).connect(musicBus);
        o.start(when); o.stop(when + dur + 0.05);
      });
    }

    // ---- MENÚ: tensión lenta de anticipación (latido + drone + notas que cuelgan) ----
    function tickMenu() {
      const beat = 0.52;                                  // mucho más lento
      const bar = step % 8;
      const root = MENU_ROOTS[Math.floor(step / 8) % MENU_ROOTS.length];
      const now = ctx.currentTime + 0.04;

      // drone grave que "respira" todo el ciclo
      if (bar === 0) drone(root - 12, beat * 8, 0.05, now);

      // LATIDO grave lub-dub en los tiempos 0 y 4 (no en cada paso → sensación de calma tensa)
      if (bar === 0 || bar === 4) {
        pluck(semitone(root - 24), beat * 0.5, 0.18, now, 'sine');                 // lub
        pluck(semitone(root - 24), beat * 0.45, 0.11, now + beat * 0.34, 'sine');  // dub
      }

      // nota alta suspendida que se sostiene y se desvanece (expectación, "espera")
      if (bar === 2 || bar === 6) {
        const h = MENU_HANG[Math.floor(step / 2) % MENU_HANG.length];
        pluck(semitone(root + h + 12), beat * 2.2, 0.045, now, 'triangle');
      }

      step++;
      timer = setTimeout(tickMenu, beat * 1000);
    }

    function tick() {
      if (!ctx) return;
      tickMenu();   // la partida va sin música; solo suena la pieza de menú/inicio
    }

    function fadeTo(target, secs) {
      if (!ctx || !musicGain) return;
      const t = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), t);
      musicGain.gain.linearRampToValueAtTime(target, t + secs);
    }
    function vol() { return 0.5; }

    function startLoop() { clearTimeout(timer); step = 0; tick(); }

    return {
      play(which) {
        if (!enabled) return;
        const c = ensure(); if (!c) return;
        current = which;
        const go = () => { startLoop(); fadeTo(vol(), 0.8); };
        if (c.state === 'suspended') c.resume().then(go).catch(go);
        else go();
      },
      stop(fast) {
        fadeTo(0.0, fast ? 0.15 : 0.5);
        const t = timer;
        setTimeout(() => { if (timer === t) { clearTimeout(timer); timer = null; current = null; } }, fast ? 180 : 520);
      },
      duck(on) { fadeTo(on ? 0.18 : vol(), 0.3); },
      setEnabled(on) { if (!on) { clearTimeout(timer); timer = null; current = null; if (musicGain) musicGain.gain.value = 0; } },
      isPlaying() { return !!timer; },
      resumeIf() { if (current && !timer) { startLoop(); fadeTo(vol(), 0.4); } }
    };
  })();

  return {
    unlock() { ensure(); },
    setEnabled(v) { enabled = v; if (masterSfx) masterSfx.gain.value = v ? 1 : 0; music.setEnabled(v); },
    isEnabled() { return enabled; },
    music,
    // ---- efectos (cálidos, tipo concurso) ----
    tap()    { tone(440, 0.07, 'sine', 0.13); },
    score()  { tone(587, 0.1, 'sine', 0.18); setTimeout(() => tone(880, 0.14, 'sine', 0.18), 80); },
    gold()   { [659, 988, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'sine', 0.16), i * 70)); },
    unscore(){ tone(330, 0.12, 'sine', 0.12, 200); },
    start()  { [523, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.16), i * 90)); },
    // tic-tac de reloj MECÁNICO y pronunciado: alterna tic agudo / tac grave,
    // ataque seco (square) + click de cuerpo, más fuerte en la recta final.
    tick()   {
      _tock = !_tock;
      const hi = _tock ? 1100 : 760;          // tic más agudo, tac más grave
      tone(hi, 0.045, 'square', 0.28, hi * 0.45);  // golpe seco que cae rápido
      tone(hi * 1.9, 0.02, 'square', 0.16);        // "click" metálico encima
    },
    timeup() { tone(440, 0.5, 'sawtooth', 0.2, 130); },
    endTurn(){ [523, 392].forEach((f, i) => setTimeout(() => tone(f, 0.24, 'sine', 0.17), i * 130)); },
    endRound(){ [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.18), i * 110)); },
    win()    { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.24, 'sine', 0.2), i * 120)); }
  };
})();
