import * as THREE from 'three';
import { wrap01 } from './characters.js';

export class RaceTrack {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'race-track';
    this.width = 15;
    this.sampleCount = 320;
    this.points = [];
    this.tangents = [];
    this.normals = [];
    this.curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-35, 0, 6),
      new THREE.Vector3(-38, 0, -19),
      new THREE.Vector3(-18, 0, -38),
      new THREE.Vector3(8, 0, -42),
      new THREE.Vector3(34, 0, -31),
      new THREE.Vector3(43, 0, -7),
      new THREE.Vector3(36, 0, 19),
      new THREE.Vector3(15, 0, 36),
      new THREE.Vector3(-13, 0, 35),
      new THREE.Vector3(-34, 0, 23),
    ], true, 'centripetal', 0.5);
    this.curve.arcLengthDivisions = 1000;
    this.length = this.curve.getLength();
    this.buildSamples();
    this.buildMeshes();
  }

  sample(progress, lateral = 0, y = 0.65) {
    const wrapped = wrap01(progress);
    const position = this.curve.getPointAt(wrapped);
    const tangent = this.curve.getTangentAt(wrapped).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    position.addScaledVector(normal, lateral);
    position.y = y;
    return { position, tangent, normal, progress: wrapped };
  }

  nearest(position, hintProgress) {
    const total = this.sampleCount;
    const hintIndex = hintProgress === undefined ? -1 : Math.round(wrap01(hintProgress) * total) % total;
    const radius = hintIndex < 0 ? total : 48;
    let bestIndex = 0;
    let bestDistanceSq = Infinity;
    for (let offset = -radius; offset <= radius; offset += 1) {
      const index = hintIndex < 0 ? (offset + radius) % total : (hintIndex + offset + total) % total;
      const point = this.points[index];
      const dx = position.x - point.x;
      const dz = position.z - point.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq < bestDistanceSq) {
        bestDistanceSq = distanceSq;
        bestIndex = index;
      }
    }
    const center = this.points[bestIndex].clone();
    const tangent = this.tangents[bestIndex].clone();
    const normal = this.normals[bestIndex].clone();
    const lateral = position.clone().sub(center).dot(normal);
    return { position: center, tangent, normal, progress: bestIndex / total, lateral, distance: Math.sqrt(bestDistanceSq) };
  }

  buildSamples() {
    for (let index = 0; index < this.sampleCount; index += 1) {
      const progress = index / this.sampleCount;
      const point = this.curve.getPointAt(progress);
      const tangent = this.curve.getTangentAt(progress).normalize();
      this.points.push(point);
      this.tangents.push(tangent);
      this.normals.push(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize());
    }
  }

  createRibbon(width, y, color) {
    const vertices = [];
    const indices = [];
    const halfWidth = width / 2;
    for (let index = 0; index <= this.sampleCount; index += 1) {
      const source = index % this.sampleCount;
      const point = this.points[source];
      const normal = this.normals[source];
      const left = point.clone().addScaledVector(normal, -halfWidth);
      const right = point.clone().addScaledVector(normal, halfWidth);
      vertices.push(left.x, y, left.z, right.x, y, right.z);
    }
    for (let index = 0; index < this.sampleCount; index += 1) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.02 }));
  }

  createCurb(side) {
    const vertices = [];
    const colors = [];
    const indices = [];
    const innerOffset = side * (this.width / 2 - 0.35);
    const outerOffset = side * (this.width / 2 + 0.65);
    const red = new THREE.Color(0xff5d73);
    const white = new THREE.Color(0xf5f7fb);
    for (let index = 0; index <= this.sampleCount; index += 1) {
      const source = index % this.sampleCount;
      const point = this.points[source];
      const normal = this.normals[source];
      const inner = point.clone().addScaledVector(normal, innerOffset);
      const outer = point.clone().addScaledVector(normal, outerOffset);
      vertices.push(inner.x, 0.075, inner.z, outer.x, 0.075, outer.z);
      const color = Math.floor(index / 5) % 2 === 0 ? red : white;
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
    for (let index = 0; index < this.sampleCount; index += 1) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
  }

  buildMeshes() {
    const grass = new THREE.Mesh(new THREE.CircleGeometry(94, 64), new THREE.MeshStandardMaterial({ color: 0x204f3a, roughness: 1 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.12;
    grass.receiveShadow = true;
    this.group.add(grass);

    const outer = this.createRibbon(this.width + 3.2, -0.01, 0xedeff4);
    const road = this.createRibbon(this.width, 0.02, 0x30343f);
    outer.receiveShadow = true;
    road.receiveShadow = true;
    this.group.add(outer, road, this.createCurb(-1), this.createCurb(1));

    const dashGeometry = new THREE.BoxGeometry(0.22, 0.05, 2.8);
    const dashMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.75 });
    for (let index = 0; index < this.sampleCount; index += 18) {
      const sample = this.sample(index / this.sampleCount, 0, 0.08);
      const dash = new THREE.Mesh(dashGeometry, dashMaterial);
      dash.position.copy(sample.position);
      dash.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
      this.group.add(dash);
    }
    this.addStartLine();
  }

  addStartLine() {
    const sample = this.sample(0, 0, 0.105);
    const angle = Math.atan2(sample.tangent.x, sample.tangent.z);
    const size = 1.25;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(size, 0.035, size), new THREE.MeshStandardMaterial({ color: (row + column) % 2 === 0 ? 0xf7f9fc : 0x151923, roughness: 0.8 }));
        tile.position.copy(sample.position)
          .addScaledVector(sample.normal, (column - 5.5) * size)
          .addScaledVector(sample.tangent, (row - 0.5) * size);
        tile.rotation.y = angle;
        this.group.add(tile);
      }
    }
  }
}

