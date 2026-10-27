import {palette, colorNumber} from './palette.ts';
import {splitChannels} from '../domain/backdrop/mix.ts';

/**
 * Hệ số cuộn của từng lớp nền, từ xa đến gần. Lớp rừng xa (0,40) là lớp thêm mới ở T4;
 * các hệ số khác giữ như bản cũ (mây 0,04; núi xa 0,14; núi giữa 0,30; rừng gần 0,55).
 */
export const LAYER_FACTORS = {
  clouds: 0.04,
  mountainFar: 0.14,
  mountainMid: 0.3,
  forestFar: 0.4,
  forestNear: 0.55,
} as const;

export type BackdropLayer = keyof typeof LAYER_FACTORS;

/** Tông theo vùng (mười vùng, nhân với màu nền); ranh giới được nội suy trong domain/backdrop/regions.ts. */
const REGION_TINTS = [
  palette.bgTintVale,
  palette.bgTintPine,
  palette.bgTintFalls,
  palette.bgTintMoon,
  palette.bgTintRuins,
  palette.bgTintVale,
  palette.bgTintVale,
  palette.bgTintPine,
  palette.bgTintFalls,
  palette.bgTintFalls,
].map(colorNumber);

export const TINT_CHANNELS = splitChannels(REGION_TINTS);

/** Vùng 1 và 3 (rừng thông và đèo trăng) dùng cây thông; các vùng khác dùng tán lá rộng. */
export const PINE_SHARE = [0, 1, 0, 1, 0, 0, 0, 1, 0, 0] as const;

/** Hàng gốc của từng texture, theo pixel nghệ thuật; dùng chung với hàm vẽ nền. */
export const LANDSCAPE_BASE_ART = {mountainFar: 142, mountainMid: 136, forestFar: 124, forestNear: 150} as const;
/** Khoảng nâng các lớp xa so với mặt đất gần, theo đơn vị thế giới. */
export const LANDSCAPE_GROUND_OFFSET = {mountainFar: -104, mountainMid: -64, forestFar: -32, forestNear: 0} as const;
