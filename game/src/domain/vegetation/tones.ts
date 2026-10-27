import {colorNumber, palette} from '../../data/palette.ts';

const c = colorNumber;

/** Bốn tông từ tối đến sáng cộng viền: dùng cho tán lá, thân thông và cỏ theo vùng. */
export interface Ramp {
  edge: number;
  dark: number;
  mid: number;
  light: number;
  sun: number;
}

export const VALE_LEAF: Ramp = {
  edge: c(palette.leafValeEdge),
  dark: c(palette.leafValeDark),
  mid: c(palette.leafValeMid),
  light: c(palette.leafValeLight),
  sun: c(palette.leafValeSun),
};
export const FALLS_LEAF: Ramp = {
  edge: c(palette.leafFallsEdge),
  dark: c(palette.leafFallsDark),
  mid: c(palette.leafFallsMid),
  light: c(palette.leafFallsLight),
  sun: c(palette.leafFallsSun),
};
export const RUINS_LEAF: Ramp = {
  edge: c(palette.leafRuinsEdge),
  dark: c(palette.leafRuinsDark),
  mid: c(palette.leafRuinsMid),
  light: c(palette.leafRuinsLight),
  sun: c(palette.leafRuinsSun),
};
export const PINE_FOREST: Ramp = {
  edge: c(palette.pineForestEdge),
  dark: c(palette.pineForestDark),
  mid: c(palette.pineForestMid),
  light: c(palette.pineForestLight),
  sun: c(palette.pineForestSun),
};
export const PINE_MOON: Ramp = {
  edge: c(palette.pineMoonEdge),
  dark: c(palette.pineMoonDark),
  mid: c(palette.pineMoonMid),
  light: c(palette.pineMoonLight),
  sun: c(palette.pineMoonSun),
};

/** Bốn tông thân cây: nền, giữa, sáng (bên trái) và viền tối (mép). */
export const BARK = {
  base: c(palette.barkBase),
  mid: c(palette.barkMid),
  light: c(palette.barkLight),
  edge: c(palette.barkEdge),
};

export const GRASS = [c(palette.plantGrassDeep), c(palette.plantGrassMid), c(palette.plantGrassBright)];
export const GRASS_SUN = c(palette.plantGrassSun);
export const STEM = c(palette.plantStem);
export const FLOWERS = [c(palette.flowerRed), c(palette.flowerYellow), c(palette.flowerWhite), c(palette.flowerPurple)];
export const FLOWER_CENTER = c(palette.flowerCenter);
export const CAP_RED = c(palette.mushroomCapRed);
export const CAP_DOT = c(palette.mushroomDot);
export const CAP_TEAL = c(palette.mushroomCapTeal);
export const CAP_TEAL_DARK = c(palette.mushroomCapTealDark);
export const MUSHROOM_STEM = c(palette.mushroomStem);
export const ROCK = [c(palette.rockDeep), c(palette.rockMid), c(palette.rockBase), c(palette.rockLight)];
export const FERN = [c(palette.fernDeep), c(palette.fernMid), c(palette.fernLight), c(palette.fernTip)];
export const REED = {stalk: c(palette.reedStalk), dark: c(palette.reedStalkDark), head: c(palette.reedHead)};
export const REED_HEAD_LIGHT = c(palette.reedHeadLight);
export const LILY = {padLight: c(palette.lilyPadLight), padDark: c(palette.lilyPadDark)};
export const LOTUS = {petal: c(palette.lilyPetal), light: c(palette.lilyPetalLight), core: c(palette.lilyCore)};
export const ROOT = [c(palette.rootDark), c(palette.rootBrown), c(palette.rootLight)];
