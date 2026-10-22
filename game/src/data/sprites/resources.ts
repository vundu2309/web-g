import type {SpriteDefinition} from '../../domain/sprite.ts';
/** 16×12 art pixels, shown at 32×24 like the earlier wood and stone props. */
const woodRows = [
  '................',
  '................',
  '................',
  '........ddddd...',
  '...eeebbbddddbbb',
  '...eeebbbbbbbbbb',
  '.cceeebbbbbbbbbb',
  '.cccaaaaaaaaaaa.',
  '.cccaaaaaaaaaaa.',
  '.cccaaaaaaaaaaa.',
  '.cc.aaaaaaaaaaa.',
  '................',
];
export const woodSprite: SpriteDefinition = {
  name: 'wood',
  width: 16,
  height: 12,
  colors: {a: 'root', b: 'legacy118', c: 'bootLace', d: 'legacy120', e: 'legacy119'},
  frames: [woodRows],
  animations: {idle: {frames: [0], frameRate: 1, repeat: -1}},
};

const stoneRows = [
  '................',
  '.........a......',
  '.....aaaaaa.....',
  '...aaaaaaaa.....',
  '..aaccccccaa....',
  '..aaaaaaaaaaa...',
  '.aaaaaaaaaaaaa..',
  '.aaaaaaaaaaaaaa.',
  '.aaaaaaaaabbbba.',
  '.aaaaaaaaabbbba.',
  'aaaaaaaaaabbbb..',
  '.....aaaaaaaa...',
];
export const stoneSprite: SpriteDefinition = {
  name: 'stone',
  width: 16,
  height: 12,
  colors: {a: 'legacy121', b: 'legacy123', c: 'legacy122'},
  frames: [stoneRows],
  animations: {idle: {frames: [0], frameRate: 1, repeat: -1}},
};
