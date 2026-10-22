import type Phaser from 'phaser';
import type {CampingScene} from './CampingScene';
import {groundAt} from '../data/world';
export class CampSimulation {
  private saveTime = 0;
  reset() {
    this.saveTime = 0;
  }
  step(scene: CampingScene, dt: number) {
    scene.clock += dt;
    scene.state.time = (scene.state.time + dt) % 480;
    scene.state.speedBuff = Math.max(0, scene.state.speedBuff - dt);
    this.saveTime += dt;
    if (this.saveTime >= 10) {
      this.saveTime = 0;
      scene.persist();
    }
    const direction = scene.controls.direction;
    if (direction && scene.fishingSystem.cancel()) scene.ui.toast('Đã thu cần để di chuyển.');
    const body = scene.player.body as Phaser.Physics.Arcade.Body;
    if (direction && body.blocked.down && body.velocity.y >= 0) {
      const next = groundAt(scene.player.x + direction * 18),
        rise = scene.player.y - next;
      if (rise > 0 && rise <= 32) {
        scene.player.setY(next - 0.5);
        body.updateFromGameObject();
      }
    }
    scene.player.setVelocityX(scene.fishing ? 0 : direction * 220 * (scene.state.speedBuff > 0 ? 1.1 : 1));
    if (direction) scene.player.setFlipX(direction < 0);
    const event = scene.fishingSystem.update(dt, scene.controls.pulling, scene.state.easyFishing);
    if (event === 'bite') scene.ui.toast('Cá cắn câu! Nhấn E / GIẬT CẦN!');
    else if (event === 'caught') {
      const caught = scene.fishingSystem.reel(scene.state)!;
      scene.persist();
      scene.ui.toast('Câu được ' + caught.species.name + ' · ' + caught.length + ' cm. Đã cho vào kho đồ.');
    } else if (event === 'broken') scene.ui.toast('Dây đã đứt! Thả nút sớm hơn khi dây căng đỏ.');
    else if (event === 'escaped') scene.ui.toast('Cá đã thoát. Thử thả câu lần nữa nhé.');
  }
}
