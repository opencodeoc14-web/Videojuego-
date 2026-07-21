import type * as THREE from 'three';

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: number;
  accent: string;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  weight: number;
}

export type ItemKind = 'nitro' | 'rocket' | 'shield' | 'trap';

export interface DriverInput {
  steer: number;
  throttle: number;
  brake: number;
  drift: boolean;
  useItem: boolean;
}

export interface TrackSample {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  progress: number;
}

export interface RaceStanding {
  id: string;
  name: string;
  emoji: string;
  lap: number;
  progress: number;
  finished: boolean;
  finishTime: number | null;
  isPlayer: boolean;
}

export interface Disposable {
  dispose(): void;
}
