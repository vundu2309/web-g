import {palette} from '../data/palette';
import {gear} from '../data/catalog';
import type {FaceVariant} from '../data/camperHead';
import {buildCamperFrames, rgbTable, rigPaletteOf} from '../domain/camperRig/build';
import {Canvas} from '../domain/camperRig/raster';
import {drawHead} from '../domain/camperRig/head';
import {FRAME_H, FRAME_W, GROUND_ROW, RIG_STATES, type RigOutfit, type RigState} from '../domain/camperRig/types';
import {PAD, paintAnchors, paintBackground, paintGrid, paintPixels} from './CamperRigPaint';

type Slot = 'hat' | 'shirt' | 'pants' | 'bag';
const SLOT_GEAR: Readonly<Record<Slot, string>> = {hat: 'hat', shirt: 'shirt', pants: 'pants', bag: 'backpack'};
const SLOT_LABEL: Readonly<Record<Slot, string>> = {hat: 'Mũ', shirt: 'Áo', pants: 'Quần', bag: 'Balo'};
const SLOTS: readonly Slot[] = ['hat', 'shirt', 'pants', 'bag'];
/** Hai bộ trang bị mặc định: vải bố (mũ kiểm lâm) và rừng thông (mũ len). */
const DEFAULTS: readonly [string, string, string, string][] = [
  ['hat-ranger', 'shirt-linen', 'pants-trail', 'bag-canvas'],
  ['hat-knit', 'shirt-pine', 'pants-denim', 'bag-moss'],
];
const DEFAULT_NAMES = ['Vải bố · mũ kiểm lâm', 'Rừng thông · mũ len'] as const;
const FACES: readonly FaceVariant[] = ['open', 'blink', 'glance', 'strain', 'bow', 'air'];

export interface RigGalleryHandle {
  show(): void;
  hide(): void;
}

/** Thông tin một món để điền ô chọn: id, tên và màu lấy từ `gear`. */
function pieceOptions(slot: Slot) {
  return gear.filter((item) => item.slot === SLOT_GEAR[slot]);
}

function pieceOf(id: string): RigOutfit['hat'] {
  const item = gear.find((entry) => entry.id === id);
  if (!item) throw new Error('thiếu món ' + id);
  return {id, color: item.color};
}

function outfitFrom(ids: readonly string[]): RigOutfit {
  return {hat: pieceOf(ids[0]), shirt: pieceOf(ids[1]), pants: pieceOf(ids[2]), bag: pieceOf(ids[3])};
}

function el<T extends HTMLElement = HTMLElement>(tag: string) {
  return document.createElement(tag) as T;
}

function selectHtml(slot: Slot, value: string) {
  const options = pieceOptions(slot)
    .map((item) => `<option value="${item.id}"${item.id === value ? ' selected' : ''}>${item.name}</option>`)
    .join('');
  return `<label>${SLOT_LABEL[slot]} <select id="rig-${slot}">${options}</select></label>`;
}

/** Đầu 12×: mọi biến thể mặt (hàng) với hai mũ (cột), vẽ bằng đúng pipeline của bộ xương. */
function paintHeads(canvas: HTMLCanvasElement, outfit: RigOutfit, scale: number) {
  const rgb = rgbTable(rigPaletteOf(outfit));
  const hats = ['hat-ranger', 'hat-knit'] as const;
  const cell = 14 * scale + PAD;
  canvas.width = hats.length * cell + PAD;
  canvas.height = FACES.length * cell + PAD;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = palette.ink;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  FACES.forEach((face, row) =>
    hats.forEach((hat, col) => {
      const c = new Canvas(14, 14);
      drawHead(c, {x: 7, y: 7}, face, hat);
      const x = PAD + col * cell;
      const y = PAD + row * cell;
      ctx.fillStyle = palette.reviewHeadBackdrop;
      ctx.fillRect(x, y, 14 * scale, 14 * scale);
      paintPixels(ctx, c.toRgba(rgb), 14, 14, x, y, scale);
    }),
  );
}

