import Phaser from 'phaser';
import {ART_PIXEL} from '../../data/palette.ts';
import {vegetationWorld} from '../../data/vegetationWorld.ts';
import {Art} from '../../domain/vegetation/art.ts';
import {paintDecorChunk, type DecorChunk} from '../../domain/vegetation/decorChunks.ts';
import type {TreePlacement} from '../../domain/vegetation/placement.ts';
import {paintBroadleaf, paintPine, paintTrunk, treeVariant, TRUNK_PIVOT_X} from '../../domain/vegetation/trees.ts';
import type {TreeVariant, Canopy} from '../../domain/vegetation/trees.ts';
import {FALLS_LEAF, PINE_FOREST, PINE_MOON, RUINS_LEAF, VALE_LEAF, type Ramp} from '../../domain/vegetation/tones.ts';
import type {Quality} from './resolution.ts';
import {CANOPY_SWAY, canopyInView} from './canopyVisibility.ts';

const DECOR_DEPTH = 9;
/** Chân cây đặt chìm 1 pixel nghệ thuật so với mặt đất. */
const SINK = ART_PIXEL;
/** Ramp tán theo vùng 0 đến 4: thung lũng, rừng thông, thác, đèo trăng, phế tích. */
const ZONE_RAMPS: readonly Ramp[] = [
  VALE_LEAF,
  PINE_FOREST,
  FALLS_LEAF,
  PINE_MOON,
  RUINS_LEAF,
  VALE_LEAF,
  FALLS_LEAF,
  PINE_FOREST,
  RUINS_LEAF,
  VALE_LEAF,
];

export interface Swaying {
  image: Phaser.GameObjects.Image;
  phase: number;
  width: number;
  height: number;
  moving: boolean;
}

/** Sprite dùng chung được cache; cây và chunk trang trí chỉ tồn tại quanh camera. */
export function createDecorChunk(scene: Phaser.Scene, chunk: DecorChunk, trees: readonly TreePlacement[]) {
  const images = [addChunk(scene, chunk)];
  const canopies: Swaying[] = [];
  for (const tree of trees) addTree(scene, tree, canopies, images);
  return {images, canopies};
}

function addChunk(scene: Phaser.Scene, chunk: DecorChunk) {
  const key = 'decor-' + chunk.index;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, chunk.width / 2, chunk.height)!;
    const image = texture.context.createImageData(chunk.width / 2, chunk.height);
    paintDecorChunk(new Art(image.width, image.height, image.data), chunk, vegetationWorld);
    texture.context.putImageData(image, 0, 0);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  return scene.add.image(chunk.x0, chunk.top, key).setOrigin(0).setScale(ART_PIXEL).setDepth(DECOR_DEPTH);
}

interface SpriteRef {
  key: string;
  width: number;
  pivotX: number;
}

function addTree(scene: Phaser.Scene, tree: TreePlacement, swaying: Swaying[], images: Phaser.GameObjects.Image[]) {
  const variant = treeVariant(tree.kind, tree.variant);
  const trunk = ensureSprite(scene, 'tree-trunk-' + tree.kind + '-' + variant.index, () => ({
    art: paintTrunk(variant),
    pivotX: TRUNK_PIVOT_X,
  }));
  const canopy = ensureSprite(scene, 'tree-canopy-' + tree.zone + '-' + tree.kind + '-' + variant.index, () =>
    paintCanopyFor(variant, ZONE_RAMPS[tree.zone]),
  );
  const base = tree.ground + SINK;
  const trunkImage = scene.add
    .image(tree.x, base, trunk.key)
    .setOrigin((trunk.pivotX + 0.5) / trunk.width, 1)
    .setScale(ART_PIXEL)
    .setDepth(DECOR_DEPTH);
  const top = base - variant.trunk * ART_PIXEL;
  const image = scene.add
    .image(tree.x, top, canopy.key)
    .setOrigin((canopy.pivotX + 0.5) / canopy.width, 1)
    .setScale(ART_PIXEL)
    .setDepth(DECOR_DEPTH + 0.1);
  images.push(trunkImage, image);
  swaying.push({image, phase: tree.phase, width: image.displayWidth, height: image.displayHeight, moving: false});
}

function paintCanopyFor(variant: TreeVariant, ramp: Ramp): Canopy {
  return variant.kind === 'pine' ? paintPine(variant, ramp) : paintBroadleaf(variant, ramp);
}

const pivots = new Map<string, number>();

/** Tạo texture sprite đúng một lần rồi dùng lại; trả về khóa, chiều rộng và cột tâm (pivot). */
function ensureSprite(scene: Phaser.Scene, key: string, paint: () => Canopy): SpriteRef {
  if (!scene.textures.exists(key)) {
    const sprite = paint();
    const {art} = sprite;
    const texture = scene.textures.createCanvas(key, art.w, art.h)!;
    texture.context.putImageData(new ImageData(new Uint8ClampedArray(art.data), art.w, art.h), 0, 0);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    pivots.set(key, sprite.pivotX);
  }
  const width = scene.textures.get(key).getSourceImage().width;
  return {key, width, pivotX: pivots.get(key) ?? 0};
}

/** Chỉ cập nhật tán giao với khung nhìn; vùng đệm bao gồm độ nghiêng và bề rộng tán. */
export function swayCanopies(items: readonly Swaying[], view: Phaser.Geom.Rectangle, clock: number, quality: Quality) {
  let updated = 0;
  for (const item of items) {
    const image = item.image;
    const visible = canopyInView(image.x, image.y, item.width, item.height, image.originX, view);
    if (quality === 'low') {
      if (item.moving) image.setRotation(0);
      item.moving = false;
    } else if (visible) {
      image.setRotation(Math.sin(clock * 1.3 + item.phase) * CANOPY_SWAY);
      item.moving = true;
      updated++;
    }
  }
  return updated;
}
