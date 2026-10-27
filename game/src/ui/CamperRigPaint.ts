import {palette} from '../data/palette';
import {FRAME_H, FRAME_W, GROUND_ROW, type Frame} from '../domain/camperRig/types';

export const PAD = 4;
const ANCHOR_COLORS = {
  hand: palette.anchorHand,
  rodTip: palette.anchorRodTip,
  head: palette.anchorHead,
  headTop: palette.anchorHeadTop,
  feet: palette.anchorFeet,
};

let scratch: HTMLCanvasElement | null = null;

/** Vẽ một ảnh RGBA kích thước w×h vào ctx tại (x, y), phóng nguyên số, không làm mượt. */
export function paintPixels(
  ctx: CanvasRenderingContext2D,
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
  scale: number,
  flip = false,
) {
  scratch ??= document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  scratch.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(x + w * scale, y);
    ctx.scale(-1, 1);
    ctx.drawImage(scratch, 0, 0, w * scale, h * scale);
  } else {
    ctx.drawImage(scratch, x, y, w * scale, h * scale);
  }
  ctx.restore();
}

/** Nền ban ngày hoặc ban đêm có lửa, theo khung rig; mặt đất đặt đúng hàng GROUND_ROW + 1. */
export function paintBackground(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, night: boolean) {
  const w = FRAME_W * scale;
  const h = FRAME_H * scale;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, night ? palette.reviewNightTop : palette.bgSkyDayTop);
  sky.addColorStop(1, night ? palette.reviewNightLow : palette.reviewDayLow);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const ground = y + (GROUND_ROW + 1) * scale;
  ctx.fillStyle = night ? palette.terrainGrassDeep : palette.terrainGrassBright;
  ctx.fillRect(x, ground, w, 2 * scale);
  ctx.fillStyle = night ? palette.reviewNightSoil : palette.terrainDirtBase;
  ctx.fillRect(x, ground + 2 * scale, w, h - (GROUND_ROW + 1) * scale);
  if (!night) return;
  const cx = x + w - 6 * scale;
  const glow = ctx.createRadialGradient(cx, ground - 4 * scale, 2, cx, ground, 14 * scale);
  glow.addColorStop(0, palette.reviewFireCore);
  glow.addColorStop(1, palette.reviewFireEdge);
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = palette.legacy021;
  ctx.fillRect(cx - 3 * scale, ground - 3 * scale, 6 * scale, 3 * scale);
}

/** Lưới ô 16 pixel nghệ thuật, để thấy tỉ lệ so với ô địa hình. */
export function paintGrid(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.strokeStyle = palette.reviewGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 0; c <= FRAME_W; c += 16) {
    ctx.moveTo(x + c * scale + 0.5, y);
    ctx.lineTo(x + c * scale + 0.5, y + FRAME_H * scale);
  }
  for (let r = 0; r <= FRAME_H; r += 16) {
    ctx.moveTo(x, y + r * scale + 0.5);
    ctx.lineTo(x + FRAME_W * scale, y + r * scale + 0.5);
  }
  ctx.stroke();
}

/** Điểm neo, mỗi điểm một ô màu; khi lật hướng thì đổi cột. */
export function paintAnchors(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  x: number,
  y: number,
  scale: number,
  flip: boolean,
) {
  const dot = (p: {x: number; y: number}, color: string) => {
    const px = flip ? FRAME_W - 1 - p.x : p.x;
    ctx.fillStyle = color;
    ctx.fillRect(x + px * scale + scale / 4, y + p.y * scale + scale / 4, scale / 2, scale / 2);
  };
  const a = frame.anchors;
  dot(a.hand, ANCHOR_COLORS.hand);
  if (a.rodTip) dot(a.rodTip, ANCHOR_COLORS.rodTip);
  dot(a.head, ANCHOR_COLORS.head);
  dot(a.headTop, ANCHOR_COLORS.headTop);
  a.feet.forEach((p) => dot(p, ANCHOR_COLORS.feet));
}
