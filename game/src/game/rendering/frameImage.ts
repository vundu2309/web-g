import {buildCamperFrames, outfitKey} from '../../domain/camperRig/build.ts';
import type {Frame, RigOutfit} from '../../domain/camperRig/types.ts';
import type {SpriteCrop} from './spriteImage.ts';

/** Ảnh pixel-exact (data URL) của một frame bộ xương, cắt theo `crop` nếu có, phóng `scale` lần, không làm mượt. */
export function frameDataUrl(frame: Frame, scale: number, crop?: SpriteCrop) {
  const source = document.createElement('canvas');
  source.width = frame.width;
  source.height = frame.height;
  const sourceContext = source.getContext('2d')!;
  const image = sourceContext.createImageData(frame.width, frame.height);
  image.data.set(frame.rgba);
  sourceContext.putImageData(image, 0, 0);
  const area = crop ?? {x: 0, y: 0, width: frame.width, height: frame.height};
  const target = document.createElement('canvas');
  target.width = area.width * scale;
  target.height = area.height * scale;
  const context = target.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, target.width, target.height);
  return target.toDataURL();
}

/** Chân dung HUD và hình kho đồ của một bộ trang bị: mã hóa PNG một lần rồi giữ theo khóa bộ (mã hóa chậm). */
export interface Look {
  readonly portrait: string;
  readonly figure: string;
}

export class LookCache {
  private readonly looks = new Map<string, Look>();

  constructor(private readonly portraitCrop: SpriteCrop) {}

  of(outfit: RigOutfit): Look {
    const key = outfitKey(outfit);
    const hit = this.looks.get(key);
    if (hit) return hit;
    const frame = buildCamperFrames(outfit).frames.idle[0]!;
    const look = {portrait: frameDataUrl(frame, 3, this.portraitCrop), figure: frameDataUrl(frame, 8)};
    this.looks.set(key, look);
    return look;
  }
}
