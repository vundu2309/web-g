import type {CampingScene} from '../CampingScene';
/** Feet sit this many world units below the view centre, which keeps more sky above the player. */
export const FEET_BELOW_CENTER = 65;
export function centerCamera(scene: CampingScene) {
  if (scene.visuals) {
    const width = scene.viewport?.width ?? 800;
    scene.cameras.main.centerOn(scene.player.x + width * 0.08, scene.player.y - FEET_BELOW_CENTER);
    scene.cameras.main.preRender();
    if (scene.background) scene.background.draw(scene.player.x, scene.clock, scene.quality);
    if (scene.daylight) scene.daylight.draw(scene.state, scene.clock, scene.quality);
  }
}
