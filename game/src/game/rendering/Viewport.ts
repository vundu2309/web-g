import Phaser from 'phaser';
import {ART_PIXEL} from '../../data/palette';
import {pixelFrame, type PixelFrame, type Quality} from './resolution';
/** Owns resize/DPI listeners, canvas placement and text density; never changes world geometry. */
export class Viewport {
  private observer: ResizeObserver;
  private frame = 0;
  private media?: MediaQueryList;
  private readonly abort = new AbortController();
  pixelScale = 1;
  zoom = 1;
  /** Visible size in world units, which the camera and the sky use. */
  width = 800;
  height = 540;
  constructor(
    private readonly scene: Phaser.Scene,
    public quality: Quality,
    private readonly onResize: () => void,
  ) {
    this.observer = new ResizeObserver(() => this.schedule());
    this.observer.observe(scene.game.canvas.parentElement!);
    window.addEventListener('resize', () => this.schedule(), {signal: this.abort.signal});
    this.watchDpi();
    this.refresh();
  }
  private watchDpi() {
    this.media?.removeEventListener('change', this.dpiChanged);
    this.media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    this.media.addEventListener('change', this.dpiChanged);
  }
  private dpiChanged = () => {
    this.watchDpi();
    this.schedule();
  };
  private schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.refresh());
  }
  refresh() {
    const host = this.scene.game.canvas.parentElement!.getBoundingClientRect();
    const frame = pixelFrame(host.width, host.height, window.devicePixelRatio || 1, this.quality);
    if (this.scene.scale.width !== frame.canvasWidth || this.scene.scale.height !== frame.canvasHeight) {
      this.scene.scale.resize(frame.canvasWidth, frame.canvasHeight);
    }
    this.placeCanvas(frame);
    this.width = frame.artWidth * ART_PIXEL;
    this.height = frame.artHeight * ART_PIXEL;
    this.pixelScale = frame.pixelScale;
    this.zoom = frame.zoom;
    this.scene.cameras.main.setSize(frame.canvasWidth, frame.canvasHeight).setZoom(frame.zoom);
    for (const child of this.scene.children.list)
      if (child instanceof Phaser.GameObjects.Text) {
        child.setResolution(frame.zoom);
        child.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    this.onResize();
  }
  /** CSS size is the backing size divided by the density, so one device pixel maps to one backing pixel. */
  private placeCanvas(frame: PixelFrame) {
    const canvas = this.scene.game.canvas;
    canvas.style.width = frame.canvasWidth / frame.density + 'px';
    canvas.style.height = frame.canvasHeight / frame.density + 'px';
  }
  setQuality(quality: Quality) {
    this.quality = quality;
    this.refresh();
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.abort.abort();
    this.media?.removeEventListener('change', this.dpiChanged);
  }
}
