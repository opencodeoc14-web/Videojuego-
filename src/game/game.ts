import * as THREE from 'three';
import { AIController } from './ai';
import { CHARACTERS, getCharacter } from './characters';
import { InputController } from './input';
import { ItemSystem } from './items';
import { Kart } from './kart';
import { damp } from './math';
import { RaceTrack } from './track';
import type { DriverInput, RaceStanding } from './types';
import { GameUI } from './ui';
import { RaceWorld } from './world';

type GameState = 'menu' | 'countdown' | 'racing' | 'paused' | 'finished';

const TOTAL_LAPS = 3;
const RACER_COUNT = 8;
const ZERO_INPUT: DriverInput = { steer: 0, throttle: 0, brake: 0, drift: false, useItem: false };

export class TurboCircuitGame {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(64, 1, 0.1, 260);
  private readonly track = new RaceTrack();
  private readonly world: RaceWorld;
  private readonly ui: GameUI;
  private readonly input: InputController;
  private readonly cameraTarget = new THREE.Vector3();
  private readonly cameraLook = new THREE.Vector3();

  private state: GameState = 'menu';
  private stateBeforePause: GameState = 'racing';
  private karts: Kart[] = [];
  private player: Kart | null = null;
  private aiControllers = new Map<Kart, AIController>();
  private itemSystem: ItemSystem | null = null;
  private standings: Kart[] = [];
  private selectedCharacterId = 'byte';
  private countdown = 0;
  private raceTime = 0;
  private previousTimestamp = performance.now();
  private finishShown = false;
  private audioContext: AudioContext | null = null;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene.add(this.track.group);
    this.world = new RaceWorld(this.scene, this.track);

    this.ui = new GameUI(uiRoot, {
      onStart: (characterId) => this.startRace(characterId),
      onResume: () => this.resume(),
      onRestart: () => this.startRace(this.selectedCharacterId),
      onMenu: () => this.backToMenu(),
    });
    this.input = new InputController({ onPause: () => this.togglePause() });

    this.camera.position.set(0, 40, 58);
    this.camera.lookAt(0, 0, 0);
    this.resize();

