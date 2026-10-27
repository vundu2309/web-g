import Phaser from 'phaser';
import {layerForDepth} from '../../domain/lighting/layers.ts';

/**
 * Ba camera theo thứ tự vẽ: nền (cameras.main, có màu nền), thế giới (được chiếu sáng, trong suốt) và hiệu ứng
 * (không chiếu sáng, cộng quầng). Mỗi đối tượng được gắn cameraFilter để chỉ đúng một camera vẽ nó.
 */
export class LayerCameras {
  readonly world: Phaser.Cameras.Scene2D.Camera;
  readonly effects: Phaser.Cameras.Scene2D.Camera;
  private assigned = -1;
  private dirty = true;
  private readonly invalidate = () => {
    this.dirty = true;
  };

  constructor(private readonly scene: Phaser.Scene) {
    const main = scene.cameras.main;
    this.world = scene.cameras.add(0, 0, main.width, main.height);
    this.effects = scene.cameras.add(0, 0, main.width, main.height);
    scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.invalidate);
    scene.events.on(Phaser.Scenes.Events.REMOVED_FROM_SCENE, this.invalidate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.invalidate);
      scene.events.off(Phaser.Scenes.Events.REMOVED_FROM_SCENE, this.invalidate);
    });
  }

  /** Sao chép khung, zoom và vị trí camera nền sang hai camera còn lại (gọi mỗi khung trước khi vẽ). */
  sync(main: Phaser.Cameras.Scene2D.Camera) {
    for (const camera of [this.world, this.effects]) {
      camera.setSize(main.width, main.height);
      camera.setZoom(main.zoom);
      camera.setScroll(main.scrollX, main.scrollY);
      camera.preRender();
    }
  }

  /** Gán lại cameraFilter khi display list đổi, kể cả thay chunk nhưng số đối tượng vẫn bằng nhau. */
  assignIfChanged(children: readonly Phaser.GameObjects.GameObject[]) {
    if (!this.dirty && children.length === this.assigned) return;
    this.dirty = false;
    this.assigned = children.length;
    const main = this.scene.cameras.main;
    for (const child of children) {
      if (!('depth' in child) || typeof child.depth !== 'number') continue;
      const layer = layerForDepth(child.depth);
      const ignored =
        layer === 'background'
          ? this.world.id | this.effects.id
          : layer === 'world'
            ? main.id | this.effects.id
            : main.id | this.world.id;
      child.cameraFilter = ignored;
    }
  }
}
