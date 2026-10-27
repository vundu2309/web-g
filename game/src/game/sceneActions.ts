import type Phaser from 'phaser';
import type {CampingScene} from './CampingScene';
import {recipes} from '../camping';
import {waterAt, waterDirections, regionAt} from '../data/world';
export function interact(scene: CampingScene) {
  if (scene.status !== 'play' || scene.ui.modalOpen) return;
  if (scene.aquatic.swimming.active) {
    scene.ui.toast('Nổi lên bờ hoặc lối gỗ để câu cá và dùng công trình.');
    return;
  }
  if (!(scene.player.body as Phaser.Physics.Arcade.Body).blocked.down) {
    scene.ui.toast('Đứng vững trên mặt đất trước nhé.');
    return;
  }
  if (scene.selected) {
    const result = scene.construction.place(scene.state, scene.placementX());
    if (!result.ok) {
      scene.ui.toast(result.message);
      return;
    }
    scene.visuals.hideActions();
    scene.visuals.restore(scene.state);
    scene.visuals.act('build', scene.clock);
    scene.persist();
    scene.ui.toast('Đã dựng ' + recipes[result.kind].name.toLowerCase() + '.');
    scene.refreshHUD();
    return;
  }
  if (scene.fishing) {
    const caught = scene.fishingSystem.reel(scene.state);
    if (scene.fishing?.phase === 'fight') {
      scene.ui.toast('Giữ E / Kéo để thu dây; thả trước khi dây căng đỏ!');
      return;
    }
    if (!caught) {
      scene.ui.toast('Phao chưa chìm. Chờ cá cắn câu!');
      return;
    }
    scene.aquatic.caught();
    scene.persist();
    scene.ui.toast(
      'Câu được ' +
        caught.species.name +
        ' · ' +
        caught.length +
        ' cm · ' +
        caught.species.rarity +
        '. Đã cho vào kho đồ.',
    );
    scene.refreshHUD();
    return;
  }
  if (scene.activities.interact(scene.player.x)) return;
  const node = scene.nearbyNode();
  if (node) {
    scene.state.harvested.push(node.id);
    scene.state[node.kind] += node.kind === 'wood' ? 5 : 4;
    scene.visuals.restore(scene.state);
    scene.visuals.act('gather', scene.clock);
    scene.persist();
    scene.ui.toast(node.kind === 'wood' ? '+5 gỗ khô' : '+4 đá');
    scene.refreshHUD();
    return;
  }
  const lake = waterAt(scene.player.x);
  if (lake) {
    scene.clearControls();
    if (!scene.aquatic.cast(lake)) {
      scene.ui.toast('Cá đang ẩn nấp. Thử đổi chỗ hoặc chờ đàn cá quay lại.');
      return;
    }
    scene.visuals.act('cast', scene.clock);
    scene.ui.toast('Đã thả câu tại ' + lake.name + '. Nhấn E khi phao chìm!');
    scene.refreshHUD();
    return;
  }
  scene.ui.toast(waterDirections(scene.player.x));
}
export function refreshHUD(scene: CampingScene) {
  const node = scene.nearbyNode(),
    lake = waterAt(scene.player.x);
  const building = scene.activities.nearby(scene.player.x);
  const actionLabel = scene.aquatic.swimming.active
    ? 'Đang bơi'
    : scene.selected
      ? 'Đặt ' + recipes[scene.selected].name
      : scene.fishing?.phase === 'bite'
        ? 'Móc cá!'
        : scene.fishing?.phase === 'fight'
          ? 'Giữ để kéo'
          : scene.fishing
            ? 'Chờ cá…'
            : building
              ? 'Mở ' + recipes[building.kind].name
              : node
                ? node.kind === 'wood'
                  ? 'Nhặt gỗ'
                  : 'Nhặt đá'
                : lake
                  ? 'Câu cá'
                  : 'Tương tác';
  const model = scene.hudModel;
  model.aquatic = {
    near: scene.aquatic.nearWater,
    active: scene.aquatic.swimming.active,
    air: scene.aquatic.swimming.air,
    surfacing: scene.aquatic.swimming.surfacing,
  };
  model.state = scene.state;
  model.status = scene.status;
  model.location = lake?.name ?? regionAt(scene.player.x).name;
  model.actionLabel = actionLabel;
  model.bite = scene.fishing?.phase === 'bite';
  model.cancelVisible = Boolean(scene.selected || scene.fishing);
  const view = scene.cameras.main.worldView;
  const anchor = (model.anchor ??= {x: 0, y: 0});
  anchor.x = Math.max(5, Math.min(75, Math.round(((scene.player.x - view.x) / view.width) * 1000) / 10));
  anchor.y = Math.max(20, Math.min(80, Math.round(((scene.player.y + 20 - view.y) / view.height) * 1000) / 10));
  scene.ui.renderHUD(model);
}
