/* ============================================================
   Deco Dialect — lógica del juego (vanilla JS).
   ============================================================ */
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Colores de equipo (cálidos, acordes al tema rojo/dorado)
  const TEAM_COLORS = [
    '#e23048', '#e9c270', '#ff7a52', '#ff5470', '#f0973a',
    '#ffcf6e', '#c2304a', '#ff9b6b', '#e8a13a', '#ff6f91',
    '#d98a2b', '#ffe6a0', '#b8243c', '#ffae6c', '#e07a3a',
    '#ff8fa3', '#caa23f', '#ffbd7a', '#cf3550', '#e2a85a'
  ];

  const state = {
    lang: 'es-ES',
    teams: 2, rounds: 5, time: 60,
    mode: 'classic',          // classic | blitz | golden | hard
    pack: 'all',              // all | nature | world | culture | daily | quirky
    names: [], scores: [],
    current: 0, round: 1,
    turnPoints: 0,
    turnDuration: 60,         // duración real del turno (blitz la fuerza a 30)
    timer: null, remaining: 0, paused: false,
    roundCategories: [],
    catDeck: [], catPtr: 0,   // mazo barajado de categorías (sin repetición)
    cards: [],  // 3 cartas: [normal, normal, gold]
    // racha (combo) y estadísticas de la partida
    streak: 0, lastHitAt: 0,
    stats: { totalHits: 0, bestTurn: 0, bestStreak: 0 }
  };

  // Ventana de tiempo (ms) para encadenar aciertos en una racha, y umbral para
  // que la racha se considere "en fuego" y se muestre/suene.
  const COMBO_WINDOW = 4000;
  const COMBO_MIN = 3;

  // Contrarreloj: arranca con poco tiempo y cada acierto SUMA segundos (hasta un tope).
  // Es un modo de impulso/momentum, distinto del Clásico (que corre a tiempo fijo).
  const BLITZ_START = 20, BLITZ_MAX = 30, BLITZ_BONUS = 2;

  // ---------- Freemium (límites de la versión gratuita) ----------
  // En Android sin compra: 15 categorías, 2 equipos, 3 rondas. Premium = sin límites.
  // En web (itch.io) Billing.isPremium() es true → sin límites.
  const FREE = { cats: 15, teams: 2, rounds: 3 };
  const MAX = { teams: 5, rounds: 20 };   // 5 equipos = los que caben en pantalla
  const CAT_PAGE = 5;                       // la carta de categorías muestra 5 como máximo
  const isPremium = () => window.Billing ? window.Billing.isPremium() : true;
  const maxTeams  = () => isPremium() ? MAX.teams  : FREE.teams;
  const maxRounds = () => isPremium() ? MAX.rounds : FREE.rounds;

  // Modos de juego. 'classic' es gratis; el resto son premium (más valor a la compra).
  const MODES = ['classic', 'blitz', 'golden', 'hard'];
  const FREE_MODES = ['classic'];
  // Packs temáticos: 'all' es gratis; los temas concretos son premium.
  const isModeAllowed = m => isPremium() || FREE_MODES.includes(m);
  const isPackAllowed = p => isPremium() || p === 'all';

  // ---------- Preferencias persistentes (localStorage) ----------
  const PREFS_KEY = 'deco-dialect:prefs';
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        lang: state.lang, teams: state.teams, rounds: state.rounds,
        time: state.time, mode: state.mode, pack: state.pack,
        names: state.names, sound: SFX.isEnabled()
      }));
    } catch (_) { /* modo privado / sin almacenamiento: se ignora */ }
  }
  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      if (p.lang && window.I18N[p.lang]) state.lang = p.lang;
      if (Number.isFinite(p.teams))  state.teams  = clamp(p.teams, 2, 20);
      if (Number.isFinite(p.rounds)) state.rounds = clamp(p.rounds, 1, 20);
      if ([30, 60, 90].includes(p.time)) state.time = p.time;
      if (MODES.includes(p.mode)) state.mode = p.mode;
      if (p.pack === 'all' || window.CATEGORY_PACKS[p.pack]) state.pack = p.pack;
      if (Array.isArray(p.names)) state.names = p.names;
      if (p.sound === false) SFX.setEnabled(false);
    } catch (_) { /* json corrupto: arranca con valores por defecto */ }
  }

  // ---------- Récords / estadísticas persistentes ----------
  const RECORDS_KEY = 'deco-dialect:records';
  const records = { best: 0, games: 0 };
  function loadRecords() {
    try {
      const r = JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}');
      if (Number.isFinite(r.best))  records.best  = r.best;
      if (Number.isFinite(r.games)) records.games = r.games;
    } catch (_) {}
  }
  function saveRecords() {
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch (_) {}
  }

  // Ajusta equipos/rondas/modo/pack a los topes vigentes (al cargar y al cambiar premium).
  function enforceLimits() {
    state.teams = clamp(state.teams, 2, maxTeams());
    state.rounds = clamp(state.rounds, 1, maxRounds());
    if (!isModeAllowed(state.mode)) state.mode = 'classic';
    if (!isPackAllowed(state.pack)) state.pack = 'all';
  }

  // ---------- i18n ----------
  function t(key) { return (window.I18N[state.lang] || window.I18N['es-ES'])[key]; }
  function applyI18n() {
    $$('[data-i18n]').forEach(el => {
      const v = t(el.dataset.i18n);
      if (typeof v === 'string') el.textContent = v;
    });
    document.documentElement.lang = state.lang.startsWith('es') ? 'es' : 'en';
    const rl = $('#rules-list'); rl.innerHTML = '';
    (t('rules') || []).forEach(r => { const li = document.createElement('li'); li.innerHTML = r; rl.appendChild(li); });
    // textos dinámicos que dependen del idioma actual
    renderModePack();
    renderMenuRecords();
  }

  // ---------- Háptica (vibración) ----------
  // Respeta el ajuste de sonido como interruptor general de feedback. Usa la API
  // estándar navigator.vibrate (Android/Chrome la soportan; en iOS/desktop es no-op).
  function buzz(pattern) {
    if (!SFX.isEnabled()) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
  }

  // ---------- Navegación ----------
  function show(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
  }

  // ---------- Helpers ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  function teamName(i) { return (state.names[i] && state.names[i].trim()) || `${t('teamDefault')} ${i + 1}`; }
  function teamColor(i) { return TEAM_COLORS[i % TEAM_COLORS.length]; }
  function currentCategory() { return state.roundCategories[state.round - 1]; }
  function pool() {
    const key = state.lang === 'en' ? 'en' : 'es';
    // modo difícil: usa el alfabeto de letras "raras" (Q, X, K, Z, Ñ…)
    return state.mode === 'hard' ? window.LETTER_POOLS_HARD[key] : window.LETTER_POOLS[key];
  }
  function randLetter() { const p = pool(); return p[Math.floor(Math.random() * p.length)]; }

  // ---------- Setup ----------
  function renderTeamNames() {
    const box = $('#team-names'); box.innerHTML = '';
    for (let i = 0; i < state.teams; i++) {
      const row = document.createElement('div');
      row.className = 'team-name-row';
      const color = teamColor(i);
      row.innerHTML =
        `<span class="team-swatch" style="background:${color};color:${color}"></span>` +
        `<input class="team-input" maxlength="16" data-team="${i}" placeholder="${t('teamDefault')} ${i + 1}" value="${state.names[i] || ''}">`;
      box.appendChild(row);
    }
    $$('.team-input').forEach(inp => inp.addEventListener('input', e => { state.names[+e.target.dataset.team] = e.target.value; savePrefs(); }));
  }
  function updateSteppers() {
    $('#val-teams').textContent = state.teams;
    $('#val-rounds').textContent = state.rounds;
  }

  // Refleja modo y pack seleccionados (chips activos + candado en los premium).
  function renderModePack() {
    $$('[data-mode]').forEach(b => {
      const m = b.dataset.mode;
      b.classList.toggle('active', m === state.mode);
      b.classList.toggle('locked', !isModeAllowed(m));
    });
    $$('[data-pack]').forEach(b => {
      const p = b.dataset.pack;
      b.classList.toggle('active', p === state.pack);
      b.classList.toggle('locked', !isPackAllowed(p));
    });
    const desc = $('#mode-desc');
    if (desc) desc.textContent = t(MODE_DESC[state.mode]);
    syncDurationLock();
  }
  // Contrarreloj fuerza turnos de 30 s: bloqueamos el selector de Duración y lo
  // fijamos visualmente en 30, así no hay contradicción (antes elegías 60 y jugabas 30).
  function syncDurationLock() {
    const blitz = state.mode === 'blitz';
    const seg = document.querySelector('[data-seg="time"]');
    if (seg) seg.classList.toggle('locked', blitz);
    $$('[data-seg="time"] .seg-btn').forEach(b => {
      b.disabled = blitz;
      const on = blitz ? (+b.dataset.val === 30) : (+b.dataset.val === state.time);
      b.classList.toggle('active', on);
    });
  }
  const MODE_DESC = { classic: 'modeClassicDesc', blitz: 'modeBlitzDesc', golden: 'modeGoldenDesc', hard: 'modeHardDesc' };
  function selectMode(m) {
    if (!isModeAllowed(m)) { SFX.tap(); openUnlock(); return; }
    state.mode = m; SFX.tap(); renderModePack(); savePrefs();
  }
  function selectPack(p) {
    if (!isPackAllowed(p)) { SFX.tap(); openUnlock(); return; }
    state.pack = p; SFX.tap(); renderModePack(); savePrefs();
  }
  function setupStepper(name, delta) {
    // si el usuario gratuito intenta superar su tope, ofrecemos desbloquear
    if (delta > 0 && !isPremium()) {
      if (name === 'teams' && state.teams >= FREE.teams) { SFX.tap(); openUnlock(); return; }
      if (name === 'rounds' && state.rounds >= FREE.rounds) { SFX.tap(); openUnlock(); return; }
    }
    if (name === 'teams') { state.teams = clamp(state.teams + delta, 2, maxTeams()); renderTeamNames(); }
    if (name === 'rounds') state.rounds = clamp(state.rounds + delta, 1, maxRounds());
    updateSteppers(); SFX.tap(); savePrefs();
  }

  // ---------- Cartas y categorías ----------
  function buildCards() {
    // dos letras normales distintas + una dorada distinta. En modo "solo doradas"
    // las tres cartas son doradas (+2) y cada acierto cambia la categoría.
    const used = new Set();
    function pick() { let c; let g = 0; do { c = randLetter(); } while (used.has(c) && g++ < 50); used.add(c); return c; }
    const allGold = state.mode === 'golden';
    return [
      { ch: pick(), gold: allGold, scored: false },
      { ch: pick(), gold: allGold, scored: false },
      { ch: pick(), gold: true,    scored: false }
    ];
  }
  // Mazo de categorías barajado con puntero: cada categoría sale una vez hasta
  // agotar todas (90), evitando repeticiones aunque se acierten muchas doradas.
  function catList() {
    const all = window.CATEGORIES[state.lang] || window.CATEGORIES['es-ES'];
    // Premium con un pack temático elegido: solo las categorías de ese tema.
    if (isPremium() && state.pack !== 'all') {
      const idx = window.CATEGORY_PACKS[state.pack];
      if (idx && idx.length) return idx.map(i => all[i]).filter(Boolean);
      return all;
    }
    if (isPremium()) return all;
    // Gratis: ventana ROTATIVA de 15 categorías que avanza con las partidas jugadas,
    // así el jugador free ve contenido distinto cada pocas sesiones (mejor retención).
    const offset = (records.games * FREE.cats) % all.length;
    const window2 = [];
    for (let k = 0; k < FREE.cats; k++) window2.push(all[(offset + k) % all.length]);
    return window2;
  }
  function resetCatDeck() { state.catDeck = shuffle(catList()); state.catPtr = 0; }
  function drawCategory() {
    if (!state.catDeck || !state.catDeck.length) resetCatDeck();
    // si se agotó el mazo, rebaraja para seguir sin cortes
    if (state.catPtr >= state.catDeck.length) {
      const last = state.catDeck[state.catDeck.length - 1];
      let deck = shuffle(catList());
      // evita que la primera del nuevo mazo repita la última mostrada
      if (deck.length > 1 && deck[0] === last) { const j = 1 + Math.floor(Math.random() * (deck.length - 1)); [deck[0], deck[j]] = [deck[j], deck[0]]; }
      state.catDeck = deck; state.catPtr = 0;
    }
    return state.catDeck[state.catPtr++];
  }
  function pickRoundCategories() {
    resetCatDeck();
    const picked = [];
    for (let i = 0; i < state.rounds; i++) picked.push(drawCategory());
    return picked;
  }

  // ---------- Flujo ----------
  function startGame() {
    state.scores = new Array(state.teams).fill(0);
    state.round = 1; state.current = 0;
    // Contrarreloj: el anillo/barra usa el tope (BLITZ_MAX) como referencia, aunque el
    // turno ARRANQUE en BLITZ_START (el resto del tiempo se "gana" acertando).
    state.turnDuration = state.mode === 'blitz' ? BLITZ_MAX : state.time;
    state.stats = { totalHits: 0, bestTurn: 0, bestStreak: 0 };
    state.roundCategories = pickRoundCategories();
    SFX.start();
    showTurnIntro();
  }

  function showTurnIntro() {
    $('#turn-round-num').textContent = state.round;
    const el = $('#turn-team-name');
    el.textContent = teamName(state.current);
    el.style.color = teamColor(state.current);
    show('screen-turn');
  }

  function beginTurn() {
    state.turnPoints = 0;
    // Contrarreloj empieza en BLITZ_START; los demás modos en su duración completa.
    state.remaining = state.mode === 'blitz' ? BLITZ_START : state.turnDuration;
    state.paused = false;
    state.streak = 0; state.lastHitAt = 0;
    state.cards = buildCards();

    $('#hud-round').textContent = state.round;

    renderCategoryCard();
    renderCards();
    renderScorebar();
    updateTimerUI();
    show('screen-play');
    SFX.start();
    SFX.music.stop(true);   // sin música de fondo durante la partida (solo efectos)

    // anima la entrada una sola vez (no en cada render de letra)
    const sp = $('#screen-play');
    sp.classList.remove('enter'); void sp.offsetWidth; sp.classList.add('enter');

    clearInterval(state.timer);
    state.timer = setInterval(tick, 1000);
  }

  function renderScorebar() {
    const bar = $('#scorebar'); bar.innerHTML = '';
    // máximo 5 equipos (caben todos en la barra). El chip activo es el indicador de turno.
    const idxs = [...Array(state.teams).keys()];
    idxs.forEach(i => {
      const chip = document.createElement('div');
      chip.className = 'score-chip' + (i === state.current ? ' active' : '');
      const live = i === state.current ? state.scores[i] + state.turnPoints : state.scores[i];
      chip.innerHTML =
        `<span class="chip-dot" style="background:${teamColor(i)}"></span>` +
        `<span>${teamName(i)}</span>` +
        `<span class="chip-pts">${live}</span>`;
      bar.appendChild(chip);
    });
  }
  function updateScorebarLive() {
    const chip = $('#scorebar .score-chip.active .chip-pts');
    if (chip) chip.textContent = state.scores[state.current] + state.turnPoints;
  }

  // La carta de categorías muestra como MÁXIMO 5 filas. Si hay más rondas, se pagina:
  // rondas 1-5 en la primera carta, 6-10 en la siguiente, etc. La página visible es
  // siempre la que contiene la ronda en curso, numerada 1..5 desde su inicio.
  function renderCategoryCard() {
    const box = $('#cat-list'); box.innerHTML = '';
    const pageStart = Math.floor((state.round - 1) / CAT_PAGE) * CAT_PAGE;
    const page = state.roundCategories.slice(pageStart, pageStart + CAT_PAGE);
    page.forEach((cat, i) => {
      const r = pageStart + i + 1;     // ronda real (para done/active)
      const row = document.createElement('div');
      row.className = 'cat-row' + (r < state.round ? ' done' : r === state.round ? ' active' : '');
      row.innerHTML = `<span class="cat-idx">${i + 1}</span><span class="cat-text">${cat}</span>`;
      box.appendChild(row);
    });
  }

  function renderCards() {
    const area = $('#cards-area'); area.innerHTML = '';
    const row = document.createElement('div'); row.className = 'letter-row';
    row.appendChild(makeCard(0)); row.appendChild(makeCard(1));
    area.appendChild(row);
    area.appendChild(makeCard(2, true));
  }
  function makeCard(i, solo) {
    const C = state.cards[i];
    const el = document.createElement('div');
    el.className = 'card' + (C.gold ? ' gold' : '') + (solo ? ' solo' : '');
    el.dataset.idx = i;
    el.innerHTML =
      (C.gold
        ? '<span class="card-pts">+2</span><span class="card-star">★</span><span class="card-shine"></span>'
        : '<span class="card-pts">+1</span>') +
      `<span class="card-letter">${C.ch}</span>`;
    return el;
  }

  // renueva la CARTA DE LETRAS COMPLETA (las 3, sin repetir entre sí) con animación
  function renewAllLetters() {
    const used = new Set();
    [0, 1, 2].forEach(k => {
      let c, g = 0; do { c = randLetter(); } while (used.has(c) && g++ < 50);
      used.add(c); state.cards[k].ch = c; refreshCard(k);
    });
  }
  // Acierto: se toca la CARTA de la letra acertada. Ambos tipos renuevan las 3
  // letras; la dorada (+2) además cambia la categoría. La normal suma +1.
  function scoreCard(i) {
    if (state.paused || state.remaining <= 0) return;
    const gold = !!state.cards[i].gold;
    flashScore(i);   // destello en la carta tocada ANTES de renovar las letras
    renewAllLetters();
    if (gold) {
      state.turnPoints += 2;
      // la dorada también renueva la CATEGORÍA activa por otra nueva (sin repetir)
      state.roundCategories[state.round - 1] = drawCategory();
      refreshCategoryActive();
      SFX.gold();
      buzz([0, 18, 40, 28]);   // doble pulso para la dorada
    } else {
      state.turnPoints += 1;
      SFX.score();
      buzz(20);                // pulso corto para acierto normal
    }
    // Contrarreloj: cada acierto AÑADE tiempo (hasta el tope) → mecánica de impulso.
    if (state.mode === 'blitz') {
      const before = state.remaining;
      state.remaining = Math.min(BLITZ_MAX, state.remaining + BLITZ_BONUS);
      if (state.remaining > before) { updateTimerUI(); flashTimerBonus(); }
    }
    // estadísticas de la partida
    state.stats.totalHits++;
    registerStreak();
    updateScorebarLive();
  }
  // destello VERDE "+2s" en el reloj al ganar tiempo (Contrarreloj)
  function flashTimerBonus() {
    const tp = document.querySelector('.timer-plate');
    if (!tp) return;
    tp.classList.remove('bonus'); void tp.offsetWidth; tp.classList.add('bonus');
  }

  // Racha: aciertos encadenados dentro de COMBO_WINDOW. A partir de COMBO_MIN se
  // muestra el banner "¡EN RACHA! xN" y suena el combo (sin alterar la puntuación,
  // para no desbalancear el juego: la racha es feedback, no puntos extra).
  function registerStreak() {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    state.streak = (now - state.lastHitAt <= COMBO_WINDOW) ? state.streak + 1 : 1;
    state.lastHitAt = now;
    if (state.streak > state.stats.bestStreak) state.stats.bestStreak = state.streak;
    if (state.streak >= COMBO_MIN) { showCombo(state.streak); SFX.combo(state.streak); buzz([0, 12, 30, 12, 30, 12]); }
  }
  // Banner flotante de racha (se crea una vez y se reutiliza).
  let comboTimer = null;
  function showCombo(n) {
    let el = $('#combo-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'combo-banner';
      $('#screen-play').appendChild(el);
    }
    el.innerHTML = `<span class="combo-text">${t('comboBanner')}</span><span class="combo-x">x${n}</span>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => el.classList.remove('show'), 900);
  }
  // breve destello de acierto en la carta tocada
  function flashScore(i) {
    const el = $(`#cards-area .card[data-idx="${i}"]`);
    if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
  }
  // Saltar categoría: cuando no sabes la categoría, la cambias por otra nueva
  // a cambio de una PENALIZACIÓN de 5 segundos en el timer.
  const SKIP_PENALTY = 5;
  function skipCategory() {
    if (state.paused || state.remaining <= 0) return;
    state.roundCategories[state.round - 1] = drawCategory();
    refreshCategoryActive();
    // penalización de tiempo
    state.remaining = Math.max(0, state.remaining - SKIP_PENALTY);
    updateTimerUI();
    SFX.penalty();
    buzz([0, 40, 60, 40]);   // zumbido de penalización (más largo/áspero)
    // saltar rompe la racha en curso
    state.streak = 0; state.lastHitAt = 0;
    flashTimerPenalty();
    // destello del botón saltar SIN transform (no mover: está centrado con translateY)
    const sb = $('#btn-skip');
    if (sb) { sb.classList.remove('flash'); void sb.offsetWidth; sb.classList.add('flash'); }
    if (state.remaining <= 0) { SFX.timeup(); endTurn(); }
  }
  // breve destello rojo en el timer al penalizar
  function flashTimerPenalty() {
    const tp = document.querySelector('.timer-plate');
    if (!tp) return;
    tp.classList.remove('penalty'); void tp.offsetWidth; tp.classList.add('penalty');
  }

  // actualiza SOLO el texto de la categoría activa (la de la ronda en curso) con animación
  function refreshCategoryActive() {
    const row = $('#cat-list .cat-row.active');
    if (!row) return;
    const txt = row.querySelector('.cat-text');
    if (txt) txt.textContent = state.roundCategories[state.round - 1];
    row.classList.remove('dealt'); void row.offsetWidth; row.classList.add('dealt');
  }
  // actualiza SOLO la letra de una carta + breve animación de reparto (sin re-render global)
  function refreshCard(i) {
    const el = $(`#cards-area .card[data-idx="${i}"]`);
    if (!el) return;
    el.querySelector('.card-letter').textContent = state.cards[i].ch;
    el.classList.remove('dealt'); void el.offsetWidth; el.classList.add('dealt');
  }

  // ---------- Timer ----------
  function fmt(s) { const m = Math.floor(s / 60); const r = s % 60; return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; }
  const RING_LEN = 326.726;   // 2·π·r con r=52 (debe coincidir con el SVG del anillo)
  function updateTimerUI() {
    const num = $('#timer-num');
    num.textContent = fmt(Math.max(0, state.remaining));
    const warn = state.remaining <= 10;
    const frac = state.turnDuration > 0 ? Math.max(0, state.remaining / state.turnDuration) : 0;
    const fill = $('#timer-fill');
    if (fill) {
      fill.style.width = (frac * 100) + '%';
      fill.classList.toggle('warn', warn);
    }
    // anillo circular que se vacía alrededor del número
    const ring = $('#timer-ring-fill');
    if (ring) {
      ring.style.strokeDashoffset = (RING_LEN * (1 - frac)).toFixed(1);
      ring.classList.toggle('warn', warn);
    }
    document.querySelector('.timer-plate')?.classList.toggle('warn', warn);
    document.querySelector('.timer-track')?.classList.toggle('warn', warn);
  }
  function tick() {
    if (state.paused) return;
    state.remaining--;
    updateTimerUI();
    // últimos 10 segundos: tic-tac de reloj (sin música de fondo en la partida)
    if (state.remaining <= 10 && state.remaining > 0) SFX.tick();
    if (state.remaining <= 0) { SFX.timeup(); endTurn(); }
  }

  function endTurn() {
    clearInterval(state.timer);
    state.scores[state.current] += state.turnPoints;
    if (state.turnPoints > state.stats.bestTurn) state.stats.bestTurn = state.turnPoints;
    $('#turn-points').textContent = state.turnPoints;
    renderScoreboard($('#mini-scoreboard'));

    // ¿es el último equipo de la ronda? -> fin de ronda
    const isRoundEnd = state.current >= state.teams - 1;
    const isGameEnd = isRoundEnd && state.round >= state.rounds;
    const banner = $('#sum-banner');
    const sub = $('#sum-sub');

    if (isRoundEnd) {
      banner.textContent = `${t('endRoundBanner')} ${state.round}`;
      banner.classList.add('round');
      sub.textContent = '';
      if (!isGameEnd) SFX.endRound();
    } else {
      banner.textContent = t('endTurnBanner');
      banner.classList.remove('round');
      // indicar el siguiente equipo
      sub.textContent = `${t('nextTeamLabel')}: ${teamName(state.current + 1)}`;
      SFX.endTurn();
    }
    if (!isGameEnd) SFX.music.play('menu');  // vuelve a música tranquila entre turnos
    show('screen-roundsum');
  }
  function nextTurn() {
    state.current++;
    if (state.current >= state.teams) {
      state.current = 0; state.round++;
      if (state.round > state.rounds) return endGame();
    }
    showTurnIntro();
  }

  function renderScoreboard(box) {
    box.innerHTML = '';
    const order = state.scores.map((pts, i) => ({ i, pts })).sort((a, b) => b.pts - a.pts);
    const max = order.length ? order[0].pts : 0;
    order.forEach(({ i, pts }) => {
      const row = document.createElement('div');
      row.className = 'score-row' + (pts === max && max > 0 ? ' lead' : '');
      row.innerHTML =
        `<span class="sb-swatch" style="background:${teamColor(i)}"></span>` +
        `<span class="sb-name">${teamName(i)}</span>` +
        `<span class="sb-pts">${pts}</span>`;
      box.appendChild(row);
    });
  }

  function endGame() {
    SFX.music.stop(true);   // silencia la música para la fanfarria de victoria
    SFX.win();
    const max = Math.max(...state.scores);
    const winners = state.scores.map((p, i) => ({ p, i })).filter(o => o.p === max);
    const nameEl = $('#winner-name');
    if (winners.length > 1) { nameEl.textContent = t('tie'); nameEl.style.color = 'var(--gold-2)'; }
    else { nameEl.textContent = teamName(winners[0].i); nameEl.style.color = teamColor(winners[0].i); }
    renderScoreboard($('#final-scoreboard'));

    // récords: cuenta la partida y comprueba récord de puntuación máxima
    records.games++;
    const isRecord = max > records.best;
    if (isRecord) records.best = max;
    saveRecords();

    // estadísticas y badge de récord
    renderStats(max, isRecord);

    show('screen-result');
    launchConfetti();
  }

  // Resumen de estadísticas + insignia de récord en la pantalla final.
  function renderStats(maxScore, isRecord) {
    const badge = $('#record-badge');
    if (badge) { badge.textContent = t('recordBadge'); badge.hidden = !isRecord; }
    const box = $('#game-stats');
    if (!box) return;
    const rows = [
      [t('statBestTurn'),   '+' + state.stats.bestTurn],
      [t('statTotalHits'),  state.stats.totalHits],
      [t('statBestStreak'), 'x' + state.stats.bestStreak]
    ];
    box.innerHTML = rows.map(([k, v]) =>
      `<div class="stat-item"><span class="stat-k">${k}</span><span class="stat-v">${v}</span></div>`).join('');
  }

  // Confeti ligero en Canvas (rojo/dorado), sin librerías. Dura ~2.2 s y se limpia.
  function launchConfetti() {
    const cv = $('#confetti');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width = cv.offsetWidth, H = cv.height = cv.offsetHeight;
    const COLORS = ['#e23048', '#e9c270', '#ffe6a8', '#ff7a52', '#ffffff'];
    const N = 90;
    const parts = [];
    for (let i = 0; i < N; i++) parts.push({
      x: Math.random() * W, y: -20 - Math.random() * H * 0.5,
      vx: (Math.random() - 0.5) * 2.4, vy: 2 + Math.random() * 3.2,
      r: 3 + Math.random() * 4, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    let frame = 0;
    const MAX_FRAMES = 150;
    let raf = 0;
    function tickC() {
      ctx.clearRect(0, 0, W, H);
      const fade = frame > MAX_FRAMES - 40 ? Math.max(0, (MAX_FRAMES - frame) / 40) : 1;
      ctx.globalAlpha = fade;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (++frame < MAX_FRAMES) raf = requestAnimationFrame(tickC);
      else ctx.clearRect(0, 0, W, H);
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tickC);
  }

  // ---------- Pausa ----------
  function openPause() { state.paused = true; SFX.music.stop(true); $('#modal-pause').classList.add('active'); }
  function closePause() { $('#modal-pause').classList.remove('active'); state.paused = false; }

  // ---------- Desbloqueo (compra) ----------
  function refreshPremiumUI() {
    const locked = window.Billing && window.Billing.isStoreAvailable() && !isPremium();
    const pill = $('#btn-unlock-menu');
    if (pill) pill.hidden = !locked;          // la píldora 🔒 solo aparece en Android sin comprar
    const price = $('#unlock-price');
    if (price && window.Billing) price.textContent = window.Billing.price();
    // "Restaurar compra": solo tiene sentido en una tienda real (Android) y cuando aún
    // no eres premium. En web/itch.io (sin tienda) y ya comprado, se oculta.
    const restoreWrap = $('#restore-wrap');
    if (restoreWrap) restoreWrap.hidden = !(window.Billing && window.Billing.isStoreAvailable() && !isPremium());
  }
  // Muestra los récords locales en el menú (oculto si aún no hay partidas jugadas).
  function renderMenuRecords() {
    const box = $('#menu-records');
    if (!box) return;
    if (records.games <= 0) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML =
      `<span class="mr-item"><span class="mr-k">${t('bestScore')}</span><span class="mr-v">${records.best}</span></span>` +
      `<span class="mr-item"><span class="mr-k">${t('gamesPlayed')}</span><span class="mr-v">${records.games}</span></span>`;
  }
  function openUnlock() {
    if (isPremium()) return;
    refreshPremiumUI();
    $('#modal-unlock').classList.add('active');
  }
  function closeUnlock() { $('#modal-unlock').classList.remove('active'); }
  // El cierre del modal y el feedback NO se disparan aquí: la compra se confirma de
  // forma ASÍNCRONA (Google verifica el recibo tras order()). Quien cierra el modal es
  // el listener onChange de Billing (ver init) en cuanto premium pasa a true. Así no
  // hace falta volver a pulsar el botón.
  async function doPurchase() {
    if (!window.Billing) return;
    SFX.tap();
    const btn = $('#btn-unlock-buy');
    if (btn) btn.disabled = true;            // evita doble pulsación mientras procesa
    try { await window.Billing.purchase(); } finally { if (btn) btn.disabled = false; }
    // si la compra ya constaba al volver (caso raro), onChange no saltará: cerramos aquí
    if (isPremium()) onUnlocked();
  }
  // Restaurar compra (reinstalación / móvil nuevo). Google exige ofrecerlo. Si tras
  // consultar a Play el usuario resulta propietario, onChange/onUnlocked se encarga;
  // si no posee nada, avisamos discretamente bajo el botón.
  async function doRestore() {
    if (!window.Billing) return;
    SFX.tap();
    const link = $('#btn-unlock-restore');
    const msg = $('#restore-msg');
    if (link) link.disabled = true;
    if (msg) msg.textContent = '';
    try { await window.Billing.restore(); } finally { if (link) link.disabled = false; }
    // si no quedó premium, no había nada que restaurar → feedback
    if (!isPremium() && msg) msg.textContent = t('restoreNone');
  }
  // Al activarse premium: cierra modal, oculta candados y refresca la UI de setup.
  // Idempotente: si el modal ya está cerrado no hace nada visible de más.
  function onUnlocked() {
    const wasOpen = $('#modal-unlock').classList.contains('active');
    closeUnlock();
    refreshPremiumUI();
    enforceLimits();
    if ($('#screen-setup').classList.contains('active')) { updateSteppers(); renderModePack(); }
    if (wasOpen) SFX.win();                  // fanfarria solo si veníamos del modal
  }

  // ---------- Eventos ----------
  function bind() {
    // idioma
    $$('.flag-btn').forEach(b => b.addEventListener('click', () => {
      $$('.flag-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); state.lang = b.dataset.lang; applyI18n(); SFX.tap(); savePrefs();
    }));
    // sonido (efectos + música)
    $('#btn-sound').addEventListener('click', e => {
      const on = !SFX.isEnabled(); SFX.setEnabled(on);
      e.currentTarget.classList.toggle('off', !on);
      if (on) { SFX.unlock(); SFX.tap(); SFX.music.play('menu'); }
      savePrefs();
    });
    // menú
    $('#btn-play').addEventListener('click', () => { SFX.unlock(); SFX.tap(); SFX.music.play('menu'); renderTeamNames(); updateSteppers(); renderModePack(); show('screen-setup'); });
    $('#btn-howto').addEventListener('click', () => { SFX.tap(); $('#modal-howto').classList.add('active'); });
    $('#btn-close-howto').addEventListener('click', () => { SFX.tap(); $('#modal-howto').classList.remove('active'); });
    // steppers
    $$('[data-stepper]').forEach(st => {
      const name = st.dataset.stepper;
      $$('.step-btn', st).forEach(btn => btn.addEventListener('click', () => setupStepper(name, +btn.dataset.delta)));
    });
    // duración (segmento)
    $$('[data-seg="time"] .seg-btn').forEach(b => b.addEventListener('click', () => {
      $$('[data-seg="time"] .seg-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); state.time = +b.dataset.val; SFX.tap(); savePrefs();
    }));
    // modo de juego y pack temático
    $$('[data-mode]').forEach(b => b.addEventListener('click', () => selectMode(b.dataset.mode)));
    $$('[data-pack]').forEach(b => b.addEventListener('click', () => selectPack(b.dataset.pack)));
    // setup → juego
    $('#btn-back-menu').addEventListener('click', () => { SFX.tap(); show('screen-menu'); });
    $('#btn-start').addEventListener('click', () => startGame());
    // turno
    $('#btn-go').addEventListener('click', () => beginTurn());
    // acciones de juego: se acierta TOCANDO la carta de la letra
    $('#cards-area').addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (!card) return;
      scoreCard(+card.dataset.idx);
    });
    $('#btn-skip').addEventListener('click', () => skipCategory());
    $('#btn-pause').addEventListener('click', () => { SFX.tap(); openPause(); });
    // desbloqueo (compra)
    $('#btn-unlock-menu').addEventListener('click', () => { SFX.tap(); openUnlock(); });
    $('#btn-unlock-buy').addEventListener('click', doPurchase);
    const restoreBtn = $('#btn-unlock-restore');
    if (restoreBtn) restoreBtn.addEventListener('click', doRestore);
    $('#btn-unlock-close').addEventListener('click', () => { SFX.tap(); closeUnlock(); });
    $('#modal-unlock').addEventListener('click', e => { if (e.target.id === 'modal-unlock') closeUnlock(); });
    // pausa
    $('#btn-resume').addEventListener('click', () => { SFX.tap(); closePause(); });   // sin música en partida
    $('#btn-restart').addEventListener('click', () => { SFX.tap(); closePause(); beginTurn(); });
    $('#btn-exit').addEventListener('click', () => { SFX.tap(); clearInterval(state.timer); closePause(); SFX.music.play('menu'); show('screen-menu'); });
    // resumen / final
    $('#btn-next').addEventListener('click', () => { SFX.tap(); nextTurn(); });
    $('#btn-rematch').addEventListener('click', () => { SFX.tap(); startGame(); });
    $('#btn-home').addEventListener('click', () => { SFX.tap(); SFX.music.play('menu'); show('screen-menu'); });

    // pausa automática al ocultar; silencia/reanuda música
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        SFX.music.stop(true);
        if (state.timer && $('#screen-play').classList.contains('active')) openPause();
      } else {
        SFX.music.resumeIf();
      }
    });

    // arranca la música en el PRIMER gesto del usuario (los navegadores bloquean
    // el audio hasta que hay interacción). Escucha varios eventos y solo una vez.
    let kicked = false;
    const kickoff = () => {
      if (kicked) return; kicked = true;
      SFX.unlock();
      if (SFX.isEnabled() && !SFX.music.isPlaying()) SFX.music.play('menu');
      ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(ev =>
        window.removeEventListener(ev, kickoff, true));
    };
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(ev =>
      window.addEventListener(ev, kickoff, true));
  }

  // ---------- Splash ----------
  function dismissSplash() {
    const sp = $('#splash');
    if (sp) sp.classList.add('hidden');
  }

  // refleja en la UI las preferencias cargadas (bandera, duración, sonido)
  function syncUiFromPrefs() {
    $$('.flag-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
    $$('[data-seg="time"] .seg-btn').forEach(b => b.classList.toggle('active', +b.dataset.val === state.time));
    $('#btn-sound')?.classList.toggle('off', !SFX.isEnabled());
    renderModePack();
    renderMenuRecords();
  }

  // ---------- Init ----------
  loadPrefs();
  loadRecords();
  enforceLimits();        // respeta los topes free/premium sobre lo cargado
  applyI18n();
  updateSteppers();
  syncUiFromPrefs();
  bind();
  refreshPremiumUI();
  // La tienda confirma la compra de forma ASÍNCRONA (al iniciar, comprar o restaurar).
  // Cuando premium pasa a true, onUnlocked cierra el modal y refresca toda la UI →
  // el usuario no tiene que volver a pulsar nada.
  if (window.Billing) window.Billing.onChange(prem => {
    if (prem) onUnlocked();
    else { enforceLimits(); updateSteppers(); refreshPremiumUI(); }
  });

  // ocultar el splash del DOM cuando acabe su animación de salida (~2.8s)
  const sp = $('#splash');
  if (sp) {
    sp.addEventListener('animationend', e => { if (e.animationName === 'splash-out') dismissSplash(); });
    setTimeout(dismissSplash, 2300); // respaldo por si el evento no salta
  }
})();
