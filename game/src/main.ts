import Phaser from 'phaser';
import './style.css';
import {CampingScene} from './game/CampingScene';
import {initialQuality, pixelFrame} from './game/rendering/resolution';

async function boot() {
  await document.fonts.load('800 14px Nunito', 'Ao Sen Gỗ Đá câu cá ế ệ').catch(() => []);
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('gallery')) {
    const {openSpriteGallery} = await import('./ui/gallery');
    return openSpriteGallery();
  }
  const frame = pixelFrame(innerWidth, innerHeight, devicePixelRatio || 1, initialQuality());
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: frame.canvasWidth,
    height: frame.canvasHeight,
    backgroundColor: '#afc1b0',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {mode: Phaser.Scale.NONE},
    physics: {
      default: 'arcade',
      arcade: {gravity: {x: 0, y: 0}, fps: 60, fixedStep: true, customUpdate: true},
    },
    scene: CampingScene,
  });
}
export default boot();
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
