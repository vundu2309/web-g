import {BONE, type PoseParams, type Point} from './types.ts';
import {ROLE_ID, type Canvas, type Tones} from './raster.ts';
import type {ArmJoints, Joints} from './skeleton.ts';
import type {HatShape} from '../../data/camperHead.ts';
import {drawHead} from './head.ts';
import {drawBag, drawLeg, drawTorso, sleeveCuff} from './outfit.ts';

/** Hình dáng và id của bốn slot trang bị; tông được truyền riêng qua `ramp`. */
export interface Dress {
  readonly hat: HatShape;
  readonly shirt: string;
  readonly pants: string;
  readonly bag: string;
}

const id = (role: string) => ROLE_ID[role as keyof typeof ROLE_ID];
const ramp = (prefix: string): Tones => [id(prefix + '0'), id(prefix + '1'), id(prefix + '2'), id(prefix + '3')];
/** Bộ phận ở xa người xem lùi một tông: dùng base, shade, deep, deep. */
const far = (t: Tones): Tones => [t[1], t[2], t[3], t[3]];

function boot(c: Canvas, ankle: Point, tones: Tones) {
  c.capsule(ankle.x, ankle.y, ankle.x + 2.8, ankle.y + 0.2, 1.7, 1.5, tones);
}

/** Tay áo, cổ tay gập theo hình dáng, bàn tay dày với ngón cái và khe ngón. */
function sleeve(c: Canvas, a: ArmJoints, tones: Tones, skin: Tones, cuff: Tones) {
  c.capsule(a.root.x, a.root.y, a.elbow.x, a.elbow.y, BONE.armR, BONE.armR * 0.9, tones);
  c.capsule(a.elbow.x, a.elbow.y, a.hand.x, a.hand.y, BONE.armR * 0.9, BONE.armR * 0.8, tones);
  const mx = (a.elbow.x + a.hand.x) / 2;
  const my = (a.elbow.y + a.hand.y) / 2;
  c.capsule(mx, my, a.hand.x, a.hand.y, BONE.armR * 0.8, BONE.armR * 0.8, cuff);
  c.ellipse(a.hand.x, a.hand.y, 1.6, 1.5, skin);
  c.ellipse(a.hand.x + 0.9, a.hand.y - 1, 0.9, 0.9, skin);
  c.put(a.hand.x + 1, a.hand.y + 0.6, skin[3]);
}

function torsoStrap(c: Canvas, j: Joints, leather: number, gold: number) {
  c.capsule(j.hip.x - BONE.torsoR[0] + 0.3, j.hip.y, j.hip.x + BONE.torsoR[0] - 0.3, j.hip.y, 0.9, 0.9, [
    leather,
    leather,
    leather,
    leather,
  ]);
  c.put(j.hip.x + 1, j.hip.y, gold);
  c.line(j.shoulder.x - 1.4, j.shoulder.y + 0.5, j.hip.x + 1.2, j.hip.y - 2.5, leather);
}

function rod(c: Canvas, grip: Point, p: PoseParams) {
  if (!p.rod) return;
  const angle = (p.rod.angle * Math.PI) / 180;
  const tip = {x: grip.x + p.rod.length * Math.cos(angle), y: grip.y - p.rod.length * Math.sin(angle)};
  c.line(grip.x, grip.y, tip.x, tip.y, id('rod1'));
  c.line(grip.x, grip.y + 1, tip.x, tip.y + 1, id('rod2'));
  c.line(grip.x, grip.y - 1, tip.x, tip.y - 1, id('rod0'));
  c.put(Math.round(tip.x), Math.round(tip.y), id('rodTip'));
}

/** Vẽ một frame theo thứ tự xa → gần: tay xa, chân xa, balo, thân, chân gần, đầu, tay gần, cần. */
export function drawRig(c: Canvas, j: Joints, p: PoseParams, dress: Dress) {
  const skin = ramp('skin');
  const boots = ramp('boot');
  const shirt = ramp('shirt');
  const pants = ramp('pants');
  const bag = ramp('bag');
  const leather = id('leather');
  const gold = id('gold');
  sleeve(c, j.armFar, far(shirt), far(skin), far(sleeveCuff(dress.shirt, shirt)));
  drawLeg(c, j.legFar, dress.pants, far(pants), BONE.legR);
  boot(c, j.legFar.ankle, far(boots));
  drawBag(c, j, dress.bag, bag, leather);
  drawTorso(c, j, dress.shirt, shirt, leather);
  torsoStrap(c, j, leather, gold);
  drawLeg(c, j.legNear, dress.pants, pants, BONE.legR);
  boot(c, j.legNear.ankle, boots);
  drawHead(c, j.head, p.face, dress.hat);
  sleeve(c, j.armNear, shirt, skin, sleeveCuff(dress.shirt, shirt));
  rod(c, j.armNear.hand, p);
}