    window.addEventListener('resize', () => this.resize(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && (this.state === 'racing' || this.state === 'countdown')) this.pause();
    });

    this.renderer.setAnimationLoop((timestamp) => this.frame(timestamp));
  }

  private startRace(characterId: string): void {
    this.ensureAudio();
    this.clearRace();
    this.selectedCharacterId = getCharacter(characterId).id;
    this.raceTime = 0;
    this.countdown = 3.7;
    this.finishShown = false;
    this.state = 'countdown';

    this.createRacers();
    this.itemSystem = new ItemSystem(this.track, {
      onPlayerMessage: (message) => {
        this.ui.showMessage(message);
        this.beep(620, 0.08, 100);
      },
    });
    this.scene.add(this.itemSystem.group);

    this.ui.showRace();
    this.ui.showCountdown('3');
    this.input.reset();
    this.snapCameraToPlayer();
    this.beep(330, 0.09);
  }

  private createRacers(): void {
    const selected = getCharacter(this.selectedCharacterId);
    const opponents = CHARACTERS.filter((character) => character.id !== selected.id);
    const orderedCharacters = [
      opponents[0]!,
      opponents[1]!,
      opponents[2]!,
      selected,
      opponents[3]!,
      opponents[4]!,
      opponents[5]!,
      opponents[6]!,
    ];

    for (let slot = 0; slot < RACER_COUNT; slot += 1) {
      const character = orderedCharacters[slot]!;
      const isPlayer = character.id === selected.id;
      const kart = new Kart(isPlayer ? 'player' : `cpu-${slot}`, character, isPlayer);
      const row = Math.floor(slot / 2);
      const side = slot % 2 === 0 ? -2.4 : 2.4;
      const progress = 0.043 - row * 0.012;
      kart.place(this.track, progress, side);
      this.karts.push(kart);
      this.scene.add(kart.group);

      if (isPlayer) {
        this.player = kart;
      } else {
        const skill = 0.93 + (slot % 4) * 0.025 + Math.random() * 0.025;
        this.aiControllers.set(kart, new AIController(kart, side * 0.55, skill));
      }
    }
    this.standings = this.sortKarts();
  }

  private frame(timestamp: number): void {
    const delta = Math.min(0.035, Math.max(0, (timestamp - this.previousTimestamp) / 1000));
    this.previousTimestamp = timestamp;
    this.world.update(timestamp);

    if (this.state !== 'paused') {
      if (this.state === 'menu') this.updateMenuCamera(timestamp, delta);
      if (this.state === 'countdown' || this.state === 'racing') this.updateRace(delta);
      if (this.state === 'finished') this.updateFinished(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateRace(delta: number): void {
    const player = this.player;
    if (!player) return;

    let canDrive = this.state === 'racing';
    if (this.state === 'countdown') {
      this.countdown -= delta;
      if (this.countdown > 0) {
        const digit = Math.ceil(this.countdown);
        this.ui.showCountdown(String(digit));
      } else {
        canDrive = true;
        this.raceTime += delta;
        if (this.countdown > -0.8) {
          this.ui.showCountdown('¡YA!');
          if (this.countdown + delta > 0) {
            this.beep(600, 0.18, 320);
            this.vibrate(45);
          }
        } else {
          this.ui.showCountdown('');
          this.state = 'racing';
        }
      }
    } else {
      this.raceTime += delta;
    }

    const preUpdateStandings = this.sortKarts();
    const playerInput = canDrive && !player.finished ? this.input.sample() : ZERO_INPUT;
    player.update(playerInput, this.track, delta, canDrive && !player.finished);
    if (playerInput.useItem) this.itemSystem?.activate(player, this.karts);

    for (const kart of this.karts) {
      if (kart.isPlayer) continue;
      const controller = this.aiControllers.get(kart);
      const rank = preUpdateStandings.indexOf(kart) + 1;
      const aiInput = controller && !kart.finished
        ? controller.sample(this.track, delta, rank, this.karts.length)
        : ZERO_INPUT;
      kart.update(aiInput, this.track, delta, canDrive && !kart.finished);
      if (aiInput.useItem) this.itemSystem?.activate(kart, this.karts);
    }

    this.resolveKartCollisions();
    this.standings = this.sortKarts();
    this.itemSystem?.update(delta, this.karts, this.standings);
    this.checkFinishes();
    this.updateCamera(player, delta);

    const currentStandings = this.toStandings(this.standings);
    const position = this.standings.indexOf(player) + 1;
    this.ui.updateHUD(
      player.completedLaps,
      TOTAL_LAPS,
      position,
      player.speed,
      player.item,
      currentStandings,
    );
  }

  private checkFinishes(): void {
    for (const kart of this.karts) {
      if (!kart.finished && kart.completedLaps >= TOTAL_LAPS) {
        kart.finished = true;
        kart.finishTime = this.raceTime;
        kart.item = null;
        if (kart.isPlayer) {
          this.state = 'finished';
          this.finishShown = false;
          this.beep(760, 0.32, 300);
          this.vibrate([60, 40, 90]);
        }
      }
    }
    this.standings = this.sortKarts();
  }

  private updateFinished(delta: number): void {
    const player = this.player;
    if (!player) return;

    for (const kart of this.karts) {
      kart.update(ZERO_INPUT, this.track, delta, false);
    }
    this.updateCamera(player, delta);

    if (!this.finishShown) {
      this.finishShown = true;
      const position = this.standings.indexOf(player) + 1;
      this.ui.showFinish(position, this.toStandings(this.standings), player.finishTime ?? this.raceTime);
    }
  }

  private resolveKartCollisions(): void {
    for (let firstIndex = 0; firstIndex < this.karts.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < this.karts.length; secondIndex += 1) {
        const first = this.karts[firstIndex]!;
        const second = this.karts[secondIndex]!;
        const delta = first.group.position.clone().sub(second.group.position);
        delta.y = 0;
        const distanceSq = delta.lengthSq();
        const minimum = 2.15;
        if (distanceSq <= 0.0001 || distanceSq >= minimum * minimum) continue;

        const distance = Math.sqrt(distanceSq);
        const normal = delta.multiplyScalar(1 / distance);
        const overlap = minimum - distance;
        const firstShare = second.character.weight / (first.character.weight + second.character.weight);
        const secondShare = 1 - firstShare;
        first.group.position.addScaledVector(normal, overlap * firstShare);
        second.group.position.addScaledVector(normal, -overlap * secondShare);
        const average = (first.speed + second.speed) * 0.5;
        first.speed = damp(first.speed, average, 5, 0.016);
        second.speed = damp(second.speed, average, 5, 0.016);
      }
    }
  }

  private sortKarts(): Kart[] {
    return [...this.karts].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.raceScore() - a.raceScore();
    });
  }

  private toStandings(karts: readonly Kart[]): RaceStanding[] {
    return karts.map((kart) => ({
      id: kart.id,
      name: kart.character.name,
      emoji: kart.character.emoji,
      lap: kart.completedLaps,
      progress: kart.progress,
      finished: kart.finished,
      finishTime: kart.finishTime,
      isPlayer: kart.isPlayer,
    }));
  }

  private updateCamera(player: Kart, delta: number): void {
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    const speedLift = Math.min(2.2, Math.abs(player.speed) * 0.045);
    const desiredPosition = player.group.position.clone()
      .addScaledVector(forward, -10.2 - speedLift)
      .add(new THREE.Vector3(0, 5.6 + speedLift * 0.3, 0));
    const desiredLook = player.group.position.clone()
      .addScaledVector(forward, 6.5 + speedLift)
      .add(new THREE.Vector3(0, 1.1, 0));

    this.camera.position.lerp(desiredPosition, 1 - Math.exp(-5.6 * delta));
    this.cameraLook.lerp(desiredLook, 1 - Math.exp(-7.8 * delta));
    this.camera.lookAt(this.cameraLook);

    const targetFov = player.boostTimer > 0 ? 72 : 64;
    this.camera.fov = damp(this.camera.fov, targetFov, 5, delta);
    this.camera.updateProjectionMatrix();
  }

  private snapCameraToPlayer(): void {
    const player = this.player;
    if (!player) return;
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    this.camera.position.copy(player.group.position)
      .addScaledVector(forward, -11)
      .add(new THREE.Vector3(0, 6, 0));
    this.cameraLook.copy(player.group.position).addScaledVector(forward, 5).add(new THREE.Vector3(0, 1, 0));
    this.camera.lookAt(this.cameraLook);
  }

  private updateMenuCamera(timestamp: number, delta: number): void {
    const angle = timestamp * 0.000055;
    const desired = new THREE.Vector3(Math.cos(angle) * 68, 38, Math.sin(angle) * 68);
    this.camera.position.lerp(desired, 1 - Math.exp(-1.2 * delta));
    this.cameraTarget.set(0, 0, 0);
    this.camera.lookAt(this.cameraTarget);
    this.camera.fov = damp(this.camera.fov, 58, 3, delta);
    this.camera.updateProjectionMatrix();
  }

  private togglePause(): void {
    if (this.state === 'paused') {
      this.resume();
    } else if (this.state === 'racing' || this.state === 'countdown') {
      this.pause();
    }
  }

  private pause(): void {
    if (this.state !== 'racing' && this.state !== 'countdown') return;
    this.stateBeforePause = this.state;
    this.state = 'paused';
    this.input.reset();
    this.ui.showPause();
  }

  private resume(): void {
    if (this.state !== 'paused') return;
    this.state = this.stateBeforePause;
    this.previousTimestamp = performance.now();
    this.ui.hidePause();
  }

  private backToMenu(): void {
    this.clearRace();
    this.state = 'menu';
    this.input.reset();
    this.ui.showMenu();
  }

  private clearRace(): void {
    for (const kart of this.karts) {
      this.scene.remove(kart.group);
      kart.dispose();
    }
    this.karts = [];
    this.player = null;
    this.standings = [];
    this.aiControllers.clear();

    if (this.itemSystem) {
      this.scene.remove(this.itemSystem.group);
      this.itemSystem.dispose();
      this.itemSystem = null;
    }
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 700 ? 1.35 : 1.6));
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  private ensureAudio(): void {
    if (this.audioContext) {
      void this.audioContext.resume();
      return;
    }
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    this.audioContext = new AudioContextClass();
  }

  private beep(frequency: number, duration: number, slide = 0): void {
    const context = this.audioContext;
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency + slide, now + duration);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private vibrate(pattern: number | number[]): void {
    navigator.vibrate?.(pattern);
  }
}
