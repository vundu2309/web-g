import {palette} from './data/palette';
import type {Save, BuildingKind} from './camping';
import {gear} from './camping';
type C = CanvasRenderingContext2D;
export function paintCamper(c: C, save: Save, frame: number) {
  const color = (slot: string) => gear.find((g) => g.id === save.equipped[slot as keyof Save['equipped']])!.color;
  const swing = Math.sin((frame * Math.PI) / 4) * 3;
  const rect = (x: number, y: number, w: number, h: number, t: string) => {
    c.fillStyle = t;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  rect(12, 25, 12, 20, palette.outline);
  rect(12, 26, 10, 17, color('backpack'));
  rect(13, 30, 8, 3, palette.bagLight);
  rect(14, 37, 5, 4, palette.bagShade);
  rect(19, 40, 7, 20 - swing, color('pants'));
  rect(27, 40, 7, 20 + swing, color('pants'));
  rect(18, 57 - swing, 10, 6, palette.boot);
  rect(26, 57 + swing, 11, 6, palette.boot);
  rect(18, 23, 16, 21, color('shirt'));
  rect(18, 42, 16, 2, palette.belt);
  rect(22, 24, 2, 16, palette.legacy006);
  rect(28, 29, 5, 5, palette.legacy007);
  rect(18, 5, 14, 17, palette.hair);
  rect(21, 9, 12, 12, palette.skin);
  rect(31, 14, 4, 4, palette.skin);
  rect(29, 12, 2, 2, palette.eye);
  rect(27, 20, 4, 5, palette.skinShade);
  rect(15, 5, 20, 6, color('hat'));
  rect(20, 1, 11, 7, color('hat'));
  rect(13, 10, 25, 3, color('hat'));
  rect(17, 7, 17, 2, palette.legacy006);
  rect(16, 26, 6, 12 + swing, color('shirt'));
  rect(17, 37 + swing, 5, 5, palette.skin);
  rect(32, 26, 5, 12 - swing, color('shirt'));
  rect(33, 37 - swing, 5, 5, palette.skin);
}
export function paintBuilding(c: C, kind: BuildingKind) {
  const box = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  if (kind === 'tent') {
    c.fillStyle = palette.tentCanvas;
    c.beginPath();
    c.moveTo(8, 68);
    c.lineTo(53, 10);
    c.lineTo(102, 68);
    c.closePath();
    c.fill();
    c.fillStyle = palette.legacy013;
    c.beginPath();
    c.moveTo(53, 10);
    c.lineTo(80, 68);
    c.lineTo(102, 68);
    c.closePath();
    c.fill();
    c.fillStyle = palette.tentDoor;
    c.beginPath();
    c.moveTo(27, 68);
    c.lineTo(53, 23);
    c.lineTo(74, 68);
    c.closePath();
    c.fill();
    box(52, 12, 2, 55, palette.legacy015);
    box(6, 68, 98, 3, palette.legacy016);
    box(3, 67, 3, 7, palette.legacy017);
    box(104, 67, 3, 7, palette.legacy017);
  } else if (kind === 'fire') {
    for (let i = 0; i < 7; i++) box(23 + i * 9, 63 + (i % 2) * 3, 10, 5, palette.legacy018);
    box(36, 61, 36, 5, palette.legacy019);
    box(43, 56, 31, 5, palette.legacy020);
    c.fillStyle = palette.legacy021;
    c.beginPath();
    c.moveTo(43, 59);
    c.lineTo(45, 38);
    c.lineTo(53, 45);
    c.lineTo(60, 25);
    c.lineTo(75, 59);
    c.closePath();
    c.fill();
    box(55, 47, 10, 15, palette.legacy022);
  } else if (kind === 'bench') {
    box(12, 35, 86, 8, palette.legacy023);
    box(23, 43, 8, 27, palette.legacy024);
    box(80, 43, 8, 27, palette.legacy024);
    box(8, 54, 92, 5, palette.legacy025);
    box(14, 59, 5, 13, palette.legacy024);
    box(91, 59, 5, 13, palette.legacy024);
    box(16, 35, 78, 2, palette.legacy026);
  } else if (kind === 'stall') {
    box(20, 21, 4, 51, palette.legacy019);
    box(86, 21, 4, 51, palette.legacy019);
    box(12, 18, 86, 12, palette.legacy027);
    for (let i = 0; i < 6; i++) box(14 + i * 14, 18, 7, 12, palette.legacy013);
    box(18, 48, 74, 22, palette.legacy028);
    box(16, 44, 78, 5, palette.legacy029);
  } else if (kind === 'stove') {
    box(28, 33, 55, 37, palette.legacy030);
    box(23, 31, 65, 6, palette.legacy031);
    box(40, 46, 30, 20, palette.legacy032);
    box(45, 54, 20, 8, palette.legacy033);
    box(42, 16, 27, 16, palette.legacy034);
    box(38, 14, 35, 4, palette.legacy035);
  } else if (kind === 'lantern') {
    box(52, 10, 5, 62, palette.legacy019);
    box(54, 10, 24, 4, palette.legacy019);
    box(67, 14, 3, 8, palette.legacy019);
    box(60, 22, 19, 22, palette.legacy036);
    box(57, 19, 25, 4, palette.legacy037);
    box(57, 44, 25, 4, palette.legacy037);
  } else if (kind === 'fence') {
    for (let i = 0; i < 5; i++) box(12 + i * 20, 35, 7, 38, palette.legacy038);
    box(10, 43, 90, 5, palette.legacy039);
    box(10, 60, 90, 5, palette.legacy039);
  } else if (kind === 'plant') {
    box(40, 49, 30, 23, palette.legacy040);
    box(36, 47, 38, 6, palette.legacy041);
    box(52, 22, 5, 25, palette.legacy042);
    box(38, 30, 18, 8, palette.legacy043);
    box(55, 23, 18, 9, palette.legacy044);
  } else {
    box(28, 38, 56, 31, palette.legacy045);
    box(26, 33, 60, 11, palette.legacy046);
    box(30, 46, 52, 2, palette.legacy047);
    box(35, 33, 4, 36, palette.legacy048);
    box(73, 33, 4, 36, palette.legacy048);
    box(53, 43, 8, 9, palette.legacy049);
  }
}
