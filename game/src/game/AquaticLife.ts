import {periodAt} from '../domain/dayTime.ts';
import {getRod} from '../data/rods.ts';
import type Phaser from 'phaser';
import {palette, colorNumber} from '../data/palette.ts';
import {terrainGrid, waters} from '../data/world.ts';
import {TILE} from '../domain/tilemap/types.ts';
import {BREATH_SECONDS, SwimmingSystem} from './systems/SwimmingSystem.ts';
import {FishSchoolSystem, type FishLure} from './systems/FishSchoolSystem.ts';
import {FishRenderer} from './rendering/FishRenderer.ts';
import type {CampingScene} from './CampingScene.ts';

export function waterColumn(x: number) {
  if (x < 0 || x >= terrainGrid.cols * TILE) return null;
  const c = terrainGrid.columnAt(x);
  const top = terrainGrid.waterSurfaceRow(c);
  const bed = terrainGrid.waterBedRow(c);
  return top < 0 || bed <= top ? null : {top: top * TILE, bed: bed * TILE};
}
/** Nối hệ thống nước, physics và hình ảnh; luật vẫn kiểm thử được khi không có Phaser. */
export class AquaticLife {
  readonly swimming = new SwimmingSystem(waterColumn);
  readonly school = new FishSchoolSystem(waters, waterColumn);
  private readonly renderer: FishRenderer;
  private readonly scene: CampingScene;
  private jumpRequested = false;
  private lure: FishLure | null = null;
  constructor(scene: CampingScene) {
    this.scene = scene;
    this.renderer = new FishRenderer(scene);
  }
  get nearWater() {
    return Boolean(waterColumn(this.scene.player.x));
  }
  jump() {
    if (!this.swimming.active) return false;
    this.jumpRequested = true;
    return true;
  }
  reset() {
    this.swimming.reset();
    (this.scene.player.body as Phaser.Physics.Arcade.Body).moves = true;
    this.jumpRequested = false;
  }
  step(dt: number) {
    const scene = this.scene;
    const player = scene.player;
    const body = player.body as Phaser.Physics.Arcade.Body;
    const result = this.swimming.update(
      dt,
      {x: player.x, y: player.y, vx: body.velocity.x, vy: body.velocity.y},
      {horizontal: scene.controls.direction, vertical: scene.controls.vertical, jump: this.jumpRequested},
    );
    this.jumpRequested = false;
    body.moves = !this.swimming.active;
    if (result) {
      player.setPosition(result.x, result.y).setVelocity(result.vx, result.vy);
      body.updateFromGameObject();
      if (this.swimming.active && (scene.fishing || scene.selected)) scene.cancelAction();
    }
    if (!scene.fishing) {
      this.school.release(false);
      this.lure = null;
    } else if (scene.fishing.phase === 'fight') this.school.hook();
    const view = scene.cameras.main.worldView;
    this.school.update(
      dt,
      scene.clock,
      {x: player.x, y: player.y, wet: this.swimming.active},
      {left: view.x, right: view.right},
      this.lure,
      periodAt(scene.state.time),
    );
  }
  cast(water: (typeof waters)[number]) {
    const scene = this.scene;
    const x = Math.max(
      water.x + 12,
      Math.min(water.x + water.width - 12, scene.player.x + (scene.player.flipX ? -55 : 55)),
    );
    const column = waterColumn(x);
    if (!column) return false;
    this.lure = {waterId: water.id, x, y: column.top};
    const target = this.school.reserve(this.lure, periodAt(scene.state.time), getRod(scene.state.rod).luck);
    if (!target) {
      this.lure = null;
      return false;
    }
    scene.fishingSystem.cast(water, scene.state.rod, scene.state.time, {
      species: target.species,
      length: target.length,
    });
    return true;
  }
  get readyToBite() {
    return !this.lure || this.school.atLure(this.lure);
  }
  caught() {
    this.school.release(true);
    this.lure = null;
  }
  draw() {
    this.renderer.draw(this.school.visible, this.scene.clock);
    const swim = this.swimming;
    const player = this.scene.player;
    const fx = this.scene.visuals.fx;
    if (!swim.active) return;
    const column = waterColumn(player.x)!;
    fx.fillStyle(colorNumber(palette.waterFoam), 0.7);
    for (let i = 0; i < 4; i++) {
      const y = player.y - 15 - ((this.scene.clock * 25 + i * 13) % 65);
      if (y > column.top) fx.fillRect(player.x - 16 + i * 8, y, 2, 2);
    }
    if (!swim.submerged && !swim.surfacing) return;
    fx.fillStyle(colorNumber(palette.ink), 0.9);
    fx.fillRect(player.x - 25, player.y - 92, 50, 8);
    fx.fillStyle(colorNumber(swim.surfacing ? palette.gold : palette.waterFoam));
    fx.fillRect(player.x - 23, player.y - 90, Math.round((46 * swim.air) / BREATH_SECONDS), 4);
  }
  dispose() {
    this.renderer.dispose();
  }
}
