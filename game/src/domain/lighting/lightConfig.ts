import {lightingPalette} from '../../data/palette/lighting.ts';

/** Màu dạng [r, g, b] trong khoảng 0 đến 1. */
export type Rgb = readonly [number, number, number];

/** Hệ số truyền sáng theo loại ô ĐÍCH: ánh sáng yếu đi khi bước vào ô đó. */
export const ATTEN_SOLID = 0.76;
export const ATTEN_WATER = 0.8;
export const ATTEN_WALL = 0.82;
export const ATTEN_OPEN = 0.87;

/** Ánh sáng trời ở ô rắn đầu tiên của mỗi cột (mặt đất). */
export const SKY_SURFACE = 0.97;

/** Sàn sáng tối thiểu theo kênh: lòng đất sâu vẫn thấy được hình. */
export const AMBIENT = 0.08;

/** Quầng sáng theo giờ (ngày, hoàng hôn, đêm), cùng trọng số với nền của T4. */
export const BLOOM_BY_PERIOD: readonly [number, number, number] = [0.2, 0.55, 1];

export type SourceKind = 'fire' | 'stove' | 'lantern' | 'tent' | 'crystal';

export interface SourceSpec {
  rgb: Rgb;
  /** Cường độ tại ô nguồn (1 là sáng hết). */
  intensity: number;
  /** Tầm tối đa tính theo ô; ngoài tầm thì không có ánh sáng từ nguồn này. */
  reach: number;
}

/** Chuyển màu hex trong bảng palette sang [r, g, b] trong khoảng 0 đến 1. */
export function hexRgb(color: string): Rgb {
  return [
    Number.parseInt(color.slice(1, 3), 16) / 255,
    Number.parseInt(color.slice(3, 5), 16) / 255,
    Number.parseInt(color.slice(5, 7), 16) / 255,
  ];
}

export const SOURCE_SPECS: Record<SourceKind, SourceSpec> = {
  fire: {rgb: hexRgb(lightingPalette.lightSourceFire), intensity: 1.1, reach: 6},
  stove: {rgb: hexRgb(lightingPalette.lightSourceStove), intensity: 0.85, reach: 5},
  lantern: {rgb: hexRgb(lightingPalette.lightSourceLantern), intensity: 0.95, reach: 5},
  tent: {rgb: hexRgb(lightingPalette.lightSourceTent), intensity: 0.6, reach: 3},
  crystal: {rgb: hexRgb(lightingPalette.lightSourceCrystal), intensity: 0.7, reach: 4},
};

/** Màu trời theo ba trạng thái (ngày, hoàng hôn, đêm). */
export const SKY_BY_PERIOD: readonly [Rgb, Rgb, Rgb] = [
  hexRgb(lightingPalette.lightSkyDay),
  hexRgb(lightingPalette.lightSkyDusk),
  hexRgb(lightingPalette.lightSkyNight),
];
