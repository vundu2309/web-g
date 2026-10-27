import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, GROUND_ROW, structureSprite} from './shared.ts';
import type {PixelGrid} from '../../../domain/pixelGrid.ts';

const POST_X = 25;
const ARM_END = 42;
const HANG_X = 39;
const CAP_TOP = 11;
const GLASS_TOP = 13;
const GLASS_BOTTOM = 24;
const GLASS_LEFT = 37;
const GLASS_RIGHT = 41;

/** Cột gỗ, đế và tay treo có giằng. */
function paintFrame(g: PixelGrid) {
  g.region(
    POST_X,
    3,
    POST_X + 2,
    GROUND_ROW,
    () => true,
    (x) => (x === POST_X ? R.woodHi : x === POST_X + 2 ? R.woodShade : R.wood),
  );
  g.fill(POST_X - 3, GROUND_ROW - 2, 9, 3, R.woodMid);
  g.hline(POST_X - 3, POST_X + 5, GROUND_ROW - 2, R.woodHi);
  g.fill(POST_X, 3, ARM_END - POST_X + 1, 2, R.woodHi);
  g.hline(POST_X, ARM_END, 4, R.wood);
  g.line(POST_X, 11, POST_X + 6, 5, R.woodMid);
}

/** Đèn treo: nắp kim loại, khung bốn cạnh, đáy kim loại và dây treo. */
function paintLantern(g: PixelGrid) {
  g.vline(HANG_X, 5, CAP_TOP - 1, R.iron);
  g.fill(HANG_X - 5, CAP_TOP, 11, 2, R.ironHi);
  g.hline(HANG_X - 5, HANG_X + 5, CAP_TOP + 2, R.ironDeep);
  g.fill(HANG_X - 5, GLASS_BOTTOM + 1, 11, 2, R.ironDeep);
  g.fill(HANG_X - 5, GLASS_BOTTOM + 3, 11, 1, R.iron);
  for (const x of [HANG_X - 4, HANG_X - 3, HANG_X + 3, HANG_X + 4]) {
    g.vline(x, CAP_TOP + 3, GLASS_BOTTOM, R.iron);
  }
  g.vline(HANG_X - 4, CAP_TOP + 3, GLASS_BOTTOM, R.ironDeep);
  g.vline(HANG_X + 4, CAP_TOP + 3, GLASS_BOTTOM, R.ironDeep);
  g.vline(HANG_X - 4, CAP_TOP + 3, CAP_TOP + 3, R.ironHi);
}

function paintBody() {
  const g = newFrame();
  paintFrame(g);
  paintLantern(g);
  return g;
}

/** Kính đèn (lớp phát sáng): lõi trắng ấm, viền cam; mỗi frame đổi độ rực để nhấp nháy. */
function paintGlass(frame: number) {
  const g = newFrame();
  const coreTop = frame === 1 ? GLASS_TOP + 2 : GLASS_TOP + 1;
  for (let y = GLASS_TOP; y <= GLASS_BOTTOM; y++) {
    for (let x = GLASS_LEFT; x <= GLASS_RIGHT; x++) {
      let glyph = R.glassEdge;
      if (x > GLASS_LEFT && x < GLASS_RIGHT) glyph = R.glass;
      if (x >= GLASS_LEFT + 1 && x <= GLASS_RIGHT - 1 && y >= coreTop && y <= GLASS_BOTTOM - 2) glyph = R.glassCore;
      g.put(x, y, glyph);
    }
  }
  g.hline(GLASS_LEFT, GLASS_RIGHT, GLASS_TOP, R.glassCore);
  g.put(GLASS_LEFT + 1, GLASS_TOP + 2, frame === 2 ? R.glassCore : R.glass);
  return g;
}

export const lanternSprite: SpriteDefinition = structureSprite('lantern', [paintBody()], {
  idle: {frames: [0], frameRate: 1, repeat: -1},
});

export const lanternGlowSprite: SpriteDefinition = structureSprite('lantern-glow', [0, 1, 2].map(paintGlass), {
  glow: {frames: [0, 1, 2], frameRate: 3, repeat: -1},
});
