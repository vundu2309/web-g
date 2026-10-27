import Phaser from 'phaser';
import {mixColor} from '../../domain/backdrop/mix.ts';

type Context = CanvasRenderingContext2D;

/** Bộ đệm điểm ảnh RGBA của một texture nền: vẽ từng điểm rồi đẩy một lần vào canvas. */
export class BackdropPixels {
  readonly width: number;
  readonly height: number;
  private readonly image: ImageData;
  private readonly data: Uint8ClampedArray;

  constructor(context: Context, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.image = context.createImageData(width, height);
    this.data = this.image.data;
  }

  /** Ghi điểm ảnh (0xRRGGBB, alpha 0..255); ngoài khung thì bỏ qua. */
  put(x: number, y: number, color: number, alpha = 255) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const o = (y * this.width + x) * 4;
    this.data[o] = (color >> 16) & 255;
    this.data[o + 1] = (color >> 8) & 255;
    this.data[o + 2] = color & 255;
    this.data[o + 3] = alpha;
  }

  /** Alpha hiện có tại (x, y); ngoài khung là 0. */
  alphaAt(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.data[(y * this.width + x) * 4 + 3];
  }

  /** Ghi điểm ảnh trộn với màu nền sẵn có theo amount (0..1), giữ alpha đã có. */
  blend(x: number, y: number, color: number, amount: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const o = (y * this.width + x) * 4;
    const current = (this.data[o] << 16) | (this.data[o + 1] << 8) | this.data[o + 2];
    this.put(x, y, mixColor(current, color, amount), this.data[o + 3]);
  }

  /** Đẩy bộ đệm vào texture (dùng một lần sau khi vẽ xong) và đặt lọc NEAREST. */
  commit(texture: Phaser.Textures.CanvasTexture) {
    texture.context.putImageData(this.image, 0, 0);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

/** Tạo canvas texture rỗng cho khóa; nếu đã có thì trả về null để bỏ qua việc vẽ lại. */
export function newBackdropTexture(scene: Phaser.Scene, key: string, width: number, height: number) {
  if (scene.textures.exists(key)) return null;
  return scene.textures.createCanvas(key, width, height)!;
}
