import { CHARACTERS, getCharacter } from './characters';
import { formatTime, ordinal } from './math';
import type { ItemKind, RaceStanding } from './types';

interface UIEvents {
  onStart: (characterId: string) => void;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

const ITEM_ICONS: Record<ItemKind, string> = {
  nitro: '⚡',
  rocket: '🚀',
  shield: '🛡️',
  trap: '🍌',
};

export class GameUI {
  readonly root: HTMLElement;
  selectedCharacterId = 'byte';

  private readonly events: UIEvents;
  private messageTimer = 0;

  constructor(root: HTMLElement, events: UIEvents) {
    this.root = root;
    this.events = events;
    this.root.innerHTML = this.template();
    this.renderCharacters();
    this.bindEvents();
    this.showMenu();
  }

  showMenu(): void {
    this.hideAllScreens();
    this.element('menu-screen').classList.remove('hidden');
    this.element('hud').classList.add('hidden');
    this.element('mobile-controls').classList.add('hidden');
    this.element('item-slot').classList.add('hidden');
    this.element('race-board').classList.add('hidden');
    this.element('countdown').textContent = '';
  }

  showRace(): void {
    this.hideAllScreens();
    this.element('hud').classList.remove('hidden');
    this.element('mobile-controls').classList.remove('hidden');
    this.element('item-slot').classList.remove('hidden');
    this.element('race-board').classList.remove('hidden');
  }

  showPause(): void {
    this.element('pause-screen').classList.remove('hidden');
  }

  hidePause(): void {
    this.element('pause-screen').classList.add('hidden');
  }

  showCountdown(value: string): void {
    this.element('countdown').textContent = value;
  }

  showMessage(text: string, duration = 1.2): void {
    const message = this.element('message');
    message.textContent = text;
    message.classList.add('show');
    window.clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => message.classList.remove('show'), duration * 1000);
  }

  updateHUD(
    completedLaps: number,
    totalLaps: number,
    position: number,
    speed: number,
    item: ItemKind | null,
    standings: readonly RaceStanding[],
  ): void {
    const currentLap = Math.min(totalLaps, completedLaps + 1);
    this.element('lap-value').textContent = `${currentLap}/${totalLaps}`;
    this.element('position-value').textContent = ordinal(position);
    this.element('speed-value').textContent = `${Math.max(0, Math.round(speed * 5.2))} km/h`;

    const slot = this.element('item-slot');
    slot.textContent = item ? ITEM_ICONS[item] : '—';
    slot.classList.toggle('ready', item !== null);

    this.element('race-board').innerHTML = standings.map((standing, index) => `
      <div class="racer-row ${standing.isPlayer ? 'player' : ''}">
        <strong>${index + 1}</strong>
        <span>${standing.emoji}</span>
        <span class="name">${standing.name}</span>
      </div>
    `).join('');
  }

  showFinish(position: number, standings: readonly RaceStanding[], raceTime: number): void {
    this.hideAllScreens();
    this.element('hud').classList.add('hidden');
    this.element('mobile-controls').classList.add('hidden');
    this.element('item-slot').classList.add('hidden');
    this.element('race-board').classList.add('hidden');

    this.element('finish-position').textContent = ordinal(position);
    this.element('finish-copy').textContent = `Tiempo: ${formatTime(raceTime)} · ${position <= 3 ? '¡Subiste al podio!' : 'La revancha te espera.'}`;
    this.element('podium').innerHTML = standings.slice(0, 3).map((standing, index) => `
      <div class="podium-card">
        <span>${standing.emoji}</span>
        <strong>${index + 1}.º ${standing.name}</strong>
      </div>
    `).join('');
    this.element('finish-screen').classList.remove('hidden');
  }

  private bindEvents(): void {
    this.element<HTMLButtonElement>('start-race').addEventListener('click', () => {
      this.events.onStart(this.selectedCharacterId);
    });
    this.element<HTMLButtonElement>('resume-race').addEventListener('click', this.events.onResume);
    this.element<HTMLButtonElement>('restart-race').addEventListener('click', this.events.onRestart);
    this.element<HTMLButtonElement>('finish-restart').addEventListener('click', this.events.onRestart);
    this.element<HTMLButtonElement>('pause-menu').addEventListener('click', this.events.onMenu);
    this.element<HTMLButtonElement>('finish-menu').addEventListener('click', this.events.onMenu);
  }

