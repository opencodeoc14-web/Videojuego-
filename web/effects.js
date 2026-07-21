import * as THREE from 'three';
import { clamp } from './characters.js';

const MAX_PARTICLES = 280;

export class EffectsSystem {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'race-effects';
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      position: new THREE.Vector3(0, -999, 0),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      color: new THREE.Color(0xffffff),
      gravity: 0,
      drag: 1,
    }));
    this.cursor = 0;
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.material = new THREE.PointsMaterial({
      size: 0.34,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    scene.add(this.group);
    this.clear();
  }

  spawn(position, velocity, color, life = 0.55, gravity = 0, drag = 0.92) {
    const particle = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    particle.active = true;
    particle.position.copy(position);
    particle.velocity.copy(velocity);
    particle.life = life;
    particle.maxLife = life;
    particle.color.set(color);
    particle.gravity = gravity;
    particle.drag = drag;
  }

  burst(position, color, count = 18, speed = 8, life = 0.6) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * 0.9 + 0.15;
      const magnitude = speed * (0.35 + Math.random() * 0.75);
      const velocity = new THREE.Vector3(
        Math.cos(angle) * magnitude,
        elevation * magnitude,
        Math.sin(angle) * magnitude,
      );
      this.spawn(position, velocity, color, life * (0.65 + Math.random() * 0.65), 10, 0.9);
    }
  }

  boostTrail(kart, delta) {
    const emissions = Math.max(1, Math.floor(delta * 55));
    const backward = new THREE.Vector3(-Math.sin(kart.heading), 0, -Math.cos(kart.heading));
    for (let index = 0; index < emissions; index += 1) {
      const position = kart.group.position.clone()
        .addScaledVector(backward, 1.6)
        .add(new THREE.Vector3((Math.random() - 0.5) * 1.1, 0.35 + Math.random() * 0.28, (Math.random() - 0.5) * 0.4));
      const velocity = backward.clone().multiplyScalar(6 + Math.random() * 5);
      velocity.y = 0.5 + Math.random() * 1.4;
      this.spawn(position, velocity, Math.random() > 0.45 ? 0x4cc9f0 : 0x59e39f, 0.24 + Math.random() * 0.22, 0, 0.86);
    }
  }

  driftSparks(kart, tier, delta) {
    if (tier <= 0 || Math.random() > delta * 34) return;
    const color = tier === 1 ? 0x4cc9f0 : tier === 2 ? 0xffa62b : 0xd56bff;
    const side = Math.random() > 0.5 ? -1 : 1;
    const local = new THREE.Vector3(side * 1.05, 0.2, -1.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), kart.heading);
    const position = kart.group.position.clone().add(local);
    const velocity = new THREE.Vector3((Math.random() - 0.5) * 4, 1 + Math.random() * 3, (Math.random() - 0.5) * 4);
    this.spawn(position, velocity, color, 0.25 + Math.random() * 0.25, 8, 0.88);
  }

  dust(kart, delta) {
    if (!kart.offRoad || Math.random() > delta * 18) return;
    const backward = new THREE.Vector3(-Math.sin(kart.heading), 0, -Math.cos(kart.heading));
    const position = kart.group.position.clone().addScaledVector(backward, 1.5).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.15, 0));
    const velocity = backward.multiplyScalar(2 + Math.random() * 3);
    velocity.y = 0.4 + Math.random();
    this.spawn(position, velocity, 0xc7aa7b, 0.5 + Math.random() * 0.35, 1.8, 0.9);
  }

  update(delta) {
    const positionAttribute = this.geometry.getAttribute('position');
    const colorAttribute = this.geometry.getAttribute('color');
    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      const particle = this.particles[index];
      const offset = index * 3;
      if (!particle.active) {
        this.positions[offset] = 0;
        this.positions[offset + 1] = -999;
        this.positions[offset + 2] = 0;
        this.colors[offset] = 0;
        this.colors[offset + 1] = 0;
        this.colors[offset + 2] = 0;
        continue;
      }

      particle.life -= delta;
      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }

      particle.velocity.y -= particle.gravity * delta;
      particle.velocity.multiplyScalar(Math.pow(particle.drag, delta * 60));
      particle.position.addScaledVector(particle.velocity, delta);
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      this.positions[offset] = particle.position.x;
      this.positions[offset + 1] = particle.position.y;
      this.positions[offset + 2] = particle.position.z;
      this.colors[offset] = particle.color.r * alpha;
      this.colors[offset + 1] = particle.color.g * alpha;
      this.colors[offset + 2] = particle.color.b * alpha;
    }
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }

  clear() {
    for (const particle of this.particles) particle.active = false;
    this.positions.fill(0);
    for (let index = 1; index < this.positions.length; index += 3) this.positions[index] = -999;
    this.colors.fill(0);
    this.geometry.getAttribute('position').needsUpdate = true;
    this.geometry.getAttribute('color').needsUpdate = true;
  }

  dispose(scene) {
    scene.remove(this.group);
    this.geometry.dispose();
    this.material.dispose();
  }
}
