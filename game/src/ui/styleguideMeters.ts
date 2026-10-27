import {palette} from '../data/palette';

/** Mẫu đo thanh canvas hiện có (CampRenderer.drawTension), dùng đúng màu và kích thước 104×20. */
export function mountFishingMeters(host: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 312;
  canvas.height = 144;
  canvas.setAttribute('aria-label', 'Thanh câu cá: lực dây vàng hoặc đỏ, tiến độ kéo xanh; hai trạng thái');
  const ctx = canvas.getContext('2d')!;
  for (const [row, tension] of [50, 90].entries()) {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = palette.legacy132;
    ctx.fillRect(0, row * 72, 312, 60);
    ctx.globalAlpha = 1;
    ctx.fillStyle = tension > 75 ? palette.legacy133 : palette.legacy134;
    ctx.fillRect(6, row * 72 + 6, tension * 3, 18);
    ctx.fillStyle = palette.legacy135;
    ctx.fillRect(6, row * 72 + 36, 45 * 3, 18);
  }
  host.append(canvas);
}
