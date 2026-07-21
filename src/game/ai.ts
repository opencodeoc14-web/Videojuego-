import { clamp, shortestAngle, wrap01 } from './math';
import type { DriverInput } from './types';
import type { RaceTrack } from './track';
import type { Kart } from './kart';

export class AIController {
  private readonly kart: Kart;
  private readonly laneBias: number;
  private readonly skill: number;
  private itemDecision = 1 + Math.random() * 2;
  private weaveTime = Math.random() * 10;

  constructor(kart: Kart, laneBias: number, skill: number) {
    this.kart = kart;
    this.laneBias = laneBias;
    this.skill = skill;
  }

  sample(track: RaceTrack, delta: number, rank: number, racerCount: number): DriverInput {
    this.weaveTime += delta;
    this.itemDecision -= delta;

    const speedLookAhead = 0.018 + Math.abs(this.kart.speed) / Math.max(1, track.length) * 0.62;
    const lookAhead = clamp(speedLookAhead, 0.018, 0.075);
    const desiredLane = this.laneBias + Math.sin(this.weaveTime * 0.42) * 0.65;
    const target = track.sample(wrap01(this.kart.progress + lookAhead), desiredLane, 0.48);
    const farther = track.sample(wrap01(this.kart.progress + lookAhead * 2.15), desiredLane, 0.48);

    const steer = this.kart.steerToward(target.position);
    const currentHeading = Math.atan2(target.tangent.x, target.tangent.z);
    const futureHeading = Math.atan2(farther.tangent.x, farther.tangent.z);
    const curve = Math.abs(shortestAngle(currentHeading, futureHeading));

    const trailingRatio = clamp((rank - 1) / Math.max(1, racerCount - 1), 0, 1);
    const rubberBand = 0.94 + trailingRatio * 0.16;
    const caution = curve > 0.6 ? 0.66 : curve > 0.34 ? 0.82 : 1;
    const throttle = clamp(caution * rubberBand * this.skill, 0.58, 1);
    const brake = curve > 0.72 && this.kart.speed > 24 ? 0.35 : 0;
    const drift = curve > 0.32 && this.kart.speed > 13 && Math.abs(steer) > 0.3;

    let useItem = false;
    if (this.kart.item && this.itemDecision <= 0) {
      const chance = this.kart.item === 'rocket' ? 0.78 : this.kart.item === 'trap' ? 0.55 : 0.88;
      useItem = Math.random() < chance;
      this.itemDecision = 1.2 + Math.random() * 2.7;
    }

    return { steer, throttle, brake, drift, useItem };
  }
}
