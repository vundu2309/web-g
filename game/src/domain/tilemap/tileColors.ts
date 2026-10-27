import {colorNumber, palette} from '../../data/palette.ts';
import {mixColor, splitChannels} from '../backdrop/mix.ts';
import {regionColor} from '../backdrop/regions.ts';

const color = colorNumber;

/** Tông theo vai trò của từng chất liệu: giữa/nền, tông phụ, tối, sáng hoặc lấp lánh (3–4 tông). */
export const TONES = {
  dirt: [
    color(palette.terrainDirtMid),
    color(palette.terrainDirtBase),
    color(palette.terrainDirtDeep),
    color(palette.terrainDirtLight),
  ],
  grass: [
    color(palette.terrainGrassMid),
    color(palette.terrainGrassBright),
    color(palette.terrainGrassDeep),
    color(palette.terrainGrassSun),
  ],
  stone: [
    color(palette.terrainStoneMid),
    color(palette.terrainStoneBase),
    color(palette.terrainStoneDeep),
    color(palette.terrainStoneLight),
  ],
  sand: [
    color(palette.terrainSandBase),
    color(palette.terrainSandLight),
    color(palette.terrainSandDeep),
    color(palette.terrainSandGlint),
  ],
  wallDirt: [
    color(palette.terrainWallDirtShade),
    color(palette.terrainWallDirtBase),
    color(palette.terrainWallDirtDeep),
    color(palette.terrainWallDirtLight),
  ],
  wallStone: [
    color(palette.terrainWallStoneShade),
    color(palette.terrainWallStoneBase),
    color(palette.terrainWallStoneDeep),
    color(palette.terrainWallStoneLight),
  ],
  copper: [color(palette.oreCopperBase), color(palette.oreCopperGlint), color(palette.oreCopperDeep)],
  iron: [color(palette.oreIronBase), color(palette.oreIronGlint), color(palette.oreIronDeep)],
  crystal: [color(palette.crystalCore), color(palette.crystalEdge), color(palette.crystalDeep)],
  water: [color(palette.waterBody), color(palette.waterDeep), color(palette.waterGlint), color(palette.waterFoam)],
} as const;

export const PEBBLE = color(palette.terrainDirtPebble);
export const RIM_LIGHT = color(palette.terrainRimLight);
export const RIM_DARK = color(palette.terrainRimDark);

const SOIL_CHANNELS = splitChannels(
  [
    palette.soilForest,
    palette.soilPine,
    palette.soilRiver,
    palette.soilMoon,
    palette.soilRuins,
    palette.soilForest,
    palette.soilForest,
    palette.soilPine,
    palette.soilRuins,
    palette.soilRiver,
  ].map(color),
);

/** Tỉ lệ trộn tông vùng vào đất, đá, cát; chuyển mượt ở ranh giới vùng nhờ `regionColor`. */
export const REGION_MIX = 0.2;

/** Tông vùng tại một x thế giới (0xRRGGBB). */
export function regionTint(worldX: number) {
  return regionColor(worldX, SOIL_CHANNELS.red, SOIL_CHANNELS.green, SOIL_CHANNELS.blue);
}

/** Trộn hai màu RGB có số nguyên (không cấp phát). */
export function blend(from: number, to: number, amount: number) {
  return mixColor(from, to, amount);
}

/** Đóng gói màu và alpha thành một số 32-bit: alpha ở byte cao, RGB ở 24 bit thấp. */
export function pack(rgb: number, alpha: number) {
  return ((alpha << 24) | rgb) >>> 0;
}
