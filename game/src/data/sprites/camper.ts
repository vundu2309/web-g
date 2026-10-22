import type {SpriteDefinition} from '../../domain/sprite.ts';
import {composePose} from './camperRig.ts';
import {camperPoses} from './camperPoses.ts';
/** 24×32 art pixels, facing right. Equipment roles are substituted by the loader. */
const idle = [
  '........................',
  '..........HHHHHH........',
  '.........HhhhhhhH.......',
  '........HhhhhhhhhH......',
  '........HhhllllhhH......',
  '.......HHHHHHHHHHHH.....',
  '......HhhhhhhhhhhhhH....',
  '.......gggsssssss.......',
  '.......gggsssssss.......',
  '.......ggsssssEss.......',
  '.......ggssssssssS......',
  '........gsssssssS.......',
  '.........SSSSSSS........',
  '..........SssS..........',
  '.......xxxttttxxx.......',
  '.....xBbbxtttttttx......',
  '....xBbbbxttltxtttx.....',
  '....xBblbxttltxtttx.....',
  '....xBblbxttltxtttx.....',
  '....xBbbbxttttxTttx.....',
  '....xBBbbxttttxTttx.....',
  '....xBbbbxTTTTxTttx.....',
  '.....xBBbxqqqqxsSS......',
  '......xxxxppppxsss......',
  '........xppppppxS.......',
  '........xppxpppx........',
  '........xppxpppx........',
  '........xPpxpPpx........',
  '........xPpxpPpx........',
  '........xPPxPPPx........',
  '.......xkkkxxkkkkx......',
  '.......xxxxxxxxxxx......',
] as const;
const colors = {
  x: 'ink',
  H: 'belt',
  h: 'hat',
  l: 'cream',
  g: 'hair',
  s: 'skin',
  S: 'skinShade',
  E: 'eye',
  t: 'shirt',
  T: 'tentCanvas',
  p: 'pants',
  P: 'outline',
  b: 'bag',
  B: 'bagShade',
  q: 'belt',
  k: 'boot',
};

const blank = '.'.repeat(24);
/** Lift raises or lowers the approved body rows; the pose is then composed by the camper rig. */
function pose(legs: readonly string[], lift = 0, swing = 0): string[] {
  const rows: string[][] = idle.map((row) => row.split(''));
  legs.forEach((row, index) => {
    rows[24 + index] = row.padEnd(24, '.').split('');
  });
  if (swing) {
    for (let y = 18; y < 24; y++) {
      for (let x = 15; x < 23; x++) rows[y][x] = '.';
    }
    rows[24][16] = '.';
    const x = swing > 0 ? 17 : 13;
    for (let y = 18; y < 23; y++) {
      rows[y][x] = 'x';
      rows[y][x + 1] = y < 21 ? 't' : 's';
      rows[y][x + 2] = y < 21 ? 't' : 'S';
      rows[y][x + 3] = 'x';
    }
  }
  const result = rows.map((row) => row.join(''));
  if (!lift) return result;
  return [...result.slice(lift), ...Array.from({length: lift}, () => blank)];
}
const jumpLegs = [
  '........xppppppx',
  '.......xpppxpppx',
  '.......xPPx.xPPx',
  '.......xPPx.xPPx',
  '........xkkx.xkkx',
  '........xxxx.xxxx',
  '........................',
  '........................',
];
// Inhale raises the upper body one art pixel while leaving both feet anchored.
const breathing = idle.map((row, index) => (index < 22 ? idle[index + 1] : row));
const glance = idle.map((row, index) => (index === 9 ? row.replace('E', 's').replace('gss', 'gsE') : row));
const composed = (name: keyof typeof camperPoses) => camperPoses[name].map((spec) => composePose(idle, spec));
/** Order matters: each action range in animations below points at these indices. */
export const camperSprite: SpriteDefinition = {
  name: 'camper',
  width: 24,
  height: 32,
  colors,
  frames: [
    idle,
    breathing,
    idle,
    glance,
    ...composed('run'),
    pose(jumpLegs, 1, 1),
    pose(jumpLegs, 2, -1),
    ...composed('fall'),
    ...composed('land'),
    ...composed('cast'),
    ...composed('fish-wait'),
    ...composed('bite'),
    ...composed('reel'),
    ...composed('gather'),
    ...composed('build'),
  ],
  animations: {
    idle: {frames: [0, 0, 1, 0, 0, 0, 2, 3], frameRate: 2, repeat: -1},
    run: {frames: [4, 5, 6, 7, 8, 9], frameRate: 9, repeat: -1},
    jump: {frames: [10, 11], frameRate: 6, repeat: 0},
    fall: {frames: [12, 13], frameRate: 6, repeat: -1},
    land: {frames: [14, 15], frameRate: 12, repeat: 0},
    cast: {frames: [16, 17, 18], frameRate: 10, repeat: 0},
    'fish-wait': {frames: [19, 20], frameRate: 3, repeat: -1},
    bite: {frames: [21, 22, 23], frameRate: 12, repeat: -1},
    reel: {frames: [24, 25, 26], frameRate: 9, repeat: -1},
    gather: {frames: [27, 28, 29], frameRate: 9, repeat: 0},
    build: {frames: [30, 31, 32], frameRate: 8, repeat: -1},
  },
};
