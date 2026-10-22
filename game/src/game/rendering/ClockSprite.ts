import type Phaser from 'phaser';
import type {SpriteDefinition} from '../../domain/sprite';
/** Phaser's registered animation frames, sampled with game time so pause freezes the exact pose. */
export class ClockSprite {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly definition: SpriteDefinition;
  private texture = '';
  private state = '';
  private key = '';
  constructor(sprite: Phaser.GameObjects.Sprite, definition: SpriteDefinition) {
    this.sprite = sprite;
    this.definition = definition;
  }
  /** Elapsed seconds since this state began; pausing the game stops elapsed time and freezes the frame. */
  draw(texture: string, state: string, elapsed: number) {
    const definition = this.definition.animations[state];
    if (!definition) return;
    if (texture !== this.texture || state !== this.state) {
      this.texture = texture;
      this.state = state;
      this.key = texture + ':' + state;
      this.sprite.play(this.key);
      this.sprite.anims.pause();
    }
    const animation = this.sprite.scene.anims.get(this.key);
    this.sprite.anims.setCurrentFrame(animation.frames[this.indexAt(elapsed)]);
  }
  /** Index into the animation’s frame list for an elapsed time, without allocating. */
  indexAt(elapsed: number) {
    const definition = this.definition.animations[this.state];
    const animation = this.sprite.scene.anims.get(this.key);
    const index = Math.max(0, Math.floor(elapsed * definition.frameRate));
    return definition.repeat < 0 ? index % animation.frames.length : Math.min(index, animation.frames.length - 1);
  }
}
