import {TILE, TILE_KINDS, WALL_KINDS, type TerrainData, type TileKind, type WallKind} from './types.ts';

export interface SolidRun {
  x: number;
  y: number;
  width: number;
}

/** Truy vấn ô và mặt đất trên lưới đã sinh; không phụ thuộc Phaser. */
export class TileGrid {
  readonly cols: number;
  readonly rows: number;
  private readonly data: TerrainData;
  private readonly waterTops: Int16Array;
  private readonly waterBeds: Int16Array;

  constructor(data: TerrainData) {
    this.data = data;
    this.cols = data.cols;
    this.rows = data.rows;
    this.waterTops = new Int16Array(data.cols).fill(-1);
    this.waterBeds = new Int16Array(data.cols).fill(-1);
    for (let c = 0; c < data.cols; c++) {
      for (let r = 0; r < data.rows; r++) {
        if (data.water[r * data.cols + c] !== 1) continue;
        if (this.waterTops[c] < 0) this.waterTops[c] = r;
        this.waterBeds[c] = r + 1;
      }
    }
  }

  /** Cột chứa tọa độ x thế giới, kẹp trong lưới. */
  columnAt(x: number) {
    return Math.max(0, Math.min(this.cols - 1, Math.floor(x / TILE)));
  }

  waterSurfaceRow(c: number) {
    return this.waterTops[Math.max(0, Math.min(this.cols - 1, c))];
  }
  waterBedRow(c: number) {
    return this.waterBeds[Math.max(0, Math.min(this.cols - 1, c))];
  }
  /** Hàng mặt đất của cột (hàng đầu tiên thuộc đất). */
  surfaceRow(c: number) {
    return this.data.surface[Math.max(0, Math.min(this.cols - 1, c))];
  }

  /** Độ cao mặt đất (đỉnh ô) tại x thế giới. */
  groundAt(x: number) {
    return this.surfaceRow(this.columnAt(x)) * TILE;
  }

  /** Loại ô. Ngoài lưới: trên trời là không khí; hai bên và dưới là đá đặc. */
  kindAt(c: number, r: number): TileKind {
    if (c < 0 || c >= this.cols || r >= this.rows) return r < 0 ? 'air' : 'stone';
    return TILE_KINDS[this.data.kinds[r * this.cols + c]];
  }

  wallAt(c: number, r: number): WallKind {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return 'none';
    return WALL_KINDS[this.data.walls[r * this.cols + c]];
  }

  /** Có phải nước (cờ nước; ô nước không đặc). */
  isWater(c: number, r: number) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    return this.data.water[r * this.cols + c] === 1;
  }

  /** Có đặc để va chạm không: mọi ô trừ không khí và nước. */
  isSolid(c: number, r: number) {
    if (this.isWater(c, r)) return false;
    return this.kindAt(c, r) !== 'air';
  }

  /** Các đoạn cột liên tiếp cùng độ cao mặt đất, dùng dựng va chạm tĩnh (gộp để ít body). */
  solidRuns(): SolidRun[] {
    const runs: SolidRun[] = [];
    let start = 0;
    for (let c = 1; c <= this.cols; c++) {
      if (c < this.cols && this.surfaceRow(c) === this.surfaceRow(start)) continue;
      const top = this.surfaceRow(start) * TILE;
      runs.push({x: start * TILE, y: top, width: (c - start) * TILE});
      start = c;
    }
    return runs;
  }
}
