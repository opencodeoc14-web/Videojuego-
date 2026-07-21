import * as THREE from 'three';
import { wrap01 } from './math';
import type { TrackSample } from './types';

interface NearestTrackPoint extends TrackSample {
  lateral: number;
  distance: number;
}

export class RaceTrack {
  readonly group = new THREE.Group();
  readonly width = 15;
  readonly sampleCount = 320;
  readonly curve: THREE.CatmullRomCurve3;
  readonly length: number;

  private readonly points: THREE.Vector3[] = [];
  private readonly tangents: THREE.Vector3[] = [];
  private readonly normals: THREE.Vector3[] = [];

  constructor() {
    this.group.name = 'race-track';
    this.curve = new THREE.CatmullRomCurve3(
      [
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
      ],
      true,
      'centripetal',
      0.5,
    );

    this.curve.arcLengthDivisions = 1000;
    this.length = this.curve.getLength();
    this.buildSamples();
    this.buildMeshes();
  }

  sample(progress: number, lateral = 0, y = 0.65): TrackSample {
    const wrapped = wrap01(progress);
    const point = this.curve.getPointAt(wrapped);
    const tangent = this.curve.getTangentAt(wrapped).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    point.addScaledVector(normal, lateral);
    point.y = y;
    return { position: point, tangent, normal, progress: wrapped };
  }

  nearest(position: THREE.Vector3, hintProgress?: number): NearestTrackPoint {
    const total = this.sampleCount;
    const hintIndex = hintProgress === undefined
      ? -1
      : Math.round(wrap01(hintProgress) * total) % total;
    const searchRadius = hintIndex < 0 ? total : 48;

    let bestIndex = 0;
    let bestDistanceSq = Number.POSITIVE_INFINITY;

    for (let offset = -searchRadius; offset <= searchRadius; offset += 1) {
      const index = hintIndex < 0
        ? (offset + searchRadius) % total
        : (hintIndex + offset + total) % total;
      const point = this.points[index]!;
      const dx = position.x - point.x;
      const dz = position.z - point.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq < bestDistanceSq) {
        bestDistanceSq = distanceSq;
        bestIndex = index;
      }
    }

    const center = this.points[bestIndex]!.clone();
    const tangent = this.tangents[bestIndex]!.clone();
    const normal = this.normals[bestIndex]!.clone();
    const delta = position.clone().sub(center);
    const lateral = delta.dot(normal);

    return {
      position: center,
      tangent,
      normal,
      progress: bestIndex / total,
      lateral,
      distance: Math.sqrt(bestDistanceSq),
    };
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

  private buildSamples(): void {
    for (let index = 0; index < this.sampleCount; index += 1) {
      const progress = index / this.sampleCount;
      const point = this.curve.getPointAt(progress);
      const tangent = this.curve.getTangentAt(progress).normalize();
      this.points.push(point);
      this.tangents.push(tangent);
      this.normals.push(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize());
    }
  }

  private buildMeshes(): void {
    const grass = new THREE.Mesh(
      new THREE.CircleGeometry(94, 64),
      new THREE.MeshStandardMaterial({ color: 0x204f3a, roughness: 1 }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.12;
    grass.receiveShadow = true;
    this.group.add(grass);

    const outer = this.createRibbon(this.width + 3.2, -0.01, 0xedeff4);
    const road = this.createRibbon(this.width, 0.02, 0x30343f);
    outer.receiveShadow = true;
    road.receiveShadow = true;
    this.group.add(outer, road);

    const curbLeft = this.createCurb(-1);
    const curbRight = this.createCurb(1);
    this.group.add(curbLeft, curbRight);

    const dashMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.75 });
    for (let index = 0; index < this.sampleCount; index += 18) {
      const progress = index / this.sampleCount;
      const sample = this.sample(progress, 0, 0.08);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 2.8), dashMaterial);
      dash.position.copy(sample.position);
      dash.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
      dash.receiveShadow = true;
      this.group.add(dash);
    }

    this.addStartLine();
  }

  private createRibbon(width: number, y: number, color: number): THREE.Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];
    const halfWidth = width / 2;

    for (let index = 0; index <= this.sampleCount; index += 1) {
      const source = index % this.sampleCount;
      const point = this.points[source]!;
      const normal = this.normals[source]!;
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
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.02 });
    return new THREE.Mesh(geometry, material);
  }

  private createCurb(side: -1 | 1): THREE.Mesh {
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const innerOffset = side * (this.width / 2 - 0.35);
    const outerOffset = side * (this.width / 2 + 0.65);
    const red = new THREE.Color(0xff5d73);
    const white = new THREE.Color(0xf5f7fb);

    for (let index = 0; index <= this.sampleCount; index += 1) {
      const source = index % this.sampleCount;
      const point = this.points[source]!;
      const normal = this.normals[source]!;
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
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return new THREE.Mesh(geometry, material);
  }

  private addStartLine(): void {
    const sample = this.sample(0, 0, 0.105);
    const angle = Math.atan2(sample.tangent.x, sample.tangent.z);
    const tileSize = 1.25;
    const columns = 12;
    const rows = 2;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const lateral = (column - (columns - 1) / 2) * tileSize;
        const forward = (row - 0.5) * tileSize;
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(tileSize, 0.035, tileSize),
          new THREE.MeshStandardMaterial({
            color: (row + column) % 2 === 0 ? 0xf7f9fc : 0x151923,
            roughness: 0.8,
          }),
        );
        tile.position.copy(sample.position)
          .addScaledVector(sample.normal, lateral)
          .addScaledVector(sample.tangent, forward);
        tile.rotation.y = angle;
        this.group.add(tile);
      }
    }
  }
}
