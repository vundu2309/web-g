import type {BuildingKind} from '../catalog.ts';
import type {SpriteDefinition} from '../../domain/sprite.ts';
import {tentSprite, fireSprite, stoveSprite, lanternSprite} from './structuresAnimated.ts';
import {benchSprite, stallSprite, fenceSprite, plantSprite, chestSprite} from './structuresProps.ts';
/** Every placeable building as a 55×37 art-pixel sprite, shown at two world units per art pixel. */
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
