import * as THREE from 'three';
import { clamp } from './math';
import type { ItemKind } from './types';
import type { RaceTrack } from './track';
import type { Kart } from './kart';

interface ItemBox {
  group: THREE.Group;
  cooldown: number;
}

interface Rocket {
  mesh: THREE.Mesh;
  owner: Kart;
  target: Kart;
  speed: number;
  life: number;
}

interface Trap {
  mesh: THREE.Mesh;
  owner: Kart;
  life: number;
}

interface ItemSystemOptions {
  onPlayerMessage: (message: string) => void;
}

export class ItemSystem {
  readonly group = new THREE.Group();

  private readonly boxes: ItemBox[] = [];
  private readonly rockets: Rocket[] = [];
  private readonly traps: Trap[] = [];
  private readonly options: ItemSystemOptions;

  constructor(track: RaceTrack, options: ItemSystemOptions) {
    this.options = options;
    this.group.name = 'items';
    this.createBoxes(track);
  }

  update(delta: number, karts: readonly Kart[], standings: readonly Kart[]): void {
    this.updateBoxes(delta, karts, standings);
    this.updateRockets(delta);
    this.updateTraps(delta, karts);
  }

  activate(kart: Kart, karts: readonly Kart[]): void {
    const item = kart.consumeItem();
    if (!item) return;

    switch (item) {
      case 'nitro':
        kart.addBoost(2.1);
        if (kart.isPlayer) this.options.onPlayerMessage('⚡ ¡Nitro!');
        break;
      case 'shield':
        kart.setShield(6);
        if (kart.isPlayer) this.options.onPlayerMessage('🛡️ Escudo activado');
        break;
      case 'rocket':
        this.launchRocket(kart, karts);
        break;
      case 'trap':
        this.dropTrap(kart);
        if (kart.isPlayer) this.options.onPlayerMessage('🍌 Trampa colocada');
        break;
    }
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
  }

