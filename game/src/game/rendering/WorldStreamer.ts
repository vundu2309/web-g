import type Phaser from 'phaser';
import {terrainGrid, WORLD_WIDTH} from '../../data/world';
import {vegetationWorld} from '../../data/vegetationWorld';
import {decorChunks, DECOR_CHUNK} from '../../domain/vegetation/decorChunks';
import {placeTrees, type TreePlacement} from '../../domain/vegetation/placement';
import {chunkCount} from '../../domain/tilemap/tileChunks';
import {ChunkWindow} from './ChunkWindow';
import {createTerrainChunk} from './terrainLayers';
import {columnTints} from '../../domain/tilemap/tileArt';
import {createDecorChunk, swayCanopies} from './decorLayer';
import type {Quality} from './resolution';

/** Có đệm 256 đơn vị cho cây có gốc ngoài view nhưng tán vươn vào màn hình. */
const OVERHANG = 256;
type Loaded = ReturnType<typeof createDecorChunk>;

/** Chỉ quản lý hình ảnh; lưới địa hình, va chạm, tài nguyên và Save không bị tải/gỡ theo camera. */
export class WorldStreamer {
  private readonly chunks: ChunkWindow<Loaded>;
  readonly stats = {loadedChunks: 0, loadedTrees: 0, updatedCanopies: 0};
  constructor(private readonly scene: Phaser.Scene) {
    const tints = columnTints(terrainGrid);
    const decor = decorChunks(vegetationWorld);
    const trees = new Map<number, TreePlacement[]>();
    for (const tree of placeTrees(vegetationWorld)) {
      const index = Math.floor(tree.x / DECOR_CHUNK);
      const bucket = trees.get(index) ?? [];
      bucket.push(tree);
      trees.set(index, bucket);
    }
    this.chunks = new ChunkWindow(
      chunkCount(terrainGrid.cols),
      DECOR_CHUNK,
      (index) => {
        const part = createDecorChunk(scene, decor[index], trees.get(index) ?? []);
        part.images.push(...createTerrainChunk(scene, index, tints));
        return part;
      },
      (index, part) => {
        for (const image of part.images) image.destroy();
        // Texture chung của cây được giữ lại; texture địa hình/trang trí được giải phóng cả CPU/GPU.
        for (const prefix of ['terrain-', 'water-', 'decor-']) {
          const key = prefix + index;
          if (scene.textures.exists(key)) scene.textures.remove(key);
        }
      },
    );
  }
  update(clock: number, quality: Quality) {
    const view = this.scene.cameras.main.worldView;
    this.chunks.update(Math.max(0, view.x - OVERHANG), Math.min(WORLD_WIDTH, view.right + OVERHANG));
    this.stats.loadedChunks = this.chunks.loaded.size;
    this.stats.loadedTrees = 0;
    this.stats.updatedCanopies = 0;
    for (const part of this.chunks.loaded.values()) {
      this.stats.loadedTrees += part.canopies.length;
      this.stats.updatedCanopies += swayCanopies(part.canopies, view, clock, quality);
    }
  }
  dispose() {
    this.chunks.dispose();
    this.stats.loadedChunks = this.stats.loadedTrees = this.stats.updatedCanopies = 0;
  }
}
