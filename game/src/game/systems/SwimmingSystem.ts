import type {WaterProbe} from '../../domain/aquatic/water.ts';

export const BREATH_SECONDS = 24;
const FLOAT_DEPTH = 46;
export interface SwimInput {
  horizontal: number;
  vertical: number;
  jump: boolean;
}
export interface Swimmer {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
/** Điều khiển trong nước thuần: không đổi Save, không phụ thuộc physics hoặc UI. */
export class SwimmingSystem {
  active = false;
  submerged = false;
  air = BREATH_SECONDS;
  surfacing = false;
  private cooldown = 0;
  private readonly water: WaterProbe;
  constructor(water: WaterProbe) {
    this.water = water;
  }
  reset() {
    this.active = this.submerged = this.surfacing = false;
    this.air = BREATH_SECONDS;
    this.cooldown = 0;
  }
  update(dt: number, body: Swimmer, input: SwimInput): Swimmer | null {
    if (!Number.isFinite(dt) || dt <= 0) return null;
    dt = Math.min(dt, 0.1);
    this.cooldown = Math.max(0, this.cooldown - dt);
    const column = this.water(body.x);
    if (!column) {
      this.reset();
      return null;
    }
    if (!this.active) {
      const entering = body.y >= column.top + 8 || (input.vertical > 0 && body.y >= column.top - 12);
      if (!entering || this.cooldown > 0) return null;
      this.active = true;
    }
    const floating = Math.min(column.bed - 2, column.top + FLOAT_DEPTH);
    if (input.jump && !this.surfacing && body.y <= floating + 5) {
      this.active = this.submerged = false;
      this.cooldown = 0.28;
      return {x: body.x, y: column.top - 1, vx: input.horizontal * 180, vy: -420};
    }
    let vx = input.horizontal * 145;
    let vy = this.surfacing ? -135 : input.vertical * 115;
    if (!input.vertical && !this.surfacing) vy = Math.max(-60, Math.min(60, (floating - body.y) * 2));
    if (vx && vy) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    const nextX = body.x + vx * dt;
    const side = this.water(nextX + Math.sign(vx) * 12);
    const next = this.water(nextX);
    const canMove = next && side && body.y <= Math.min(next.bed, side.bed) - 2;
    const x = canMove ? nextX : body.x;
    if (!canMove) vx = 0;
    const bounds = this.water(x)!;
    const minY = Math.min(bounds.bed - 2, bounds.top + FLOAT_DEPTH);
    const y = Math.max(minY, Math.min(bounds.bed - 2, body.y + vy * dt));
    this.submerged = y - 62 > bounds.top;
    if (this.submerged) {
      this.air = Math.max(0, this.air - dt);
      if (this.air === 0) this.surfacing = true;
    } else {
      this.air = Math.min(BREATH_SECONDS, this.air + dt * 8);
      if (this.air >= BREATH_SECONDS && input.vertical <= 0) this.surfacing = false;
    }
    return {x, y, vx, vy: y === body.y ? 0 : vy};
  }
}
