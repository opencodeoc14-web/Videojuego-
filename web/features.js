import * as THREE from 'three';
import { clamp } from './characters.js';

function createCoinMesh() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0x7a4800,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.62,
  });
  const bright = new THREE.MeshBasicMaterial({ color: 0xfff1a8 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.16, 18), gold);
  coin.rotation.z = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 7, 18), bright);
  ring.rotation.y = Math.PI / 2;
  group.add(coin, ring);
  group.scale.setScalar(0.86);
  return group;
}

function createPadMesh(color, jump = false) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, jump ? 0.34 : 0.16, 2.15),
    new THREE.MeshStandardMaterial({
      color: jump ? 0x29354f : 0x1c3040,
      emissive: color,
      emissiveIntensity: jump ? 0.24 : 0.36,
      roughness: 0.52,
      metalness: 0.25,
    }),
  );
  if (jump) base.rotation.x = -0.08;
  group.add(base);
  const arrowMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
  for (const x of [-0.9, 0, 0.9]) {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.95, 3), arrowMaterial);
    arrow.position.set(x, jump ? 0.27 : 0.14, 0.04);
    arrow.rotation.x = Math.PI / 2;
    group.add(arrow);
  }
  return group;
}

export class CourseFeatureSystem {
  constructor(track, effects, callbacks = {}) {
    this.track = track;
    this.effects = effects;
    this.onMessage = callbacks.onMessage ?? (() => {});
    this.onSfx = callbacks.onSfx ?? (() => {});
    this.onCameraShake = callbacks.onCameraShake ?? (() => {});
    this.group = new THREE.Group();
    this.group.name = 'course-features';
    this.coins = [];
    this.droppedCoins = [];
    this.boostPads = [];
    this.jumpPads = [];
    this.time = 0;
    this.buildCoins();
    this.buildPads();
  }

  buildCoins() {
    const lanePatterns = [
      [-4.2, 0, 4.2],
      [-3.6, -1.2, 1.2, 3.6],
      [-4.5, -2.25, 0, 2.25, 4.5],
      [-2.7, 0, 2.7],
    ];
    this.track.definition.coinLines.forEach((progress, lineIndex) => {
      const pattern = lanePatterns[lineIndex % lanePatterns.length];
      for (const lateral of pattern) {
        const maxLateral = this.track.width * 0.36;
        const sample = this.track.sample(progress, clamp(lateral, -maxLateral, maxLateral), 1.05);
        const mesh = createCoinMesh();
        mesh.position.copy(sample.position);
        mesh.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
        this.group.add(mesh);
        this.coins.push({ mesh, cooldown: 0, baseY: sample.position.y, phase: lineIndex * 0.7 + lateral });
      }
    });
  }

  buildPads() {
    const theme = this.track.definition.theme;
    this.track.definition.boostPads.forEach((definition, index) => {
      const sample = this.track.sample(definition.progress, definition.lateral, 0.13);
      const mesh = createPadMesh(theme.curbA, false);
      mesh.position.copy(sample.position);
      mesh.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
      this.group.add(mesh);
      this.boostPads.push({ id: `boost-${index}`, mesh, cooldowns: new Map() });
    });

    this.track.definition.jumpPads.forEach((definition, index) => {
      const sample = this.track.sample(definition.progress, definition.lateral, 0.17);
      const mesh = createPadMesh(0xffd166, true);
      mesh.position.copy(sample.position);
      mesh.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
      this.group.add(mesh);
      this.jumpPads.push({ id: `jump-${index}`, mesh, cooldowns: new Map() });
    });
  }

  update(delta, karts) {
    this.time += delta;
    this.updateCoins(delta, karts);
    this.updateDroppedCoins(delta, karts);
    this.updatePads(delta, karts, this.boostPads, false);
    this.updatePads(delta, karts, this.jumpPads, true);
  }

  updateCoins(delta, karts) {
    for (const coin of this.coins) {
      coin.cooldown = Math.max(0, coin.cooldown - delta);
      coin.mesh.visible = coin.cooldown <= 0;
      if (!coin.mesh.visible) continue;
      coin.mesh.rotation.y += delta * 3.2;
      coin.mesh.position.y = coin.baseY + Math.sin(this.time * 3.1 + coin.phase) * 0.16;
      for (const kart of karts) {
        if (kart.finished || kart.coins >= 10) continue;
        if (coin.mesh.position.distanceToSquared(kart.group.position) < 3.0) {
          if (kart.addCoin(1)) {
            coin.cooldown = 5.2;
            coin.mesh.visible = false;
            this.effects?.burst(coin.mesh.position, 0xffd166, 10, 4.5, 0.42);
            if (kart.isPlayer) {
              this.onMessage(`🪙 Monedas: ${kart.coins}/10`);
              this.onSfx('coin');
            }
          }
          break;
        }
      }
    }
  }

