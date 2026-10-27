import {COAST_X, OCEAN_X, SEA_LEVEL} from '../../data/worldLayout';
import {groundAt, WORLD_WIDTH} from '../../data/world';
import {backdropGround, landscapeTop} from '../../domain/backdrop/terrainAnchor';
import type Phaser from 'phaser';
import {
  CLOUD_TONES,
  FAR_FOREST_TONES,
  FAR_RIDGE_TONES,
  HAZE_TONES,
  MID_RIDGE_TONES,
  NEAR_FOREST_TONES,
} from '../../data/backdropTones';
import {LANDSCAPE_BASE_ART, LAYER_FACTORS, PINE_SHARE, TINT_CHANNELS, type BackdropLayer} from '../../data/parallax';
import {cloudDrift} from '../../domain/backdrop/clouds';
import {mixColor} from '../../domain/backdrop/mix';
import {regionColor, regionValue} from '../../domain/backdrop/regions';
import {PERIOD_COUNT, writePeriodWeights} from '../../domain/backdrop/periods';
import {stackAlphas} from '../../domain/backdrop/stack';
import {BackdropPixels, newBackdropTexture} from './backdropPixels';
import {BACKDROP_WIDTH, paintClouds, paintForest, paintRidge} from './backdropLayers';
import {MAX_ART_HEIGHT, type Quality} from './resolution';

/** Chiều cao texture theo điểm ảnh nghệ thuật: khung lớn nhất, nên không lặp dọc trên màn hình. */
const LAYER_HEIGHT = MAX_ART_HEIGHT;
const CLOUD_SPEED = 1.5;
const referenceGround = (x: number) => (x >= OCEAN_X ? SEA_LEVEL : groundAt(x));

/** Mỗi lớp là một chuỗi sprite cùng độ sâu; alpha xếp chồng theo trọng số giờ (và loại rừng theo vùng). */
interface Layer {
  kind: BackdropLayer;
  depth: number;
  sprites: Phaser.GameObjects.TileSprite[];
  /** Lớp rừng có sáu mục (tán tròn ba giờ, rồi cây thông ba giờ); các lớp khác có ba. */
  weights: Float64Array;
  alphas: Float64Array;
}

