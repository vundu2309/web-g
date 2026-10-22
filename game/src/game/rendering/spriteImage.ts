import {compileSprite, type SpriteDefinition, type SpritePalette} from '../../domain/sprite.ts';
import {palette} from '../../data/palette.ts';
/** Pixel-exact PNG-style data URL for HUD portraits, recipe icons and the inventory preview. */
export function spriteDataUrl(def: SpriteDefinition, slotColors: SpritePalette, frame: number, scale: number) {
  const compiled = compileSprite(def, palette, slotColors);
  const source = document.createElement('canvas');
  source.width = def.width;
  source.height = def.height;
  const sourceContext = source.getContext('2d')!;
  const image = sourceContext.createImageData(def.width, def.height);
  image.data.set(compiled.frames[frame]);
  sourceContext.putImageData(image, 0, 0);
  const target = document.createElement('canvas');
  target.width = def.width * scale;
  target.height = def.height * scale;
  const context = target.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, target.width, target.height);
  return target.toDataURL();
}
