import {FRAME_H, FRAME_W, RIG_ROLES, type RigRole} from './types.ts';

/** Bốn tông của một vật thể theo thứ tự sáng → tối; mỗi phần tử là mã vai trò (xem `ROLE_ID`). */
export type Tones = readonly [number, number, number, number];
export type Rgb = readonly [number, number, number];

/** Mã vai trò, bắt đầu từ 1; 0 là pixel trong suốt. */
export const ROLE_ID: Readonly<Record<RigRole, number>> = Object.fromEntries(
  RIG_ROLES.map((role, index) => [role, index + 1]),
) as Record<RigRole, number>;

/** Hướng sáng từ trên trái: pixel đón sáng dùng tông sáng, pixel khuất dùng tông tối. */
const LIGHT = [-0.6, -0.8] as const;

function shadeOf(nx: number, ny: number) {
  const facing = nx * LIGHT[0] + ny * LIGHT[1];
  if (facing > 0.5) return 0;
  if (facing > -0.05) return 1;
  if (facing > -0.55) return 2;
  return 3;
}

/** Bảng pixel theo mã vai trò. Dùng `Uint8Array` để không cấp phát trong vòng lặp vẽ. */
export class Canvas {
  readonly width: number;
  readonly height: number;
  readonly ids: Uint8Array;

  constructor(width = FRAME_W, height = FRAME_H) {
    this.width = width;
    this.height = height;
    this.ids = new Uint8Array(width * height);
  }

  put(x: number, y: number, id: number) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px >= 0 && py >= 0 && px < this.width && py < this.height) this.ids[py * this.width + px] = id;
  }

  at(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.ids[y * this.width + x];
  }

  /** Viên nang: đoạn từ A đến B, bán kính nội suy từ r0 đến r1. Tông theo hướng pháp tuyến. */
  capsule(ax: number, ay: number, bx: number, by: number, r0: number, r1: number, tones: Tones) {
    const r = Math.max(r0, r1);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-6;
    const minX = Math.floor(Math.min(ax, bx) - r - 1);
    const maxX = Math.ceil(Math.max(ax, bx) + r + 1);
    const minY = Math.floor(Math.min(ay, by) - r - 1);
    const maxY = Math.ceil(Math.max(ay, by) + r + 1);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        const ddx = px - (ax + t * dx);
        const ddy = py - (ay + t * dy);
        const d = Math.hypot(ddx, ddy);
        if (d > r0 + (r1 - r0) * t) continue;
        const shade = d ? shadeOf(ddx / d, ddy / d) : 0;
        this.put(x, y, tones[shade]);
      }
    }
  }

  /** Ellipse đặc, tông theo hướng pháp tuyến như viên nang. */
  ellipse(cx: number, cy: number, rx: number, ry: number, tones: Tones) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const a = (x + 0.5 - cx) / rx;
        const b = (y + 0.5 - cy) / ry;
        if (a * a + b * b > 1) continue;
        const n = Math.hypot(a, b) || 1;
        this.put(x, y, tones[shadeOf(a / n, b / n)]);
      }
    }
  }

  /** Đoạn thẳng một pixel (Bresenham), hai đầu đều được vẽ. */
  line(x0: number, y0: number, x1: number, y1: number, id: number) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const ex = Math.round(x1);
    const ey = Math.round(y1);
    const dx = Math.abs(ex - x);
    const dy = -Math.abs(ey - y);
    const sx = x < ex ? 1 : -1;
    const sy = y < ey ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.put(x, y, id);
      if (x === ex && y === ey) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** Hàng thấp nhất có pixel thuộc một trong các vai trò; -1 nếu không có. */
  lowestOf(ids: readonly number[]) {
    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        if (ids.includes(this.ids[y * this.width + x])) return y;
      }
    }
    return -1;
  }

  /** Chuyển sang RGBA. Pixel mép (có ô kề trong suốt hoặc nằm ngoài khung) được làm tối nhẹ, không thêm viền. */
  toRgba(rgb: readonly Rgb[]) {
    const out = new Uint8ClampedArray(this.width * this.height * 4);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = this.ids[y * this.width + x];
        if (!id) continue;
        const edge =
          this.at(x - 1, y) === 0 || this.at(x + 1, y) === 0 || this.at(x, y - 1) === 0 || this.at(x, y + 1) === 0;
        const [r, g, b] = rgb[id];
        const k = (y * this.width + x) * 4;
        out[k] = edge ? r * 0.66 : r;
        out[k + 1] = edge ? g * 0.66 : g;
        out[k + 2] = edge ? b * 0.7 : b;
        out[k + 3] = 255;
      }
    }
    return out;
  }
}
