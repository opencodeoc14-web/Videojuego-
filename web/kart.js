import * as THREE from 'three';
import { clamp, damp, shortestAngle, wrap01 } from './characters.js';

export class Kart {
  constructor(id, character, isPlayer) {
    this.id = id;
    this.character = character;
    this.isPlayer = isPlayer;
    this.group = new THREE.Group();
    this.group.name = `kart-${id}`;
    this.bodyPivot = new THREE.Group();
    this.group.add(this.bodyPivot);
    this.wheels = [];
    this.flames = [];
    this.speed = 0;
    this.heading = 0;
    this.progress = 0;
    this.previousProgress = 0;
    this.completedLaps = 0;
    this.finished = false;
    this.finishTime = null;
    this.item = null;
    this.shieldTimer = 0;
    this.boostTimer = 0;
    this.stunTimer = 0;
    this.driftCharge = 0;
    this.lateral = 0;
    this.offRoad = false;
    this.itemCooldown = 0;
    this.visualSteer = 0;
    this.buildModel();
    this.shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.65, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0x65dfff, transparent: true, opacity: 0.22, wireframe: true, depthWrite: false }),
    );
    this.shieldMesh.position.y = 0.75;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);
  }

  place(track, progress, lateral) {
    const sample = track.sample(progress, lateral, 0.48);
    this.group.position.copy(sample.position);
    this.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.group.rotation.y = this.heading;
    this.progress = sample.progress;
    this.previousProgress = sample.progress;
    this.lateral = lateral;
  }

  update(input, track, delta, canDrive) {
    this.itemCooldown = Math.max(0, this.itemCooldown - delta);
    this.shieldTimer = Math.max(0, this.shieldTimer - delta);
    this.boostTimer = Math.max(0, this.boostTimer - delta);
    this.stunTimer = Math.max(0, this.stunTimer - delta);
    this.shieldMesh.visible = this.shieldTimer > 0;
    this.shieldMesh.rotation.y += delta * 2.4;

    const nearestBefore = track.nearest(this.group.position, this.progress);
    this.lateral = nearestBefore.lateral;
    this.offRoad = Math.abs(this.lateral) > track.width * 0.52;
    const baseMaxSpeed = 31 * this.character.maxSpeed;
    const maxForward = baseMaxSpeed * (this.boostTimer > 0 ? 1.32 : 1) * (this.offRoad ? 0.56 : 1);

    let throttle = canDrive ? clamp(input.throttle, 0, 1) : 0;
    let brake = canDrive ? clamp(input.brake, 0, 1) : 0;
    let steer = canDrive ? clamp(input.steer, -1, 1) : 0;
    if (this.stunTimer > 0) {
      throttle = 0;
      brake = 0.6;
      steer *= 0.25;
      this.bodyPivot.rotation.y += delta * 9;
    } else {
      this.bodyPivot.rotation.y = damp(this.bodyPivot.rotation.y, 0, 8, delta);
    }

    if (throttle > 0) this.speed += 18.5 * this.character.acceleration * throttle * delta;
    if (brake > 0) this.speed -= (this.speed > 0 ? 29 : 11) * brake * delta;
    if (throttle === 0 && brake === 0) this.speed = damp(this.speed, 0, this.offRoad ? 1.9 : 0.55, delta);
    this.speed = clamp(this.speed, -8, maxForward);

    const speedRatio = clamp(Math.abs(this.speed) / Math.max(1, baseMaxSpeed), 0.12, 1);
    const drifting = input.drift && Math.abs(steer) > 0.24 && this.speed > 10 && !this.offRoad;
    this.heading += steer * (drifting ? 2.05 : 1.48) * this.character.handling * speedRatio * delta * (this.speed >= 0 ? 1 : -1);
    if (drifting) {
      this.driftCharge = clamp(this.driftCharge + delta * (0.45 + Math.abs(steer) * 0.65), 0, 1.35);
      this.speed *= Math.pow(0.986, delta * 60);
    } else if (this.driftCharge > 0) {
      if (this.driftCharge > 0.48) this.boostTimer = Math.max(this.boostTimer, 0.35 + this.driftCharge * 0.55);
      this.driftCharge = 0;
    }

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.group.position.addScaledVector(forward, this.speed * delta);
    this.group.position.y = 0.48;
    const nearest = track.nearest(this.group.position, this.progress);
    this.previousProgress = this.progress;
    this.progress = nearest.progress;
    this.lateral = nearest.lateral;
    if (this.previousProgress > 0.86 && this.progress < 0.14 && this.speed > 1 && canDrive) this.completedLaps += 1;
    if (nearest.distance > 25) this.resetToTrack(track);
    this.updateVisuals(steer, drifting, delta);
  }

  steerToward(target) {
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    return clamp(shortestAngle(this.heading, Math.atan2(dx, dz)) * 1.9, -1, 1);
  }

  grantItem(item) {
    if (this.item !== null || this.itemCooldown > 0 || this.finished) return false;
    this.item = item;
    return true;
  }

  consumeItem() {
    const item = this.item;
    this.item = null;
    this.itemCooldown = 0.8;
    return item;
  }

  applyHit(strength = 1) {
    if (this.shieldTimer > 0 || this.finished) return false;
    this.speed *= Math.max(0.2, 0.55 - strength * 0.08);
    this.stunTimer = Math.max(this.stunTimer, 0.55 + strength * 0.3);
    return true;
  }

  addBoost(seconds) {
    this.boostTimer = Math.max(this.boostTimer, seconds);
    this.speed = Math.max(this.speed, 23 * this.character.maxSpeed);
  }

  setShield(seconds) {
    this.shieldTimer = Math.max(this.shieldTimer, seconds);
  }

  raceScore() {
    return this.completedLaps + this.progress;
  }

  resetToTrack(track) {
    const sample = track.sample(this.progress, clamp(this.lateral, -track.width * 0.32, track.width * 0.32), 0.48);
    this.group.position.copy(sample.position);
    this.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.speed *= 0.45;
  }

  updateVisuals(steer, drifting, delta) {
    this.visualSteer = damp(this.visualSteer, steer, 10, delta);
    this.group.rotation.y = this.heading;
    this.bodyPivot.rotation.z = damp(this.bodyPivot.rotation.z, -this.visualSteer * 0.1, 8, delta);
    this.bodyPivot.rotation.x = damp(this.bodyPivot.rotation.x, this.boostTimer > 0 ? -0.055 : clamp(-this.speed / 500, -0.04, 0.04), 7, delta);
    for (const wheel of this.wheels) wheel.rotation.x -= this.speed * delta * 1.9;
    if (this.wheels[0]) this.wheels[0].rotation.y = this.visualSteer * 0.38;
    if (this.wheels[1]) this.wheels[1].rotation.y = this.visualSteer * 0.38;
    for (const flame of this.flames) {
      flame.visible = this.boostTimer > 0;
      flame.scale.setScalar(0.75 + Math.random() * 0.5);
    }
    this.bodyPivot.scale.set(drifting ? 1.03 : 1, 1, drifting ? 1.03 : 1);
  }

  buildModel() {
    const paint = new THREE.MeshStandardMaterial({ color: this.character.color, roughness: 0.42, metalness: 0.08 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x111522, roughness: 0.72 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aa6b5, roughness: 0.3, metalness: 0.75 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x7de4ff, roughness: 0.16, metalness: 0.1 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd4ad, roughness: 0.8 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.45, 3.1), paint);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    this.bodyPivot.add(chassis);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.32, 1.15), paint);
    nose.position.set(0, 0.66, 1.55);
    this.bodyPivot.add(nose);
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.48, 1.1), dark);
    cockpit.position.set(0, 0.83, -0.2);
    this.bodyPivot.add(cockpit);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.34, 0.12), glass);
    windshield.position.set(0, 1.03, 0.35);
    windshield.rotation.x = -0.22;
    this.bodyPivot.add(windshield);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.78, 0.3), dark);
    seat.position.set(0, 1.15, -0.72);
    this.bodyPivot.add(seat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), skin);
    head.position.set(0, 1.55, -0.34);
    this.bodyPivot.add(head);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.47, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.57), paint);
    helmet.position.set(0, 1.64, -0.36);
    helmet.rotation.x = -0.12;
    this.bodyPivot.add(helmet);
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.2), metal);
    bumper.position.set(0, 0.38, 1.78);
    this.bodyPivot.add(bumper);
    const wheelGeometry = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 14);
    for (const [x, y, z] of [[-1.18, 0.42, 1.02], [1.18, 0.42, 1.02], [-1.18, 0.42, -1.02], [1.18, 0.42, -1.02]]) {
      const wheel = new THREE.Mesh(wheelGeometry, dark);
      wheel.position.set(x, y, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      this.wheels.push(wheel);
      this.bodyPivot.add(wheel);
    }
    const flameMaterial = new THREE.MeshBasicMaterial({ color: 0x63e8ff, transparent: true, opacity: 0.8 });
    for (const x of [-0.55, 0.55]) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 10), flameMaterial);
      flame.position.set(x, 0.45, -1.95);
      flame.rotation.x = -Math.PI / 2;
      flame.visible = false;
      this.flames.push(flame);
      this.bodyPivot.add(flame);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.45, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.43;
    shadow.scale.set(1, 1.5, 1);
    this.group.add(shadow);
  }
}

