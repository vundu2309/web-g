import Phaser from 'phaser';
import {buildCamperFrames, outfitKey} from '../../domain/camperRig/build.ts';
import {FRAME_H, FRAME_W, RIG_STATES, type RigOutfit} from '../../domain/camperRig/types.ts';
import {SHEET_ANIMATIONS} from '../../domain/camperRig/sheet.ts';

/**
 * Nạp bộ xương vào Phaser: một texture canvas chứa mọi frame theo thứ tự sheet, đăng ký animation theo trạng thái.
 * Cache theo bộ trang bị; đổi trang bị chỉ tạo texture mới khi bộ đó chưa từng dùng.
 */
export function loadCamperSheet(scene: Phaser.Scene, outfit: RigOutfit): string {
  const set = buildCamperFrames(outfit);
  const key = 'camper-rig:' + outfitKey(outfit);
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, FRAME_W * set.all.length, FRAME_H)!;
    const context = texture.context;
    set.all.forEach((frame, index) => {
      const image = context.createImageData(FRAME_W, FRAME_H);
      image.data.set(frame.rgba);
      context.putImageData(image, index * FRAME_W, 0);
      texture.add('frame-' + index, 0, index * FRAME_W, 0, FRAME_W, FRAME_H);
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  for (const state of RIG_STATES) {
    const animationKey = key + ':' + state;
    if (scene.anims.exists(animationKey)) continue;
    const animation = SHEET_ANIMATIONS[state];
    scene.anims.create({
      key: animationKey,
      frames: animation.frames.map((index) => ({key, frame: 'frame-' + index})),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    });
  }
  return key;
}

/**
 * Nạp sẵn các bộ trang bị khác, mỗi bộ một lần gọi theo đồng hồ Phaser (mỗi `delay` mili-giây), để lúc đổi trang bị
 * không phải làm hết trong một khung hình. `each` chạy thêm cho mỗi bộ (ví dụ mã hóa chân dung). Bộ đã nạp bỏ qua nhờ cache.
 */
export function warmCamperSheets(
  scene: Phaser.Scene,
  outfits: readonly RigOutfit[],
  delay = 40,
  each?: (outfit: RigOutfit) => void,
  done?: () => void,
) {
  if (outfits.length === 0) return void done?.();
  let next = 0;
  scene.time.addEvent({
    delay,
    repeat: outfits.length - 1,
    callback: () => {
      const outfit = outfits[next++];
      if (!outfit) return;
      loadCamperSheet(scene, outfit);
      each?.(outfit);
      if (next === outfits.length) done?.();
    },
  });
}
