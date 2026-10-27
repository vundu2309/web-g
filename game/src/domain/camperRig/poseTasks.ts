import type {PoseParams} from './types.ts';
import {pose, STANCE} from './poseBase.ts';

export const CAST: readonly PoseParams[] = [
  pose({
    lean: -2,
    ...STANCE,
    armNear: {a: -28, f: 40},
    armFar: {a: -10, f: 30},
    rod: {angle: 120, length: 11},
  }),
  pose({
    lean: 3,
    ...STANCE,
    armNear: {a: 40, f: 22},
    armFar: {a: 20, f: 26},
    rod: {angle: 75, length: 11},
  }),
  pose({
    lean: 7,
    legNear: {t: 10, f: 6},
    legFar: {t: -8, f: 4},
    armNear: {a: 66, f: 6},
    armFar: {a: 50, f: 18},
    rod: {angle: 60, length: 11},
  }),
  pose({
    lean: 6,
    ...STANCE,
    armNear: {a: 60, f: 10},
    armFar: {a: 40, f: 24},
    rod: {angle: 60, length: 11},
  }),
];

export const FISH_WAIT: readonly PoseParams[] = [
  pose({
    lean: 2,
    ...STANCE,
    armNear: {a: 46, f: 40},
    armFar: {a: 14, f: 30},
    rod: {angle: 65, length: 11},
  }),
  pose({
    lean: 2,
    ...STANCE,
    face: 'glance',
    head: [0, 0.5],
    armNear: {a: 46, f: 40},
    armFar: {a: 14, f: 30},
    rod: {angle: 66, length: 11},
  }),
  pose({
    lean: 2,
    ...STANCE,
    armNear: {a: 46, f: 41},
    armFar: {a: 14, f: 30},
    rod: {angle: 67, length: 11},
  }),
];

export const BITE: readonly PoseParams[] = [
  pose({
    face: 'strain',
    lean: 0,
    ...STANCE,
    armNear: {a: 34, f: 40},
    armFar: {a: 10, f: 30},
    rod: {angle: 45, length: 11},
  }),
  pose({
    face: 'strain',
    lean: -3,
    chest: -1,
    head: [0, -0.5],
    ...STANCE,
    armNear: {a: 18, f: 46},
    armFar: {a: 4, f: 34},
    rod: {angle: 62, length: 11},
  }),
  pose({
    face: 'strain',
    lean: 0,
    ...STANCE,
    armNear: {a: 30, f: 42},
    armFar: {a: 8, f: 32},
    rod: {angle: 48, length: 11},
  }),
];

export const REEL: readonly PoseParams[] = [
  pose({
    face: 'strain',
    lean: -8,
    legNear: {t: -8, f: 10},
    legFar: {t: 10, f: 12},
    armNear: {a: 40, f: 90},
    armFar: {a: 34, f: 96},
    rod: {angle: 22, length: 9},
  }),
  pose({
    face: 'strain',
    lean: -10,
    chest: 0.5,
    legNear: {t: -10, f: 12},
    legFar: {t: 12, f: 14},
    armNear: {a: 28, f: 100},
    armFar: {a: 24, f: 100},
    rod: {angle: 26, length: 9},
  }),
  pose({
    face: 'strain',
    lean: -4,
    ...STANCE,
    armNear: {a: 46, f: 80},
    armFar: {a: 36, f: 86},
    rod: {angle: 30, length: 9},
  }),
  pose({
    face: 'strain',
    lean: 2,
    ...STANCE,
    armNear: {a: 50, f: 72},
    armFar: {a: 44, f: 74},
    rod: {angle: 30, length: 9},
  }),
];

export const GATHER: readonly PoseParams[] = [
  pose({
    face: 'bow',
    lean: 36,
    head: [1.2, 1.6],
    legNear: {t: 58, f: 108},
    legFar: {t: 40, f: 100},
    armNear: {a: 12, f: 14},
    armFar: {a: 4, f: 18},
  }),
  pose({
    face: 'bow',
    lean: 40,
    head: [1.4, 1.8],
    legNear: {t: 62, f: 112},
    legFar: {t: 42, f: 104},
    armNear: {a: 10, f: 12},
    armFar: {a: 2, f: 16},
  }),
  pose({
    face: 'bow',
    lean: 38,
    head: [1.4, 1.8],
    legNear: {t: 60, f: 110},
    legFar: {t: 40, f: 102},
    armNear: {a: 8, f: 10},
    armFar: {a: 0, f: 14},
  }),
];

export const BUILD: readonly PoseParams[] = [
  pose({
    lean: 3,
    legNear: {t: 4, f: 4},
    legFar: {t: -6, f: 2},
    armNear: {a: 70, f: 15},
    armFar: {a: 55, f: 20},
  }),
  pose({
    lean: 4,
    legNear: {t: 4, f: 4},
    legFar: {t: -6, f: 2},
    armNear: {a: 80, f: 8},
    armFar: {a: 65, f: 12},
  }),
  pose({
    lean: 5,
    legNear: {t: 4, f: 4},
    legFar: {t: -6, f: 2},
    armNear: {a: 88, f: 2},
    armFar: {a: 72, f: 8},
  }),
];
