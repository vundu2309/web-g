import {palette} from '../palette.ts';
import {camperPalette} from './camper.ts';

/**
 * Vai trò màu cố định của bộ xương nhân vật (R1). Không thêm hex mới: mỗi vai trò trỏ tới màu có tên sẵn.
 * Bốn tông trang bị (hat, shirt, pants, bag) không nằm ở đây; chúng suy từ `gear` qua `toneRamp`.
 */
export const camperRigPalette = {
  skin0: camperPalette.camperSkinHi,
  skin1: camperPalette.camperSkin,
  skin2: camperPalette.camperSkinShade,
  skin3: camperPalette.camperSkinDeep,
  hair0: camperPalette.camperHairHi,
  hair1: camperPalette.camperHair,
  hair2: camperPalette.camperHairShade,
  hair3: camperPalette.camperHairDeep,
  boot0: camperPalette.camperBootHi,
  boot1: camperPalette.camperBoot,
  boot2: camperPalette.camperBootShade,
  boot3: camperPalette.camperBootSole,
  sole: camperPalette.camperBootSole,
  eye: camperPalette.camperEye,
  mouth: camperPalette.camperMouth,
  blush: camperPalette.camperBlush,
  leather: camperPalette.camperLeather,
  gold: palette.gold,
  glint: camperPalette.camperGlint,
  pom: camperPalette.camperGlint,
  rod0: camperPalette.rodWoodHi,
  rod1: camperPalette.rodWood,
  rod2: camperPalette.rodWoodShade,
  rodTip: camperPalette.rodTip,
} as const;
