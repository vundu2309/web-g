import {Canvas, ROLE_ID} from './raster.ts';
import {drawRig, type Dress} from './parts.ts';
import {solveJoints, type Joints} from './skeleton.ts';
import {RIG_POSES} from './poses.ts';
import {CENTER_X, GROUND_ROW, RIG_STATES, type Anchors, type Point, type PoseParams, type RigState} from './types.ts';

/** Vai trò của giày: đáy thấp nhất của các pixel này là hàng mặt đất. */
export const BOOT_IDS = [ROLE_ID.boot0, ROLE_ID.boot1, ROLE_ID.boot2, ROLE_ID.boot3] as const;
const HAT_IDS = [ROLE_ID.hat0, ROLE_ID.hat1, ROLE_ID.hat2, ROLE_ID.hat3, ROLE_ID.pom] as const;
const START_ROW = GROUND_ROW - 18;

export interface Geometry {
  readonly state: RigState;
  readonly index: number;
  readonly canvas: Canvas;
  readonly anchors: Anchors;
}

function compose(p: PoseParams, originY: number, dress: Dress): {canvas: Canvas; joints: Joints} {
  const canvas = new Canvas();
  const joints = solveJoints(p, {x: CENTER_X, y: originY});
  drawRig(canvas, joints, p, dress);
  return {canvas, joints};
}

/**
 * Đặt hông sao cho đáy giày thấp nhất đúng hàng mặt đất (đứng/chạy) hoặc cao hơn `lift` px (trên không).
 * Đo bằng chính pixel vẽ ra, nên không lệch do làm tròn.
 */
function place(p: PoseParams, dress: Dress): {canvas: Canvas; joints: Joints} {
  const target = p.grounded ? GROUND_ROW : GROUND_ROW - p.lift;
  const probe = compose(p, START_ROW, dress);
  const low = probe.canvas.lowestOf(BOOT_IDS);
  if (low < 0) throw new Error('camperRig: không tìm thấy giày trong khung');
  const placed = compose(p, START_ROW + target - low, dress);
  if (placed.canvas.lowestOf(BOOT_IDS) !== target) throw new Error('camperRig: không đặt được chân lên hàng ' + target);
  return placed;
}

/** Neo tính từ khớp và pixel: tay, đầu cần, đầu, đỉnh mũ (pixel trên cùng của mũ), cổ chân và hàng mặt đất. */
function anchorsOf(canvas: Canvas, joints: Joints, p: PoseParams): Anchors {
  const at = (point: Point) => ({x: Math.floor(point.x), y: Math.floor(point.y)});
  return {
    hand: at(joints.armNear.hand),
    rodTip: p.rod ? rodTip(joints.armNear.hand, p.rod.angle, p.rod.length) : null,
    head: at(joints.head),
    headTop: topOfHat(canvas),
    feet: [at(joints.legNear.ankle), at(joints.legFar.ankle)],
    ground: GROUND_ROW,
  };
}

function rodTip(grip: Point, angle: number, length: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.round(grip.x + length * Math.cos(radians)),
    y: Math.round(grip.y - length * Math.sin(radians)),
  };
}

function topOfHat(canvas: Canvas): Point {
  for (let y = 0; y < canvas.height; y++) {
    let sum = 0;
    let count = 0;
    for (let x = 0; x < canvas.width; x++) {
      if (HAT_IDS.includes(canvas.ids[y * canvas.width + x] as (typeof HAT_IDS)[number])) {
        sum += x;
        count++;
      }
    }
    if (count) return {x: Math.round(sum / count), y};
  }
  return {x: CENTER_X, y: 0};
}

/** Dựng hình học của mọi frame một lần cho một hình dáng: vị trí pixel theo mã vai trò, không phụ thuộc màu. */
export function buildGeometry(dress: Dress): readonly Geometry[] {
  return RIG_STATES.flatMap((state) =>
    RIG_POSES[state].map((params, index) => {
      const {canvas, joints} = place(params, dress);
      return {state, index, canvas, anchors: anchorsOf(canvas, joints, params)};
    }),
  );
}
