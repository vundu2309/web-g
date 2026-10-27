import {palette} from './palette.ts';
export type Slot = 'hat' | 'shirt' | 'pants' | 'backpack';
export const slots: Record<Slot, string> = {
  hat: 'Mũ',
  shirt: 'Áo',
  pants: 'Quần',
  backpack: 'Balo',
};
const starterGear = [
  {id: 'hat-ranger', slot: 'hat', name: 'Mũ kiểm lâm', color: palette.hat},
  {id: 'hat-knit', slot: 'hat', name: 'Mũ len rừng', color: palette.gearHatKnit},
  {id: 'shirt-linen', slot: 'shirt', name: 'Áo vải dã ngoại', color: palette.shirt},
  {id: 'shirt-pine', slot: 'shirt', name: 'Áo khoác thông', color: palette.gearShirtPine},
  {id: 'pants-trail', slot: 'pants', name: 'Quần leo núi', color: palette.pants},
  {id: 'pants-denim', slot: 'pants', name: 'Quần denim', color: palette.gearPantsDenim},
  {id: 'bag-canvas', slot: 'backpack', name: 'Balo vải bố', color: palette.bag},
  {id: 'bag-moss', slot: 'backpack', name: 'Balo rêu', color: palette.gearBagMoss},
] as const;
const shopGear = (Object.keys(slots) as Slot[]).flatMap((slot) => [
  {id: slot + '-adventure', slot, name: slots[slot] + ' thám hiểm', color: palette.gearAdventure, price: 80},
  {id: slot + '-summit', slot, name: slots[slot] + ' đỉnh núi', color: palette.gearSummit, price: 220},
]);
export const gear: readonly {id: string; slot: Slot; name: string; color: string; price: number}[] = [
  ...starterGear.map((item) => ({...item, price: 0})),
  ...shopGear,
];
export const rarityPrices = {Thường: 3, 'Ít gặp': 8, Hiếm: 20, 'Rất hiếm': 60} as const;
export const meals = {
  grilled: {name: 'Cá nướng', multiplier: 1.8},
  soup: {name: 'Canh cá', multiplier: 2.5},
} as const;
export type MealId = keyof typeof meals;
const baseFishSpecies = [
  {
    id: 'perch',
    name: 'Cá rô đồng',
    habitats: ['pond', 'lake'],
    rarity: 'Thường',
    weight: 35,
    color: palette.fishPerch,
    min: 12,
    max: 28,
  },
  {
    id: 'tilapia',
    name: 'Cá rô phi',
    habitats: ['pond', 'lake'],
    rarity: 'Thường',
    weight: 30,
    color: palette.fishTilapia,
    min: 18,
    max: 40,
  },
  {
    id: 'carp',
    name: 'Cá chép',
    habitats: ['pond', 'lake'],
    rarity: 'Ít gặp',
    weight: 18,
    color: palette.fishCarp,
    min: 20,
    max: 65,
  },
  {
    id: 'crucian',
    name: 'Cá diếc',
    habitats: ['pond'],
    rarity: 'Thường',
    weight: 28,
    color: palette.fishCrucian,
    min: 10,
    max: 25,
  },
  {
    id: 'catfish',
    name: 'Cá trê',
    habitats: ['pond', 'river'],
    rarity: 'Ít gặp',
    weight: 17,
    color: palette.fishCatfish,
    min: 25,
    max: 75,
  },
  {
    id: 'snakehead',
    name: 'Cá lóc',
    habitats: ['pond', 'river'],
    rarity: 'Hiếm',
    weight: 8,
    color: palette.fishSnakehead,
    min: 30,
    max: 85,
  },
  {
    id: 'trout',
    name: 'Cá hồi suối',
    habitats: ['river'],
    rarity: 'Ít gặp',
    weight: 25,
    color: palette.fishTrout,
    min: 20,
    max: 55,
  },
  {
    id: 'goby',
    name: 'Cá bống suối',
    habitats: ['river'],
    rarity: 'Thường',
    weight: 40,
    color: palette.fishGoby,
    min: 7,
    max: 18,
  },
  {
    id: 'bass',
    name: 'Cá vược hồ',
    habitats: ['lake'],
    rarity: 'Hiếm',
    weight: 10,
    color: palette.fishBass,
    min: 25,
    max: 80,
  },
  {
    id: 'koi',
    name: 'Cá chép gấm',
    habitats: ['pond', 'lake'],
    rarity: 'Rất hiếm',
    weight: 2,
    color: palette.fishKoi,
    min: 20,
    max: 60,
  },
  {
    id: 'sturgeon',
    name: 'Cá tầm',
    habitats: ['lake', 'river'],
    rarity: 'Rất hiếm',
    weight: 2,
    color: palette.fishSturgeon,
    min: 45,
    max: 110,
  },
  {
    id: 'golden',
    name: 'Cá vàng núi',
    habitats: ['river'],
    rarity: 'Rất hiếm',
    weight: 1,
    color: palette.fishGolden,
    min: 12,
    max: 30,
  },
  {
    id: 'mackerel',
    name: 'Cá bạc má',
    habitats: ['sea'],
    rarity: 'Thường',
    weight: 30,
    color: palette.fishTrout,
    min: 18,
    max: 40,
  },
  {
    id: 'snapper',
    name: 'Cá hồng',
    habitats: ['sea'],
    rarity: 'Ít gặp',
    weight: 12,
    color: palette.fishKoi,
    min: 25,
    max: 65,
  },
  {
    id: 'grouper',
    name: 'Cá mú',
    habitats: ['sea'],
    rarity: 'Hiếm',
    weight: 4,
    color: palette.fishCatfish,
    min: 35,
    max: 100,
  },
] as const;
export const fishSpecies = baseFishSpecies.map((fish) => ({
  ...fish,
  activeAt: (fish.id === 'golden' || fish.id === 'sturgeon'
    ? ['dusk', 'night']
    : fish.id === 'koi'
      ? ['dawn', 'day', 'dusk']
      : ['dawn', 'day', 'dusk', 'night']) as readonly string[],
}));
export type Habitat = 'pond' | 'lake' | 'river' | 'sea';
export type FishId = (typeof fishSpecies)[number]['id'];
export type BuildingKind = 'tent' | 'fire' | 'bench' | 'chest' | 'stall' | 'stove' | 'lantern' | 'fence' | 'plant';
export const recipes: Record<BuildingKind, {name: string; wood: number; stone: number; description: string}> = {
  stall: {name: 'Quầy thu mua', wood: 8, stone: 2, description: 'Bán cá, món ăn và mua trang bị.'},
  stove: {name: 'Bếp nấu', wood: 6, stone: 8, description: 'Nấu canh cá; dựng cạnh bếp lửa có sẵn.'},
  lantern: {name: 'Đèn lồng', wood: 3, stone: 1, description: 'Ánh sáng ấm giữa rừng đêm.'},
  fence: {name: 'Hàng rào', wood: 3, stone: 0, description: 'Viền gỗ cho khu trại.'},
  plant: {name: 'Cây chậu', wood: 2, stone: 2, description: 'Một góc xanh nhỏ.'},
  tent: {name: 'Lều vải', wood: 8, stone: 2, description: 'Một mái trú chân giữa rừng.'},
  fire: {name: 'Bếp lửa', wood: 4, stone: 4, description: 'Ánh lửa ấm áp cho khu trại.'},
  bench: {name: 'Bàn dã ngoại', wood: 10, stone: 4, description: 'Góc nghỉ bên hồ câu.'},
  chest: {
    name: 'Rương gỗ',
    wood: 12,
    stone: 4,
    description: 'Cất vật liệu, cá và món ăn trong 20 ô riêng.',
  },
};
