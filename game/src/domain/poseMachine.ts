/** Chooses which camper pose to show. Display only: it never changes physics, fishing or saves. */
export type PoseName =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'cast'
  | 'fish-wait'
  | 'bite'
  | 'reel'
  | 'gather'
  | 'build'
  | 'swim'
  | 'dive';
export type ActionName = 'cast' | 'gather' | 'build';
export type FishingPhase = 'none' | 'waiting' | 'bite' | 'fight' | 'landed';
export interface PoseInput {
  swimming?: boolean;
  diving?: boolean;
  vx: number;
  vy: number;
  grounded: boolean;
  fishing: FishingPhase;
}
const ACTION_SECONDS: Record<ActionName, number> = {cast: 0.34, gather: 0.33, build: 0.5};
const LAND_SECONDS = 0.2;
const JUMP_RISE = -40;
/** Times are game-clock seconds, so pausing the game also freezes every pose transition. */
export class PoseMachine {
  name: PoseName = 'idle';
  since = 0;
  private airborne = false;
  private landUntil = 0;
  private action: ActionName | null = null;
  private actionStart = 0;
  private actionUntil = 0;
  /** Starts a timed action. Walking away cancels gather, build and cast immediately. */
  start(action: ActionName, clock: number) {
    this.action = action;
    this.actionStart = clock;
    this.actionUntil = clock + ACTION_SECONDS[action];
  }
  update(clock: number, input: PoseInput): PoseName {
    if (input.swimming) {
      this.airborne = false;
      this.action = null;
      this.landUntil = 0;
      return this.set(input.diving ? 'dive' : 'swim', clock);
    }
    const moving = Math.abs(input.vx) > 1;
    if (moving) this.action = null;
    if (!input.grounded) {
      this.airborne = true;
      this.set(input.vy < JUMP_RISE ? 'jump' : 'fall', clock);
      return this.name;
    }
    if (this.airborne) {
      this.airborne = false;
      this.landUntil = clock + LAND_SECONDS;
    }
    if (clock < this.landUntil) return this.set('land', clock);
    if (this.action && clock >= this.actionUntil) this.action = null;
    if (this.action && input.fishing !== 'bite' && input.fishing !== 'fight') {
      return this.set(this.action, this.actionStart);
    }
    if (input.fishing === 'bite') return this.set('bite', clock);
    if (input.fishing === 'fight' || input.fishing === 'landed') return this.set('reel', clock);
    if (input.fishing === 'waiting') return this.set('fish-wait', clock);
    return this.set(moving ? 'run' : 'idle', clock);
  }
  private set(name: PoseName, clock: number) {
    if (name !== this.name) {
      this.name = name;
      this.since = clock;
    }
    return name;
  }
}
