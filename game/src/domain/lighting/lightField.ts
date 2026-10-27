import type {BuildingKind} from '../../data/catalog.ts';
import type {TileGrid} from '../tilemap/grid.ts';
import {computeSkyField} from './sky.ts';
import {composeLight, type LightWindow, type SkyField} from './compose.ts';
import {buildingSources, computeSourceField, crystalSources, type LightSource, type SourceField} from './sources.ts';

export interface LightBuilding {
  id: string;
  kind: BuildingKind;
  x: number;
}

/**
 * Trạng thái ánh sáng của một lưới: trời tính một lần; pha lê cố định; nguồn từ công trình chỉ dựng lại khi
 * tập nguồn đổi. Không dùng Phaser.
 */
export class LightField {
  readonly sky: SkyField;
  private readonly grid: TileGrid;
  private readonly crystals: SourceField[];
  private readonly cache = new Map<string, SourceField>();
  private readonly scratch: LightSource[] = [];
  private previous: LightSource[] = [];
  private readonly buildings: SourceField[] = [];
  private readonly active: SourceField[] = [];

  constructor(grid: TileGrid) {
    this.grid = grid;
    const values = new Float32Array(grid.cols * grid.rows);
    computeSkyField(grid, values);
    this.sky = {cols: grid.cols, rows: grid.rows, values};
    const list: LightSource[] = [];
    crystalSources(grid, list);
    this.crystals = list.map((source) => computeSourceField(grid, source));
    this.rebuildActive();
  }

  /** Đặt tập công trình; trả về true nếu tập nguồn đổi (cần tổng hợp lại ngay). */
  setBuildings(buildings: readonly LightBuilding[], time: number) {
    buildingSources(this.grid, buildings, time, this.scratch);
    if (sameSources(this.previous, this.scratch)) return false;
    this.previous = this.scratch.map((source) => ({...source}));
    this.buildings.length = 0;
    for (const source of this.scratch) this.buildings.push(this.fieldFor(source));
    this.rebuildActive();
    return true;
  }

  /** Các trường nguồn đang hoạt động (công trình và pha lê). */
  sources(): readonly SourceField[] {
    return this.active;
  }

  /** Tổng hợp RGBA cho vùng ô theo màu trời hiện tại. */
  compose(win: LightWindow, skyRgb: ArrayLike<number>, out: Uint8ClampedArray) {
    composeLight(this.sky, skyRgb, this.active, win, out);
  }

  private fieldFor(source: LightSource) {
    const key = source.id + ':' + source.kind + ':' + source.col + ':' + source.row;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const field = computeSourceField(this.grid, source);
    this.cache.set(key, field);
    return field;
  }

  private rebuildActive() {
    this.active.length = 0;
    for (const field of this.buildings) this.active.push(field);
    for (const field of this.crystals) this.active.push(field);
  }
}

function sameSources(a: readonly LightSource[], b: readonly LightSource[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].kind !== b[i].kind) return false;
    if (a[i].col !== b[i].col || a[i].row !== b[i].row) return false;
  }
  return true;
}
