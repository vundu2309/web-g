/** Bảng màu thực vật và vật trang trí (T5). Mỗi tông có tên theo vai trò; không có màu tính lúc chạy. */
export const vegetationPalette = {
  // Thân cây và rễ: vỏ tối ở mép, nhiều tông ở giữa, nhánh cùng bảng.
  barkBase: '#5a3d26',
  barkMid: '#6e4a2e',
  barkLight: '#7d5636',
  barkEdge: '#442c1b',
  rootBrown: '#6d533a',
  rootDark: '#4a3826',
  rootLight: '#8a6a4a',
  // Tán lá rộng vùng 0 (thung lũng): tối ở đáy/mép, sáng ở trên-trái.
  leafValeEdge: '#244f2e',
  leafValeDark: '#2f6b3a',
  leafValeMid: '#3f8a46',
  leafValeLight: '#59a852',
  leafValeSun: '#86cc6a',
  // Tán lá rộng vùng 2 (thác): ngả xanh lam nhẹ theo tông vùng.
  leafFallsEdge: '#2b5a44',
  leafFallsDark: '#37735a',
  leafFallsMid: '#4c9470',
  leafFallsLight: '#6dbb8a',
  leafFallsSun: '#a2dca5',
  // Tán lá rộng vùng 4 (phế tích): ngả olive ấm.
  leafRuinsEdge: '#4a5a2a',
  leafRuinsDark: '#5d7434',
  leafRuinsMid: '#7a9447',
  leafRuinsLight: '#9bb35e',
  leafRuinsSun: '#c2d07c',
  // Tán thông vùng 1 (rừng thông sương).
  pineForestEdge: '#1d3f35',
  pineForestDark: '#255447',
  pineForestMid: '#2f6b58',
  pineForestLight: '#43866c',
  pineForestSun: '#65a58a',
  // Tán thông vùng 3 (đèo trăng): ngả xanh lam-tím nhẹ.
  pineMoonEdge: '#2a4a52',
  pineMoonDark: '#34606a',
  pineMoonMid: '#43818a',
  pineMoonLight: '#5fa1a6',
  pineMoonSun: '#8bc6c4',
  // Cỏ, hoa, thân cỏ.
  plantGrassDeep: '#437a31',
  plantGrassMid: '#56933c',
  plantGrassBright: '#68a947',
  plantGrassSun: '#86c45a',
  plantStem: '#3f7a31',
  flowerRed: '#d9534f',
  flowerYellow: '#f2c94c',
  flowerWhite: '#f0f0eb',
  flowerPurple: '#aa78dc',
  flowerCenter: '#ffe9a0',
  // Nấm đỏ chấm trắng và nấm xanh nhạt.
  mushroomCapRed: '#c84640',
  mushroomDot: '#fff0e6',
  mushroomStem: '#f0e6c8',
  mushroomCapTeal: '#8fd6cf',
  mushroomCapTealDark: '#5fa9a3',
  // Đá nhỏ nhiều tông.
  rockDeep: '#505662',
  rockMid: '#5f6573',
  rockBase: '#6f7685',
  rockLight: '#818a9a',
  // Dương xỉ.
  fernDeep: '#355e49',
  fernMid: '#4d7f62',
  fernLight: '#77a687',
  fernTip: '#a6cfa1',
  // Sậy bên bờ hồ.
  reedStalk: '#6f9a4c',
  reedStalkDark: '#4c7038',
  reedHead: '#7a4a28',
  reedHeadLight: '#9a6638',
  // Lá sen và hoa sen trên mặt nước.
  lilyPadLight: '#6dbb5a',
  lilyPadDark: '#3f8a46',
  lilyPetal: '#f0a0be',
  lilyPetalLight: '#ffd2e1',
  lilyCore: '#ffd45a',
  // Gỗ và đá nhặt được.
  woodRing: '#c79a5b',
  woodRingDark: '#9d784b',
  stoneChunkLight: '#a9b0bd',
  stoneChunkDark: '#4d5461',
} as const;