  updatePads(delta, karts, pads, jump) {
    for (const pad of pads) {
      pad.mesh.children.forEach((child, childIndex) => {
        if (childIndex > 0) child.material.opacity = 0.72 + Math.sin(this.time * 5 + childIndex) * 0.22;
      });
      for (const [id, cooldown] of pad.cooldowns) {
        const next = cooldown - delta;
        if (next <= 0) pad.cooldowns.delete(id);
        else pad.cooldowns.set(id, next);
      }

      for (const kart of karts) {
        if (kart.finished || pad.cooldowns.has(kart.id)) continue;
        const horizontalDistance = pad.mesh.position.distanceToSquared(kart.group.position);
        if (horizontalDistance > (jump ? 6.2 : 5.5)) continue;
        pad.cooldowns.set(kart.id, 1.15);
        if (jump) {
          if (kart.launch(8.2)) {
            kart.addBoost(0.55);
            this.effects?.burst(kart.group.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xffd166, 14, 5.5, 0.48);
            if (kart.isPlayer) {
              this.onMessage('🛫 ¡Salto turbo!');
              this.onSfx('jump');
              this.onCameraShake(0.22);
              navigator.vibrate?.(25);
            }
          }
        } else {
          kart.addBoost(0.82);
          this.effects?.burst(kart.group.position.clone().add(new THREE.Vector3(0, 0.35, 0)), this.track.definition.theme.curbA, 10, 4, 0.35);
          if (kart.isPlayer) {
            this.onMessage('⚡ Zona turbo');
            this.onSfx('boost');
            navigator.vibrate?.(18);
          }
        }
      }
    }
  }

  dropCoins(kart, count) {
    const amount = Math.min(4, Math.max(0, count));
    for (let index = 0; index < amount; index += 1) {
      const mesh = createCoinMesh();
      mesh.position.copy(kart.group.position).add(new THREE.Vector3(0, 0.8, 0));
      const angle = (index / Math.max(1, amount)) * Math.PI * 2 + Math.random() * 0.35;
      const velocity = new THREE.Vector3(Math.cos(angle) * (4 + Math.random() * 3), 5 + Math.random() * 2.5, Math.sin(angle) * (4 + Math.random() * 3));
      this.group.add(mesh);
      this.droppedCoins.push({ mesh, velocity, life: 8, collectDelay: 0.55, grounded: false });
    }
  }

  updateDroppedCoins(delta, karts) {
    for (let index = this.droppedCoins.length - 1; index >= 0; index -= 1) {
      const coin = this.droppedCoins[index];
      coin.life -= delta;
      coin.collectDelay = Math.max(0, coin.collectDelay - delta);
      coin.mesh.rotation.y += delta * 5;
      if (!coin.grounded) {
        coin.velocity.y -= 15 * delta;
        coin.velocity.multiplyScalar(Math.pow(0.985, delta * 60));
        coin.mesh.position.addScaledVector(coin.velocity, delta);
        if (coin.mesh.position.y <= 0.82) {
          coin.mesh.position.y = 0.82;
          coin.velocity.y = Math.abs(coin.velocity.y) * 0.38;
          coin.velocity.x *= 0.7;
          coin.velocity.z *= 0.7;
          if (Math.abs(coin.velocity.y) < 1.1) coin.grounded = true;
        }
      } else {
        coin.mesh.position.y = 0.82 + Math.sin(this.time * 4 + index) * 0.08;
      }

      if (coin.collectDelay <= 0) {
        let collected = false;
        for (const kart of karts) {
          if (kart.finished || kart.coins >= 10) continue;
          if (coin.mesh.position.distanceToSquared(kart.group.position) < 3.0 && kart.addCoin(1)) {
            this.effects?.burst(coin.mesh.position, 0xffd166, 8, 4, 0.35);
            if (kart.isPlayer) this.onSfx('coin');
            collected = true;
            break;
          }
        }
        if (collected) {
          this.removeDroppedCoin(index);
          continue;
        }
      }

      if (coin.life <= 0) this.removeDroppedCoin(index);
    }
  }

  removeDroppedCoin(index) {
    const coin = this.droppedCoins[index];
    if (!coin) return;
    this.group.remove(coin.mesh);
    coin.mesh.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      object.material.dispose();
    });
    this.droppedCoins.splice(index, 1);
  }

  dispose(scene) {
    scene.remove(this.group);
    this.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    this.coins.length = 0;
    this.droppedCoins.length = 0;
    this.boostPads.length = 0;
    this.jumpPads.length = 0;
  }
}
