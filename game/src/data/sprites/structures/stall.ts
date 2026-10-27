import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, CENTER, GROUND_ROW, structureSprite} from './shared.ts';

const LEFT = 3;
const RIGHT = 51;
const CANOPY_TOP = 5;
const COUNTER_TOP = 19;

/** Mái vải sọc đỏ và kem, mép lượn sóng; mỗi dải rộng 4 pixel. */
function paintCanopy(g: ReturnType<typeof newFrame>) {
  g.hline(LEFT, RIGHT, CANOPY_TOP - 1, R.redDeep);
  for (let x = LEFT; x <= RIGHT; x++) {
    const stripe = Math.floor((x - LEFT) / 4) % 2 === 0 ? R.red : R.canvasHi;
    g.vline(x, CANOPY_TOP, CANOPY_TOP + 5, stripe);
    const scallop = (x - LEFT) % 4;
    g.put(x, CANOPY_TOP + 6, scallop === 1 || scallop === 2 ? stripe : R.canvasShade);
  }
  g.hline(LEFT, RIGHT, CANOPY_TOP + 5, R.canvasDeep);
}

/** Quầy gỗ: mặt bàn sáng, thân ván ngang và đế tối. */
function paintCounter(g: ReturnType<typeof newFrame>) {
  g.region(
    2,
    COUNTER_TOP,
    52,
    COUNTER_TOP + 1,
    () => true,
    (x, y) => (y === COUNTER_TOP ? R.woodHi : x % 12 === 0 ? R.woodMid : R.wood),
  );
  g.region(
    3,
    COUNTER_TOP + 2,
    51,
    GROUND_ROW - 1,
    () => true,
    (x, y) => {
      if ((y - COUNTER_TOP) % 4 === 0) return R.woodShade;
      if (x < 5 || x > 49) return R.woodMid;
      return x % 12 === 0 ? R.woodMid : R.wood;
    },
  );
  for (const x of [5, 6, 46, 47]) g.vline(x, CANOPY_TOP + 7, GROUND_ROW, R.woodDeep);
  g.hline(3, 51, GROUND_ROW, R.woodDeep);
}

/** Rổ, cá và thùng bày trên quầy: đọc được là quầy thu mua cá. */
function paintGoods(g: ReturnType<typeof newFrame>) {
  g.region(
    8,
    13,
    17,
    COUNTER_TOP - 1,
    (x, y) => Math.abs(x - 12.5) <= 4.5 - Math.abs(y - (COUNTER_TOP - 1)) * 0.2,
    (x, y) => ((x + y) % 3 === 0 ? R.basketDeep : x < 11 ? R.basketHi : R.basket),
  );
  for (const [cx, cy] of [
    [24, 16],
    [30, 15],
    [36, 16],
  ]) {
    g.region(
      cx - 4,
      cy - 1,
      cx + 4,
      cy + 1,
      (x, y) => ((x - cx) / 4.5) ** 2 + ((y - cy) / 1.8) ** 2 <= 1,
      (x) => (x < cx - 1 ? R.fishHi : x > cx + 1 ? R.fishDeep : R.fish),
    );
    g.put(cx + 4, cy, R.fishDeep);
  }
  g.region(
    41,
    12,
    47,
    COUNTER_TOP - 1,
    (x, y) => y >= 13 && x >= 41 && x <= 47,
    (x, y) => (y === 13 || x === 41 ? R.woodHi : x === 47 ? R.woodShade : R.woodMid),
  );
}

/** Quầy thu mua: mái sọc, quầy gỗ và hàng hóa; đế và cột chạm mặt đất. */
export const stallSprite: SpriteDefinition = (() => {
  const g = newFrame();
  paintCanopy(g);
  g.vline(CENTER - 20, 12, GROUND_ROW, R.woodMid);
  g.vline(CENTER + 20, 12, GROUND_ROW, R.woodShade);
  paintCounter(g);
  paintGoods(g);
  return structureSprite('stall', [g], {idle: {frames: [0], frameRate: 1, repeat: -1}});
})();