/** Nền xa cuộn theo parallax: mây, núi xa và giữa, rừng xa và gần; mỗi lớp là vài texture theo giờ. */
export class ParallaxRenderer {
  readonly layers: Layer[] = [];
  private readonly scene: Phaser.Scene;
  private readonly periods = new Float64Array(PERIOD_COUNT);

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const specs: [BackdropLayer, number, number][] = [
      ['clouds', -8, 0],
      ['mountainFar', -7, 0],
      ['mountainMid', -6, 0],
      ['forestFar', -5, 0],
      ['forestNear', -4, 0],
    ];
    for (const [kind, depth] of specs) {
      const count = kind === 'forestFar' || kind === 'forestNear' ? PERIOD_COUNT * 2 : PERIOD_COUNT;
      const sprites: Phaser.GameObjects.TileSprite[] = [];
      for (let i = 0; i < count; i++) {
        const key = this.textureKey(kind, i);
        this.ensureTexture(key, kind, i);
        sprites.push(this.addSprite(key, depth, LAYER_FACTORS[kind]));
      }
      this.layers.push({
        kind,
        depth,
        sprites,
        weights: new Float64Array(count),
        alphas: new Float64Array(count),
      });
    }
  }

  private textureKey(kind: BackdropLayer, index: number) {
    if (kind === 'forestFar' || kind === 'forestNear') {
      const type = index < PERIOD_COUNT ? 'round' : 'pine';
      return 'bg-' + kind + '-' + type + '-' + (index % PERIOD_COUNT);
    }
    return 'bg-' + kind + '-' + index;
  }

  private addSprite(key: string, depth: number, factor: number) {
    return this.scene.add
      .tileSprite(0, 0, 1100, LAYER_HEIGHT * 2, key)
      .setOrigin(0)
      .setDepth(depth)
      .setScrollFactor(factor, 1)
      .setTileScale(2);
  }

  /** Vẽ texture một lần cho khóa; khóa đã có (từ scene trước) thì bỏ qua. */
  private ensureTexture(key: string, kind: BackdropLayer, index: number) {
    const texture = newBackdropTexture(this.scene, key, BACKDROP_WIDTH, LAYER_HEIGHT);
    if (!texture) return;
    const px = new BackdropPixels(texture.context, BACKDROP_WIDTH, LAYER_HEIGHT);
    const period = index % PERIOD_COUNT;
    if (kind === 'clouds') paintClouds(px, CLOUD_TONES[period], 7);
    if (kind === 'mountainFar') {
      const [body, hi] = FAR_RIDGE_TONES[period];
      paintRidge(px, LANDSCAPE_BASE_ART.mountainFar, 86, [2, 5], 11, [body, hi], HAZE_TONES[period], 0.3);
    }
    if (kind === 'mountainMid') {
      const [body, hi] = MID_RIDGE_TONES[period];
      paintRidge(px, LANDSCAPE_BASE_ART.mountainMid, 60, [3, 7], 23, [body, hi], HAZE_TONES[period], 0.18);
    }
    if (kind === 'forestFar') {
      const body = FAR_FOREST_TONES[period];
      const pine = index >= PERIOD_COUNT;
      paintForest(
        px,
        LANDSCAPE_BASE_ART.forestFar,
        pine,
        body,
        mixColor(body, HAZE_TONES[period], 0.3),
        pine ? 32 : 31,
      );
    }
    if (kind === 'forestNear') {
      const body = NEAR_FOREST_TONES[period];
      const pine = index >= PERIOD_COUNT;
      const hi = mixColor(body, FAR_FOREST_TONES[period], 0.45);
      paintForest(px, LANDSCAPE_BASE_ART.forestNear, pine, body, hi, pine ? 42 : 41);
    }
    px.commit(texture);
  }

  /** Mỗi khung: đặt từng lớp theo camera, cuộn theo hệ số, xếp alpha theo giờ và tông vùng. */
  draw(x: number, clock: number, quality: Quality, time: number) {
    const camera = this.scene.cameras.main;
    const view = camera.worldView;
    // Núi/rừng neo vào mốc đất, không neo vào mép camera đang di chuyển theo cú nhảy.
    const terrainY = backdropGround(x, WORLD_WIDTH, referenceGround);
    writePeriodWeights(time, this.periods);
    const pine = regionValue(x, PINE_SHARE);
    const tint = regionColor(x, TINT_CHANNELS.red, TINT_CHANNELS.green, TINT_CHANNELS.blue);
    for (const layer of this.layers) {
      const visible = quality === 'high' || layer.kind === 'mountainFar' || layer.kind === 'forestNear';
      this.fillWeights(layer, pine);
      stackAlphas(layer.weights, layer.alphas);
      const coastFade = layer.kind === 'clouds' ? 1 : Math.max(0, Math.min(1, (OCEAN_X - x) / (OCEAN_X - COAST_X)));
      const factor = LAYER_FACTORS[layer.kind];
      for (let i = 0; i < layer.sprites.length; i++) {
        const sprite = layer.sprites[i];
        const show = visible && layer.alphas[i] > 0 && coastFade > 0;
        sprite.setVisible(show);
        if (!show) continue;
        sprite.setPosition(
          view.x - camera.scrollX * (1 - factor),
          layer.kind === 'clouds' ? view.y : landscapeTop(layer.kind, terrainY),
        );
        sprite.setSize(Math.ceil(view.width) + 2, Math.ceil(view.height) + 2);
        sprite.tilePositionX = view.x * factor + (layer.kind === 'clouds' ? cloudDrift(clock, CLOUD_SPEED) : 0);
        sprite.tilePositionY = 0;
        sprite.setTint(tint);
        sprite.setAlpha(layer.alphas[i] * coastFade);
      }
    }
  }

  /** Trọng số mục = trọng số giờ; với rừng nhân thêm tỉ lệ cây thông (theo vùng) hoặc tán lá rộng. */
  private fillWeights(layer: Layer, pine: number) {
    const count = PERIOD_COUNT;
    for (let p = 0; p < count; p++) {
      if (layer.kind !== 'forestFar' && layer.kind !== 'forestNear') {
        layer.weights[p] = this.periods[p];
        continue;
      }
      layer.weights[p] = this.periods[p] * (1 - pine);
      layer.weights[count + p] = this.periods[p] * pine;
    }
  }
}
