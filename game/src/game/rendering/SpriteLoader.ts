import Phaser from 'phaser';
import {compileSprite, type SpriteDefinition, type SpritePalette} from '../../domain/sprite';
import {palette, ART_PIXEL} from '../../data/palette';
export {ART_PIXEL};
export function spriteTextureKey(def: SpriteDefinition, slotColors: SpritePalette) {
  return (
    'pixel-' +
    def.name +
    '-' +
    Object.keys(slotColors)
      .sort()
      .map((key) => key + slotColors[key])
      .join('-')
  );
}
/** Compile only on a cache miss, at native art resolution. Register animations once per outfit. */
export function loadSprite(scene: Phaser.Scene, def: SpriteDefinition, slotColors: SpritePalette = {}) {
  const key = spriteTextureKey(def, slotColors);
  if (!scene.textures.exists(key)) {
    const data = compileSprite(def, palette, slotColors);
    const texture = scene.textures.createCanvas(key, def.width * data.frames.length, def.height)!;
    const c = texture.context;
    data.frames.forEach((pixels, index) => {
      const image = c.createImageData(def.width, def.height);
      image.data.set(pixels);
      c.putImageData(image, index * def.width, 0);
      texture.add('frame-' + index, 0, index * def.width, 0, def.width, def.height);
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  for (const [name, animation] of Object.entries(def.animations)) {
    const animationKey = key + ':' + name;
    if (!scene.anims.exists(animationKey)) {
      scene.anims.create({
        key: animationKey,
        frames: animation.frames.map((index) => ({key, frame: 'frame-' + index})),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }
  return key;
}
