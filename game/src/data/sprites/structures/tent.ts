import type {SpriteDefinition} from '../../../domain/sprite.ts';
import {newFrame, R, CENTER, GROUND_ROW, structureSprite} from './shared.ts';
import type {PixelGrid} from '../../../domain/pixelGrid.ts';

/** Lều: đỉnh ở APEX, hem ở HEM; nửa rộng tăng tuyến tính tới HALF ở hem. */
const APEX = 5;
const HEM = 33;
const HALF = 22;
const DOOR_TOP = 16;
const STAKE = 25;

function halfAt(row: number) {
  return Math.max(1, Math.round(((row - APEX + 1) / (HEM - APEX + 1)) * HALF));
}

/** Nửa rộng cửa lều: tam giác nhỏ mở từ DOOR_TOP tới hem. */
function doorHalfAt(row: number) {
  return Math.round(((row - DOOR_TOP) / (HEM - DOOR_TOP)) * 6) + 1;
}

function paintFlag(g: PixelGrid, flutter: boolean) {
  g.vline(CENTER, 1, APEX, R.woodMid);
  g.put(CENTER, 1, R.woodHi);
  for (let k = 1; k <= 6; k++) {
    const x = CENTER + k;
    const top = 1 + (flutter && k >= 4 ? 1 : 0);
    const bottom = 3 - (!flutter && k >= 4 ? 1 : 0);
    g.vline(x, top, bottom, R.red);
    g.put(x, bottom, R.redDeep);
  }
}

/** Tông vải theo vị trí: sáng ở trái, tối ở phải, mép và hem đậm, đường may ở giữa. */
function fabricAt(row: number, dx: number, half: number) {
  if (row >= HEM || Math.abs(dx) === half) return R.canvasDeep;
  if (dx === 0) return R.canvasShade;
  if (dx < 0) return dx < -half * 0.55 ? R.canvasHi : R.canvas;
  return dx < half * 0.55 ? R.canvasMid : R.canvasShade;
}

function paintBody(g: PixelGrid) {
  for (let row = APEX; row <= HEM; row++) {
    const half = halfAt(row);
    for (let dx = -half; dx <= half; dx++) {
      const stitch = row % 5 === 0 && Math.abs(dx) === Math.round(half / 2);
      g.put(CENTER + dx, row, stitch ? R.canvasDeep : fabricAt(row, dx, half));
    }
  }
}

function paintDoor(g: PixelGrid) {
  for (let row = DOOR_TOP; row < HEM; row++) {
    const half = doorHalfAt(row);
    for (let dx = -half; dx <= half; dx++) g.put(CENTER + dx, row, Math.abs(dx) === half ? R.canvasDeep : R.doorDark);
  }
  g.hline(CENTER - 1, CENTER + 1, DOOR_TOP - 1, R.canvasDeep);
}

function paintRopes(g: PixelGrid) {
  for (const side of [-1, 1]) {
    const anchor = CENTER + side * halfAt(27);
    g.line(anchor, 27, CENTER + side * (STAKE - 1), GROUND_ROW - 1, R.rope);
    g.vline(CENTER + side * STAKE, 31, GROUND_ROW, R.woodMid);
    g.put(CENTER + side * STAKE, 31, R.woodHi);
  }
}

function paintTent(flutter: boolean) {
  const g = newFrame();
  paintBody(g);
  paintDoor(g);
  paintRopes(g);
  paintFlag(g, flutter);
  return g;
}

/** Cửa lều phát sáng khi đêm: chỉ lớp trong cửa, ban ngày ẩn (alpha theo giờ ở CampRenderer). */
function paintDoorGlow() {
  const g = newFrame();
  for (let row = DOOR_TOP; row < HEM; row++) {
    const inner = doorHalfAt(row) - 1;
    for (let dx = -inner; dx <= inner; dx++) {
      const hot = row > DOOR_TOP + 6 && Math.abs(dx) <= 1;
      g.put(CENTER + dx, row, hot ? R.doorCore : R.doorWarm);
    }
  }
  return g;
}

export const tentSprite: SpriteDefinition = structureSprite('tent', [paintTent(false), paintTent(true)], {
  flutter: {frames: [0, 1], frameRate: 2, repeat: -1},
});

export const tentGlowSprite: SpriteDefinition = structureSprite('tent-glow', [paintDoorGlow()], {
  glow: {frames: [0], frameRate: 1, repeat: -1},
});
