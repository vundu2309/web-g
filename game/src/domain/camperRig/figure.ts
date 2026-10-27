/** Khối bao quanh nhân vật theo pixel thật của frame (kể cả cần), để nhãn và lớp mờ khớp hình. Thuần, không Phaser. */
import type {LabelBox} from '../fishingLabels.ts';
import {FRAME_H, FRAME_W, type Frame} from './types.ts';
import {FEET_EDGE, mirrorColumn, cellCorner, type Placement} from './sheet.ts';

/** Ô có pixel không trong suốt của một frame, cột và hàng tính từ 0 (đóng gói, cả hai đầu đều nằm trong khung). */
export interface CellBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

const bounds = new WeakMap<Frame, CellBounds>();

/** Ô trái, phải và hàng trên cùng có pixel; dò một lần cho mỗi frame và giữ trong cache. */
export function frameBounds(frame: Frame): CellBounds {
  const hit = bounds.get(frame);
  if (hit) return hit;
  let left = FRAME_W;
  let right = -1;
  let top = FRAME_H;
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      if (frame.rgba[(y * FRAME_W + x) * 4 + 3] === 0) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
    }
  }
  const result = {left, right, top};
  bounds.set(frame, result);
  return result;
}

/** Khối thế giới của nhân vật và cần ở frame này: từ đỉnh pixel cao nhất tới hàng chân; lật theo hướng nhìn. */
export function figureBox(frame: Frame, place: Placement): LabelBox {
  const b = frameBounds(frame);
  const left = place.flip ? mirrorColumn(b.right) : b.left;
  const right = place.flip ? mirrorColumn(b.left) : b.right;
  const corner = cellCorner({x: left, y: b.top}, {...place, flip: false});
  return {
    x: corner.x,
    y: corner.y,
    width: (right - left + 1) * place.scale,
    height: (FEET_EDGE - b.top) * place.scale,
  };
}
