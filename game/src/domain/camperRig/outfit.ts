import type {Point} from './types.ts';
import type {Canvas, Tones} from './raster.ts';
import type {LegJoints} from './skeleton.ts';

/** Hai hình dáng mỗi slot: id trùng `gear`. Mỗi hàm vẽ một bộ phận theo đúng hình dáng, màu lấy từ tông. */
export const SHIRT_LINEN = 'shirt-linen';
export const SHIRT_PINE = 'shirt-pine';
export const PANTS_TRAIL = 'pants-trail';
export const PANTS_DENIM = 'pants-denim';
export const BAG_CANVAS = 'bag-canvas';
export const BAG_MOSS = 'bag-moss';

interface TorsoJoints {
  readonly hip: Point;
  readonly shoulder: Point;
}

/** Cổ tay áo: áo sơ mi xắn tay (sáng), áo khoác có bo gấu tối. */
export function sleeveCuff(id: string, shirt: Tones): Tones {
  if (id === SHIRT_LINEN) return [shirt[0], shirt[0], shirt[1], shirt[1]];
  if (id === SHIRT_PINE) return [shirt[2], shirt[3], shirt[3], shirt[3]];
  throw new Error('camperRig: áo không rõ ' + id);
}

/** Thân áo: sơ mi có nẹp và cổ mở; áo khoác dày hơn với cổ đứng, khóa kéo và túi ngực. */
export function drawTorso(c: Canvas, j: TorsoJoints, id: string, shirt: Tones, leather: number) {
  if (id === SHIRT_LINEN) {
    c.capsule(j.hip.x, j.hip.y - 0.3, j.shoulder.x, j.shoulder.y + 0.4, 3.1, 3.6, shirt);
    c.line(j.shoulder.x - 1, j.shoulder.y + 1.2, j.shoulder.x + 1.6, j.shoulder.y + 1.2, shirt[0]);
    c.line(j.shoulder.x + 0.8, j.shoulder.y + 1.5, j.hip.x + 0.8, j.hip.y - 1.5, shirt[2]);
    c.put(j.shoulder.x + 0.8, j.shoulder.y + 4.5, shirt[0]);
    return;
  }
  if (id === SHIRT_PINE) {
    c.capsule(j.hip.x, j.hip.y - 0.3, j.shoulder.x, j.shoulder.y + 0.4, 3.5, 4, shirt);
    c.line(j.shoulder.x - 1.8, j.shoulder.y + 0.2, j.shoulder.x + 2.2, j.shoulder.y + 0.2, shirt[3]);
    for (let y = Math.round(j.shoulder.y + 1.5); y < j.hip.y - 1; y++) {
      c.put(j.shoulder.x + 1, y, y % 2 ? shirt[3] : leather);
    }
    const px = Math.round(j.shoulder.x + 1.2);
    const py = Math.round(j.shoulder.y + 3.5);
    for (let dy = 0; dy < 3; dy++) {
      c.put(px, py + dy, shirt[3]);
      c.put(px + 2, py + dy, shirt[3]);
    }
    c.line(px + 1, py, px + 1, py + 2, shirt[2]);
    c.line(px, py + 3, px + 2, py + 3, shirt[3]);
    return;
  }
  throw new Error('camperRig: áo không rõ ' + id);
}

/** Chân quần: quần leo núi có miếng đệm gối, túi hộp đùi và dây ở gấu; quần denim có đường chỉ và gấu xắn. */
export function drawLeg(c: Canvas, l: LegJoints, id: string, tones: Tones, legR: number) {
  c.capsule(l.root.x, l.root.y, l.knee.x, l.knee.y, legR, legR * 0.95, tones);
  c.capsule(l.knee.x, l.knee.y, l.ankle.x, l.ankle.y, legR * 0.95, legR * 0.8, tones);
  if (id === PANTS_TRAIL) {
    c.ellipse(l.knee.x, l.knee.y, 1.6, 1.5, [tones[0], tones[1], tones[2], tones[3]]);
    const mx = Math.round((l.root.x + l.knee.x) / 2 - 0.6);
    const my = Math.round((l.root.y + l.knee.y) / 2);
    c.put(mx, my, tones[3]);
    c.put(mx + 1, my, tones[3]);
    c.put(mx, my + 1, tones[3]);
    c.put(mx + 1, my + 1, tones[3]);
    c.put(Math.round(l.ankle.x), Math.round(l.ankle.y - 1.5), tones[3]);
    return;
  }
  if (id === PANTS_DENIM) {
    const sx = (l.root.x + l.knee.x) / 2 + 0.9;
    const sy = (l.root.y + l.knee.y) / 2;
    for (let i = -2; i <= 2; i++) c.put(Math.round(sx + i * 0.2), Math.round(sy + i * 1.1), tones[0]);
    c.line(l.ankle.x - 1.2, l.ankle.y - 1.5, l.ankle.x + 1.2, l.ankle.y - 1.5, tones[0]);
    c.put(Math.round(l.root.x - 1), Math.round(l.root.y + 1), tones[3]);
    return;
  }
  throw new Error('camperRig: quần không rõ ' + id);
}

/** Balo: canvas là hộp chữ nhật có nắp và khóa; moss là bầu tròn có cuộn túi ngủ và dây rút. */
export function drawBag(c: Canvas, j: TorsoJoints, id: string, bag: Tones, leather: number) {
  const bx = j.shoulder.x - 3.1 - 1.6;
  const by = j.shoulder.y + 2.6;
  if (id === BAG_CANVAS) {
    for (let y = Math.floor(by); y <= Math.ceil(by + 6); y++) {
      for (let x = Math.floor(bx - 2.4); x <= Math.ceil(bx + 2.2); x++) {
        const edge = x <= Math.floor(bx - 2.4) || x >= Math.ceil(bx + 2.2) || y >= Math.ceil(by + 6);
        c.put(x, y, edge ? bag[2] : bag[1]);
      }
    }
    for (let x = Math.floor(bx - 2.4); x <= Math.ceil(bx + 2.2); x++) c.put(x, Math.floor(by) + 2, bag[0]);
    c.put(Math.round(bx), Math.floor(by) + 3, leather);
    return;
  }
  if (id === BAG_MOSS) {
    const mx = bx - 1.4;
    c.ellipse(mx, by + 3.4, 3.1, 3.6, bag);
    c.capsule(mx - 1.6, by - 0.8, mx + 1.6, by - 0.8, 1.5, 1.4, bag);
    c.put(Math.round(mx), Math.round(by + 0.5), leather);
    return;
  }
  throw new Error('camperRig: balo không rõ ' + id);
}
