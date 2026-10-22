/** Pose rig for the 24×32 camper: upper body from the approved idle grid, arms and legs drawn per pose. */
export type LegSpec = {hip: number; foot: number; footY: number};
export type Point = readonly [number, number];
export interface PoseSpec {
  /** Upper body offset in art pixels: -1 crouches, 0 stands, 1 rises. */
  bob: number;
  /** Back leg first, front leg second. */
  legs: readonly [LegSpec, LegSpec];
  /** Hand positions: back arm first, front arm second. */
  hands: readonly [Point, Point];
  /** Backpack drop in art pixels, 0 or 1. */
  bag?: number;
}
const HIP_ROW = 23;
const SHOULDER_BACK: Point = [11, 17];
const SHOULDER_FRONT: Point = [16, 17];
function blankGrid(): string[][] {
  return Array.from({length: 32}, () => Array<string>(24).fill('.'));
}
/** Shifts the approved upper body rows (0–22) by bob; the legs below are composed separately. */
function upperBody(base: readonly string[], bob: number): string[][] {
  const grid = blankGrid();
  for (let y = 0; y < HIP_ROW; y++) {
    const source = y - bob;
    if (source < 0 || source >= base.length) continue;
    for (let x = 0; x < 24; x++) grid[y][x] = base[source][x];
  }
  // The approved arm sits inside the torso at waist height; the arm layer redraws it.
  for (let y = 21; y < HIP_ROW; y++)
    for (let x = 14; x < 18; x++) if (grid[y][x] === 's' || grid[y][x] === 'S') grid[y][x] = 't';
  return grid;
}
function drawLeg(grid: string[][], leg: LegSpec, shade: string) {
  const bottom = leg.footY - 2;
  for (let y = HIP_ROW; y <= bottom; y++) {
    const t = bottom === HIP_ROW ? 0 : (y - HIP_ROW) / (bottom - HIP_ROW);
    const cx = Math.round(leg.hip + (leg.foot - leg.hip) * t);
    for (let x = cx - 1; x <= cx + 1; x++) if (x >= 0 && x < 24) grid[y][x] = x === cx + 1 ? shade : 'p';
    if (cx - 2 >= 0) grid[y][cx - 2] = 'x';
    if (cx + 2 < 24) grid[y][cx + 2] = 'x';
  }
  const top = leg.footY - 1;
  for (let x = leg.foot - 2; x <= leg.foot + 1; x++) if (x >= 0 && x < 24) grid[top][x] = 'k';
  if (leg.foot - 3 >= 0) grid[top][leg.foot - 3] = 'x';
  if (leg.foot + 2 < 24) grid[top][leg.foot + 2] = 'x';
  for (let x = leg.foot - 3; x <= leg.foot + 2; x++) if (x >= 0 && x < 24) grid[leg.footY][x] = 'x';
}
/** Bresenham line; each step paints two columns so arms read as two-pixel sleeves. */
function drawArm(grid: string[][], from: Point, to: Point, mask: Set<string>) {
  let [x0, y0] = from;
  const [x1, y1] = to;
  const dx = Math.abs(x1 - x0),
    dy = -Math.abs(y1 - y0),
    sx = x0 < x1 ? 1 : -1,
    sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    for (const x of [x0, x0 + 1]) {
      if (x >= 0 && x < 24 && y0 >= 0 && y0 < 32) {
        grid[y0][x] = 't';
        mask.add(x + ',' + y0);
      }
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}
function drawHand(grid: string[][], hand: Point, mask: Set<string>) {
  const [hx, hy] = hand;
  for (let y = hy; y < hy + 2; y++) {
    for (let x = hx; x < hx + 2; x++) {
      if (x >= 0 && x < 24 && y >= 0 && y < 32) {
        grid[y][x] = 's';
        mask.add(x + ',' + y);
      }
    }
  }
}
/** Composes one 24×32 pose from the approved idle grid and explicit leg and hand positions. */
export function composePose(base: readonly string[], spec: PoseSpec): string[] {
  const grid = upperBody(base, spec.bob);
  const bag = spec.bag ?? 0;
  if (bag) {
    // Backpack columns slide down one row, bottom first, then the vacated top row is cleared.
    for (let y = 21; y >= 14; y--) for (let x = 3; x <= 9; x++) grid[y + 1][x] = grid[y][x];
    for (let x = 3; x <= 9; x++) grid[14][x] = '.';
  }
  const mask = new Set<string>();
  drawLeg(grid, spec.legs[0], 'P');
  drawLeg(grid, spec.legs[1], 'p');
  drawArm(grid, SHOULDER_BACK, spec.hands[0], mask);
  drawHand(grid, spec.hands[0], mask);
  drawArm(grid, SHOULDER_FRONT, spec.hands[1], mask);
  drawHand(grid, spec.hands[1], mask);
  for (const key of mask) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < 24 && ny >= 0 && ny < 32 && grid[ny][nx] === '.') grid[ny][nx] = 'x';
    }
  }
  return grid.map((row) => row.join(''));
}