/** Gắn chế độ "Bộ xương" vào trang gallery dev; trả về điều khiển hiện/ẩn. */
export function mountRigGallery(root: HTMLElement): RigGalleryHandle {
  const wrap = el('section');
  wrap.className = 'rig-review';
  wrap.hidden = true;
  const [hatId, shirtId, pantsId, bagId] = DEFAULTS[0];
  wrap.innerHTML = `
    <section class="review-toolbar" aria-label="Điều khiển bộ xương">
      ${selectHtml('hat', hatId)}${selectHtml('shirt', shirtId)}${selectHtml('pants', pantsId)}${selectHtml('bag', bagId)}
      <label>Trạng thái <select id="rig-state">${RIG_STATES.map((s) => `<option value="${s}">${s}</option>`).join('')}</select></label>
      <label>Phóng to <select id="rig-zoom"><option value="1">1×</option><option value="3">3×</option>
        <option value="6" selected>6×</option></select></label>
      <button id="rig-night" aria-pressed="false">Ban đêm</button>
      <button id="rig-anchors" aria-pressed="false">Neo</button>
      <button id="rig-grid" aria-pressed="false">Lưới ô 16</button>
      <button id="rig-compare" aria-pressed="false">So sánh hai bộ mặc định</button>
      <button id="rig-pause" aria-pressed="false">Tạm dừng</button>
      <button id="rig-flip" aria-pressed="false">Đổi hướng</button>
    </section>
    <p class="review-spec">Bộ xương: khung ${FRAME_W} × ${FRAME_H}, hàng mặt đất ${GROUND_ROW}. Cột đầu của mỗi hàng là
      Mỗi món có hai hình dáng: đổi id để đổi hình, đổi màu theo gear.</p>
    <h3>Đầu 12× · sáu biến thể mặt (hàng) × hai mũ (cột)</h3>
    <div style="overflow-x:auto;max-width:100%"><canvas id="rig-heads"></canvas></div>
    <h3>Tất cả frame, hàng là trạng thái</h3>
    <div style="overflow-x:auto;max-width:100%"><canvas id="rig-sheet"></canvas></div>
    <h3>Chạy động</h3>
    <canvas id="rig-anim"></canvas>`;
  root.append(wrap);
  const view = {
    ids: [hatId, shirtId, pantsId, bagId],
    pose: 'idle' as RigState,
    zoom: 6,
    night: false,
    anchors: false,
    grid: false,
    compare: false,
  };
  const motion = {paused: false, flip: false, frame: 0};
  const sheet = wrap.querySelector<HTMLCanvasElement>('#rig-sheet')!;
  const anim = wrap.querySelector<HTMLCanvasElement>('#rig-anim')!;
  const heads = wrap.querySelector<HTMLCanvasElement>('#rig-heads')!;
  const q = <T extends HTMLElement>(id: string) => wrap.querySelector<T>('#' + id)!;
  const current = () => outfitFrom(view.ids);

  const drawSheet = () => {
    const blocks = view.compare ? DEFAULTS.map((ids) => outfitFrom(ids)) : [current()];
    const s = view.zoom;
    const cols = Math.max(...RIG_STATES.map((name) => buildCamperFrames(current()).frames[name].length));
    const cellW = FRAME_W * s + PAD;
    const cellH = FRAME_H * s + PAD;
    const blockH = RIG_STATES.length * cellH + PAD + 2 * PAD;
    sheet.width = cols * cellW + PAD;
    sheet.height = blocks.length * blockH + PAD;
    const ctx = sheet.getContext('2d')!;
    ctx.fillStyle = palette.ink;
    ctx.fillRect(0, 0, sheet.width, sheet.height);
    blocks.forEach((outfit, block) => {
      const top = PAD + block * blockH + PAD;
      const set = buildCamperFrames(outfit);
      ctx.fillStyle = palette.cream;
      ctx.font = `600 ${Math.max(12, s * 3)}px system-ui, sans-serif`;
      ctx.fillText(view.compare ? DEFAULT_NAMES[block] : 'Bộ hiện tại', PAD, top - 2);
      RIG_STATES.forEach((name, row) => {
        const y = top + row * cellH;
        set.frames[name].forEach((frame, col) => {
          const x = PAD + col * cellW;
          paintBackground(ctx, x, y, s, view.night);
          paintPixels(ctx, frame.rgba, FRAME_W, FRAME_H, x, y, s);
          if (view.grid) paintGrid(ctx, x, y, s);
          if (view.anchors) paintAnchors(ctx, frame, x, y, s, false);
        });
      });
    });
  };

  const drawAnim = () => {
    const frames = buildCamperFrames(current()).frames[view.pose];
    const frame = frames[motion.frame % frames.length];
    const s = view.zoom;
    anim.width = FRAME_W * s + PAD * 2;
    anim.height = FRAME_H * s + PAD * 2;
    const ctx = anim.getContext('2d')!;
    paintBackground(ctx, PAD, PAD, s, view.night);
    paintPixels(ctx, frame.rgba, FRAME_W, FRAME_H, PAD, PAD, s, motion.flip);
    if (view.grid) paintGrid(ctx, PAD, PAD, s);
    if (view.anchors) paintAnchors(ctx, frame, PAD, PAD, s, motion.flip);
  };

  const redraw = () => {
    paintHeads(heads, current(), 12);
    drawSheet();
    drawAnim();
  };
  const flagButton = (id: string, get: () => boolean, set: (value: boolean) => void) => {
    q(id).addEventListener('click', () => {
      set(!get());
      q(id).setAttribute('aria-pressed', String(get()));
      redraw();
    });
  };

  SLOTS.forEach((slot, index) => {
    q<HTMLSelectElement>('rig-' + slot).addEventListener('change', (e) => {
      view.ids[index] = (e.target as HTMLSelectElement).value;
      redraw();
    });
  });
  q<HTMLSelectElement>('rig-state').addEventListener('change', (e) => {
    view.pose = (e.target as HTMLSelectElement).value as RigState;
    motion.frame = 0;
    drawAnim();
  });
  q<HTMLSelectElement>('rig-zoom').addEventListener('change', (e) => {
    view.zoom = Number((e.target as HTMLSelectElement).value);
    redraw();
  });
  flagButton(
    'rig-night',
    () => view.night,
    (v) => (view.night = v),
  );
  flagButton(
    'rig-anchors',
    () => view.anchors,
    (v) => (view.anchors = v),
  );
  flagButton(
    'rig-grid',
    () => view.grid,
    (v) => (view.grid = v),
  );
  flagButton(
    'rig-compare',
    () => view.compare,
    (v) => (view.compare = v),
  );
  flagButton(
    'rig-flip',
    () => motion.flip,
    (v) => (motion.flip = v),
  );
  q('rig-pause').addEventListener('click', () => {
    motion.paused = !motion.paused;
    q('rig-pause').setAttribute('aria-pressed', String(motion.paused));
    q('rig-pause').textContent = motion.paused ? 'Tiếp tục' : 'Tạm dừng';
  });

  let timer = 0;
  const step = () => {
    if (!motion.paused) motion.frame++;
    drawAnim();
    timer = window.setTimeout(step, 110);
  };
  return {
    show() {
      wrap.hidden = false;
      redraw();
      if (!timer) step();
    },
    hide() {
      wrap.hidden = true;
      window.clearTimeout(timer);
      timer = 0;
    },
  };
}