  private renderCharacters(): void {
    const grid = this.element('character-grid');
    grid.innerHTML = CHARACTERS.map((character) => {
      const speedDots = Math.round(character.maxSpeed * 4);
      return `
        <button class="character-card ${character.id === this.selectedCharacterId ? 'selected' : ''}"
          data-character="${character.id}" style="--accent:${character.accent}">
          <span class="character-face">${character.emoji}</span>
          <span class="character-name">${character.name}</span>
          <span class="character-role">${character.role}</span>
          <span class="stat-row" aria-label="Velocidad">
            ${Array.from({ length: 5 }, (_, index) => `<i class="stat-dot ${index < speedDots ? 'on' : ''}"></i>`).join('')}
          </span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll<HTMLButtonElement>('.character-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.character;
        if (!id) return;
        this.selectedCharacterId = getCharacter(id).id;
        grid.querySelectorAll('.character-card').forEach((element) => element.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }

  private hideAllScreens(): void {
    this.root.querySelectorAll('.screen').forEach((screen) => screen.classList.add('hidden'));
  }

  private element<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = this.root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(`Falta el elemento #${id}`);
    return element;
  }

  private template(): string {
    return `
      <section id="menu-screen" class="screen">
        <div class="menu-card">
          <h1 class="brand">Turbo <span>Circuit 3D</span></h1>
          <p class="menu-copy">
            Carrera arcade en 3D contra siete rivales. Derrapa para cargar mini-turbos,
            recoge objetos y completa tres vueltas antes que los demás.
          </p>
          <h2 class="section-title">Elige tu personaje</h2>
          <div id="character-grid" class="character-grid"></div>
          <div class="menu-actions">
            <button id="start-race" class="primary-button">Iniciar Gran Premio</button>
            <button class="secondary-button" type="button" onclick="document.documentElement.requestFullscreen?.()">Pantalla completa</button>
          </div>
          <div class="hint-row">
            <span class="key-hint">Móvil: conducción automática</span>
            <span class="key-hint">Teclado: WASD o flechas</span>
            <span class="key-hint">Shift: derrape</span>
            <span class="key-hint">Espacio: objeto</span>
          </div>
        </div>
      </section>

      <div id="hud" class="hidden">
        <div class="hud-panel">
          <span class="hud-label">Vuelta</span>
          <span id="lap-value" class="hud-value">1/3</span>
        </div>
        <button id="pause-button" aria-label="Pausar">⏸</button>
        <div class="hud-panel right">
          <span class="hud-label">Posición</span>
          <span id="position-value" class="hud-value">1.º</span>
        </div>
        <div class="hud-panel">
          <span class="hud-label">Velocidad</span>
          <span id="speed-value" class="hud-value">0 km/h</span>
        </div>
      </div>

      <div id="item-slot" class="hidden" aria-label="Objeto disponible">—</div>
      <div id="race-board" class="hidden"></div>
      <div id="countdown"></div>
      <div id="message"></div>

      <div id="mobile-controls" class="hidden">
        <div class="control-cluster">
          <button id="steer-left" class="touch-button" aria-label="Girar a la izquierda">‹</button>
          <button id="steer-right" class="touch-button" aria-label="Girar a la derecha">›</button>
        </div>
        <div class="control-cluster actions">
          <button id="drift-button" class="touch-button small" aria-label="Derrapar">〰</button>
          <button id="item-button" class="touch-button small" aria-label="Usar objeto">🎁</button>
        </div>
      </div>

      <section id="pause-screen" class="screen hidden">
        <div class="menu-card" style="max-width:440px;text-align:center">
          <h2 class="finish-title">Pausa</h2>
          <p class="menu-copy">La carrera está detenida.</p>
          <button id="resume-race" class="primary-button" style="width:100%">Continuar</button>
          <button id="restart-race" class="secondary-button" style="width:100%;margin-top:10px">Reiniciar</button>
          <button id="pause-menu" class="secondary-button" style="width:100%;margin-top:10px">Elegir personaje</button>
        </div>
      </section>

      <section id="finish-screen" class="screen hidden">
        <div class="menu-card" style="max-width:620px">
          <h2 class="finish-title">Carrera terminada</h2>
          <div id="finish-position" class="finish-position">1.º</div>
          <p id="finish-copy" class="finish-copy"></p>
          <div id="podium" class="podium"></div>
          <div class="menu-actions">
            <button id="finish-restart" class="primary-button">Correr de nuevo</button>
            <button id="finish-menu" class="secondary-button">Personajes</button>
          </div>
        </div>
      </section>
    `;
  }
}
