import { CHARACTERS, getCharacter, ITEM_ICONS, ordinal, formatTime } from './characters.js';

export class InputController {
  constructor(onPause) {
    this.left = false;
    this.right = false;
    this.accelerate = false;
    this.brake = false;
    this.drift = false;
    this.itemQueued = false;
    this.autoAccelerate = matchMedia('(pointer: coarse)').matches;
    this.bindKeyboard(onPause);
    this.bindHold('steer-left', (active) => { this.left = active; });
    this.bindHold('steer-right', (active) => { this.right = active; });
    this.bindHold('drift-button', (active) => { this.drift = active; });
    const itemButton = document.querySelector('#item-button');
    itemButton?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.itemQueued = true;
      itemButton.classList.add('active');
    });
    const release = () => itemButton?.classList.remove('active');
    itemButton?.addEventListener('pointerup', release);
    itemButton?.addEventListener('pointercancel', release);
    document.querySelector('#pause-button')?.addEventListener('click', onPause);
  }

  sample() {
    const steer = this.left === this.right ? 0 : this.left ? -1 : 1;
    const result = {
      steer,
      throttle: this.autoAccelerate ? 1 : this.accelerate ? 1 : 0,
      brake: this.brake ? 1 : 0,
      drift: this.drift,
      useItem: this.itemQueued,
    };
    this.itemQueued = false;
    return result;
  }

  reset() {
    this.left = this.right = this.accelerate = this.brake = this.drift = this.itemQueued = false;
    document.querySelectorAll('.touch-button.active').forEach((button) => button.classList.remove('active'));
  }

  bindKeyboard(onPause) {
    const setKey = (key, active) => {
      if (['ArrowLeft', 'a', 'A'].includes(key)) this.left = active;
      else if (['ArrowRight', 'd', 'D'].includes(key)) this.right = active;
      else if (['ArrowUp', 'w', 'W'].includes(key)) this.accelerate = active;
      else if (['ArrowDown', 's', 'S'].includes(key)) this.brake = active;
      else if (key === 'Shift') this.drift = active;
      else if (key === ' ') { if (active) this.itemQueued = true; }
      else return false;
      return true;
    };
    addEventListener('keydown', (event) => {
      if (['Escape', 'p', 'P'].includes(event.key)) {
        if (!event.repeat) onPause();
        event.preventDefault();
      } else if (setKey(event.key, true)) event.preventDefault();
    });
    addEventListener('keyup', (event) => { if (setKey(event.key, false)) event.preventDefault(); });
    addEventListener('blur', () => this.reset());
  }

  bindHold(id, setter) {
    const button = document.querySelector(`#${id}`);
    if (!button) return;
    const down = (event) => {
      event.preventDefault();
      setter(true);
      button.classList.add('active');
      try { button.setPointerCapture(event.pointerId); } catch {}
    };
    const up = (event) => {
      event.preventDefault();
      setter(false);
      button.classList.remove('active');
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  }
}

export class GameUI {
  constructor(root, events) {
    this.root = root;
    this.events = events;
    this.selectedCharacterId = 'byte';
    this.messageTimer = 0;
    root.innerHTML = this.template();
    this.renderCharacters();
    this.bindEvents();
    this.showMenu();
  }

  element(id) {
    const element = this.root.querySelector(`#${id}`);
    if (!element) throw new Error(`Falta el elemento #${id}`);
    return element;
  }

  hideScreens() {
    this.root.querySelectorAll('.screen').forEach((screen) => screen.classList.add('hidden'));
  }

  showMenu() {
    this.hideScreens();
    this.element('menu-screen').classList.remove('hidden');
    for (const id of ['hud', 'mobile-controls', 'item-slot', 'race-board']) this.element(id).classList.add('hidden');
    this.element('countdown').textContent = '';
  }

  showRace() {
    this.hideScreens();
    for (const id of ['hud', 'mobile-controls', 'item-slot', 'race-board']) this.element(id).classList.remove('hidden');
  }

  showPause() { this.element('pause-screen').classList.remove('hidden'); }
  hidePause() { this.element('pause-screen').classList.add('hidden'); }
  showCountdown(value) { this.element('countdown').textContent = value; }

