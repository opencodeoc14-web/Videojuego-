import * as THREE from 'three';
import type { RaceTrack } from './track';

export class RaceWorld {
  readonly group = new THREE.Group();

  constructor(scene: THREE.Scene, track: RaceTrack) {
    scene.background = new THREE.Color(0x8fd7ff);
    scene.fog = new THREE.Fog(0x8fd7ff, 85, 175);

    const hemisphere = new THREE.HemisphereLight(0xc8efff, 0x294426, 2.1);
    scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xfff3d8, 2.8);
    sun.position.set(-45, 70, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -85;
    sun.shadow.camera.right = 85;
    sun.shadow.camera.top = 85;
    sun.shadow.camera.bottom = -85;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 180;
    scene.add(sun);

    this.addTrees(track);
    this.addGrandstands(track);
    this.addStartArch(track);
    this.addClouds();
    this.addMountains();
    scene.add(this.group);
  }

  update(time: number): void {
    for (const child of this.group.children) {
      if (child.userData['cloud'] === true) {
        child.position.x += 0.006;
        if (child.position.x > 95) child.position.x = -95;
        child.rotation.y = Math.sin(time * 0.00015 + child.position.z) * 0.1;
      }
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

  private addTrees(track: RaceTrack): void {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x71452b, roughness: 1 });
    const leafMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x2f8052, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: 0x3b9960, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: 0x256b48, roughness: 0.95 }),
    ];
    const trunkGeometry = new THREE.CylinderGeometry(0.28, 0.42, 2.6, 7);
    const leafGeometry = new THREE.ConeGeometry(1.55, 3.8, 8);

    for (let index = 0; index < 78; index += 1) {
      const angle = (index / 78) * Math.PI * 2 + Math.sin(index * 1.7) * 0.08;
      const radius = 54 + (index % 5) * 4.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const nearest = track.nearest(new THREE.Vector3(x, 0, z));
      if (nearest.distance < track.width * 0.78 + 3) continue;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.3;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(leafGeometry, leafMaterials[index % leafMaterials.length]!);
      leaves.position.y = 3.9;
      leaves.castShadow = true;
      tree.add(trunk, leaves);
      const scale = 0.75 + (index % 7) * 0.055;
      tree.scale.setScalar(scale);
      tree.position.set(x, -0.02, z);
      tree.rotation.y = angle;
      this.group.add(tree);
    }
  }

  private addGrandstands(track: RaceTrack): void {
    const standMaterial = new THREE.MeshStandardMaterial({ color: 0x25304b, roughness: 0.8 });
    const seatColors = [0xff5d73, 0x4cc9f0, 0xffd166, 0x59e39f, 0x9b5de5];

    for (const [progress, lateral] of [[0.02, -16], [0.04, 17]] as const) {
      const sample = track.sample(progress, lateral, 0);
      const stand = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(14, 3.2, 5), standMaterial);
      base.position.y = 1.6;
      base.castShadow = true;
      stand.add(base);

      for (let row = 0; row < 3; row += 1) {
        for (let seat = 0; seat < 11; seat += 1) {
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.72, 0.58, 0.72),
            new THREE.MeshStandardMaterial({ color: seatColors[(seat + row * 2) % seatColors.length]!, roughness: 0.7 }),
          );
          cube.position.set((seat - 5) * 1.05, 2.6 + row * 0.78, 1.4 - row * 0.82);
          stand.add(cube);
        }
      }

      stand.position.copy(sample.position);
      stand.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
      this.group.add(stand);
    }
  }

  private addStartArch(track: RaceTrack): void {
    const sample = track.sample(0, 0, 0);
    const arch = new THREE.Group();
    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x10182f, roughness: 0.45, metalness: 0.25 });
    const bannerMaterial = new THREE.MeshStandardMaterial({ color: 0x59e39f, emissive: 0x123b2a, emissiveIntensity: 0.45 });

    for (const x of [-8.2, 8.2]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 7.5, 0.85), pillarMaterial);
      pillar.position.set(x, 3.75, 0);
      pillar.castShadow = true;
      arch.add(pillar);
    }

    const banner = new THREE.Mesh(new THREE.BoxGeometry(17.4, 1.55, 0.7), bannerMaterial);
    banner.position.y = 7.1;
    banner.castShadow = true;
    arch.add(banner);

    const checks = new THREE.Group();
    for (let index = 0; index < 16; index += 1) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.42, 0.73),
        new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? 0xffffff : 0x141923 }),
      );
      tile.position.set((index - 7.5) * 1.02, 7.1, 0.38);
      checks.add(tile);
    }
    arch.add(checks);
    arch.position.copy(sample.position);
    arch.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.group.add(arch);
  }

  private addClouds(): void {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.78, depthWrite: false });
    const geometry = new THREE.SphereGeometry(1, 12, 8);
    for (let index = 0; index < 9; index += 1) {
      const cloud = new THREE.Group();
      cloud.userData['cloud'] = true;
      for (let part = 0; part < 5; part += 1) {
        const puff = new THREE.Mesh(geometry, material);
        puff.position.set((part - 2) * 1.4, Math.sin(part) * 0.45, (part % 2) * 0.45);
        puff.scale.set(1.5 + (part % 2) * 0.6, 0.9 + (part % 3) * 0.25, 1.1);
        cloud.add(puff);
      }
      cloud.position.set(-80 + index * 20, 25 + (index % 3) * 7, -55 + (index % 5) * 26);
      cloud.scale.setScalar(1.1 + (index % 4) * 0.18);
      this.group.add(cloud);
    }
  }

  private addMountains(): void {
    const colors = [0x607d8b, 0x78909c, 0x546e7a];
    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(12 + (index % 4) * 3, 28 + (index % 5) * 4, 5),
        new THREE.MeshStandardMaterial({ color: colors[index % colors.length]!, roughness: 1 }),
      );
      mountain.position.set(Math.cos(angle) * 112, 8, Math.sin(angle) * 112);
      mountain.rotation.y = angle + index;
      this.group.add(mountain);
    }
  }
}
