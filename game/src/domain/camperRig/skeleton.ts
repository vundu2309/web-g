import {BONE, CENTER_X, type PoseParams, type Point} from './types.ts';

export interface LegJoints {
  readonly root: Point;
  readonly knee: Point;
  readonly ankle: Point;
}

export interface ArmJoints {
  readonly root: Point;
  readonly elbow: Point;
  readonly hand: Point;
}

export interface Joints {
  readonly hip: Point;
  readonly shoulder: Point;
  readonly head: Point;
  readonly legNear: LegJoints;
  readonly legFar: LegJoints;
  readonly armNear: ArmJoints;
  readonly armFar: ArmJoints;
}

const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** Làm tròn khớp tới nửa pixel: đủ mịn để không nhấp nháy mép giữa các frame, nhưng không phải số thực tuỳ ý. */
export const snap = (value: number) => Math.round(value * 2) / 2;

/** Điểm cách `from` một đoạn `length` theo góc đo từ phương thẳng đứng (dương = về phía trước). */
function along(from: Point, angle: number, length: number): Point {
  return {x: snap(from.x + length * Math.sin(rad(angle))), y: snap(from.y + length * Math.cos(rad(angle)))};
}

function leg(root: Point, t: number, f: number): LegJoints {
  const knee = along(root, t, BONE.thigh);
  return {root, knee, ankle: along(knee, t - f, BONE.shin)};
}

function arm(root: Point, a: number, f: number): ArmJoints {
  const elbow = along(root, a, BONE.upperArm);
  return {root, elbow, hand: along(elbow, a + f, BONE.forearm)};
}

/**
 * Động học thuận. Hông ở `origin` (cột trung tâm, hàng hông); mọi toạ độ là pixel nghệ thuật.
 * `origin` nguyên nên các khớp đã làm tròn vẫn nằm trên lưới nửa pixel sau khi cộng.
 */
export function solveJoints(p: PoseParams, origin: Point = {x: CENTER_X, y: 0}): Joints {
  const hip = {x: origin.x, y: origin.y};
  const shoulder = {
    x: snap(hip.x + BONE.torso * Math.sin(rad(p.lean))),
    y: snap(hip.y - BONE.torso * Math.cos(rad(p.lean)) + p.chest),
  };
  const head = {
    x: snap(shoulder.x + BONE.neck * Math.sin(rad(p.lean)) + p.head[0]),
    y: snap(shoulder.y - BONE.neck * Math.cos(rad(p.lean)) + p.head[1]),
  };
  const nearRoot = {x: hip.x + BONE.hipOffset, y: hip.y};
  const farRoot = {x: hip.x - BONE.hipOffset, y: hip.y};
  const nearShoulder = {x: shoulder.x + BONE.shoulderX, y: shoulder.y + BONE.shoulderY};
  const farShoulder = {x: shoulder.x - BONE.shoulderX, y: shoulder.y + BONE.shoulderY};
  return {
    hip,
    shoulder,
    head,
    legNear: leg(nearRoot, p.legNear.t, p.legNear.f),
    legFar: leg(farRoot, p.legFar.t, p.legFar.f),
    armNear: arm(nearShoulder, p.armNear.a, p.armNear.f),
    armFar: arm(farShoulder, p.armFar.a, p.armFar.f),
  };
}