export class AIController {
  constructor(kart, laneBias, skill) {
    this.kart = kart;
    this.laneBias = laneBias;
    this.skill = skill;
    this.itemDecision = 1 + Math.random() * 2;
    this.weaveTime = Math.random() * 10;
  }

  sample(track, delta, rank, racerCount) {
    this.weaveTime += delta;
    this.itemDecision -= delta;
    const lookAhead = clamp(0.018 + Math.abs(this.kart.speed) / Math.max(1, track.length) * 0.62, 0.018, 0.075);
    const lane = this.laneBias + Math.sin(this.weaveTime * 0.42) * 0.65;
    const target = track.sample(wrap01(this.kart.progress + lookAhead), lane, 0.48);
    const farther = track.sample(wrap01(this.kart.progress + lookAhead * 2.15), lane, 0.48);
    const steer = this.kart.steerToward(target.position);
    const curve = Math.abs(shortestAngle(Math.atan2(target.tangent.x, target.tangent.z), Math.atan2(farther.tangent.x, farther.tangent.z)));
    const trailingRatio = clamp((rank - 1) / Math.max(1, racerCount - 1), 0, 1);
    const throttle = clamp((curve > 0.6 ? 0.66 : curve > 0.34 ? 0.82 : 1) * (0.94 + trailingRatio * 0.16) * this.skill, 0.58, 1);
    const brake = curve > 0.72 && this.kart.speed > 24 ? 0.35 : 0;
    const drift = curve > 0.32 && this.kart.speed > 13 && Math.abs(steer) > 0.3;
    let useItem = false;
    if (this.kart.item && this.itemDecision <= 0) {
      useItem = Math.random() < (this.kart.item === 'rocket' ? 0.78 : this.kart.item === 'trap' ? 0.55 : 0.88);
      this.itemDecision = 1.2 + Math.random() * 2.7;
    }
    return { steer, throttle, brake, drift, useItem };
  }
}

