import {rollFish} from '../../domain/camping.ts';
import {hash01} from '../../domain/tilemap/random.ts';
import {fishBehavior} from '../../data/fishBehavior.ts';
import type {WaterArea, WaterProbe} from '../../domain/aquatic/water.ts';
import type {Period} from '../../domain/dayTime.ts';
import type {Habitat, fishSpecies} from '../../data/catalog.ts';
type FishSpecies = (typeof fishSpecies)[number];

export interface FishBot {
  id: string;
  waterId: string;
  habitat: Habitat;
  generation: number;
  removed: boolean;
  species: FishSpecies;
  length: number;
  x: number;
  y: number;
  homeX: number;
  direction: number;
  phase: number;
  mode: 'cruise' | 'flee' | 'lure' | 'hooked' | 'rest';
  cooldown: number;
  hooked: boolean;
}
export interface FishLure {
  waterId: string;
  x: number;
  y: number;
}
/** Cá tự bơi: chỉ mô phỏng gần camera, theo biên nước thật, mỗi lần câu nhắm một cá thể. */
export class FishSchoolSystem {
  readonly fish: FishBot[] = [];
  readonly visible: FishBot[] = [];
  updated = 0;
  private target: FishBot | null = null;
  private readonly probe: WaterProbe;
  constructor(areas: readonly WaterArea[], probe: WaterProbe) {
    this.probe = probe;
    for (const area of areas) {
      const count = Math.max(3, Math.ceil(area.width / 110));
      for (let i = 0; i < count; i++) {
        const x = area.x + 24 + ((area.width - 48) * (i + 0.5)) / count;
        const water = probe(x);
        if (!water || water.bed - water.top < 28) continue;
        const caught = rollFish(
          area.habitat,
          hash01(912, x, i),
          hash01(913, x, i),
          1,
          hash01(915, x, i) > 0.5 ? 'night' : 'day',
        );
        const depth = fishBehavior(caught.species.id).depth;
        this.fish.push({
          id: area.id + '-fish-' + i,
          waterId: area.id,
          habitat: area.habitat,
          generation: 0,
          removed: false,
          species: caught.species,
          length: caught.length,
          x,
          homeX: x,
          y: water.top + 14 + (water.bed - water.top - 28) * depth,
          direction: i % 2 ? 1 : -1,
          phase: hash01(914, x, i) * Math.PI * 2,
          mode: 'cruise',
          cooldown: 0,
          hooked: false,
        });
      }
    }
  }
  reserve(lure: FishLure, period: Period = 'day', luck = 1, random = Math.random()) {
    this.release(false);
    const candidates = this.fish.filter(
      (fish) =>
        fish.waterId === lure.waterId &&
        fish.cooldown <= 0 &&
        fish.species.activeAt.includes(period) &&
        Math.abs(fish.x - lure.x) < 450,
    );
    const weights = candidates.map((fish) => {
      const tier = ['Thường', 'Ít gặp', 'Hiếm', 'Rất hiếm'].indexOf(fish.species.rarity);
      return (1 + Math.max(0, tier) * (luck - 1)) / (40 + Math.abs(fish.x - lure.x));
    });
    let draw = Math.max(0, Math.min(0.999999, random)) * weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < candidates.length; i++) {
      draw -= weights[i];
      if (draw <= 0) {
        this.target = candidates[i];
        break;
      }
    }
    return this.target;
  }
  release(caught: boolean) {
    if (!this.target) return;
    if (caught) {
      const index = this.visible.indexOf(this.target);
      if (index >= 0) this.visible.splice(index, 1);
    }
    this.target.removed = caught;
    this.target.cooldown = caught ? 40 : 4;
    this.target.mode = 'rest';
    this.target.hooked = false;
    this.target = null;
  }
  atLure(lure: FishLure) {
    return Boolean(this.target && Math.hypot(this.target.x - lure.x, this.target.y - lure.y - 30) < 38);
  }
  hook() {
    if (this.target) this.target.hooked = true;
  }
  update(
    dt: number,
    clock: number,
    player: {x: number; y: number; wet: boolean},
    view: {left: number; right: number},
    lure: FishLure | null,
    period: Period = 'day',
  ) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.1);
    this.updated = 0;
    this.visible.length = 0;
    for (const fish of this.fish) {
      fish.cooldown = Math.max(0, fish.cooldown - dt);
      if (fish.removed) {
        if (fish.cooldown > 0) continue;
        this.respawn(fish, period);
      }
      if (fish !== this.target && (fish.x < view.left - 256 || fish.x > view.right + 256)) continue;
      this.updated++;
      this.move(fish, dt, clock, player, lure);
      this.visible.push(fish);
    }
  }
  private respawn(fish: FishBot, period: Period) {
    fish.generation++;
    const caught = rollFish(
      fish.habitat,
      hash01(920 + fish.generation, fish.homeX, 0),
      hash01(921 + fish.generation, fish.homeX, 1),
      1,
      period,
    );
    fish.species = caught.species;
    fish.length = caught.length;
    fish.id = fish.waterId + '-fish-' + fish.homeX + '-' + fish.generation;
    fish.x = fish.homeX;
    const water = this.probe(fish.x)!;
    fish.y = water.top + 14 + (water.bed - water.top - 28) * fishBehavior(fish.species.id).depth;
    fish.removed = false;
    fish.mode = 'cruise';
  }
  private move(
    fish: FishBot,
    dt: number,
    clock: number,
    player: {x: number; y: number; wet: boolean},
    lure: FishLure | null,
  ) {
    const water = this.probe(fish.x);
    if (!water) return;
    const profile = fishBehavior(fish.species.id);
    let vx = fish.direction * profile.speed;
    let vy = Math.sin(clock * 1.7 + fish.phase) * 10;
    const startled = player.wet && Math.hypot(fish.x - player.x, fish.y - player.y + 30) < profile.shy;
    fish.mode = fish.cooldown > 0 ? 'rest' : 'cruise';
    if (fish === this.target && lure) {
      fish.mode = fish.hooked ? 'hooked' : 'lure';
      const tx = lure.x + (fish.hooked ? Math.sin(clock * 8) * 16 : 0);
      const ty = lure.y + (fish.hooked ? 12 : 30);
      vx = Math.max(-85, Math.min(85, (tx - fish.x) * 2));
      vy = Math.max(-65, Math.min(65, (ty - fish.y) * 2));
    } else if (startled) {
      fish.mode = 'flee';
      vx = (fish.x >= player.x ? 1 : -1) * profile.speed * 2.8;
      vy = 18;
    } else if (Math.abs(fish.x - fish.homeX) > 140) vx = Math.sign(fish.homeX - fish.x) * profile.speed;
    const nx = fish.x + vx * dt;
    const next = this.probe(nx + Math.sign(vx) * 36);
    if (!next || fish.y < next.top + 14 || fish.y > next.bed - 14) {
      fish.direction *= -1;
    } else {
      fish.x = nx;
      if (Math.abs(vx) > 1) fish.direction = Math.sign(vx);
    }
    const column = this.probe(fish.x)!;
    fish.y = Math.max(column.top + 14, Math.min(column.bed - 14, fish.y + vy * dt));
  }
}
