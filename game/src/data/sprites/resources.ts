import type {SpriteDefinition} from '../../domain/sprite.ts';
/** 16×12 art pixels, shown at 32×24 like before. Gỗ nằm trên mặt đất: đáy khung là hàng 11, tông vỏ và vòng năm. */
const woodRows = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..eeeggggggggge.',
  '.edddebabbbabbe.',
  '.edrdebabbbabbe.',
  '.ddrddbabbbabbe.',
  '.edrdebabbbabbe.',
  '.edddeaaaaaaaae.',
  '..eeeeeeeeeeeee.',
];
export const woodSprite: SpriteDefinition = {
  name: 'wood',
  width: 16,
  height: 12,
  colors: {a: 'barkBase', b: 'barkMid', d: 'woodRingDark', e: 'barkEdge', g: 'barkLight', r: 'woodRing'},
  frames: [woodRows],
  animations: {idle: {frames: [0], frameRate: 1, repeat: -1}},
};

/** Đá nhỏ: sáng ở trên-trái, tối ở dưới-phải, vài vết nứt; đáy là hàng 11. */
const stoneRows = [
  '................',
  '......cll.......',
  '...cclllmmmm....',
  '..clllmmmmmmb...',
  '.clllmmmmmbbbd..',
  'lllmmmmmbbbbbdd.',
  'lmmmmmbbbebbbdd.',
  'mmmmbbbbbbebbdd.',
  '.mmbeebbbbebbd..',
  '..ddddddddded...',
  '...ddddddddd....',
  '......ddd.......',
];
export const stoneSprite: SpriteDefinition = {
  name: 'stone',
  width: 16,
  height: 12,
  colors: {
    b: 'rockBase',
    c: 'stoneChunkLight',
    d: 'rockDeep',
    e: 'stoneChunkDark',
    l: 'rockLight',
    m: 'rockMid',
  },
  frames: [stoneRows],
  animations: {idle: {frames: [0], frameRate: 1, repeat: -1}},
};
