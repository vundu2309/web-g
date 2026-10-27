/** Bộ đệm RGBA của một sprite hoặc chunk thực vật (1 điểm = 1 pixel nghệ thuật). Thuần, không Phaser. */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Art {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;

  constructor(w: number, h: number, data?: Uint8ClampedArray) {
    this.w = w;
    this.h = h;
    this.data = data ?? new Uint8ClampedArray(w * h * 4);
  }

  /** Ghi một màu 0xRRGGBB, bỏ qua điểm ngoài khung; `alpha` mặc định đặc. */
  put(x: number, y: number, rgb: number, alpha = 255) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || py < 0 || px >= this.w || py >= this.h) return;
    const i = (py * this.w + px) * 4;
    this.data[i] = (rgb >> 16) & 255;
    this.data[i + 1] = (rgb >> 8) & 255;
    this.data[i + 2] = rgb & 255;
    this.data[i + 3] = alpha;
  }

  /** Có điểm đã được tô (alpha > 0) hay không. */
  has(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.data[(y * this.w + x) * 4 + 3] > 0;
  }

  /** Màu 0xRRGGBB của một điểm (không kiểm tra alpha; dùng sau khi `has`). */
  rgbAt(x: number, y: number) {
    const i = (y * this.w + x) * 4;
    return (this.data[i] << 16) | (this.data[i + 1] << 8) | this.data[i + 2];
  }

  /** Khung bao các điểm đã tô, hoặc null nếu trống. */
  bounds(): Bounds | null {
    let minX = this.w;
    let minY = this.h;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!this.has(x, y)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return maxX < 0 ? null : {minX, minY, maxX, maxY};
  }

  /** Sao chép khung con (không đổi bộ đệm gốc). */
  crop(b: Bounds) {
    const w = b.maxX - b.minX + 1;
    const h = b.maxY - b.minY + 1;
    const out = new Art(w, h);
    for (let y = 0; y < h; y++) {
      const from = ((b.minY + y) * this.w + b.minX) * 4;
      out.data.set(this.data.subarray(from, from + w * 4), y * w * 4);
    }
    return out;
  }
}