  showMessage(text, duration = 1.2) {
    const message = this.element('message');
    message.textContent = text;
    message.classList.add('show');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => message.classList.remove('show'), duration * 1000);
  }

  updateHUD(completedLaps, totalLaps, position, speed, item, standings) {
    this.element('lap-value').textContent = `${Math.min(totalLaps, completedLaps + 1)}/${totalLaps}`;
    this.element('position-value').textContent = ordinal(position);
    this.element('speed-value').textContent = `${Math.max(0, Math.round(speed * 5.2))} km/h`;
    const slot = this.element('item-slot');
    slot.textContent = item ? ITEM_ICONS[item] : '—';
    slot.classList.toggle('ready', Boolean(item));
    this.element('race-board').innerHTML = standings.map((standing, index) => `
      <div class="racer-row ${standing.isPlayer ? 'player' : ''}">
        <strong>${index + 1}</strong><span>${standing.emoji}</span><span class="name">${standing.name}</span>
      </div>`).join('');
  }

  showFinish(position, standings, raceTime) {
    this.hideScreens();
    for (const id of ['hud', 'mobile-controls', 'item-slot', 'race-board']) this.element(id).classList.add('hidden');
    this.element('finish-position').textContent = ordinal(position);
    this.element('finish-copy').textContent = `Tiempo: ${formatTime(raceTime)} · ${position <= 3 ? '¡Subiste al podio!' : 'La revancha te espera.'}`;
    this.element('podium').innerHTML = standings.slice(0, 3).map((standing, index) => `
      <div class="podium-card"><span>${standing.emoji}</span><strong>${index + 1}.º ${standing.name}</strong></div>`).join('');
    this.element('finish-screen').classList.remove('hidden');
  }

  renderCharacters() {
    const grid = this.element('character-grid');
    grid.innerHTML = CHARACTERS.map((character) => `
      <button class="character-card ${character.id === this.selectedCharacterId ? 'selected' : ''}" data-character="${character.id}" style="--accent:${character.accent}">
        <span class="character-face">${character.emoji}</span>
        <span class="character-name">${character.name}</span>
        <span class="character-role">${character.role}</span>
        <span class="stat-row">${Array.from({ length: 5 }, (_, index) => `<i class="stat-dot ${index < Math.round(character.maxSpeed * 4) ? 'on' : ''}"></i>`).join('')}</span>
      </button>`).join('');
    grid.querySelectorAll('.character-card').forEach((card) => card.addEventListener('click', () => {
      this.selectedCharacterId = getCharacter(card.dataset.character).id;
      grid.querySelectorAll('.character-card').forEach((item) => item.classList.remove('selected'));
      card.classList.add('selected');
    }));
  }

  bindEvents() {
    this.element('start-race').addEventListener('click', () => this.events.onStart(this.selectedCharacterId));
    this.element('resume-race').addEventListener('click', this.events.onResume);
    this.element('restart-race').addEventListener('click', this.events.onRestart);
    this.element('finish-restart').addEventListener('click', this.events.onRestart);
    this.element('pause-menu').addEventListener('click', this.events.onMenu);
    this.element('finish-menu').addEventListener('click', this.events.onMenu);
    this.element('fullscreen-button').addEventListener('click', () => document.documentElement.requestFullscreen?.());
  }

  template() {
    return `
      <section id="menu-screen" class="screen">
        <div class="menu-card">
          <h1 class="brand">Turbo <span>Circuit 3D</span></h1>
          <p class="menu-copy">Carrera arcade 3D contra siete rivales. Derrapa para cargar mini-turbos, recoge objetos y completa tres vueltas antes que los demás.</p>
          <h2 class="section-title">Elige tu personaje</h2>
          <div id="character-grid" class="character-grid"></div>
          <div class="menu-actions">
            <button id="start-race" class="primary-button">Iniciar Gran Premio</button>
            <button id="fullscreen-button" class="secondary-button">Pantalla completa</button>
          </div>
          <div class="hint-row">
            <span class="key-hint">Móvil: aceleración automática</span><span class="key-hint">WASD o flechas</span><span class="key-hint">Shift: derrape</span><span class="key-hint">Espacio: objeto</span>
          </div>
        </div>
      </section>
      <div id="hud" class="hidden">
        <div class="hud-panel"><span class="hud-label">Vuelta</span><span id="lap-value" class="hud-value">1/3</span></div>
        <button id="pause-button" aria-label="Pausar">⏸</button>
        <div class="hud-panel right"><span class="hud-label">Posición</span><span id="position-value" class="hud-value">1.º</span></div>
        <div class="hud-panel"><span class="hud-label">Velocidad</span><span id="speed-value" class="hud-value">0 km/h</span></div>
      </div>
      <div id="item-slot" class="hidden">—</div><div id="race-board" class="hidden"></div><div id="countdown"></div><div id="message"></div>
      <div id="mobile-controls" class="hidden">
        <div class="control-cluster"><button id="steer-left" class="touch-button">‹</button><button id="steer-right" class="touch-button">›</button></div>
        <div class="control-cluster actions"><button id="drift-button" class="touch-button small">〰</button><button id="item-button" class="touch-button small">🎁</button></div>
      </div>
      <section id="pause-screen" class="screen hidden"><div class="menu-card" style="max-width:440px;text-align:center">
        <h2 class="finish-title">Pausa</h2><p class="menu-copy">La carrera está detenida.</p>
        <button id="resume-race" class="primary-button" style="width:100%">Continuar</button>
        <button id="restart-race" class="secondary-button" style="width:100%;margin-top:10px">Reiniciar</button>
        <button id="pause-menu" class="secondary-button" style="width:100%;margin-top:10px">Elegir personaje</button>
      </div></section>
      <section id="finish-screen" class="screen hidden"><div class="menu-card" style="max-width:620px">
        <h2 class="finish-title">Carrera terminada</h2><div id="finish-position" class="finish-position">1.º</div><p id="finish-copy" class="finish-copy"></p><div id="podium" class="podium"></div>
        <div class="menu-actions"><button id="finish-restart" class="primary-button">Correr de nuevo</button><button id="finish-menu" class="secondary-button">Personajes</button></div>
      </div></section>`;
  }
}
