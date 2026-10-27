import {palette, colorNumber} from './palette.ts';

/** Bảng màu nền theo ba trạng thái trời: 0 ngày, 1 hoàng hôn, 2 đêm (xem domain/backdrop/periods.ts). */
const n = colorNumber;

export const SKY_TONES = [
  [n(palette.bgSkyDayTop), n(palette.bgSkyDayMid), n(palette.bgSkyDayLow)],
  [n(palette.bgSkyDuskTop), n(palette.bgSkyDuskMid), n(palette.bgSkyDuskLow)],
  [n(palette.bgSkyNightTop), n(palette.bgSkyNightMid), n(palette.bgSkyNightLow)],
] as const;

export const CLOUD_TONES = [
  [n(palette.bgCloudDayLight), n(palette.bgCloudDayMid), n(palette.bgCloudDayShade)],
  [n(palette.bgCloudDuskLight), n(palette.bgCloudDuskMid), n(palette.bgCloudDuskShade)],
  [n(palette.bgCloudNightLight), n(palette.bgCloudNightMid), n(palette.bgCloudNightShade)],
] as const;

/** Màu sương mờ chân núi và rừng xa theo trạng thái trời. */
export const HAZE_TONES = [n(palette.bgHazeDay), n(palette.bgHazeDusk), n(palette.bgSkyNightLow)] as const;

/** Núi: [màu thân, màu viền sáng] theo trạng thái trời. */
export const FAR_RIDGE_TONES = [
  [n(palette.bgRidgeFarDay), n(palette.bgRidgeFarDayHi)],
  [n(palette.bgRidgeFarDusk), n(palette.bgRidgeFarDuskHi)],
  [n(palette.bgRidgeFarNight), n(palette.bgRidgeFarNightHi)],
] as const;

export const MID_RIDGE_TONES = [
  [n(palette.bgRidgeMidDay), n(palette.bgRidgeMidDayHi)],
  [n(palette.bgRidgeMidDusk), n(palette.bgRidgeMidDuskHi)],
  [n(palette.bgRidgeMidNight), n(palette.bgRidgeMidNightHi)],
] as const;

/** Rừng: màu thân theo trạng thái trời; đỉnh tán sáng hơn được trộn từ màu này. */
export const FAR_FOREST_TONES = [
  n(palette.bgForestFarDay),
  n(palette.bgForestFarDusk),
  n(palette.bgForestFarNight),
] as const;

export const NEAR_FOREST_TONES = [
  n(palette.bgForestNearDay),
  n(palette.bgForestNearDusk),
  n(palette.bgForestNearNight),
] as const;

/** Mặt trời: vị trí theo tỉ lệ khung nhìn (0..1) và bán kính theo điểm ảnh nghệ thuật. */
export const SUN_DAY = {x: 0.79, y: 0.16, radius: 9, core: n(palette.bgSunDay)};
export const SUN_DUSK = {x: 0.69, y: 0.385, radius: 15, core: n(palette.bgSunDusk)};
export const SUN_HIGHLIGHT = n(palette.bgSunHighlight);

export const MOON = {x: 0.49, y: 0.17, radius: 9};
export const MOON_COLORS = {
  body: n(palette.bgMoonBody),
  crater: n(palette.bgMoonCrater),
  shade: n(palette.bgMoonShade),
  glow: n(palette.bgMoonGlow),
} as const;

export const STAR_COLORS = [n(palette.bgStarWarm), n(palette.bgStarGlint)] as const;
