import Phaser from 'phaser';
import {terrainGrid} from '../../data/world.ts';
import {writePeriodWeights} from '../../domain/backdrop/periods.ts';
import {bloomStrength, skyTint} from '../../domain/lighting/compose.ts';
import {LightField} from '../../domain/lighting/lightField.ts';
import type {Save} from '../../domain/saveTypes.ts';
import {TILE} from '../../domain/tilemap/types.ts';
import {LayerCameras} from './cameraLayers.ts';
import {LightBloom} from './LightBloom.ts';
import {LIGHT_PIPELINE, LightPipeline} from './LightPipeline.ts';
import type {Quality} from './resolution.ts';

const TEXTURE_KEY = 'light-field';
/** Đệm quanh khung nhìn, theo ô, để cảnh cuộn không lộ mép ánh sáng. */
const MARGIN = 2;
/** Chu kỳ tổng hợp (giây game): chế độ Đẹp 10 lần/giây, Tiết kiệm 5 lần/giây. */
const TICK_HIGH = 0.1;
const TICK_LOW = 0.2;

/**
 * Ánh sáng theo ô cho cảnh: tổng hợp texture RGBA theo ô, nhân lên camera thế giới qua LightPipeline,
 * và quầng cộng trên camera hiệu ứng. Trường trời và nguồn nằm trong LightField (thuần).
 */
export class WorldLighting {
  private readonly field = new LightField(terrainGrid);
  private readonly layers: LayerCameras;
  private readonly bloom: LightBloom;
  private readonly pipeline: LightPipeline | null = null;
  private readonly weights = new Float64Array(3);
  private readonly tint = new Float64Array(3);
  private readonly xform = new Float32Array([1, 1, 0, 0]);
  private texture: Phaser.Textures.CanvasTexture | null = null;
  private image: ImageData | null = null;
  private win = {c0: 0, r0: 0, cols: 0, rows: 0};
  private lastTick = -Infinity;

  constructor(private readonly scene: Phaser.Scene) {
    this.layers = new LayerCameras(scene);
    this.bloom = new LightBloom(scene);
    const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer.type === Phaser.WEBGL && renderer.pipelines) {
      renderer.pipelines.addPostPipeline(LIGHT_PIPELINE, LightPipeline);
      this.layers.world.setPostPipeline(LIGHT_PIPELINE);
      this.pipeline = this.layers.world.getPostPipeline(LIGHT_PIPELINE) as LightPipeline;
    }
  }

  /** Mỗi khung: đồng bộ camera, tổng hợp theo chu kỳ, đặt uniform và quầng. Tiết kiệm/Đẹp khác tần suất. */
  update(state: Save, clock: number, quality: Quality) {
    this.layers.assignIfChanged(this.scene.children.list);
    this.layers.sync(this.scene.cameras.main);
    const view = this.layers.world.worldView;
    const interval = quality === 'high' ? TICK_HIGH : TICK_LOW;
    if (this.pipeline && clock - this.lastTick >= interval) {
      this.lastTick = clock;
      this.compose(state, view);
    }
    this.placeLight(view);
    this.bloom.update(this.field.sources(), view, this.strength(state), clock, quality);
  }

  private strength(state: Save) {
    writePeriodWeights(state.time, this.weights);
    return bloomStrength(this.weights);
  }

  private compose(state: Save, view: Phaser.Geom.Rectangle) {
    this.field.setBuildings(state.buildings, state.time);
    const c0 = Math.floor(view.x / TILE) - MARGIN;
    const r0 = Math.floor(view.y / TILE) - MARGIN;
    const cols = Math.ceil(view.right / TILE) + MARGIN - c0;
    const rows = Math.ceil(view.bottom / TILE) + MARGIN - r0;
    this.ensureTexture(cols, rows);
    writePeriodWeights(state.time, this.weights);
    skyTint(this.weights, this.tint);
    this.field.compose({c0, r0, cols, rows}, this.tint, this.image!.data);
    this.texture!.context.putImageData(this.image!, 0, 0);
    this.texture!.refresh();
    // Canvas refresh re-creates the GL texture with the pixelArt default (NEAREST); LINEAR is set again after each upload.
    this.texture!.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.win = {c0, r0, cols, rows};
  }

  private ensureTexture(cols: number, rows: number) {
    if (this.texture && this.image && this.image.width === cols && this.image.height === rows) return;
    if (this.scene.textures.exists(TEXTURE_KEY)) this.scene.textures.remove(TEXTURE_KEY);
    this.texture = this.scene.textures.createCanvas(TEXTURE_KEY, cols, rows)!;
    this.image = this.texture.context.createImageData(cols, rows);
    this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  /** Phép biến đổi uv từ camera sang texture theo vùng đã tổng hợp (không theo camera hiện tại). */
  private placeLight(view: Phaser.Geom.Rectangle) {
    if (!this.pipeline || !this.texture) return;
    const w = this.win;
    const width = w.cols * TILE;
    const height = w.rows * TILE;
    this.xform[0] = view.width / width;
    this.xform[1] = view.height / height;
    this.xform[2] = (view.x - w.c0 * TILE) / width;
    this.xform[3] = (view.y - w.r0 * TILE) / height;
    this.pipeline.setLight(this.texture.source[0].glTexture, this.xform);
  }
}
