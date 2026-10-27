import type Phaser from 'phaser';
import {MOON, MOON_COLORS, SKY_TONES, STAR_COLORS, SUN_DAY, SUN_DUSK, SUN_HIGHLIGHT} from '../../data/backdropTones';
import {PERIOD_COUNT, writePeriodWeights} from '../../domain/backdrop/periods';
import {stackAlphas} from '../../domain/backdrop/stack';
import {BACKDROP_WIDTH} from './backdropLayers';
import {paintMoon, paintSkyBands, paintStars, paintSun} from './backdropSky';
import {BackdropPixels, newBackdropTexture} from './backdropPixels';
import {MAX_ART_HEIGHT, type Quality} from './resolution';

const SKY_WIDTH = 64;
const STAR_ROWS = 150;
const SUN_DAY_SIZE = 96;
const SUN_DUSK_SIZE = 144;
const MOON_SIZE = 80;
/** Nhịp nhấp nháy của sao: biên độ rất nhỏ, chỉ chạy ở chế độ Đẹp. */
const TWINKLE_SPEED = 1.7;
const TWINKLE_DEPTH = 0.15;

/**
 * Trời, sao, mặt trời và trăng. Mỗi thứ là vài texture vẽ một lần; khi giờ đổi thì chỉ đổi alpha xếp chồng,
 * nên trời chuyển mượt theo domain/dayTime mà không vẽ lại texture trong khung hình.
 */
export class SkyLayers {
  private readonly sky: Phaser.GameObjects.TileSprite[] = [];
  private readonly celestial: Phaser.GameObjects.Image[] = [];
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly weights = new Float64Array(PERIOD_COUNT);
  private readonly alphas = new Float64Array(PERIOD_COUNT);
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let p = 0; p < PERIOD_COUNT; p++) {
      const key = 'bg-sky-' + p;
      this.paintTexture(key, SKY_WIDTH, MAX_ART_HEIGHT, (px) => {
        const [top, mid, low] = SKY_TONES[p];
        paintSkyBands(px, top, mid, low);
      });
      this.sky.push(
        scene.add.tileSprite(0, 0, 1, 1, key).setOrigin(0).setDepth(-10).setScrollFactor(0).setTileScale(2),
      );
    }
    this.stars = this.addStars();
    this.addCelestial();
  }

  private paintTexture(key: string, width: number, height: number, paint: (px: BackdropPixels) => void) {
    const texture = newBackdropTexture(this.scene, key, width, height);
    if (!texture) return;
    const px = new BackdropPixels(texture.context, width, height);
    paint(px);
    px.commit(texture);
  }

  private addStars() {
    this.paintTexture('bg-stars', BACKDROP_WIDTH, MAX_ART_HEIGHT, (px) => paintStars(px, STAR_COLORS, STAR_ROWS));
    return this.scene.add
      .tileSprite(0, 0, 1, 1, 'bg-stars')
      .setOrigin(0)
      .setDepth(-9.5)
      .setScrollFactor(0)
      .setTileScale(2)
      .setAlpha(0);
  }

  private addCelestial() {
    this.paintTexture('bg-sun-day', SUN_DAY_SIZE, SUN_DAY_SIZE, (px) =>
      paintSun(px, SUN_DAY.radius, SUN_DAY.core, SUN_HIGHLIGHT),
    );
    this.paintTexture('bg-sun-dusk', SUN_DUSK_SIZE, SUN_DUSK_SIZE, (px) =>
      paintSun(px, SUN_DUSK.radius, SUN_DUSK.core, SUN_HIGHLIGHT),
    );
    this.paintTexture('bg-moon', MOON_SIZE, MOON_SIZE, (px) => paintMoon(px, MOON.radius, MOON_COLORS));
    for (const key of ['bg-sun-day', 'bg-sun-dusk', 'bg-moon']) {
      this.celestial.push(this.scene.add.image(0, 0, key).setDepth(-9).setScrollFactor(0).setScale(2));
    }
  }

  /** Mỗi khung: alpha xếp chồng theo giờ; sao nhấp nháy nhẹ khi ban đêm và chỉ ở chế độ Đẹp. */
  draw(time: number, clock: number, quality: Quality, view: Phaser.Geom.Rectangle, screenX: number, screenY: number) {
    writePeriodWeights(time, this.weights);
    stackAlphas(this.weights, this.alphas);
    for (let p = 0; p < PERIOD_COUNT; p++) {
      this.sky[p]
        .setPosition(screenX, screenY)
        .setSize(view.width + 2, view.height + 2)
        .setAlpha(this.alphas[p]);
    }
    const night = this.weights[2];
    const twinkle = 1 - TWINKLE_DEPTH + TWINKLE_DEPTH * Math.sin(clock * TWINKLE_SPEED);
    this.stars
      .setPosition(screenX, screenY)
      .setSize(view.width + 2, view.height + 2)
      .setAlpha(quality === 'high' ? night * twinkle : 0);
    this.placeCelestial(view, screenX, screenY);
  }

  private placeCelestial(view: Phaser.Geom.Rectangle, screenX: number, screenY: number) {
    const sunDayAlpha = this.alphas[0];
    const sunDuskAlpha = this.alphas[1];
    const moonAlpha = this.alphas[2];
    const sunDay = this.celestial[0];
    const sunDusk = this.celestial[1];
    const moon = this.celestial[2];
    sunDay.setPosition(screenX + SUN_DAY.x * view.width, screenY + SUN_DAY.y * view.height).setAlpha(sunDayAlpha);
    sunDusk.setPosition(screenX + SUN_DUSK.x * view.width, screenY + SUN_DUSK.y * view.height).setAlpha(sunDuskAlpha);
    moon.setPosition(screenX + MOON.x * view.width, screenY + MOON.y * view.height).setAlpha(moonAlpha);
  }
}
