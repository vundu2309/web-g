import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, CENTER, GROUND_ROW, structureSprite} from './shared.ts';
import type {PixelGrid} from '../../../domain/pixelGrid.ts';

const BODY_LEFT = 13;
const BODY_RIGHT = 41;
const BODY_TOP = 15;
const DOOR_LEFT = 20;
const DOOR_RIGHT = 34;
const DOOR_TOP = 22;
const DOOR_BOTTOM = 31;

/** Khối lò bằng gạch: hàng gạch xen kẽ, sáng bên trái, tối bên phải và đáy. */
function paintBlock(g: PixelGrid) {
  g.fill(CENTER - 2, 2, 5, 13, R.iron);
  g.fill(CENTER - 4, 1, 9, 2, R.ironHi);
  g.vline(CENTER - 2, 2, 14, R.ironHi);
  g.vline(CENTER + 2, 2, 14, R.ironDeep);
  g.region(
    BODY_LEFT,
    BODY_TOP,
    BODY_RIGHT,
    GROUND_ROW - 1,
    () => true,
    (x, y) => {
      const row = Math.floor((y - BODY_TOP) / 4);
      const offset = row % 2 ? 3 : 0;
      if ((y - BODY_TOP) % 4 === 0) return R.mortar;
      if ((x + offset) % 6 === 0) return R.mortar;
      if (x < BODY_LEFT + 2) return R.stoneHi;
      if (x > BODY_RIGHT - 3) return R.stoneShade;
      if (y > GROUND_ROW - 3) return R.stoneDeep;
      return (x * 7 + y * 3) % 11 === 0 ? R.stoneMid : R.stone;
    },
  );
  g.fill(BODY_LEFT - 1, BODY_TOP - 1, BODY_RIGHT - BODY_LEFT + 3, 2, R.stoneHi);
  g.hline(BODY_LEFT - 1, BODY_RIGHT + 1, BODY_TOP, R.stoneShade);
}

/** Cửa lò bằng sắt, khung dày, tay nắm và lưới ghi phía dưới. */
function paintDoor(g: PixelGrid) {
  g.fill(DOOR_LEFT - 1, DOOR_TOP - 1, DOOR_RIGHT - DOOR_LEFT + 3, DOOR_BOTTOM - DOOR_TOP + 3, R.iron);
  g.hline(DOOR_LEFT - 1, DOOR_RIGHT + 1, DOOR_TOP - 1, R.ironHi);
  g.fill(DOOR_LEFT, DOOR_TOP, DOOR_RIGHT - DOOR_LEFT + 1, DOOR_BOTTOM - DOOR_TOP + 1, R.doorDark);
  g.hline(DOOR_LEFT - 1, DOOR_RIGHT + 1, DOOR_BOTTOM + 2, R.ironDeep);
  g.hline(DOOR_LEFT, DOOR_RIGHT, DOOR_BOTTOM + 1, R.ironDeep);
  g.hline(DOOR_RIGHT - 1, DOOR_RIGHT - 3, DOOR_TOP + 4, R.ironDeep);
  for (let x = DOOR_LEFT + 3; x <= DOOR_RIGHT - 3; x += 4) g.vline(x, DOOR_TOP + 1, DOOR_BOTTOM - 1, R.mortar);
}

/** Chân đế của lò: hai khối đá dày đặt trên mặt đất. */
function paintFoot(g: PixelGrid) {
  g.fill(BODY_LEFT - 2, GROUND_ROW - 2, 5, 3, R.stoneDeep);
  g.fill(BODY_RIGHT - 2, GROUND_ROW - 2, 5, 3, R.stoneDeep);
  g.hline(BODY_LEFT - 2, BODY_RIGHT + 2, GROUND_ROW, R.stoneShade);
}

function paintBody() {
  const g = newFrame();
  paintBlock(g);
  paintDoor(g);
  paintFoot(g);
  return g;
}

/** Lửa trong cửa lò (lớp phát sáng): than cam, đốm vàng và lõi sáng đổi vị trí theo frame. */
function paintEmbers(frame: number) {
  const g = newFrame();
  for (let y = DOOR_TOP; y <= DOOR_BOTTOM; y++) {
    for (let x = DOOR_LEFT; x <= DOOR_RIGHT; x++) {
      let glyph = R.ember;
      if (y > DOOR_BOTTOM - 4) glyph = R.flameOrange;
      if ((x + frame * 2) % 5 === 0 && y % 3 === frame % 3) glyph = R.flameYellow;
      const core = Math.abs(x - CENTER) <= 2 + (frame === 1 ? 0 : 1) && y > DOOR_TOP + 2 && y < DOOR_BOTTOM - 1;
      if (core) glyph = frame === 2 ? R.flameYellow : R.flameCore;
      g.put(x, y, glyph);
    }
  }
  return g;
}

export const stoveSprite: SpriteDefinition = structureSprite('stove', [paintBody()], {
  idle: {frames: [0], frameRate: 1, repeat: -1},
});

export const stoveGlowSprite: SpriteDefinition = structureSprite('stove-glow', [0, 1, 2].map(paintEmbers), {
  glow: {frames: [0, 1, 2], frameRate: 3, repeat: -1},
});
