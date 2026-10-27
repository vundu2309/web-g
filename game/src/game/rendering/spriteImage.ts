import {compileSprite, type SpriteDefinition, type SpritePalette} from '../../domain/sprite.ts';
import {palette} from '../../data/palette.ts';
/** A rectangle of art pixels, in frame coordinates, that a data URL keeps. */
export interface SpriteCrop {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Một lớp của hình ghép: sprite và frame của nó (các lớp cùng khung, vẽ theo thứ tự). */
export interface SpriteLayer {
  readonly def: SpriteDefinition;
  readonly frame: number;
}

/** Pixel-exact PNG-style data URL for HUD portraits, recipe icons and the inventory preview. */
export function spriteDataUrl(
  def: SpriteDefinition,
  slotColors: SpritePalette,
  frame: number,
  scale: number,
  crop?: SpriteCrop,
) {
  return spriteLayersDataUrl([{def, frame}], slotColors, scale, crop);
}

/** Ghép nhiều lớp cùng khung (ví dụ thân và phần phát sáng của công trình) thành một hình, không làm mịn. */
export function spriteLayersDataUrl(
  layers: readonly SpriteLayer[],
  slotColors: SpritePalette,
  scale: number,
  crop?: SpriteCrop,
) {
  const [first] = layers;
  const {width, height} = first.def;
  const target = document.createElement('canvas');
  const area = crop ?? {x: 0, y: 0, width, height};
  target.width = area.width * scale;
  target.height = area.height * scale;
  const context = target.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext('2d')!;
  for (const layer of layers) {
    const compiled = compileSprite(layer.def, palette, slotColors);
    const image = sourceContext.createImageData(width, height);
    image.data.set(compiled.frames[layer.frame]);
    sourceContext.clearRect(0, 0, width, height);
    sourceContext.putImageData(image, 0, 0);
    context.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, target.width, target.height);
  }
  return target.toDataURL();
}
