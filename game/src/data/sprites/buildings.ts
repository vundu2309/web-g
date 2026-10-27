import type {BuildingKind} from '../catalog.ts';
import type {SpriteDefinition} from '../../domain/sprite.ts';
import {tentSprite, tentGlowSprite} from './structures/tent.ts';
import {fireSprite, fireGlowSprite} from './structures/fire.ts';
import {stoveSprite, stoveGlowSprite} from './structures/stove.ts';
import {lanternSprite, lanternGlowSprite} from './structures/lantern.ts';
import {benchSprite} from './structures/bench.ts';
import {stallSprite} from './structures/stall.ts';
import {fenceSprite} from './structures/fence.ts';
import {plantSprite} from './structures/plant.ts';
import {chestSprite} from './structures/chest.ts';

/**
 * Thân mọi công trình: 55×37 pixel nghệ thuật, hiển thị ở 110×74 đơn vị. Thân nằm ở lớp thế giới và được chiếu sáng.
 */
export const buildingSprites: Record<BuildingKind, SpriteDefinition> = {
  tent: tentSprite,
  fire: fireSprite,
  stove: stoveSprite,
  lantern: lanternSprite,
  bench: benchSprite,
  stall: stallSprite,
  fence: fenceSprite,
  plant: plantSprite,
  chest: chestSprite,
};

/**
 * Lớp phát sáng riêng (cùng khung, cùng gốc) của công trình tự phát sáng. Lớp này nằm ở lớp hiệu ứng,
 * không bị chiếu sáng nên chỉ các pixel tự phát sáng mới sáng trắng/vàng ban đêm.
 */
export const buildingGlows: Partial<Record<BuildingKind, SpriteDefinition>> = {
  tent: tentGlowSprite,
  fire: fireGlowSprite,
  stove: stoveGlowSprite,
  lantern: lanternGlowSprite,
};

/** Applies recorded cell changes ("x,y,glyph" tokens separated by spaces) to a copy of a glyph grid. */
export function patchRows(rows: readonly string[], changes: string) {
  const cells = rows.map((row) => row.split(''));
  for (const token of changes.split(' ')) {
    if (!token) continue;
    const [x, y, glyph] = token.split(',');
    cells[Number(y)][Number(x)] = glyph;
  }
  return cells.map((row) => row.join(''));
}
