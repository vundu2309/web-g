import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, GROUND_ROW, structureSprite} from './shared.ts';

const POSTS = [3, 14, 25, 36, 47];
const TOP = 11;

/** Hàng rào gỗ: cọc đầu nhọn sáng ở trái, tối ở phải, hai thanh ngang. */
export const fenceSprite: SpriteDefinition = (() => {
  const g = newFrame();
  for (const x of POSTS) {
    g.region(
      x,
      TOP,
      x + 3,
      GROUND_ROW,
      (px, py) => py >= TOP + 2 || Math.abs(px - (x + 1.5)) <= 1.5 - (TOP + 1 - py) * 0.5,
      (px) => (px === x ? R.woodHi : px === x + 3 ? R.woodShade : R.wood),
    );
    g.put(x + 1, TOP - 1, R.woodHi);
  }
  for (const y of [19, 27]) {
    g.region(
      2,
      y,
      52,
      y + 2,
      () => true,
      (_px, py) => (py === y ? R.woodHi : py === y + 2 ? R.woodShade : R.woodMid),
    );
  }
  return structureSprite('fence', [g], {idle: {frames: [0], frameRate: 1, repeat: -1}});
})();