  private createBoxes(track: RaceTrack): void {
    const progressGroups = [0.11, 0.29, 0.48, 0.68, 0.84];
    for (const progress of progressGroups) {
      for (const lateral of [-4.5, 0, 4.5]) {
        const sample = track.sample(progress, lateral, 1.15);
        const group = new THREE.Group();
        group.position.copy(sample.position);

        const outer = new THREE.Mesh(
          new THREE.BoxGeometry(1.35, 1.35, 1.35),
          new THREE.MeshBasicMaterial({
            color: 0x65e8ff,
            transparent: true,
            opacity: 0.58,
            wireframe: true,
          }),
        );
        outer.rotation.set(0.45, 0.65, 0.15);
        group.add(outer);

        const inner = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.52),
          new THREE.MeshStandardMaterial({
            color: 0xffd166,
            emissive: 0x8c4d00,
            emissiveIntensity: 1.3,
            roughness: 0.35,
          }),
        );
        group.add(inner);
        this.group.add(group);
        this.boxes.push({ group, cooldown: 0 });
      }
    }
  }

  private updateBoxes(delta: number, karts: readonly Kart[], standings: readonly Kart[]): void {
    for (const box of this.boxes) {
      box.cooldown = Math.max(0, box.cooldown - delta);
      box.group.visible = box.cooldown <= 0;
      box.group.rotation.y += delta * 1.5;
      box.group.rotation.x = Math.sin(performance.now() * 0.0015) * 0.18;
      if (box.cooldown > 0) continue;

      for (const kart of karts) {
        if (kart.finished || kart.item !== null) continue;
        const distanceSq = box.group.position.distanceToSquared(kart.group.position);
        if (distanceSq < 4.2) {
          const rank = standings.indexOf(kart) + 1;
          const item = this.randomItem(rank, standings.length);
          if (kart.grantItem(item)) {
            box.cooldown = 5.5;
            box.group.visible = false;
            if (kart.isPlayer) this.options.onPlayerMessage(`Objeto: ${this.itemIcon(item)}`);
            break;
          }
        }
      }
    }
  }

  private launchRocket(owner: Kart, karts: readonly Kart[]): void {
    const candidates = karts
      .filter((kart) => kart !== owner && !kart.finished)
      .map((kart) => ({ kart, delta: kart.raceScore() - owner.raceScore() }))
      .filter(({ delta }) => delta > -0.08)
      .sort((a, b) => a.delta - b.delta);
    const target = candidates[0]?.kart;

    if (!target) {
      owner.addBoost(1.25);
      if (owner.isPlayer) this.options.onPlayerMessage('🚀 Sin objetivo: impulso extra');
      return;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xff5d73,
      emissive: 0x8a102c,
      emissiveIntensity: 1.2,
      roughness: 0.35,
    });
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.25, 10), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(owner.group.position).add(new THREE.Vector3(0, 0.8, 0));
    this.group.add(mesh);
    this.rockets.push({ mesh, owner, target, speed: 38, life: 5 });
    if (owner.isPlayer) this.options.onPlayerMessage(`🚀 Objetivo: ${target.character.name}`);
  }

  private updateRockets(delta: number): void {
    for (let index = this.rockets.length - 1; index >= 0; index -= 1) {
      const rocket = this.rockets[index]!;
      rocket.life -= delta;
      if (rocket.life <= 0 || rocket.target.finished) {
        this.removeRocket(index);
        continue;
      }

      const targetPosition = rocket.target.group.position.clone().add(new THREE.Vector3(0, 0.75, 0));
      const direction = targetPosition.sub(rocket.mesh.position).normalize();
      rocket.mesh.position.addScaledVector(direction, rocket.speed * delta);
      rocket.mesh.lookAt(rocket.mesh.position.clone().add(direction));
      rocket.mesh.rotateX(Math.PI / 2);

      if (rocket.mesh.position.distanceToSquared(rocket.target.group.position) < 2.8) {
        const hit = rocket.target.applyHit(1.2);
        if (hit && rocket.target.isPlayer) this.options.onPlayerMessage('💥 ¡Te alcanzó un cohete!');
        if (hit && rocket.owner.isPlayer) this.options.onPlayerMessage(`💥 Golpe a ${rocket.target.character.name}`);
        this.removeRocket(index);
      }
    }
  }

  private dropTrap(owner: Kart): void {
    const backward = new THREE.Vector3(-Math.sin(owner.heading), 0, -Math.cos(owner.heading));
    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.85, 7),
      new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.7 }),
    );
    mesh.position.copy(owner.group.position).addScaledVector(backward, 2.4);
    mesh.position.y = 0.42;
    mesh.rotation.z = Math.PI;
    this.group.add(mesh);
    this.traps.push({ mesh, owner, life: 14 });
  }

  private updateTraps(delta: number, karts: readonly Kart[]): void {
    for (let index = this.traps.length - 1; index >= 0; index -= 1) {
      const trap = this.traps[index]!;
      trap.life -= delta;
      trap.mesh.rotation.y += delta * 1.8;
      if (trap.life <= 0) {
        this.removeTrap(index);
        continue;
      }

      for (const kart of karts) {
        if (kart === trap.owner || kart.finished) continue;
        if (kart.group.position.distanceToSquared(trap.mesh.position) < 3.2) {
          const hit = kart.applyHit(0.9);
          if (hit && kart.isPlayer) this.options.onPlayerMessage('🍌 ¡Pisaste una trampa!');
          this.removeTrap(index);
          break;
        }
      }
    }
  }

  private removeRocket(index: number): void {
    const rocket = this.rockets[index];
    if (!rocket) return;
    this.group.remove(rocket.mesh);
    rocket.mesh.geometry.dispose();
    (rocket.mesh.material as THREE.Material).dispose();
    this.rockets.splice(index, 1);
  }

  private removeTrap(index: number): void {
    const trap = this.traps[index];
    if (!trap) return;
    this.group.remove(trap.mesh);
    trap.mesh.geometry.dispose();
    (trap.mesh.material as THREE.Material).dispose();
    this.traps.splice(index, 1);
  }

  private randomItem(rank: number, racerCount: number): ItemKind {
    const trailing = clamp((rank - 1) / Math.max(1, racerCount - 1), 0, 1);
    const roll = Math.random();
    if (trailing > 0.55) {
      if (roll < 0.42) return 'rocket';
      if (roll < 0.76) return 'nitro';
      if (roll < 0.9) return 'shield';
      return 'trap';
    }
    if (roll < 0.34) return 'trap';
    if (roll < 0.59) return 'shield';
    if (roll < 0.81) return 'nitro';
    return 'rocket';
  }

  private itemIcon(item: ItemKind): string {
    return ({ nitro: '⚡ Nitro', rocket: '🚀 Cohete', shield: '🛡️ Escudo', trap: '🍌 Trampa' })[item];
  }
}
