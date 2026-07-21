import * as THREE from 'three';
import { clamp, damp, shortestAngle } from './math';
import type { CharacterDef, DriverInput, ItemKind } from './types';
import type { RaceTrack } from './track';

export class Kart {
  readonly group = new THREE.Group();
  readonly velocity = new THREE.Vector3();
  readonly id: string;
  readonly character: CharacterDef;
  readonly isPlayer: boolean;

  speed = 0;
  heading = 0;
  progress = 0;
  previousProgress = 0;
  completedLaps = 0;
  finished = false;
  finishTime: number | null = null;
  item: ItemKind | null = null;
  shieldTimer = 0;
  boostTimer = 0;
  stunTimer = 0;
  driftCharge = 0;
  lateral = 0;
  offRoad = false;
  itemCooldown = 0;

  private readonly bodyPivot = new THREE.Group();
  private readonly wheels: THREE.Mesh[] = [];
  private readonly shieldMesh: THREE.Mesh;
  private readonly flames: THREE.Mesh[] = [];
  private visualSteer = 0;

  constructor(id: string, character: CharacterDef, isPlayer: boolean) {
    this.id = id;
    this.character = character;
    this.isPlayer = isPlayer;
    this.group.name = `kart-${id}`;
    this.group.add(this.bodyPivot);
    this.buildModel();

    const shieldGeometry = new THREE.SphereGeometry(1.65, 18, 12);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x65dfff,
      transparent: true,
      opacity: 0.22,
      wireframe: true,
      depthWrite: false,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.shieldMesh.position.y = 0.75;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);
  }

  place(track: RaceTrack, progress: number, lateral: number): void {
    const sample = track.sample(progress, lateral, 0.48);
    this.group.position.copy(sample.position);
    this.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.group.rotation.y = this.heading;
    this.progress = sample.progress;
    this.previousProgress = sample.progress;
    this.lateral = lateral;
  }

  update(input: DriverInput, track: RaceTrack, delta: number, canDrive: boolean): void {
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
    const boostMultiplier = this.boostTimer > 0 ? 1.32 : 1;
    const roadMultiplier = this.offRoad ? 0.56 : 1;
    const maxForward = baseMaxSpeed * boostMultiplier * roadMultiplier;
    const maxReverse = -8;

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

    const acceleration = 18.5 * this.character.acceleration;
    if (throttle > 0) this.speed += acceleration * throttle * delta;
    if (brake > 0) this.speed -= (this.speed > 0 ? 29 : 11) * brake * delta;
    if (throttle === 0 && brake === 0) this.speed = damp(this.speed, 0, this.offRoad ? 1.9 : 0.55, delta);

    this.speed = clamp(this.speed, maxReverse, maxForward);

    const speedRatio = clamp(Math.abs(this.speed) / Math.max(1, baseMaxSpeed), 0.12, 1);
    const drifting = input.drift && Math.abs(steer) > 0.24 && this.speed > 10 && !this.offRoad;
    const turnRate = (drifting ? 2.05 : 1.48) * this.character.handling;
    this.heading += steer * turnRate * speedRatio * delta * (this.speed >= 0 ? 1 : -1);

    if (drifting) {
      this.driftCharge = clamp(this.driftCharge + delta * (0.45 + Math.abs(steer) * 0.65), 0, 1.35);
      this.speed *= Math.pow(0.986, delta * 60);
    } else if (this.driftCharge > 0) {
      if (this.driftCharge > 0.48) this.boostTimer = Math.max(this.boostTimer, 0.35 + this.driftCharge * 0.55);
      this.driftCharge = 0;
    }

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.velocity.copy(forward).multiplyScalar(this.speed);
    this.group.position.addScaledVector(this.velocity, delta);
    this.group.position.y = 0.48;

    const nearest = track.nearest(this.group.position, this.progress);
    this.previousProgress = this.progress;
    this.progress = nearest.progress;
    this.lateral = nearest.lateral;

    if (this.previousProgress > 0.86 && this.progress < 0.14 && this.speed > 1 && canDrive) {
      this.completedLaps += 1;
    }

    if (nearest.distance > 25) this.resetToTrack(track);

    this.updateVisuals(steer, drifting, delta);
  }

  steerToward(target: THREE.Vector3): number {
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    const targetHeading = Math.atan2(dx, dz);
    return clamp(shortestAngle(this.heading, targetHeading) * 1.9, -1, 1);
  }

  grantItem(item: ItemKind): boolean {
    if (this.item !== null || this.itemCooldown > 0 || this.finished) return false;
    this.item = item;
    return true;
  }

  consumeItem(): ItemKind | null {
    const item = this.item;
    this.item = null;
    this.itemCooldown = 0.8;
    return item;
  }

  applyHit(strength = 1): boolean {
    if (this.shieldTimer > 0 || this.finished) return false;
    this.speed *= Math.max(0.2, 0.55 - strength * 0.08);
    this.stunTimer = Math.max(this.stunTimer, 0.55 + strength * 0.3);
    return true;
  }

  addBoost(seconds: number): void {
    this.boostTimer = Math.max(this.boostTimer, seconds);
    this.speed = Math.max(this.speed, 23 * this.character.maxSpeed);
  }

  setShield(seconds: number): void {
    this.shieldTimer = Math.max(this.shieldTimer, seconds);
  }

  raceScore(): number {
    return this.completedLaps + this.progress;
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

  private resetToTrack(track: RaceTrack): void {
    const sample = track.sample(this.progress, clamp(this.lateral, -track.width * 0.32, track.width * 0.32), 0.48);
    this.group.position.copy(sample.position);
    this.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.speed *= 0.45;
  }

  private updateVisuals(steer: number, drifting: boolean, delta: number): void {
    this.visualSteer = damp(this.visualSteer, steer, 10, delta);
    this.group.rotation.y = this.heading;
    this.bodyPivot.rotation.z = damp(this.bodyPivot.rotation.z, -this.visualSteer * 0.1, 8, delta);
    this.bodyPivot.rotation.x = damp(
      this.bodyPivot.rotation.x,
      this.boostTimer > 0 ? -0.055 : clamp(-this.speed / 500, -0.04, 0.04),
      7,
      delta,
    );

    for (const wheel of this.wheels) {
      wheel.rotation.x -= this.speed * delta * 1.9;
    }

    const frontLeft = this.wheels[0];
    const frontRight = this.wheels[1];
    if (frontLeft) frontLeft.rotation.y = this.visualSteer * 0.38;
    if (frontRight) frontRight.rotation.y = this.visualSteer * 0.38;

    for (const flame of this.flames) {
      flame.visible = this.boostTimer > 0;
      const pulse = 0.75 + Math.random() * 0.5;
      flame.scale.setScalar(pulse);
    }

    const bodyScale = drifting ? 1.03 : 1;
    this.bodyPivot.scale.set(bodyScale, 1, bodyScale);
  }

  private buildModel(): void {
    const paint = new THREE.MeshStandardMaterial({
      color: this.character.color,
      roughness: 0.42,
      metalness: 0.08,
    });
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
    nose.rotation.x = -0.08;
    nose.castShadow = true;
    this.bodyPivot.add(nose);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.48, 1.1), dark);
    cockpit.position.set(0, 0.83, -0.2);
    cockpit.castShadow = true;
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
    head.castShadow = true;
    this.bodyPivot.add(head);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.47, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.57),
      paint,
    );
    helmet.position.set(0, 1.64, -0.36);
    helmet.rotation.x = -0.12;
    helmet.castShadow = true;
    this.bodyPivot.add(helmet);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.2), metal);
    bumper.position.set(0, 0.38, 1.78);
    this.bodyPivot.add(bumper);

    const wheelGeometry = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 14);
    const wheelPositions: ReadonlyArray<readonly [number, number, number]> = [
      [-1.18, 0.42, 1.02],
      [1.18, 0.42, 1.02],
      [-1.18, 0.42, -1.02],
      [1.18, 0.42, -1.02],
    ];
    for (const [x, y, z] of wheelPositions) {
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

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.43;
    shadow.scale.set(1, 1.5, 1);
    this.group.add(shadow);
  }
}
