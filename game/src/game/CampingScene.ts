import {AquaticLife} from './AquaticLife';
import {WorldStreamer} from './rendering/WorldStreamer';
import {palette} from '../data/palette';
import {centerCamera} from './rendering/sceneView';
import {ParallaxRenderer} from './rendering/ParallaxRenderer';
import {CampSimulation} from './CampSimulation';
import {interact, refreshHUD} from './sceneActions';
import {DayNightRenderer} from './rendering/DayNightRenderer';
import Phaser from 'phaser';
import {writeQuality} from '../storage/preferences';
import {equip, newSave, type Save, type BuildingKind} from '../camping';
import {groundAt, waterAt, resourceNodes, WORLD_WIDTH, WORLD_HEIGHT} from '../data/world';
import {initFirebase} from '../firebase';
import {LocalSaveRepository, type SaveRepository} from '../storage/SaveRepository';
import {GameUI, type Panel, type GameStatus, type HUDModel} from '../ui/GameUI';
import {PlayerControls, type PlayerAction} from '../input/PlayerControls';
import type {CampActivities} from './CampActivities';
import {bindSceneUI} from './bindSceneUI';
import {FishingSystem} from './systems/FishingSystem';
import {ConstructionSystem} from './systems/ConstructionSystem';
import {CampRenderer, type VisualFrame} from './rendering/CampRenderer';
import {buildWorld} from './rendering/WorldRenderer';
import {Viewport} from './rendering/Viewport';
import {initialQuality, type Quality} from './rendering/resolution';
const STEP = 1 / 60;
/** Composition root: coordinates world simulation and commands, without building DOM. */
export class CampingScene extends Phaser.Scene {
  state: Save = newSave();
  status: GameStatus = 'ready';
  quality: Quality = initialQuality();
  readonly hudModel: HUDModel = {
    state: this.state,
    status: this.status,
    location: '',
    actionLabel: '',
    bite: false,
    cancelVisible: false,
  };
  clock = 0;
  accumulator = 0;
  readonly simulation = new CampSimulation();
  private storageWarning = false;
  readonly fishingSystem = new FishingSystem();
  readonly construction = new ConstructionSystem({
    width: WORLD_WIDTH,
    heightAt: groundAt,
    isWet: (x) => Boolean(waterAt(x)),
    resources: resourceNodes,
  });
  aquatic!: AquaticLife;
  activities!: CampActivities;
  worldStreamer!: WorldStreamer;
  daylight!: DayNightRenderer;
  background!: ParallaxRenderer;
  fps = {frames: 0, elapsed: 0, average: 0, samples: 0};
  visuals!: CampRenderer;
  ui!: GameUI;
  controls!: PlayerControls;
  viewport!: Viewport;
  private readonly placementFrame = {kind: 'tent' as BuildingKind, x: 0, error: ''};
  private readonly renderFrame: VisualFrame = {
    state: this.state,
    placement: null,
    fishing: null,
    clock: 0,
    quality: this.quality,
  };
  constructor(private readonly saves: SaveRepository = new LocalSaveRepository()) {
    super('forest');
  }
  get player() {
    return this.visuals.player;
  }
  get fishing() {
    return this.fishingSystem.session;
  }
  get selected() {
    return this.construction.selected;
  }
  get keys() {
    return this.controls.keys;
  }
  get nodes() {
    return this.visuals.nodes;
  }
  get structures() {
    return this.visuals.structures;
  }
  create() {
    this.state = this.saves.load();
    this.status = 'ready';
    this.clock = this.accumulator = 0;
    this.simulation.reset();
    this.fishingSystem.cancel();
    this.construction.selected = null;
    this.ui = new GameUI();
    this.cameras.main.setBackgroundColor(palette.skyHorizon).setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const labels: Phaser.GameObjects.Text[] = [];
    const floor = buildWorld(this, labels);
    this.daylight = new DayNightRenderer(this);
    this.background = new ParallaxRenderer(this);
    this.visuals = new CampRenderer(this, this.state, labels);
    this.worldStreamer = new WorldStreamer(this);
    this.aquatic = new AquaticLife(this);
    this.physics.add.collider(this.player, floor, undefined, () => !this.aquatic.swimming.active);
    this.ui.setPortrait(this.visuals.portrait);
    this.controls = new PlayerControls({
      playing: () => this.status === 'play',
      modalOpen: () => this.ui.modalOpen,
      pauseOpen: () => this.ui.pauseMenu.open,
      action: (action) => this.command(action),
      blur: () => this.persist(),
      hidden: () => {
        if (this.status === 'play') this.togglePause();
      },
    });
    bindSceneUI(this);
    this.viewport = new Viewport(this, this.quality, () => this.centerCamera());
    this.ui.setQuality(this.quality);
    document.querySelector<HTMLInputElement>('#easy-fishing')!.checked = this.state.easyFishing;
    this.ui.showWelcome(true);
    this.physics.pause();
    this.refreshHUD();
    let disposed = false;
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      this.persist();
      this.controls.dispose();
      this.viewport.dispose();
      this.aquatic.dispose();
      this.worldStreamer.dispose();
      this.ui.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
      this.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    if (import.meta.env.DEV) (window as unknown as {forest: CampingScene}).forest = this;
  }
  private command(action: PlayerAction) {
    switch (action) {
      case 'jump':
        this.jump();
        break;
      case 'pause':
        this.togglePause();
        break;
      case 'interact':
        this.interact();
        break;
      case 'inventory':
        this.openPanel('inventory');
        break;
      case 'build':
        this.openPanel('build');
        break;
      case 'cancel':
        this.cancelAction();
    }
  }
  clearControls() {
    this.controls.clear();
    this.player.setVelocityX(0);
  }
  private pause() {
    if (this.status === 'play') {
      this.status = 'pause';
      this.clearControls();
      this.physics.pause();
      this.persist();
    }
  }
  private resume() {
    if (this.status === 'ready') return;
    this.status = 'play';
    this.accumulator = 0;
    this.physics.resume();
    this.ui.closeAll();
    this.refreshHUD();
  }
  start() {
    this.ui.closeAll();
    this.status = 'play';
    this.physics.resume();
    this.ui.showWelcome(false);
    void initFirebase().catch(() => {});
    this.ui.toast('I: kho đồ · B: dựng trại · E: thu thập hoặc câu cá');
    this.refreshHUD();
  }
  togglePause() {
    if (this.status === 'ready') return;
    if (this.status === 'play') {
      this.pause();
      this.ui.pauseMenu.showModal();
    } else if (this.ui.pauseMenu.open) this.resume();
    this.refreshHUD();
  }
  returnHome() {
    this.ui.closeAll();
    this.cancelAction();
    this.clearControls();
    this.aquatic.reset();
    this.player.setPosition(120, groundAt(120) - 1).setVelocity(0);
    this.resume();
    this.persist();
  }
  openPanel(panel: Panel) {
    if (this.selected || this.fishing) this.cancelAction();
    this.pause();
    if (panel === 'inventory') this.ui.renderInventory(this.state, this.visuals.figure);
    if (panel === 'build') this.ui.renderRecipes(this.state, this.visuals.buildingImages);
    this.ui.showPanel(panel);
    this.refreshHUD();
  }
  closePanel(panel: Panel) {
    this.ui.closePanel(panel);
    if (this.status !== 'ready') {
      this.ui.pauseMenu.showModal();
      this.refreshHUD();
    }
  }
  equipItem(id: string) {
    if (equip(this.state, id)) {
      this.ui.setPortrait(this.visuals.refreshAppearance(this.state));
      this.ui.renderInventory(this.state, this.visuals.figure);
      this.persist();
    }
  }
  selectBuilding(kind: BuildingKind) {
    this.construction.selected = kind;
    this.ui.buildMenu.close();
    this.resume();
    this.ui.toast('Chọn vị trí, nhấn E hoặc nút Đặt. Esc để hủy.');
    this.refreshHUD();
  }
  jump() {
    if (this.status === 'ready') {
      this.start();
      return;
    }
    if (this.status === 'play' && !this.ui.modalOpen && this.aquatic.jump()) return;
    if (this.status === 'play' && !this.ui.modalOpen && (this.player.body as Phaser.Physics.Arcade.Body).blocked.down) {
      this.cancelAction();
      this.player.setVelocityY(-720);
    }
  }
  applyQuality(quality: Quality) {
    this.quality = quality;
    this.viewport.setQuality(quality);
    this.ui.setQuality(quality);
    writeQuality(quality);
  }
  centerCamera() {
    centerCamera(this);
  }
  persist() {
    if (!this.visuals) return;
    this.state.x = Math.round(this.player.x);
    if (this.saves.save(this.state)) this.storageWarning = false;
    else if (!this.storageWarning) {
      this.storageWarning = true;
      this.ui.toast('Không lưu được trên thiết bị này. Tiến trình hiện chỉ giữ trong lượt chơi.');
    }
  }
  nearbyNode() {
    return resourceNodes.find(
      (node) => !this.state.harvested.includes(node.id) && Math.abs(node.x - this.player.x) < 75,
    );
  }
  placementX() {
    return this.construction.position(this.player.x, this.player.flipX);
  }
  placementError(x: number) {
    return this.construction.error(this.state, x);
  }
  interact() {
    interact(this);
  }
  cancelAction() {
    this.fishingSystem.cancel();
    this.construction.selected = null;
    this.visuals.hideActions();
    this.refreshHUD();
  }
  refreshHUD() {
    refreshHUD(this);
  }
  update(_time: number, delta: number) {
    if (this.status !== 'play') return;
    if (import.meta.env.DEV) {
      this.fps.frames++;
      this.fps.elapsed += delta;
      if (this.fps.elapsed >= 1000) {
        this.fps.average = (this.fps.frames * 1000) / this.fps.elapsed;
        this.fps.samples++;
        this.fps.frames = this.fps.elapsed = 0;
      }
    }
    this.accumulator += Math.min(delta / 1000, 0.1);
    while (this.accumulator >= STEP && this.status === 'play') {
      this.simulation.step(this, STEP);
      this.physics.world.update(this.clock * 1000, 1000 / 60);
      this.physics.world.postUpdate();
      this.accumulator -= STEP;
    }
    this.centerCamera();
    const frame = this.renderFrame;
    frame.state = this.state;
    frame.fishing = this.fishing;
    frame.swimming = this.aquatic.swimming.active;
    frame.diving = this.aquatic.swimming.submerged;
    frame.clock = this.clock;
    frame.quality = this.quality;
    frame.placement = null;
    if (this.selected) {
      this.placementFrame.kind = this.selected;
      this.placementFrame.x = this.placementX();
      this.placementFrame.error = this.placementError(this.placementFrame.x);
      frame.placement = this.placementFrame;
    }
    this.visuals.draw(frame);
    this.aquatic.draw();
    this.refreshHUD();
  }
}
