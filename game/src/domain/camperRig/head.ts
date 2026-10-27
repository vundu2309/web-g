import {HAT_GRIDS, HEAD_GRIDS, HEAD_ORIGIN, KEY_ROLE, type FaceVariant, type HatShape} from '../../data/camperHead.ts';
import {ROLE_ID, type Canvas} from './raster.ts';
import type {Point, RigRole} from './types.ts';

/** Đóng dấu một lưới ký tự lên khung: ô `origin` trùng với pixel `(hx, hy)` của tâm đầu. */
export function stampGrid(c: Canvas, grid: readonly string[], hx: number, hy: number) {
  grid.forEach((row, gy) => {
    [...row].forEach((key, gx) => {
      const role = KEY_ROLE[key];
      if (role === undefined) return;
      c.put(hx - HEAD_ORIGIN.x + gx, hy - HEAD_ORIGIN.y + gy, ROLE_ID[role as RigRole]);
    });
  });
}

/** Vẽ đầu: lưới của biến thể mặt, rồi lưới mũ đè lên (cùng neo nên mọi biến thể khớp mọi mũ). */
export function drawHead(c: Canvas, center: Point, face: FaceVariant, hat: HatShape) {
  const hx = Math.floor(center.x);
  const hy = Math.floor(center.y);
  stampGrid(c, HEAD_GRIDS[face], hx, hy);
  stampGrid(c, HAT_GRIDS[hat], hx, hy);
}