export class RaceWorld {
  constructor(scene, track) {
    this.group = new THREE.Group();
    scene.background = new THREE.Color(0x8fd7ff);
    scene.fog = new THREE.Fog(0x8fd7ff, 85, 175);
    scene.add(new THREE.HemisphereLight(0xc8efff, 0x294426, 2.1));
    const sun = new THREE.DirectionalLight(0xfff3d8, 2.8);
    sun.position.set(-45, 70, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 10, far: 180 });
    scene.add(sun);
    this.addTrees(track);
    this.addStartArch(track);
    this.addClouds();
    this.addMountains();
    scene.add(this.group);
  }

  addTrees(track) {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x71452b, roughness: 1 });
    const leafMaterials = [0x2f8052, 0x3b9960, 0x256b48].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
    const trunkGeometry = new THREE.CylinderGeometry(0.28, 0.42, 2.6, 7);
    const leafGeometry = new THREE.ConeGeometry(1.55, 3.8, 8);
    for (let index = 0; index < 78; index += 1) {
      const angle = index / 78 * Math.PI * 2 + Math.sin(index * 1.7) * 0.08;
      const radius = 54 + index % 5 * 4.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (track.nearest(new THREE.Vector3(x, 0, z)).distance < track.width * 0.78 + 3) continue;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.3;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(leafGeometry, leafMaterials[index % leafMaterials.length]);
      leaves.position.y = 3.9;
      leaves.castShadow = true;
      tree.add(trunk, leaves);
      tree.scale.setScalar(0.75 + index % 7 * 0.055);
      tree.position.set(x, -0.02, z);
      this.group.add(tree);
    }
  }

  addStartArch(track) {
    const sample = track.sample(0, 0, 0);
    const arch = new THREE.Group();
    const dark = new THREE.MeshStandardMaterial({ color: 0x10182f, roughness: 0.45, metalness: 0.25 });
    const green = new THREE.MeshStandardMaterial({ color: 0x59e39f, emissive: 0x123b2a, emissiveIntensity: 0.45 });
    for (const x of [-8.2, 8.2]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 7.5, 0.85), dark);
      pillar.position.set(x, 3.75, 0);
      arch.add(pillar);
    }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(17.4, 1.55, 0.7), green);
    banner.position.y = 7.1;
    arch.add(banner);
    arch.position.copy(sample.position);
    arch.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.group.add(arch);
  }

  addClouds() {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.78, depthWrite: false });
    const geometry = new THREE.SphereGeometry(1, 12, 8);
    for (let index = 0; index < 9; index += 1) {
      const cloud = new THREE.Group();
      cloud.userData.cloud = true;
      for (let part = 0; part < 5; part += 1) {
        const puff = new THREE.Mesh(geometry, material);
        puff.position.set((part - 2) * 1.4, Math.sin(part) * 0.45, part % 2 * 0.45);
        puff.scale.set(1.5 + part % 2 * 0.6, 0.9 + part % 3 * 0.25, 1.1);
        cloud.add(puff);
      }
      cloud.position.set(-80 + index * 20, 25 + index % 3 * 7, -55 + index % 5 * 26);
      this.group.add(cloud);
    }
  }

  addMountains() {
    const colors = [0x607d8b, 0x78909c, 0x546e7a];
    for (let index = 0; index < 18; index += 1) {
      const angle = index / 18 * Math.PI * 2;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(12 + index % 4 * 3, 28 + index % 5 * 4, 5), new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 1 }));
      mountain.position.set(Math.cos(angle) * 112, 8, Math.sin(angle) * 112);
      mountain.rotation.y = angle + index;
      this.group.add(mountain);
    }
  }

  update(time) {
    for (const child of this.group.children) {
      if (child.userData.cloud) {
        child.position.x += 0.006;
        if (child.position.x > 95) child.position.x = -95;
        child.rotation.y = Math.sin(time * 0.00015 + child.position.z) * 0.1;
      }
    }
  }
}
