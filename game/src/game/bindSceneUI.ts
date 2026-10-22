import {CampActivities} from './CampActivities';
import type {CampingScene} from './CampingScene';
export function bindSceneUI(scene: CampingScene) {
  scene.activities = new CampActivities({
    state: () => scene.state,
    open: () => scene.openPanel('activity'),
    persist: () => {
      scene.persist();
      scene.refreshHUD();
    },
    toast: (message) => scene.ui.toast(message),
  });
  scene.ui.bind({
    start: () => scene.start(),
    pause: () => scene.togglePause(),
    home: () => scene.returnHome(),
    panel: (panel) => scene.openPanel(panel),
    closePanel: (panel) => scene.closePanel(panel),
    interact: () => scene.interact(),
    easyFishing: (value) => {
      scene.state.easyFishing = value;
      scene.persist();
    },
    activity: (command) => scene.activities.command(command),
    cancel: () => scene.cancelAction(),
    quality: (q) => scene.applyQuality(q),
    fullscreen: () => {
      if (scene.scale.isFullscreen) scene.scale.stopFullscreen();
      else scene.scale.startFullscreen();
    },
    equip: (id) => scene.equipItem(id),
    selectBuilding: (kind) => scene.selectBuilding(kind),
  });
}
