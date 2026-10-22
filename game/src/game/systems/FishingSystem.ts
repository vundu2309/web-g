import {periodAt, type Period} from '../../domain/dayTime.ts';
import {rollFish, storeFish, type Save, type Habitat} from '../../camping.ts';
import {getRod, type RodId} from '../../data/rods.ts';
type Caught = ReturnType<typeof rollFish>;
export type FishingSession = {
  phase: 'waiting' | 'bite' | 'fight' | 'landed';
  remaining: number;
  waterId: string;
  habitat: Habitat;
  rod: RodId;
  period: Period;
  tension: number;
  progress: number;
  slack: number;
  struggleTime: number;
  struggle: number;
  strength: number;
  caught: Caught | null;
};
export class FishingSystem {
  session: FishingSession | null = null;
  private readonly random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  cast(water: {id: string; habitat: Habitat}, rod: RodId = 'bamboo', time = 160) {
    this.session = {
      period: periodAt(time),
      phase: 'waiting',
      remaining: (2.5 + this.random() * 2.5) * getRod(rod).accuracy,
      waterId: water.id,
      habitat: water.habitat,
      rod,
      tension: 28,
      progress: 0,
      slack: 0,
      struggleTime: 1,
      struggle: 0,
      strength: 1,
      caught: null,
    };
  }
  cancel() {
    const active = Boolean(this.session);
    this.session = null;
    return active;
  }
  update(dt: number, pulling = false, easy = false): 'bite' | 'escaped' | 'broken' | 'caught' | null {
    const session = this.session;
    if (!session || !Number.isFinite(dt) || dt <= 0) return null;
    if (session.phase === 'landed') return null;
    if (session.phase === 'fight') return this.fight(Math.min(dt, 0.1), pulling, easy);
    session.remaining -= dt;
    if (session.remaining > 0) return null;
    if (session.phase === 'waiting') {
      session.phase = 'bite';
      session.remaining = 2;
      return 'bite';
    }
    this.session = null;
    return 'escaped';
  }
  private fight(dt: number, pulling: boolean, easy: boolean): 'escaped' | 'broken' | 'caught' | null {
    const session = this.session!;
    const rod = getRod(session.rod);
    const threshold = easy ? Math.min(100, rod.threshold + 14) : rod.threshold;
    session.struggleTime -= dt;
    if (session.struggleTime <= 0) {
      session.struggleTime = 0.8 + this.random() * 1.4;
      session.struggle = this.random() * session.strength * 7;
    }
    // Assistance releases pressure near the red zone but still asks the player to hold to reel.
    const pull = pulling && (!easy || session.tension < threshold - 12);
    session.tension = Math.max(
      0,
      Math.min(100, session.tension + dt * (pull ? 23 + session.struggle : -32 + session.struggle * 0.3)),
    );
    session.progress = Math.max(0, session.progress + dt * (pull ? rod.power / session.strength : -3));
    session.slack = session.tension < 8 ? session.slack + dt : 0;
    if (session.tension >= threshold) {
      this.session = null;
      return 'broken';
    }
    if (session.slack >= (easy ? 5 : 3)) {
      this.session = null;
      return 'escaped';
    }
    if (session.progress >= 100) {
      session.phase = 'landed';
      return 'caught';
    }
    return null;
  }
  /** First press hooks a fish; inventory changes only after the fight is won. */
  reel(state: Save) {
    const session = this.session;
    if (!session) return null;
    if (session.phase === 'bite') {
      session.caught = rollFish(
        session.habitat,
        this.random(),
        this.random(),
        getRod(session.rod).luck,
        session.period,
      );
      const fish = session.caught;
      const tier = ['Thường', 'Ít gặp', 'Hiếm', 'Rất hiếm'].indexOf(fish.species.rarity);
      session.strength =
        1 + tier * 0.12 + ((fish.length - fish.species.min) / (fish.species.max - fish.species.min)) * 0.2;
      session.phase = 'fight';
      return null;
    }
    if (session.phase !== 'landed' || !session.caught) return null;
    const caught = session.caught;
    storeFish(state, caught.species.id, caught.length);
    this.session = null;
    return caught;
  }
}
