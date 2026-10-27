import {pose} from './poseBase.ts';

/** Đạp chân và quạt tay, không cầm cần, giữ nguyên trang bị đang mặc. */
export function swimPose(step: number, diving: boolean) {
  const phase = (Math.PI * step) / 2;
  const wave = Math.sin(phase);
  return pose({
    lean: diving ? 20 : 14,
    lift: 4,
    grounded: false,
    legNear: {t: 35 + wave * 15, f: 55},
    legFar: {t: -5 - wave * 10, f: 35},
    armNear: {a: 65 + wave * 10, f: -15},
    armFar: {a: 65 - wave * 10, f: -15},
  });
}
