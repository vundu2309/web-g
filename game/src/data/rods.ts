export const rods = [
  {id: 'bamboo', name: 'Cần tre', price: 0, wood: 0, stone: 0, threshold: 82, power: 16, accuracy: 1, luck: 1},
  {
    id: 'fiberglass',
    name: 'Cần sợi thủy tinh',
    price: 100,
    wood: 5,
    stone: 0,
    threshold: 87,
    power: 19,
    accuracy: 0.9,
    luck: 1.1,
  },
  {id: 'carbon', name: 'Cần carbon', price: 350, wood: 8, stone: 6, threshold: 92, power: 23, accuracy: 0.8, luck: 1.2},
  {
    id: 'legendary',
    name: 'Cần huyền thoại',
    price: 1000,
    wood: 15,
    stone: 10,
    threshold: 98,
    power: 28,
    accuracy: 0.7,
    luck: 1.35,
  },
] as const;
export type RodId = (typeof rods)[number]['id'];
export function getRod(id: RodId) {
  return rods.find((rod) => rod.id === id)!;
}
