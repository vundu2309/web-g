import {swimPose} from './poseSwimming.ts';
import {RIG_FRAME_COUNTS, type PoseParams, type RigState} from './types.ts';
import {pose} from './poseBase.ts';
import {BUILD, CAST, FISH_WAIT, BITE, REEL, GATHER} from './poseTasks.ts';

const TAU = Math.PI * 2;

/** Chu kỳ chạy 8 frame: đùi và gối theo đường tròn, tay vung ngược chân cùng bên (bản phác phương án A). */
function run(step: number): PoseParams {
  const p = (TAU * step) / RIG_FRAME_COUNTS.run;
  const s = Math.sin(p);
  const c = Math.cos(p);
  /** Gối gập mạnh khi bàn chân đang thu lên (đùi đi qua thẳng đứng về phía trước); cẳng không quá 65° ra sau. */
  const flexNear = 5 + 22 * ((1 + c) / 2);
  const flexFar = 5 + 22 * ((1 - c) / 2);
  return pose({
    lean: 11,
    head: [0.4, 0],
    legNear: {t: 40 * s, f: flexNear},
    legFar: {t: -40 * s, f: flexFar},
    armNear: {a: -48 * s, f: 62 + 14 * c},
    armFar: {a: 48 * s, f: 62 - 14 * c},
  });
}

const IDLE: readonly PoseParams[] = [
  pose({lean: 2, legNear: {t: 7, f: 4}, legFar: {t: -7, f: 5}, armNear: {a: 7, f: 12}, armFar: {a: -5, f: 10}}),
  pose({
    lean: 2,
    chest: -0.5,
    head: [0, -0.5],
    legNear: {t: 7, f: 4},
    legFar: {t: -7, f: 5},
    armNear: {a: 7, f: 12},
    armFar: {a: -5, f: 10},
  }),
  pose({
    lean: 2,
    legNear: {t: 7, f: 4},
    legFar: {t: -7, f: 5},
    armNear: {a: 7, f: 12},
    armFar: {a: -5, f: 10},
    face: 'blink',
  }),
  pose({
    lean: 2,
    legNear: {t: 7, f: 4},
    legFar: {t: -7, f: 5},
    armNear: {a: 7, f: 12},
    armFar: {a: -5, f: 10},
    face: 'glance',
  }),
];

const JUMP: readonly PoseParams[] = [
  pose({
    lean: 5,
    lift: 3,
    grounded: false,
    face: 'air',
    head: [0.5, -0.5],
    legNear: {t: 40, f: 70},
    legFar: {t: -6, f: 36},
    armNear: {a: 118, f: 28},
    armFar: {a: 78, f: 22},
  }),
  pose({
    lean: 5,
    lift: 5,
    grounded: false,
    face: 'air',
    head: [0.5, -0.5],
    legNear: {t: 58, f: 88},
    legFar: {t: -12, f: 42},
    armNear: {a: 128, f: 30},
    armFar: {a: 86, f: 24},
  }),
];

const FALL: readonly PoseParams[] = [
  pose({
    lean: -2,
    lift: 5,
    grounded: false,
    face: 'air',
    legNear: {t: 22, f: 12},
    legFar: {t: -22, f: 16},
    armNear: {a: 140, f: 8},
    armFar: {a: 118, f: 12},
  }),
  pose({
    lean: -2,
    lift: 4,
    grounded: false,
    face: 'air',
    legNear: {t: 14, f: 8},
    legFar: {t: -10, f: 14},
    armNear: {a: 120, f: 14},
    armFar: {a: 100, f: 16},
  }),
];

const LAND: readonly PoseParams[] = [
  pose({
    lean: 16,
    face: 'strain',
    chest: 1,
    legNear: {t: 36, f: 80},
    legFar: {t: -16, f: 62},
    armNear: {a: 30, f: 20},
    armFar: {a: 14, f: 24},
  }),
  pose({
    lean: 6,
    chest: 0.5,
    legNear: {t: 14, f: 30},
    legFar: {t: -10, f: 26},
    armNear: {a: 12, f: 16},
    armFar: {a: 4, f: 14},
  }),
];

/** Thư viện pose theo tham số: mỗi trạng thái có đúng `RIG_FRAME_COUNTS[state]` frame. */
export const RIG_POSES: Readonly<Record<RigState, readonly PoseParams[]>> = {
  idle: IDLE,
  run: Array.from({length: RIG_FRAME_COUNTS.run}, (_, step) => run(step)),
  jump: JUMP,
  fall: FALL,
  land: LAND,
  cast: CAST,
  'fish-wait': FISH_WAIT,
  bite: BITE,
  reel: REEL,
  gather: GATHER,
  build: BUILD,
  swim: Array.from({length: 4}, (_, i) => swimPose(i, false)),
  dive: Array.from({length: 4}, (_, i) => swimPose(i, true)),
};
