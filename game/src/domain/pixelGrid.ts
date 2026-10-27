/** Ký tự trong suốt của lưới pixel (thuần, không phụ thuộc Phaser). */
export const CLEAR = '.';

/** Lưới ký tự thuần: mỗi ô là một ký tự vai trò màu, `CLEAR` là trong suốt. Ngoài lưới thì bỏ qua. */
export class PixelGrid {
  readonly width: number;
  readonly height: number;
  private readonly cells: string[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({length: width * height}, () => CLEAR);
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number) {
    return this.inside(x, y) ? this.cells[y * this.width + x] : CLEAR;
  }

  put(x: number, y: number, glyph: string) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (this.inside(px, py)) this.cells[py * this.width + px] = glyph;
  }

  /** Tô hình chữ nhật [x, x+w) × [y, y+h). */
  fill(x: number, y: number, w: number, h: number, glyph: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, glyph);
  }

  /** Tô các điểm của vùng [x0, x1] × [y0, y1] mà `inside` đúng; `pick` chọn ký tự (null thì bỏ qua). */
  region(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    inside: (x: number, y: number) => boolean,
    pick: (x: number, y: number) => string | null,
  ) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!inside(x, y)) continue;
        const glyph = pick(x, y);
        if (glyph !== null) this.put(x, y, glyph);
      }
    }
  }

  /** Đường thẳng pixel (Bresenham) có độ dày 1. */
  line(x0: number, y0: number, x1: number, y1: number, glyph: string) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const tx = Math.round(x1);
    const ty = Math.round(y1);
    const dx = Math.abs(tx - x);
    const dy = -Math.abs(ty - y);
    const sx = x < tx ? 1 : -1;
    const sy = y < ty ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.put(x, y, glyph);
      if (x === tx && y === ty) break;
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

  /** Dãy ngang và dọc (đầu mút bao gồm). */
  hline(x0: number, x1: number, y: number, glyph: string) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.put(x, y, glyph);
  }

  vline(x: number, y0: number, y1: number, glyph: string) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.put(x, y, glyph);
  }

  /** Các hàng của lưới, mỗi hàng đúng `width` ký tự. */
  rows() {
    return Array.from({length: this.height}, (_, y) => this.cells.slice(y * this.width, (y + 1) * this.width).join(''));
  }
}

/** Khoảng cách từ điểm (px, py) tới đoạn thẳng AB. */
export function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
