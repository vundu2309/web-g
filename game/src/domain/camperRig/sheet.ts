/** Sheet frame của bộ xương: vị trí frame, nhịp animation, lật ngang và đổi neo sang thế giới. Thuần, không Phaser. */
import {
  CENTER_X,
  FRAME_H,
  FRAME_W,
  GROUND_ROW,
  RIG_FRAME_COUNTS,
  RIG_STATES,
  type Point,
  type RigState,
} from './types.ts';

/** Hàng đáy của khung: bờ dưới của hàng mặt đất, nơi sprite đặt lên mặt đất (đơn vị pixel nghệ thuật). */
export const FEET_EDGE = GROUND_ROW + 1;
/** Gốc đặt sprite theo chiều dọc (0 = đỉnh khung, 1 = đáy khung). Gốc ngang là giữa khung. */
export const ORIGIN_Y = FEET_EDGE / FRAME_H;
export const ORIGIN_X = 0.5;

/** Nhịp của từng trạng thái, giữ đúng nhịp của nhân vật cũ (theo đồng hồ game). */
export const RIG_RATES: Readonly<Record<RigState, {readonly frameRate: number; readonly repeat: number}>> = {
  idle: {frameRate: 1.5, repeat: -1},
  run: {frameRate: 9, repeat: -1},
  jump: {frameRate: 6, repeat: 0},
  fall: {frameRate: 6, repeat: -1},
  land: {frameRate: 12, repeat: 0},
  cast: {frameRate: 12, repeat: 0},
  'fish-wait': {frameRate: 3, repeat: -1},
  bite: {frameRate: 12, repeat: -1},
  reel: {frameRate: 9, repeat: -1},
  gather: {frameRate: 9, repeat: 0},
  build: {frameRate: 8, repeat: -1},
  swim: {frameRate: 6, repeat: -1},
  dive: {frameRate: 7, repeat: -1},
};

/** Frame idle theo thứ tự: 0 mở mắt, 1 thở (đầu nhô 1 px), 2 chớp mắt, 3 liếc. */
const IDLE_CYCLE: readonly number[] = [0, 1, 0, 0, 2, 0, 3, 0];

const STARTS = new Map<RigState, number>();
let total = 0;
for (const state of RIG_STATES) {
  STARTS.set(state, total);
  total += RIG_FRAME_COUNTS[state];
}

/** Tổng số frame trong sheet (46). */
export const SHEET_FRAME_COUNT = total;

/** Chỉ số frame trong sheet của frame `index` của trạng thái `state`; sheet xếp theo thứ tự `RIG_STATES`. */
export function sheetIndex(state: RigState, index: number): number {
  return (STARTS.get(state) ?? 0) + index;
}

export interface SheetAnimation {
  /** Chỉ số frame trong sheet, theo thứ tự chạy. */
  readonly frames: readonly number[];
  readonly frameRate: number;
  readonly repeat: number;
}

function animationOf(state: RigState): SheetAnimation {
  const local = state === 'idle' ? IDLE_CYCLE : Array.from({length: RIG_FRAME_COUNTS[state]}, (_, i) => i);
  return {frames: local.map((index) => sheetIndex(state, index)), ...RIG_RATES[state]};
}

/** Animation của mọi trạng thái, khóa theo tên trạng thái của `PoseMachine`. */
export const SHEET_ANIMATIONS: Readonly<Record<RigState, SheetAnimation>> = Object.fromEntries(
  RIG_STATES.map((state) => [state, animationOf(state)]),
) as Record<RigState, SheetAnimation>;

/** Cột lật: `mirrorColumn(c)` là cột đối xứng qua trục thân (CENTER_X), khớp với lật ngang của sprite. */
export function mirrorColumn(column: number): number {
  return 2 * CENTER_X + 1 - column;
}

/** Điểm neo sau khi lật ngang (khi nhân vật nhìn trái). */
export function mirrorPoint(point: Point, flip: boolean): Point {
  return flip ? {x: mirrorColumn(point.x), y: point.y} : point;
}

export interface Placement {
  /** Điểm đặt sprite (giữa đáy chân) trong thế giới. */
  readonly x: number;
  readonly y: number;
  readonly flip: boolean;
  /** Kích thước một pixel nghệ thuật trong thế giới (`ART_PIXEL`). */
  readonly scale: number;
}

/** Góc trên-trái trong thế giới của ô (cột, hàng) của khung, sau lật ngang. Ô là pixel nghệ thuật. */
export function cellCorner(point: Point, place: Placement): Point {
  const column = mirrorPoint(point, place.flip).x;
  return {
    x: place.x - (FRAME_W * place.scale) / 2 + column * place.scale,
    y: place.y - FEET_EDGE * place.scale + point.y * place.scale,
  };
}

/** Tâm của ô trong thế giới (cùng quy ước với `cellCorner`). */
export function cellCenter(point: Point, place: Placement): Point {
  const corner = cellCorner(point, place);
  return {x: corner.x + place.scale / 2, y: corner.y + place.scale / 2};
}
