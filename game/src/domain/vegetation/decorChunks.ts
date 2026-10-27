import {paintBeachScenery, paintLandScenery, paintUnderwaterScenery} from './sceneryArt.ts';
import type {Art} from './art.ts';
import {paintGrass, paintFlower, paintMushroom, paintRock} from './groundArt.ts';
import {paintFern, paintLily, paintReeds, paintRoots} from './plantArt.ts';
import {inAnySpan, nearAny, type Span, type VegetationWorld} from './world.ts';

/** Một chunk trang trí dài 512 đơn vị (256 pixel nghệ thuật); vẽ một lần ở độ phân giải pixel nghệ thuật. */
export const DECOR_CHUNK = 512;
/** Khoảng trống phía trên mặt đất cao nhất của chunk để cỏ, dương xỉ và sậy có chỗ. */
export const DECOR_CLEARANCE = 96;
/** Khoảng cấm cho đá và nấm quanh nút tài nguyên (đơn vị thế giới). */
export const DECOR_NODE_MARGIN = 60;
/** Cột đầu/cuối của chunk không đặt vật nào; vật rộng nhất vươn tối đa 10 pixel nên không bị cắt. */
export const DECOR_EDGE = 12;
/** Dải bờ hồ có sậy: từ 6 đến 40 đơn vị ngoài mép hồ. */
const BANK_NEAR = 6;
const BANK_FAR = 40;

export interface DecorChunk {
  index: number;
  x0: number;
  /** Chiều rộng theo đơn vị thế giới (chunk cuối có thể ngắn hơn). */
  width: number;
  /** Đỉnh khung chunk, là số chẵn để khớp lưới pixel nghệ thuật. */
  top: number;
  /** Chiều cao khung theo pixel nghệ thuật. */
  height: number;
}

/** Chia thế giới thành chunk; khung cao vừa đủ cho mặt đất, mặt nước và rễ. */
export function decorChunks(world: VegetationWorld): DecorChunk[] {
  const out: DecorChunk[] = [];
  for (let index = 0, x0 = 0; x0 < world.width; index++, x0 += DECOR_CHUNK) {
    const width = Math.min(DECOR_CHUNK, world.width - x0);
    let low = Infinity;
    let high = -Infinity;
    for (let wx = x0; wx < x0 + width; wx += 2) {
      const ground = world.groundAt(wx);
      low = Math.min(low, ground, world.waterTopAt(wx) ?? Infinity);
      high = Math.max(high, ground, world.waterTopAt(wx) ?? -Infinity, world.waterBedAt?.(wx) ?? -Infinity);
    }
    const top = Math.floor((low - DECOR_CLEARANCE) / 2) * 2;
    out.push({index, x0, width, top, height: Math.ceil((high + 16 - top) / 2)});
  }
  return out;
}

/** Vẽ toàn bộ trang trí tĩnh của một chunk vào `art` (kích thước width/2 × height). */
export function paintDecorChunk(art: Art, chunk: DecorChunk, world: VegetationWorld) {
  const banks = bankSpans(world);
  for (let px = DECOR_EDGE; px < art.w - DECOR_EDGE; px++) {
    const wx = chunk.x0 + px * 2 + 1;
    const water = world.waterTopAt(wx);
    if (water !== null) {
      if (world.seaFrom === undefined || wx < world.seaFrom) paintLily(art, px, (water - chunk.top) / 2, wx);
      const bed = world.waterBedAt?.(wx) ?? world.groundAt(wx);
      paintUnderwaterScenery(
        art,
        px,
        (water - chunk.top) / 2,
        (bed - chunk.top) / 2,
        wx,
        world.seaFrom !== undefined && wx >= world.seaFrom,
      );
      continue;
    }
    const gy = (world.groundAt(wx) - chunk.top) / 2;
    if (world.coastFrom !== undefined && wx >= world.coastFrom) paintBeachScenery(art, px, gy, wx);
    else paintLand(art, px, wx, world, gy, inAnySpan(wx, banks));
  }
}

function paintLand(art: Art, px: number, wx: number, world: VegetationWorld, gy: number, bank: boolean) {
  const nearNode = nearAny(wx, world.nodes, DECOR_NODE_MARGIN);
  const nearLandmark = inAnySpan(wx, world.landmarks, DECOR_NODE_MARGIN);
  paintGrass(art, px, gy, wx);
  paintFlower(art, px, gy, wx);
  if (!nearNode && !nearLandmark) {
    paintMushroom(art, px, gy, wx);
    paintRock(art, px, gy, wx);
    paintFern(art, px, gy, wx);
    paintLandScenery(art, px, gy, wx);
  }
  if (bank) paintReeds(art, px, gy, wx);
  paintRoots(art, px, gy, wx, world);
}

/** Dải đất sát mép hồ (từ 6 đến 40 đơn vị ngoài mép), nơi có sậy. Tính một lần cho mỗi chunk. */
function bankSpans(world: VegetationWorld): Span[] {
  const spans: Span[] = [];
  for (const lake of world.lakes) {
    spans.push({x: lake.x - BANK_FAR, width: BANK_FAR - BANK_NEAR});
    spans.push({x: lake.x + lake.width + BANK_NEAR, width: BANK_FAR - BANK_NEAR});
  }
  return spans;
}
