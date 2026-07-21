'use strict';
  function update(dt) {
    state.time += dt;
    state.difficulty = 1 + Math.min(2.2, state.time / 42);
    const baseSpeed = 290 + state.difficulty * 55;
    const bothPressed = (input.left || input.keyboardLeft) && (input.right || input.keyboardRight);

    if (bothPressed && state.boost > .03) {
      state.boosting = true;
      state.boost = Math.max(0, state.boost - dt * .28);
    } else {
      state.boosting = false;
      state.boost = Math.min(1, state.boost + dt * .12);
    }

    const worldSpeed = baseSpeed * (state.boosting ? 1.48 : 1);
    state.roadOffset = (state.roadOffset + worldSpeed * dt) % 62;
    state.score += dt * (13 + state.difficulty * 3) * (state.boosting ? 1.75 : 1);

    const left = input.left || input.keyboardLeft;
    const right = input.right || input.keyboardRight;
    const desired = left === right ? 0 : left ? -1 : 1;

    const accel = 1650;
    const maxSpeed = Math.max(300, road.laneWidth * 4.3);
    player.vx += desired * accel * dt;
    player.vx *= Math.pow(.0009, dt);
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    player.x += player.vx * dt;
    player.x = clamp(player.x, road.x + 10, road.x + road.width - player.width - 10);

    player.invulnerable = Math.max(0, player.invulnerable - dt);
    state.shake = Math.max(0, state.shake - dt * 5.5);
    state.flash = Math.max(0, state.flash - dt * 3.8);

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObstacle();
      const minGap = Math.max(.46, .95 - state.difficulty * .13);
      state.spawnTimer = minGap + Math.random() * .52;
    }

    state.coinTimer -= dt;
    if (state.coinTimer <= 0) {
      spawnCoin();
      state.coinTimer = 1.05 + Math.random() * 1.25;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += (worldSpeed + o.speed) * dt;

      if (!o.passed && o.y > player.y + player.height) {
        o.passed = true;
        state.score += 18;
      }

      if (player.invulnerable <= 0 && rectsOverlap(player, o, player.width * .12, o.width * .10)) {
        obstacles.splice(i, 1);
        state.lives--;
        player.invulnerable = 1.45;
        state.shake = 1;
        state.flash = 1;
        burst(player.x + player.width / 2, player.y + player.height / 2, '#ff5d73', 28, 220);
        beep(95, .18, 'sawtooth', .08, -45);
        vibrate([70, 40, 70]);

        if (state.lives <= 0) {
          updateHUD();
          endGame();
          return;
        } else {
          showToast('¡Choque!');
        }
      } else if (o.y > H + o.height + 40) {
        obstacles.splice(i, 1);
      }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.y += (worldSpeed + c.speed) * dt;
      c.spin += dt * 7;

      if (circleRectOverlap(c, player)) {
        coins.splice(i, 1);
        state.score += 100;
        state.boost = Math.min(1, state.boost + .18);
        burst(c.x, c.y, '#ffd166', 16, 115);
        beep(720, .09, 'square', .045, 220);
        vibrate(20);
        showToast('+100');
      } else if (c.y > H + c.r * 2) {
        coins.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(.12, dt);
      p.vy *= Math.pow(.12, dt);
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (state.boosting && Math.random() < dt * 24) {
      const life = .25 + Math.random() * .22;
      particles.push({
        x: player.x + player.width * (.25 + Math.random() * .5),
        y: player.y + player.height,
        vx: (Math.random() - .5) * 30,
        vy: 90 + Math.random() * 80,
        life,
        maxLife: life,
        size: 2 + Math.random() * 3,
        color: Math.random() > .5 ? '#4cc9f0' : '#56e39f',
        glow: 8
      });
    }

    updateHUD();
  }

  function draw() {
    ctx.save();

    if (state.shake > 0) {
      const strength = state.shake * 8;
      ctx.translate((Math.random() - .5) * strength, (Math.random() - .5) * strength);
    }

    drawBackground();
    drawRoad();

    for (const c of coins) drawCoin(c);
    for (const o of obstacles) drawCar(o.x, o.y, o.width, o.height, o.colors, false, false);
    drawParticles();
    drawCar(player.x, player.y, player.width, player.height, ['#56e39f', '#1c7250'], true, player.invulnerable > 0);

    if (state.boosting) {
      ctx.fillStyle = 'rgba(76,201,240,.045)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(200,250,255,.24)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const x = (i * 83 + state.time * 170) % W;
        const y = (i * 127 + state.time * 650) % H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 38 + (i % 4) * 12);
        ctx.stroke();
      }
    }

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,93,115,${state.flash * .27})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function loop(timestamp) {
    requestAnimationFrame(loop);

    if (!state.lastTime) state.lastTime = timestamp;
    let dt = Math.min(.033, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;

    if (state.running && !state.paused && !state.over) {
      update(dt);
    }

    draw();
  }

  function setButtonState(button, active) {
    button.classList.toggle('active', active);
  }

  function bindHold(button, direction) {
    const down = (e) => {
      e.preventDefault();
      initAudio();
      input[direction] = true;
      setButtonState(button, true);
      try { button.setPointerCapture(e.pointerId); } catch (_) {}
    };

    const up = (e) => {
      e.preventDefault();
      input[direction] = false;
      setButtonState(button, false);
    };

    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  }

  bindHold(leftBtn, 'left');
  bindHold(rightBtn, 'right');

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.keyboardLeft = true;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) input.keyboardRight = true;
    if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      state.paused ? resumeGame() : pauseGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.keyboardLeft = false;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) input.keyboardRight = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.running && !state.paused && !state.over) pauseGame();
  });

  document.getElementById('startBtn').addEventListener('click', resetGame);
  document.getElementById('restartBtn').addEventListener('click', resetGame);
  document.getElementById('restartFromPauseBtn').addEventListener('click', resetGame);
  document.getElementById('resumeBtn').addEventListener('click', resumeGame);

  pauseBtn.addEventListener('click', () => {
    if (!state.running || state.over) return;
    state.paused ? resumeGame() : pauseGame();
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  requestAnimationFrame(loop);
