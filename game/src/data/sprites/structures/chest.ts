import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, CENTER, GROUND_ROW, structureSprite} from './shared.ts';
import type {PixelGrid} from '../../../domain/pixelGrid.ts';

const LEFT = 15;
const RIGHT = 39;
const BOX_TOP = 25;
const LID_TOP = 19;

/** Thân rương: ván ngang, đai sắt hai bên và ổ khóa vàng ở giữa. */
function paintBox(g: PixelGrid) {
  g.region(
    LEFT,
    BOX_TOP,
    RIGHT,
    GROUND_ROW - 1,
    () => true,
    (x, y) => {
      if (y === BOX_TOP) return R.woodHi;
      if (y % 4 === 1) return R.woodShade;
      if (x < LEFT + 2) return R.woodHi;
      if (x > RIGHT - 2) return R.woodDeep;
      return R.wood;
    },
  );
  g.hline(LEFT, RIGHT, GROUND_ROW - 1, R.woodDeep);
  g.fill(LEFT + 2, GROUND_ROW, 3, 1, R.woodDeep);
  g.fill(RIGHT - 4, GROUND_ROW, 3, 1, R.woodDeep);
}

/** Nắp tròn: đỉnh sáng, mép tối, đai kim loại và khóa vàng. */
function paintLid(g: PixelGrid, top: number) {
  for (let y = top; y < top + 6; y++) {
    const inset = y < top + 2 ? 2 : y < top + 4 ? 1 : 0;
    for (let x = LEFT + inset; x <= RIGHT - inset; x++) {
      let glyph = y < top + 2 ? R.woodHi : R.wood;
      if (y === top + 5) glyph = R.woodShade;
      g.put(x, y, glyph);
    }
  }
  for (const x of [LEFT + 2, RIGHT - 2]) g.vline(x, top, top + 5, R.iron);
  g.vline(LEFT + 2, top, top, R.ironHi);
}

function paintLock(g: PixelGrid, top: number) {
  g.fill(CENTER - 2, top + 3, 5, 5, R.gold);
  g.hline(CENTER - 2, CENTER + 2, top + 3, R.goldHi);
  g.put(CENTER, top + 5, R.woodDeep);
  g.put(CENTER, top + 6, R.woodDeep);
}

/** Rương: nắp tròn, đai sắt, khóa. Ba frame mở dần (nắp lên 0, 3, 6 pixel); trong rương tối khi mở. */
function paintChest(lift: number) {
  const g = newFrame();
  if (lift > 0)
    g.region(
      LEFT + 2,
      LID_TOP,
      RIGHT - 2,
      BOX_TOP - 1,
      () => true,
      () => R.doorDark,
    );
  paintBox(g);
  paintLid(g, LID_TOP - lift);
  if (lift === 0) paintLock(g, LID_TOP);
  return g;
}

export const chestSprite: SpriteDefinition = structureSprite('chest', [0, 3, 6].map(paintChest), {
  open: {frames: [0, 1, 2], frameRate: 14, repeat: 0},
  close: {frames: [2, 1, 0], frameRate: 14, repeat: 0},
});
