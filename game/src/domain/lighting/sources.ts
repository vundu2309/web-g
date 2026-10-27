import type {BuildingKind} from '../../data/catalog.ts';
import {TILE} from '../tilemap/types.ts';
import type {TileGrid} from '../tilemap/grid.ts';
import {nightAmount} from '../dayTime.ts';
import {attenuationAt, relaxField} from './sky.ts';
import {SOURCE_SPECS, type SourceKind, type SourceSpec} from './lightConfig.ts';

/** Nguồn sáng đặt tại một ô. `id` ổn định để cache trường sáng theo nguồn. */
export interface LightSource {
  id: string;
  kind: SourceKind;
  col: number;
  row: number;
}

/** Trường cường độ vô hướng của một nguồn trên hình vuông (2·tầm + 1) ô quanh nguồn. */
export interface SourceField {
  id: string;
  kind: SourceKind;
  spec: SourceSpec;
  c0: number;
  r0: number;
  side: number;
  values: Float32Array;
}

/**
 * Độ cao hiển thị của tâm nguồn so với mặt đất, theo loại công trình (đơn vị thế giới). T8a: khớp tâm phần
 * phát sáng của hình mới (lửa: tâm lưỡi lửa; bếp nấu: cửa lò; đèn: kính; lều: cửa).
 */
const BUILDING_LIFT: Partial<Record<BuildingKind, number>> = {fire: 30, stove: 19, lantern: 35, tent: 24};

const BUILDING_SOURCE: Partial<Record<BuildingKind, SourceKind>> = {
  fire: 'fire',
  stove: 'stove',
  lantern: 'lantern',
  tent: 'tent',
};

/**
 * Nguồn từ công trình trong lưới: bếp lửa, bếp nấu, đèn lồng và lều (lều chỉ về đêm, theo logic cũ).
 * Ghi vào `out` (không cấp phát mảng mới), trả về số nguồn.
 */
export function buildingSources(
  grid: TileGrid,
  buildings: readonly {id: string; kind: BuildingKind; x: number}[],
  time: number,
  out: LightSource[],
) {
  out.length = 0;
  const night = nightAmount(time) > 0;
  for (const building of buildings) {
    const kind = BUILDING_SOURCE[building.kind];
    if (!kind) continue;
    if (kind === 'tent' && !night) continue;
    const lift = BUILDING_LIFT[building.kind] ?? 0;
    const y = grid.groundAt(building.x) - lift;
    out.push({
      id: building.id,
      kind,
      col: Math.floor(building.x / TILE),
      row: Math.floor(y / TILE),
    });
  }
  return out.length;
}

/** Nguồn cố định: mọi ô pha lê của lưới (địa hình không đổi nên tính một lần). */
export function crystalSources(grid: TileGrid, out: LightSource[]) {
  out.length = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (grid.kindAt(c, r) === 'crystal') out.push({id: 'crystal-' + c + '-' + r, kind: 'crystal', col: c, row: r});
    }
  }
  return out.length;
}

/**
 * Hệ số giảm dần theo khoảng cách (Euclid, đơn vị ô): bằng 1 gần tâm và bằng 0 từ tầm trở đi, nên mép hình
 * vuông của cửa sổ tính trường không lộ ra (đường cong smoothstep).
 */
export function falloffAt(distance: number, reach: number) {
  const t = Math.max(0, Math.min(1, (reach - distance) / (0.7 * reach)));
  return t * t * (3 - 2 * t);
}

/** Tính trường của một nguồn: lan truyền theo luật ô (có chặn bởi đất) rồi nhân hệ số giảm theo khoảng cách. */
export function computeSourceField(grid: TileGrid, source: LightSource): SourceField {
  const spec = SOURCE_SPECS[source.kind];
  const side = spec.reach * 2 + 1;
  const c0 = source.col - spec.reach;
  const r0 = source.row - spec.reach;
  const values = new Float32Array(side * side);
  const atten = new Float32Array(side * side);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) atten[y * side + x] = attenuationAt(grid, c0 + x, r0 + y);
  }
  values[spec.reach * side + spec.reach] = spec.intensity;
  relaxField(values, atten, side, side, true);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const d = Math.hypot(x - spec.reach, y - spec.reach);
      values[y * side + x] *= falloffAt(d, spec.reach);
    }
  }
  return {id: source.id, kind: source.kind, spec, c0, r0, side, values};
}
