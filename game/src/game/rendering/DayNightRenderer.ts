import type Phaser from 'phaser';
import type {Save} from '../../domain/saveTypes';
import {SkyLayers} from './SkyLayers';
import {WorldLighting} from './WorldLighting';
import type {Quality} from './resolution';

/** Trời, sao, mặt trời và trăng nằm ở camera nền (SkyLayers); ánh sáng theo ô ở WorldLighting. */
export class DayNightRenderer {
  private readonly skyLayers: SkyLayers;
  private readonly lighting: WorldLighting;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.skyLayers = new SkyLayers(scene);
    this.lighting = new WorldLighting(scene);
  }

  draw(state: Save, clock: number, quality: Quality) {
    const camera = this.scene.cameras.main;
    const view = camera.worldView;
    const x = view.x - camera.scrollX;
    const y = view.y - camera.scrollY;
    this.skyLayers.draw(state.time, clock, quality, view, x, y);
    this.lighting.update(state, clock, quality);
  }
}