export class ItemSystem {
  constructor(track, onMessage) {
    this.group = new THREE.Group();
    this.boxes = [];
    this.rockets = [];
    this.traps = [];
    this.onMessage = onMessage;
    for (const progress of [0.11, 0.29, 0.48, 0.68, 0.84]) {
      for (const lateral of [-4.5, 0, 4.5]) this.createBox(track, progress, lateral);
    }
  }

  createBox(track, progress, lateral) {
    const sample = track.sample(progress, lateral, 1.15);
    const group = new THREE.Group();
    group.position.copy(sample.position);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 1.35), new THREE.MeshBasicMaterial({ color: 0x65e8ff, transparent: true, opacity: 0.58, wireframe: true }));
    outer.rotation.set(0.45, 0.65, 0.15);
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.52), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x8c4d00, emissiveIntensity: 1.3, roughness: 0.35 }));
    group.add(outer, inner);
    this.group.add(group);
    this.boxes.push({ group, cooldown: 0 });
  }

  update(delta, karts, standings) {
    for (const box of this.boxes) {
      box.cooldown = Math.max(0, box.cooldown - delta);
      box.group.visible = box.cooldown <= 0;
      box.group.rotation.y += delta * 1.5;
      if (box.cooldown > 0) continue;
      for (const kart of karts) {
        if (kart.finished || kart.item !== null) continue;
        if (box.group.position.distanceToSquared(kart.group.position) < 4.2) {
          const rank = standings.indexOf(kart) + 1;
          const trailing = clamp((rank - 1) / Math.max(1, standings.length - 1), 0, 1);
          const roll = Math.random();
          const item = trailing > 0.55 ? (roll < 0.42 ? 'rocket' : roll < 0.76 ? 'nitro' : roll < 0.9 ? 'shield' : 'trap') : (roll < 0.34 ? 'trap' : roll < 0.59 ? 'shield' : roll < 0.81 ? 'nitro' : 'rocket');
          if (kart.grantItem(item)) {
            box.cooldown = 5.5;
            if (kart.isPlayer) this.onMessage(`Objeto: ${{ nitro: '⚡ Nitro', rocket: '🚀 Cohete', shield: '🛡️ Escudo', trap: '🍌 Trampa' }[item]}`);
            break;
          }
        }
      }
    }
    this.updateRockets(delta);
    this.updateTraps(delta, karts);
  }

  activate(kart, karts) {
    const item = kart.consumeItem();
    if (!item) return;
    if (item === 'nitro') {
      kart.addBoost(2.1);
      if (kart.isPlayer) this.onMessage('⚡ ¡Nitro!');
    } else if (item === 'shield') {
      kart.setShield(6);
      if (kart.isPlayer) this.onMessage('🛡️ Escudo activado');
    } else if (item === 'rocket') {
      const target = karts.filter((other) => other !== kart && !other.finished).map((other) => ({ other, delta: other.raceScore() - kart.raceScore() })).filter(({ delta }) => delta > -0.08).sort((a, b) => a.delta - b.delta)[0]?.other;
      if (!target) {
        kart.addBoost(1.25);
        return;
      }
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.25, 10), new THREE.MeshStandardMaterial({ color: 0xff5d73, emissive: 0x8a102c, emissiveIntensity: 1.2 }));
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(kart.group.position).add(new THREE.Vector3(0, 0.8, 0));
      this.group.add(mesh);
      this.rockets.push({ mesh, owner: kart, target, speed: 38, life: 5 });
      if (kart.isPlayer) this.onMessage(`🚀 Objetivo: ${target.character.name}`);
    } else if (item === 'trap') {
      const backward = new THREE.Vector3(-Math.sin(kart.heading), 0, -Math.cos(kart.heading));
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.85, 7), new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.7 }));
      mesh.position.copy(kart.group.position).addScaledVector(backward, 2.4);
      mesh.position.y = 0.42;
      mesh.rotation.z = Math.PI;
      this.group.add(mesh);
      this.traps.push({ mesh, owner: kart, life: 14 });
      if (kart.isPlayer) this.onMessage('🍌 Trampa colocada');
    }
  }

  updateRockets(delta) {
    for (let index = this.rockets.length - 1; index >= 0; index -= 1) {
      const rocket = this.rockets[index];
      rocket.life -= delta;
      if (rocket.life <= 0 || rocket.target.finished) {
        this.group.remove(rocket.mesh);
        this.rockets.splice(index, 1);
        continue;
      }
      const direction = rocket.target.group.position.clone().add(new THREE.Vector3(0, 0.75, 0)).sub(rocket.mesh.position).normalize();
      rocket.mesh.position.addScaledVector(direction, rocket.speed * delta);
      rocket.mesh.lookAt(rocket.mesh.position.clone().add(direction));
      rocket.mesh.rotateX(Math.PI / 2);
      if (rocket.mesh.position.distanceToSquared(rocket.target.group.position) < 2.8) {
        const hit = rocket.target.applyHit(1.2);
        if (hit && rocket.target.isPlayer) this.onMessage('💥 ¡Te alcanzó un cohete!');
        if (hit && rocket.owner.isPlayer) this.onMessage(`💥 Golpe a ${rocket.target.character.name}`);
        this.group.remove(rocket.mesh);
        this.rockets.splice(index, 1);
      }
    }
  }

  updateTraps(delta, karts) {
    for (let index = this.traps.length - 1; index >= 0; index -= 1) {
      const trap = this.traps[index];
      trap.life -= delta;
      trap.mesh.rotation.y += delta * 1.8;
      if (trap.life <= 0) {
        this.group.remove(trap.mesh);
        this.traps.splice(index, 1);
        continue;
      }
      for (const kart of karts) {
        if (kart === trap.owner || kart.finished) continue;
        if (kart.group.position.distanceToSquared(trap.mesh.position) < 3.2) {
          const hit = kart.applyHit(0.9);
          if (hit && kart.isPlayer) this.onMessage('🍌 ¡Pisaste una trampa!');
          this.group.remove(trap.mesh);
          this.traps.splice(index, 1);
          break;
        }
      }
    }
  }
}
