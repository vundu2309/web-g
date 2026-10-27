import type {PoseParams} from './types.ts';

/** Tư thế nền: đứng yên, không cầm cần, mặt mở. Các tư thế khác ghi đè một phần. */
export const BASE: PoseParams = {
  lean: 0,
  chest: 0,
  head: [0, 0],
  legNear: {t: 0, f: 0},
  legFar: {t: 0, f: 0},
  armNear: {a: 0, f: 0},
  armFar: {a: 0, f: 0},
  lift: 0,
  grounded: true,
  rod: null,
  face: 'open',
};

export const pose = (overrides: Partial<PoseParams>): PoseParams => ({...BASE, ...overrides});

export const STANCE = {legNear: {t: 4, f: 4}, legFar: {t: -4, f: 4}};
