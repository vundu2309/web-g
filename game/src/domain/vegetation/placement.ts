import {hash01} from '../tilemap/random.ts';
import {TREE_VARIANTS, type TreeKind} from './trees.ts';
import {inAnySpan, nearAny, zoneOf, type VegetationWorld} from './world.ts';

const SEED = 0x51ed;
/** Khoảng cách giữa hai ứng viên cây: tối thiểu 200, cộng ngẫu nhiên theo hash. */
export const TREE_STEP_MIN = 200;
export const TREE_STEP_RANGE = 120;
/** Khoảng cách tối thiểu tới hồ (đã tính đệm), nút tài nguyên và nền đất phải phẳng hai bên. */
export const LAKE_MARGIN = 110;
export const NODE_MARGIN = 28;
export const FLAT_HALF = 12;

export interface TreePlacement {
  x: number;
  ground: number;
  kind: TreeKind;
  variant: number;
  zone: number;
  /** Pha dao động của tán khi chế độ Đẹp (radian). */
  phase: number;
}

/** Độ lệch thử quanh mỗi ứng viên khi vị trí đầu không đạt (đơn vị thế giới). */
const RETRY_OFFSETS = [0, 30, 60];

/**
 * Đặt cây theo hash cố định: lần lượt đi từ spawn theo bước cố định; mỗi bước thử vài độ lệch nhỏ
 * và lấy vị trí đầu tiên không nằm trong hồ, khoảng cấm, gần nút tài nguyên và có mặt đất phẳng.
 * Vùng 1 và 3 dùng thông, các vùng còn lại dùng lá rộng.
 */
export function placeTrees(world: VegetationWorld): TreePlacement[] {
  const out: TreePlacement[] = [];
  let cursor = world.spawnX;
  for (let i = 0; cursor < world.width - 80; i++) {
    const step = TREE_STEP_MIN + Math.floor(hash01(SEED, i, 1) * TREE_STEP_RANGE);
    const at = findSpot(world, cursor);
    cursor += step;
    if (at === null) continue;
    const zone = zoneOf(world, at);
    out.push({
      x: at,
      ground: world.groundAt(at),
      kind: (world.pineZones?.includes(zone) ?? (zone === 1 || zone === 3)) ? 'pine' : 'broadleaf',
      variant: Math.floor(hash01(SEED, i, 2) * TREE_VARIANTS),
      zone,
      phase: hash01(SEED, i, 3) * Math.PI * 2,
    });
  }
  return out;
}

function findSpot(world: VegetationWorld, from: number) {
  for (const offset of RETRY_OFFSETS) {
    if (acceptable(world, from + offset)) return from + offset;
  }
  return null;
}

function acceptable(world: VegetationWorld, x: number) {
  if (x < world.spawnX) return false;
  if (inAnySpan(x, world.lakes, LAKE_MARGIN)) return false;
  if (inAnySpan(x, world.landmarks)) return false;
  if (nearAny(x, world.nodes, NODE_MARGIN)) return false;
  const ground = world.groundAt(x);
  return world.groundAt(x - FLAT_HALF) === ground && world.groundAt(x + FLAT_HALF) === ground;
}
