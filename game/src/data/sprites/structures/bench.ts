import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, GROUND_ROW, structureSprite} from './shared.ts';

/** Bàn dã ngoại: mặt bàn ván ghép, ghế ván hai bên và chân chữ A. */
export const benchSprite: SpriteDefinition = (() => {
  const g = newFrame();
  g.region(
    3,
    15,
    51,
    18,
    () => true,
    (x, y) => {
      if (y === 15) return R.woodHi;
      if (y === 18) return R.woodShade;
      if (x % 14 === 0) return R.woodDeep;
      return R.wood;
    },
  );
  g.hline(3, 51, 19, R.woodDeep);
  g.region(
    2,
    23,
    52,
    25,
    () => true,
    (x, y) => (y === 23 ? R.woodHi : y === 25 ? R.woodShade : x % 13 === 0 ? R.woodMid : R.wood),
  );
  for (const cx of [10, 44]) {
    g.fill(cx - 1, 20, 3, 14, R.wood);
    g.vline(cx + 1, 20, 33, R.woodShade);
    g.vline(cx - 1, 20, 33, R.woodHi);
    g.fill(cx - 3, 34, 7, 2, R.woodDeep);
  }
  g.hline(3, 51, GROUND_ROW, R.woodDeep);
  return structureSprite('bench', [g], {idle: {frames: [0], frameRate: 1, repeat: -1}});
})();
