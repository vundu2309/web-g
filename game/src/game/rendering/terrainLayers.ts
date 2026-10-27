import Phaser from 'phaser';
import {ART_PIXEL} from '../../data/palette.ts';
import {terrainGrid} from '../../data/world.ts';
import {chunkHasWater, chunkPixels, chunkRange, paintChunk} from '../../domain/tilemap/tileChunks.ts';
import {TILE} from '../../domain/tilemap/types.ts';

const TERRAIN_DEPTH = 8;
const WATER_DEPTH = 8.5;

/** Chỉ dựng một chunk được yêu cầu; caller sở hữu sprite và texture để gỡ khi ra xa. */
export function createTerrainChunk(scene: Phaser.Scene, index: number, tints: Int32Array) {
  const images = [addChunk(scene, 'terrain-' + index, index, false, tints, TERRAIN_DEPTH)];
  if (chunkHasWater(terrainGrid, index))
    images.push(addChunk(scene, 'water-' + index, index, true, tints, WATER_DEPTH));
  return images;
}

function addChunk(
  scene: Phaser.Scene,
  key: string,
  index: number,
  waterLayer: boolean,
  tints: Int32Array,
  depth: number,
) {
  if (!scene.textures.exists(key)) {
    const {width, height} = chunkPixels(terrainGrid, index);
    const texture = scene.textures.createCanvas(key, width, height)!;
    const image = texture.context.createImageData(width, height);
    paintChunk(terrainGrid, tints, index, waterLayer, image.data);
    texture.context.putImageData(image, 0, 0);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const x = chunkRange(index, terrainGrid.cols).first * TILE;
  return scene.add.image(x, 0, key).setOrigin(0).setScale(ART_PIXEL).setDepth(depth);
}
