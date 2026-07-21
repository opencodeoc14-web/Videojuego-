'use strict';
  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const w = player.width * (0.92 + Math.random() * .10);
    const h = w * (1.60 + Math.random() * .18);
    const x = road.x + lane * road.laneWidth + (road.laneWidth - w) / 2;
    const palette = carPalettes[Math.floor(Math.random() * carPalettes.length)];

    const tooClose = obstacles.some(o => o.lane === lane && o.y < h * 2.2);
    if (!tooClose) {
      obstacles.push({
        x, y: -h - 20, width: w, height: h, lane,
        speed: 40 + Math.random() * 75,
        colors: palette,
        passed: false
      });
    }
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    const r = Math.max(11, player.width * .23);
    coins.push({
      x: road.x + lane * road.laneWidth + road.laneWidth / 2,
      y: -r * 2,
      r,
      lane,
      spin: Math.random() * Math.PI,
      speed: 25 + Math.random() * 40
    });
  }

  function rectsOverlap(a, b, paddingA = 0, paddingB = 0) {
    return (
      a.x + paddingA < b.x + b.width - paddingB &&
      a.x + a.width - paddingA > b.x + paddingB &&
      a.y + paddingA < b.y + b.height - paddingB &&
      a.y + a.height - paddingA > b.y + paddingB
    );
  }

  function circleRectOverlap(circle, rect) {
    const cx = clamp(circle.x, rect.x, rect.x + rect.width);
    const cy = clamp(circle.y, rect.y, rect.y + rect.height);
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function burst(x, y, color, count = 18, force = 140) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * force;
      const life = .35 + Math.random() * .55;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 2 + Math.random() * 4,
        color,
        glow: 8
      });
    }
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 800);
  }

  function initAudio() {
    if (state.audioReady) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    state.audioReady = true;
  }

  function beep(freq = 440, duration = .08, type = 'sine', volume = .06, slide = 0) {
    if (!audioCtx || state.muted) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function vibrate(pattern) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }

  function resetGame() {
    obstacles = [];
    coins = [];
    particles = [];
    state.running = true;
    state.paused = false;
    state.over = false;
    state.lastTime = performance.now();
    state.time = 0;
    state.score = 0;
    state.lives = 3;
    state.roadOffset = 0;
    state.spawnTimer = .65;
    state.coinTimer = 1.2;
    state.difficulty = 1;
    state.shake = 0;
    state.flash = 0;
    state.boost = 1;
    state.boosting = false;
    player.x = W / 2 - player.width / 2;
    player.vx = 0;
    player.invulnerable = 0;
    updateHUD();
    startOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseBtn.textContent = '⏸';
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    beep(220, .11, 'square', .045, 180);
  }

  function pauseGame() {
    if (!state.running || state.over) return;
    state.paused = true;
    pauseOverlay.classList.remove('hidden');
    pauseBtn.textContent = '▶';
    input.left = input.right = false;
    setButtonState(leftBtn, false);
    setButtonState(rightBtn, false);
  }

  function resumeGame() {
    if (!state.running || state.over) return;
    state.paused = false;
    state.lastTime = performance.now();
    pauseOverlay.classList.add('hidden');
    pauseBtn.textContent = '⏸';
  }

  function endGame() {
    state.running = false;
    state.over = true;
    state.boosting = false;

    const finalScore = Math.floor(state.score);
    if (finalScore > state.best) {
      state.best = finalScore;
      localStorage.setItem('turboCalleBest', String(state.best));
      bestEl.textContent = state.best.toLocaleString('es-CO');
      resultEl.innerHTML = `Nuevo récord: <strong>${finalScore.toLocaleString('es-CO')}</strong>`;
    } else {
      resultEl.innerHTML = `Puntos: <strong>${finalScore.toLocaleString('es-CO')}</strong>`;
    }

    gameOverOverlay.classList.remove('hidden');
    beep(160, .25, 'sawtooth', .05, -100);
    vibrate([80, 50, 120]);
  }

  function updateHUD() {
    scoreEl.textContent = Math.floor(state.score).toLocaleString('es-CO');
    livesEl.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(Math.max(0, 3 - state.lives));
    boostFill.style.transform = `scaleX(${clamp(state.boost, 0, 1)})`;
  }
