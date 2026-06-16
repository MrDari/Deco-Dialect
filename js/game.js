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
    names: [], scores: [],
    current: 0, round: 1,
    turnPoints: 0,
    timer: null, remaining: 0, paused: false,
    roundCategories: [],
    catDeck: [], catPtr: 0,   // mazo barajado de categorías (sin repetición)
    cards: []   // 3 cartas: [normal, normal, gold]
  };

  // ---------- Preferencias persistentes (localStorage) ----------
  const PREFS_KEY = 'deco-dialect:prefs';
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        lang: state.lang, teams: state.teams, rounds: state.rounds,
        time: state.time, names: state.names, sound: SFX.isEnabled()
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
      if (Array.isArray(p.names)) state.names = p.names;
      if (p.sound === false) SFX.setEnabled(false);
    } catch (_) { /* json corrupto: arranca con valores por defecto */ }
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
  function pool() { return window.LETTER_POOLS[state.lang === 'en' ? 'en' : 'es']; }
  function randLetter() { const p = pool(); return p[Math.floor(Math.random() * p.length)]; }

  // ---------- Setup ----------
  function renderTeamNames() {
    const box = $('#team-names'); box.innerHTML = '';
    for (let i = 0; i < state.teams; i++) {
      const row = document.createElement('div');
      row.className = 'team-name-row';
      const color = teamColor(i);
      row.innerHTML =
        `<span class="team-swatch" style="background:${color}"></span>` +
        `<input class="team-input" maxlength="16" data-team="${i}" placeholder="${t('teamDefault')} ${i + 1}" value="${state.names[i] || ''}">`;
      box.appendChild(row);
    }
    $$('.team-input').forEach(inp => inp.addEventListener('input', e => { state.names[+e.target.dataset.team] = e.target.value; savePrefs(); }));
  }
  function updateSteppers() {
    $('#val-teams').textContent = state.teams;
    $('#val-rounds').textContent = state.rounds;
  }
  function setupStepper(name, delta) {
    if (name === 'teams') { state.teams = clamp(state.teams + delta, 2, 20); renderTeamNames(); }
    if (name === 'rounds') state.rounds = clamp(state.rounds + delta, 1, 20);
    updateSteppers(); SFX.tap(); savePrefs();
  }

  // ---------- Cartas y categorías ----------
  function buildCards() {
    // dos letras normales distintas + una dorada distinta
    const used = new Set();
    function pick() { let c; let g = 0; do { c = randLetter(); } while (used.has(c) && g++ < 50); used.add(c); return c; }
    return [
      { ch: pick(), gold: false, scored: false },
      { ch: pick(), gold: false, scored: false },
      { ch: pick(), gold: true,  scored: false }
    ];
  }
  // Mazo de categorías barajado con puntero: cada categoría sale una vez hasta
  // agotar todas (90), evitando repeticiones aunque se acierten muchas doradas.
  function catList() { return window.CATEGORIES[state.lang] || window.CATEGORIES['es-ES']; }
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
    state.remaining = state.time;
    state.paused = false;
    state.cards = buildCards();

    $('#hud-round').textContent = state.round;
    $('#hud-team-name').textContent = teamName(state.current);

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
    // muestra hasta 4 equipos en la barra para no saturar; resto en resumen
    const show = Math.min(state.teams, 4);
    for (let i = 0; i < show; i++) {
      const chip = document.createElement('div');
      chip.className = 'score-chip' + (i === state.current ? ' active' : '');
      const live = i === state.current ? state.scores[i] + state.turnPoints : state.scores[i];
      chip.innerHTML =
        `<span class="chip-dot" style="background:${teamColor(i)}"></span>` +
        `<span>${teamName(i)}</span>` +
        `<span class="chip-pts">${live}</span>`;
      bar.appendChild(chip);
    }
  }
  function updateScorebarLive() {
    const chip = $('#scorebar .score-chip.active .chip-pts');
    if (chip) chip.textContent = state.scores[state.current] + state.turnPoints;
  }

  function renderCategoryCard() {
    const box = $('#cat-list'); box.innerHTML = '';
    state.roundCategories.forEach((cat, i) => {
      const r = i + 1;
      const row = document.createElement('div');
      row.className = 'cat-row' + (r < state.round ? ' done' : r === state.round ? ' active' : '');
      row.innerHTML = `<span class="cat-idx">${r}</span><span class="cat-text">${cat}</span>`;
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

  // Acierto: renueva las letras del tipo correspondiente y suma
  function score(gold) {
    if (state.paused || state.remaining <= 0) return;
    if (gold) {
      state.turnPoints += 2;
      state.cards[2].ch = randLetter();
      refreshCard(2);
      // la dorada también renueva la CATEGORÍA activa por otra nueva (sin repetir)
      state.roundCategories[state.round - 1] = drawCategory();
      refreshCategoryActive();
      SFX.gold();
    } else {
      state.turnPoints += 1;
      const used = new Set([state.cards[2].ch]);
      [0, 1].forEach(k => {
        let c, g = 0; do { c = randLetter(); } while (used.has(c) && g++ < 50);
        used.add(c); state.cards[k].ch = c; refreshCard(k);
      });
      SFX.score();
    }
    updateScorebarLive();
    flashButton(gold ? '#btn-golden' : '#btn-hit');
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
  function flashButton(sel) { const b = $(sel); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }

  // ---------- Timer ----------
  function fmt(s) { const m = Math.floor(s / 60); const r = s % 60; return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; }
  function updateTimerUI() {
    const num = $('#timer-num');
    num.textContent = fmt(Math.max(0, state.remaining));
    const warn = state.remaining <= 10;
    const fill = $('#timer-fill');
    fill.style.width = (Math.max(0, state.remaining / state.time) * 100) + '%';
    fill.classList.toggle('warn', warn);
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
    show('screen-result');
  }

  // ---------- Pausa ----------
  function openPause() { state.paused = true; SFX.music.stop(true); $('#modal-pause').classList.add('active'); }
  function closePause() { $('#modal-pause').classList.remove('active'); state.paused = false; }

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
    $('#btn-play').addEventListener('click', () => { SFX.unlock(); SFX.tap(); SFX.music.play('menu'); renderTeamNames(); updateSteppers(); show('screen-setup'); });
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
    // setup → juego
    $('#btn-back-menu').addEventListener('click', () => { SFX.tap(); show('screen-menu'); });
    $('#btn-start').addEventListener('click', () => startGame());
    // turno
    $('#btn-go').addEventListener('click', () => beginTurn());
    // acciones de juego
    $('#btn-hit').addEventListener('click', () => score(false));
    $('#btn-golden').addEventListener('click', () => score(true));
    $('#btn-pause').addEventListener('click', () => { SFX.tap(); openPause(); });
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
  }

  // ---------- Init ----------
  loadPrefs();
  applyI18n();
  updateSteppers();
  syncUiFromPrefs();
  bind();

  // ocultar el splash del DOM cuando acabe su animación de salida (~2.8s)
  const sp = $('#splash');
  if (sp) {
    sp.addEventListener('animationend', e => { if (e.animationName === 'splash-out') dismissSplash(); });
    setTimeout(dismissSplash, 2300); // respaldo por si el evento no salta
  }
})();
