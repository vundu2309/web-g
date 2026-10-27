import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {segmentDistance} from '../../../domain/pixelGrid.ts';
import {newFrame, R, CENTER, GROUND_ROW, structureSprite} from './shared.ts';
import type {PixelGrid} from '../../../domain/pixelGrid.ts';

const HEARTH_Y = 33;

/** Vòng đá quanh hố lửa: đá sáng ở trên-trái, đậm ở dưới, tro ở giữa. */
function paintRing(g: PixelGrid) {
  g.region(
    CENTER - 14,
    HEARTH_Y - 2,
    CENTER + 14,
    GROUND_ROW,
    (x, y) => ((x - CENTER) / 14) ** 2 + ((y - GROUND_ROW + 1) / 6) ** 2 <= 1,
    (x, y) => {
      const inner = ((x - CENTER) / 9) ** 2 + ((y - GROUND_ROW + 1) / 3.2) ** 2 < 1;
      if (inner) return R.woodDeep;
      if (y >= GROUND_ROW - 1) return R.stoneShade;
      if ((x + y * 3) % 7 === 0) return R.stoneMid;
      return x < CENTER - 4 ? R.stoneHi : R.stone;
    },
  );
}

/** Hai khúc củi chéo nhau trên tro, có vân và đầu mặt cắt sáng. */
function paintLogs(g: PixelGrid) {
  const logs: [number, number, number, number][] = [
    [CENTER - 10, 34, CENTER + 9, 29],
    [CENTER + 10, 34, CENTER - 9, 29],
  ];
  for (const [ax, ay, bx, by] of logs) {
    g.region(
      Math.min(ax, bx) - 2,
      Math.min(ay, by) - 2,
      Math.max(ax, bx) + 2,
      Math.max(ay, by) + 2,
      (x, y) => segmentDistance(x, y, ax, ay, bx, by) <= 1.7,
      (x, y) => {
        const along = (x - ax) / (bx - ax);
        const lineY = ay + (by - ay) * along;
        if (y < lineY - 0.5) return R.woodHi;
        if (y > lineY + 0.6) return R.woodShade;
        return (x * 5 + y) % 4 === 0 ? R.woodMid : R.wood;
      },
    );
    g.put(ax, ay, R.woodRing);
    g.put(bx, by, R.woodRing);
  }
}

/** Một lưỡi lửa: viền đỏ, thân cam, lõi vàng và trắng; hẹp dần lên đỉnh. */
function tongue(g: PixelGrid, cx: number, base: number, height: number, width: number) {
  for (let y = base; y > base - height; y--) {
    const t = (base - y) / height;
    const half = width * (1 - t) ** 0.8;
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
      const d = Math.abs(dx);
      if (d > half) continue;
      let glyph = R.flameRed;
      if (d <= half * 0.6) glyph = t < 0.7 ? R.flameOrange : R.flameRed;
      if (d <= half * 0.35 && t < 0.5) glyph = R.flameYellow;
      if (d <= half * 0.15 && t < 0.25) glyph = R.flameCore;
      g.put(cx + dx, y, glyph);
    }
  }
}

/** Lửa (lớp phát sáng): ba lưỡi và tia lửa; mỗi frame đổi chiều cao để nhấp nháy. */
function paintFlame(frame: number) {
  const g = newFrame();
  const shift = [0, 2, -1, 1][frame];
  tongue(g, CENTER, HEARTH_Y - 3, 18 + shift, 7);
  tongue(g, CENTER - 5, HEARTH_Y - 4, 11 - shift, 4);
  tongue(g, CENTER + 5, HEARTH_Y - 4, 13 + shift, 4);
  for (let k = 0; k < 3; k++) g.put(CENTER - 6 + k * 6, 10 + ((frame * 3 + k * 4) % 6), R.spark);
  return g;
}

function paintBody() {
  const g = newFrame();
  paintRing(g);
  paintLogs(g);
  return g;
}

export const fireSprite: SpriteDefinition = structureSprite('fire', [paintBody()], {
  idle: {frames: [0], frameRate: 1, repeat: -1},
});

export const fireGlowSprite: SpriteDefinition = structureSprite('fire-glow', [0, 1, 2, 3].map(paintFlame), {
  burn: {frames: [0, 1, 2, 3], frameRate: 6, repeat: -1},
});
