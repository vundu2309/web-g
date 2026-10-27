import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, CENTER, GROUND_ROW, structureSprite} from './shared.ts';

/** Lá hình elip nghiêng; tông sáng ở phía trên-trái, gân lá đậm. */
function leaf(g: ReturnType<typeof newFrame>, cx: number, cy: number, rx: number, ry: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const reach = Math.max(rx, ry);
  g.region(
    Math.floor(cx - reach),
    Math.floor(cy - reach),
    Math.ceil(cx + reach),
    Math.ceil(cy + reach),
    (x, y) => {
      const u = (x - cx) * cos + (y - cy) * sin;
      const v = -(x - cx) * sin + (y - cy) * cos;
      return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
    },
    (x, y) => {
      const u = (x - cx) * cos + (y - cy) * sin;
      const v = -(x - cx) * sin + (y - cy) * cos;
      if (Math.abs(v) < 0.6) return R.leafShade;
      const light = -v / ry - (u / rx) * 0.3;
      if (light > 0.45) return R.leafHi;
      if (light > 0) return R.leaf;
      if (light > -0.45) return R.leafMid;
      return R.leafShade;
    },
  );
}

/** Chậu gốm có vành, thân nhỏ thuôn và cây xanh nhiều tông. */
export const plantSprite: SpriteDefinition = (() => {
  const g = newFrame();
  g.vline(CENTER, 14, 28, R.leafShade);
  const leaves: [number, number, number, number, number][] = [
    [15, 11, 8, 4, -28],
    [39, 9, 8, 4, 28],
    [14, 21, 8, 3.5, 24],
    [40, 19, 8, 3.5, -24],
    [23, 5, 5, 3.5, -55],
    [31, 5, 5, 3.5, 55],
    [CENTER, 9, 4, 6, 0],
  ];
  for (const [cx, cy, rx, ry, deg] of leaves) leaf(g, cx, cy, rx, ry, deg);
  g.region(
    18,
    27,
    36,
    29,
    () => true,
    (x, y) => (y === 27 ? R.potHi : y === 29 ? R.potDeep : x < 20 ? R.potHi : R.pot),
  );
  g.region(
    19,
    30,
    35,
    GROUND_ROW,
    (x, y) => Math.abs(x - CENTER) <= 8 - (y - 30) * 0.15,
    (x, y) => (x < CENTER - 5 ? R.potHi : x > CENTER + 5 ? R.potDeep : y === GROUND_ROW ? R.potDeep : R.pot),
  );
  return structureSprite('plant', [g], {idle: {frames: [0], frameRate: 1, repeat: -1}});
})();
