import * as THREE from 'three';
import { CHARACTERS, getCharacter, damp } from './characters.js';
import { RaceTrack, RaceWorld } from './track.js';
import { Kart, AIController, ItemSystem } from './kart.js';
import { GameUI, InputController } from './ui.js';

const TOTAL_LAPS = 3;
const RACER_COUNT = 8;
const ZERO_INPUT = { steer: 0, throttle: 0, brake: 0, drift: false, useItem: false };

class TurboCircuitGame {
  constructor(canvas, uiRoot) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(64, 1, 0.1, 260);
    this.track = new RaceTrack();
    this.world = new RaceWorld(this.scene, this.track);
    this.scene.add(this.track.group);
    this.karts = [];
    this.player = null;
    this.aiControllers = new Map();
    this.itemSystem = null;
    this.standings = [];
    this.state = 'menu';
    this.stateBeforePause = 'racing';
    this.selectedCharacterId = 'byte';
    this.countdown = 0;
    this.raceTime = 0;
    this.previousTimestamp = performance.now();
    this.finishShown = false;
    this.cameraLook = new THREE.Vector3();
    this.audioContext = null;

    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.ui = new GameUI(uiRoot, {
      onStart: (id) => this.startRace(id),
      onResume: () => this.resume(),
      onRestart: () => this.startRace(this.selectedCharacterId),
      onMenu: () => this.backToMenu(),
    });
    this.input = new InputController(() => this.togglePause());
    this.camera.position.set(0, 40, 58);
    this.camera.lookAt(0, 0, 0);
    this.resize();
    addEventListener('resize', () => this.resize(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && ['racing', 'countdown'].includes(this.state)) this.pause();
    });
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  ensureAudio() {
    if (this.audioContext) {
      this.audioContext.resume().catch(() => {});
      return;
    }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio) this.audioContext = new Audio();
  }

  beep(frequency, duration, slide = 0) {
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

  startRace(characterId) {
    this.ensureAudio();
    this.clearRace();
    this.selectedCharacterId = getCharacter(characterId).id;
    this.raceTime = 0;
    this.countdown = 3.7;
    this.finishShown = false;
    this.state = 'countdown';
    this.createRacers();
    this.itemSystem = new ItemSystem(this.track, (message) => {
      this.ui.showMessage(message);
      this.beep(620, 0.08, 100);
    });
    this.scene.add(this.itemSystem.group);
    this.ui.showRace();
    this.ui.showCountdown('3');
    this.input.reset();
    this.snapCameraToPlayer();
    this.beep(330, 0.09);
  }

  createRacers() {
    const selected = getCharacter(this.selectedCharacterId);
    const opponents = CHARACTERS.filter((character) => character.id !== selected.id);
    const order = [opponents[0], opponents[1], opponents[2], selected, opponents[3], opponents[4], opponents[5], opponents[6]];
    for (let slot = 0; slot < RACER_COUNT; slot += 1) {
      const character = order[slot];
      const isPlayer = character.id === selected.id;
      const kart = new Kart(isPlayer ? 'player' : `cpu-${slot}`, character, isPlayer);
      const row = Math.floor(slot / 2);
      const side = slot % 2 === 0 ? -2.4 : 2.4;
      kart.place(this.track, 0.043 - row * 0.012, side);
      this.karts.push(kart);
      this.scene.add(kart.group);
      if (isPlayer) this.player = kart;
      else this.aiControllers.set(kart, new AIController(kart, side * 0.55, 0.93 + slot % 4 * 0.025 + Math.random() * 0.025));
    }
    this.standings = this.sortKarts();
  }

  frame(timestamp) {
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

  updateRace(delta) {
    const player = this.player;
    if (!player) return;
    let canDrive = this.state === 'racing';
    if (this.state === 'countdown') {
      this.countdown -= delta;
      if (this.countdown > 0) {
        this.ui.showCountdown(String(Math.ceil(this.countdown)));
      } else {
        canDrive = true;
        this.raceTime += delta;
        if (this.countdown > -0.8) {
          this.ui.showCountdown('¡YA!');
          if (this.countdown + delta > 0) {
            this.beep(600, 0.18, 320);
            navigator.vibrate?.(45);
          }
        } else {
          this.ui.showCountdown('');
          this.state = 'racing';
        }
      }
    } else this.raceTime += delta;

    const previousStandings = this.sortKarts();
    const playerInput = canDrive && !player.finished ? this.input.sample() : ZERO_INPUT;
    player.update(playerInput, this.track, delta, canDrive && !player.finished);
    if (playerInput.useItem) this.itemSystem?.activate(player, this.karts);

    for (const kart of this.karts) {
      if (kart.isPlayer) continue;
      const controller = this.aiControllers.get(kart);
      const aiInput = controller && !kart.finished ? controller.sample(this.track, delta, previousStandings.indexOf(kart) + 1, this.karts.length) : ZERO_INPUT;
      kart.update(aiInput, this.track, delta, canDrive && !kart.finished);
      if (aiInput.useItem) this.itemSystem?.activate(kart, this.karts);
    }

    this.resolveCollisions();
    this.standings = this.sortKarts();
    this.itemSystem?.update(delta, this.karts, this.standings);
    this.checkFinishes();
    this.updateCamera(player, delta);
    this.ui.updateHUD(player.completedLaps, TOTAL_LAPS, this.standings.indexOf(player) + 1, player.speed, player.item, this.toStandings());
  }

  checkFinishes() {
    for (const kart of this.karts) {
      if (!kart.finished && kart.completedLaps >= TOTAL_LAPS) {
        kart.finished = true;
        kart.finishTime = this.raceTime;
        kart.item = null;
        if (kart.isPlayer) {
          this.state = 'finished';
          this.finishShown = false;
          this.beep(760, 0.32, 300);
          navigator.vibrate?.([60, 40, 90]);
        }
      }
    }
    this.standings = this.sortKarts();
  }

  updateFinished(delta) {
    if (!this.player) return;
    for (const kart of this.karts) kart.update(ZERO_INPUT, this.track, delta, false);
    this.updateCamera(this.player, delta);
    if (!this.finishShown) {
      this.finishShown = true;
      this.ui.showFinish(this.standings.indexOf(this.player) + 1, this.toStandings(), this.player.finishTime ?? this.raceTime);
    }
  }

  resolveCollisions() {
    for (let a = 0; a < this.karts.length; a += 1) {
      for (let b = a + 1; b < this.karts.length; b += 1) {
        const first = this.karts[a];
        const second = this.karts[b];
        const vector = first.group.position.clone().sub(second.group.position);
        vector.y = 0;
        const distanceSq = vector.lengthSq();
        if (distanceSq <= 0.0001 || distanceSq >= 2.15 ** 2) continue;
        const distance = Math.sqrt(distanceSq);
        const normal = vector.multiplyScalar(1 / distance);
        const overlap = 2.15 - distance;
        const firstShare = second.character.weight / (first.character.weight + second.character.weight);
        first.group.position.addScaledVector(normal, overlap * firstShare);
        second.group.position.addScaledVector(normal, -overlap * (1 - firstShare));
        const average = (first.speed + second.speed) * 0.5;
        first.speed = damp(first.speed, average, 5, 0.016);
        second.speed = damp(second.speed, average, 5, 0.016);
      }
    }
  }

  sortKarts() {
    return [...this.karts].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.raceScore() - a.raceScore();
    });
  }

  toStandings() {
    return this.standings.map((kart) => ({
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

  updateCamera(player, delta) {
    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    const speedLift = Math.min(2.2, Math.abs(player.speed) * 0.045);
    const desiredPosition = player.group.position.clone().addScaledVector(forward, -10.2 - speedLift).add(new THREE.Vector3(0, 5.6 + speedLift * 0.3, 0));
    const desiredLook = player.group.position.clone().addScaledVector(forward, 6.5 + speedLift).add(new THREE.Vector3(0, 1.1, 0));
    this.camera.position.lerp(desiredPosition, 1 - Math.exp(-5.6 * delta));
    this.cameraLook.lerp(desiredLook, 1 - Math.exp(-7.8 * delta));
    this.camera.lookAt(this.cameraLook);
    this.camera.fov = damp(this.camera.fov, player.boostTimer > 0 ? 72 : 64, 5, delta);
    this.camera.updateProjectionMatrix();
  }

  snapCameraToPlayer() {
    if (!this.player) return;
    const forward = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading));
    this.camera.position.copy(this.player.group.position).addScaledVector(forward, -11).add(new THREE.Vector3(0, 6, 0));
    this.cameraLook.copy(this.player.group.position).addScaledVector(forward, 5).add(new THREE.Vector3(0, 1, 0));
    this.camera.lookAt(this.cameraLook);
  }

  updateMenuCamera(timestamp, delta) {
    const angle = timestamp * 0.000055;
    this.camera.position.lerp(new THREE.Vector3(Math.cos(angle) * 68, 38, Math.sin(angle) * 68), 1 - Math.exp(-1.2 * delta));
    this.camera.lookAt(0, 0, 0);
    this.camera.fov = damp(this.camera.fov, 58, 3, delta);
    this.camera.updateProjectionMatrix();
  }

  togglePause() {
    if (this.state === 'paused') this.resume();
    else if (['racing', 'countdown'].includes(this.state)) this.pause();
  }

  pause() {
    if (!['racing', 'countdown'].includes(this.state)) return;
    this.stateBeforePause = this.state;
    this.state = 'paused';
    this.input.reset();
    this.ui.showPause();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = this.stateBeforePause;
    this.previousTimestamp = performance.now();
    this.ui.hidePause();
  }

  backToMenu() {
    this.clearRace();
    this.state = 'menu';
    this.input.reset();
    this.ui.showMenu();
  }

  clearRace() {
    for (const kart of this.karts) this.scene.remove(kart.group);
    this.karts = [];
    this.player = null;
    this.standings = [];
    this.aiControllers.clear();
    if (this.itemSystem) {
      this.scene.remove(this.itemSystem.group);
      this.itemSystem = null;
    }
  }

  resize() {
    const width = innerWidth;
    const height = innerHeight;
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.35 : 1.6));
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }
}

const canvas = document.querySelector('#game-canvas');
const root = document.querySelector('#ui-root');
if (!canvas || !root) throw new Error('No se pudo iniciar Turbo Circuit 3D.');
new TurboCircuitGame(canvas, root);
