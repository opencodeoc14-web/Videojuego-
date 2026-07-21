'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const livesEl = document.getElementById('lives');
  const boostFill = document.getElementById('boostFill');
  const toast = document.getElementById('toast');

  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const resultEl = document.getElementById('result');

  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const state = {
    running: false,
    paused: false,
    over: false,
    lastTime: 0,
    time: 0,
    score: 0,
    best: Number(localStorage.getItem('turboCalleBest') || 0),
    lives: 3,
    roadOffset: 0,
    spawnTimer: 0,
    coinTimer: 0,
    difficulty: 1,
    shake: 0,
    flash: 0,
    boost: 1,
    boosting: false,
    audioReady: false,
    muted: false
  };

  bestEl.textContent = state.best.toLocaleString('es-CO');

  const input = {
    left: false,
    right: false,
    keyboardLeft: false,
    keyboardRight: false
  };

  let W = 0;
  let H = 0;
  let DPR = 1;
  let road = { x: 0, width: 0, laneWidth: 0 };
  let obstacles = [];
  let coins = [];
  let particles = [];
  let audioCtx = null;

  const player = {
    x: 0,
    y: 0,
    width: 46,
    height: 82,
    vx: 0,
    invulnerable: 0
  };

  const carPalettes = [
    ['#ff5d73', '#8e2443'],
    ['#4cc9f0', '#17647a'],
    ['#ffd166', '#8a6422'],
    ['#9b5de5', '#4d2873'],
    ['#f15bb5', '#7e285e'],
    ['#56e39f', '#257956']
  ];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    road.width = Math.min(W * 0.78, 430);
    road.x = (W - road.width) / 2;
    road.laneWidth = road.width / 3;

    player.width = Math.max(40, Math.min(52, W * 0.12));
    player.height = player.width * 1.76;
    player.y = H - Math.max(185, H * 0.25) - player.height * 0.25;

    if (!state.running && !state.over) {
      player.x = W / 2 - player.width / 2;
    } else {
      player.x = clamp(player.x, road.x + 8, road.x + road.width - player.width - 8);
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#16213a');
    sky.addColorStop(0.45, '#11192c');
    sky.addColorStop(1, '#080d18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const cityY = H * 0.20;
    ctx.fillStyle = '#0b1020';
    const unit = Math.max(28, W / 12);
    for (let i = -1; i < W / unit + 2; i++) {
      const x = i * unit;
      const n = ((i * 37) % 5 + 5) % 5;
      const bh = 35 + n * 13;
      ctx.fillRect(x, cityY - bh, unit - 4, bh);
      ctx.fillStyle = 'rgba(255,209,102,.16)';
      for (let wy = cityY - bh + 9; wy < cityY - 6; wy += 14) {
        for (let wx = x + 7; wx < x + unit - 8; wx += 12) {
          if (((wx + wy + i) | 0) % 3 === 0) ctx.fillRect(wx, wy, 4, 6);
        }
      }
      ctx.fillStyle = '#0b1020';
    }

    const grassGradient = ctx.createLinearGradient(0, cityY, 0, H);
    grassGradient.addColorStop(0, '#132a2a');
    grassGradient.addColorStop(1, '#0c1717');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, cityY, W, H - cityY);

    for (let i = 0; i < 16; i++) {
      const y = ((i * 91 + state.roadOffset * 0.28) % (H + 100)) - 50;
      const side = i % 2;
      const x = side ? road.x + road.width + 18 + (i % 3) * 18 : road.x - 28 - (i % 3) * 18;
      ctx.fillStyle = i % 3 ? '#173c31' : '#1d4b3d';
      ctx.beginPath();
      ctx.arc(x, y, 13 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d201b';
      ctx.fillRect(x - 2, y + 10, 4, 16);
    }
  }

  function drawRoad() {
    ctx.fillStyle = '#202633';
    ctx.fillRect(road.x, 0, road.width, H);

    const edgeWidth = 8;
    ctx.fillStyle = '#d9e1ea';
    ctx.fillRect(road.x, 0, edgeWidth, H);
    ctx.fillRect(road.x + road.width - edgeWidth, 0, edgeWidth, H);

    const segment = 34;
    for (let y = -segment + (state.roadOffset % segment); y < H; y += segment) {
      ctx.fillStyle = (Math.floor((y - state.roadOffset) / segment) % 2 === 0) ? '#ff5d73' : '#f4f7fb';
      ctx.fillRect(road.x, y, edgeWidth, segment / 2);
      ctx.fillRect(road.x + road.width - edgeWidth, y, edgeWidth, segment / 2);
    }

    ctx.strokeStyle = 'rgba(255,255,255,.78)';
    ctx.lineWidth = Math.max(3, road.width * 0.012);
    ctx.setLineDash([32, 28]);
    ctx.lineDashOffset = state.roadOffset;
    for (let lane = 1; lane < 3; lane++) {
      const lx = road.x + lane * road.laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const glow = ctx.createLinearGradient(road.x, 0, road.x + road.width, 0);
    glow.addColorStop(0, 'rgba(255,255,255,.035)');
    glow.addColorStop(.5, 'rgba(255,255,255,.005)');
    glow.addColorStop(1, 'rgba(255,255,255,.035)');
    ctx.fillStyle = glow;
    ctx.fillRect(road.x, 0, road.width, H);
  }

  function drawCar(x, y, w, h, colors, playerCar = false, invulnerable = false) {
    ctx.save();

    if (invulnerable && Math.floor(state.time * 14) % 2 === 0) {
      ctx.globalAlpha = .28;
    }

    ctx.shadowColor = 'rgba(0,0,0,.42)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    roundedRect(x, y, w, h, w * .22);
    ctx.fillStyle = colors[1];
    ctx.fill();

    ctx.shadowColor = colors[0];
    ctx.shadowBlur = playerCar && state.boosting ? 24 : 8;
    ctx.shadowOffsetY = 0;
    roundedRect(x + w * .08, y + h * .04, w * .84, h * .89, w * .19);
    ctx.fillStyle = colors[0];
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#0c1422';
    roundedRect(x + w * .19, y + h * .17, w * .62, h * .23, w * .1);
    ctx.fill();

    const glass = ctx.createLinearGradient(0, y + h * .17, 0, y + h * .40);
    glass.addColorStop(0, '#bff4ff');
    glass.addColorStop(1, '#27647a');
    ctx.fillStyle = glass;
    roundedRect(x + w * .23, y + h * .20, w * .54, h * .16, w * .07);
    ctx.fill();

    ctx.fillStyle = '#0b1020';
    roundedRect(x + w * .20, y + h * .50, w * .60, h * .21, w * .08);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,.18)';
    roundedRect(x + w * .45, y + h * .08, w * .10, h * .68, w * .04);
    ctx.fill();

    ctx.fillStyle = '#edfaff';
    roundedRect(x + w * .15, y + h * .08, w * .18, h * .07, 3);
    ctx.fill();
    roundedRect(x + w * .67, y + h * .08, w * .18, h * .07, 3);
    ctx.fill();

    ctx.fillStyle = '#ff3b30';
    roundedRect(x + w * .14, y + h * .83, w * .20, h * .06, 3);
    ctx.fill();
    roundedRect(x + w * .66, y + h * .83, w * .20, h * .06, 3);
    ctx.fill();

    ctx.fillStyle = '#05070d';
    ctx.fillRect(x - w * .06, y + h * .18, w * .10, h * .23);
    ctx.fillRect(x + w * .96, y + h * .18, w * .10, h * .23);
    ctx.fillRect(x - w * .06, y + h * .60, w * .10, h * .23);
    ctx.fillRect(x + w * .96, y + h * .60, w * .10, h * .23);

    if (playerCar && state.boosting) {
      const flameH = 22 + Math.sin(state.time * 30) * 6;
      const flame = ctx.createLinearGradient(0, y + h, 0, y + h + flameH);
      flame.addColorStop(0, '#ffffff');
      flame.addColorStop(.35, '#4cc9f0');
      flame.addColorStop(1, 'rgba(76,201,240,0)');
      ctx.fillStyle = flame;

      ctx.beginPath();
      ctx.moveTo(x + w * .28, y + h * .88);
      ctx.lineTo(x + w * .42, y + h + flameH);
      ctx.lineTo(x + w * .48, y + h * .88);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + w * .52, y + h * .88);
      ctx.lineTo(x + w * .58, y + h + flameH);
      ctx.lineTo(x + w * .72, y + h * .88);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawCoin(coin) {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    const squash = .55 + Math.abs(Math.sin(coin.spin)) * .45;
    ctx.scale(squash, 1);

    ctx.shadowColor = 'rgba(255,209,102,.75)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff1b6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r * .66, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#8a6422';
    ctx.font = `900 ${coin.r * 1.15}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow || 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
