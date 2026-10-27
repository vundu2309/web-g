import type {CampingScene} from '../CampingScene';
/** Chân nhân vật thấp hơn tâm nhìn để chừa trời; camera bám cả di chuyển ngang và nhảy. */
export const FEET_BELOW_CENTER = 65;
export function centerCamera(scene: CampingScene) {
  if (scene.visuals) {
    const width = scene.viewport?.width ?? 800;
    scene.cameras.main.centerOn(scene.player.x + width * 0.08, scene.player.y - FEET_BELOW_CENTER);
    scene.cameras.main.preRender();
    scene.worldStreamer?.update(scene.clock, scene.quality);
    if (scene.background) scene.background.draw(scene.player.x, scene.clock, scene.quality, scene.state.time);
    if (scene.daylight) scene.daylight.draw(scene.state, scene.clock, scene.quality);
  }
}
