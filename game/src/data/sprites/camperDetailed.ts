import type {SpriteDefinition} from '../../domain/sprite.ts';
import {camperSprite} from './camper.ts';
/** A higher-density proposal for review only: same silhouette, individually authored one-pixel details. */
function detailFrame(frame: readonly string[]) {
  const grid = frame.flatMap((row) => {
    const pixels = [...row].flatMap((glyph) => [glyph, glyph]);
    return [[...pixels], [...pixels]];
  });
  const put = (x: number, y: number, glyph: string, surface: string) => {
    if (grid[y]?.[x] && surface.includes(grid[y][x])) grid[y][x] = glyph;
  };
  // Small material marks replace individual pixels, not entire enlarged 2×2 blocks.
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 48; x++) {
      const glyph = grid[y][x];
      if (glyph === 'g' && (x + y * 3) % 7 === 0) put(x, y, 'G', 'g');
      if (glyph === 'h' && y % 4 === 0 && x % 5 === 1) put(x, y, 'a', 'h');
      if (glyph === 'b' && y % 5 === 0 && x % 4 === 1) put(x, y, 'w', 'b');
      if (glyph === 'p' && x % 6 === 1 && y % 4 === 0) put(x, y, 'u', 'p');
    }
  }
  const eyes: {x: number; y: number}[] = [];
  for (let y = 0; y < 63; y++) {
    for (let x = 0; x < 47; x++) {
      if (grid[y][x] === 'E' && grid[y - 1]?.[x] !== 'E' && grid[y][x - 1] !== 'E') eyes.push({x, y});
    }
  }
  for (const eye of eyes) {
    put(eye.x, eye.y, 'f', 'E');
    for (let dx = -1; dx < 3; dx++) put(eye.x + dx, eye.y - 2, 'g', 'sS');
    put(eye.x + 2, eye.y + 3, 'r', 'sS');
    put(eye.x + 3, eye.y + 3, 'r', 'sS');
    put(eye.x + 3, eye.y + 4, 'S', 'sS');
    put(eye.x, eye.y + 6, 'm', 'sS');
    put(eye.x + 1, eye.y + 6, 'm', 'sS');
    put(eye.x - 5, eye.y + 1, 'S', 'gs');
    put(eye.x - 4, eye.y + 1, 'f', 'gsS');
  }
  let shoulder = 64;
  for (let y = 0; y < 64; y++)
    if (grid[y].includes('t')) {
      shoulder = y;
      break;
    }
  // Collar, button placket, chest pocket and cuff seams stay on the cloth mask in every pose.
  for (let y = shoulder + 3; y < shoulder + 15; y++) {
    put(25, y, y % 3 === 0 ? 'q' : 'v', 'tTl');
  }
  for (let dx = 0; dx < 5; dx++) {
    put(27 + dx, shoulder + 7, 'v', 'tTl');
    put(27 + dx, shoulder + 11, 'v', 'tTl');
  }
  for (let dy = 7; dy <= 11; dy++) {
    put(27, shoulder + dy, 'v', 'tTl');
    put(31, shoulder + dy, 'v', 'tTl');
  }
  put(29, shoulder + 8, 'q', 'tTl');
  for (const x of [21, 22, 27, 28]) put(x, shoulder + 2, 'v', 'tTl');
  for (let y = shoulder + 7; y < shoulder + 19; y += 4) {
    put(21, y, 'l', 'tT');
    put(33, y, 'v', 'tT');
  }
  // Pack stitching, side pocket and metal clasp.
  for (let y = shoulder + 5; y < shoulder + 15; y++) put(12, y, 'w', 'bB');
  for (let x = 11; x < 17; x++) {
    put(x, shoulder + 9, 'B', 'bBl');
    put(x, shoulder + 15, 'B', 'bBl');
  }
  put(14, shoulder + 10, 'q', 'bBl');
  put(15, shoulder + 10, 'f', 'bBl');
  put(14, shoulder + 11, 'q', 'bBl');
  for (let y = 0; y < 63; y++) {
    for (let x = 0; x < 47; x++) {
      if (grid[y][x] === 'k' && x % 4 === 1) put(x, y, 'j', 'k');
    }
  }
  return grid.map((row) => row.join(''));
}
export const camperDetailed: SpriteDefinition = {
  ...camperSprite,
  name: 'camper-detailed-review',
  width: 48,
  height: 64,
  colors: {
    ...camperSprite.colors,
    G: 'hairLight',
    a: 'hatLight',
    w: 'bagLight',
    u: 'pantsLight',
    f: 'skinLight',
    r: 'cheek',
    m: 'mouth',
    v: 'clothSeam',
    j: 'bootLace',
  },
  frames: camperSprite.frames.map(detailFrame),
};
