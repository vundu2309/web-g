export type PlayerAction = 'jump' | 'pause' | 'interact' | 'inventory' | 'build' | 'cancel';
export interface InputContext {
  playing(): boolean;
  modalOpen(): boolean;
  pauseOpen(): boolean;
  action(action: PlayerAction): void;
  blur(): void;
  hidden(): void;
}
export class PlayerControls {
  readonly keys = new Set<string>();
  readonly actionPointers = new Set<number>();
  readonly pointers = new Map<number, number>();
  private readonly abort = new AbortController();
  constructor(private readonly context: InputContext) {
    const options = {signal: this.abort.signal};
    document.addEventListener('keydown', this.keydown, options);
    document.addEventListener(
      'keyup',
      (e) => {
        this.keys.delete(e.code);
        this.syncButtons();
      },
      options,
    );
    window.addEventListener(
      'blur',
      () => {
        this.clear();
        context.blur();
      },
      options,
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          this.clear();
          context.hidden();
        }
      },
      options,
    );
    window.addEventListener('pagehide', () => context.blur(), options);
    for (const [id, direction] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const button = document.getElementById(id)!;
      button.addEventListener(
        'pointerdown',
        (e) => {
          e.preventDefault();
          if (!context.playing() || context.modalOpen()) return;
          button.setPointerCapture(e.pointerId);
          this.pointers.set(e.pointerId, direction);
          this.syncButtons();
        },
        options,
      );
      const release = (e: PointerEvent) => {
        this.pointers.delete(e.pointerId);
        this.syncButtons();
      };
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
        button.addEventListener(type, release, options);
    }
    const action = document.getElementById('action')!;
    action.addEventListener(
      'pointerdown',
      (event) => {
        if (!context.playing() || context.modalOpen()) return;
        event.preventDefault();
        action.setPointerCapture(event.pointerId);
        this.actionPointers.add(event.pointerId);
        if (this.actionPointers.size === 1) context.action('interact');
      },
      options,
    );
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      action.addEventListener(type, (event) => this.actionPointers.delete(event.pointerId), options);
    }
    const jump = document.getElementById('jump')!;
    jump.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        context.action('jump');
      },
      options,
    );
    jump.addEventListener(
      'click',
      (e) => {
        if (e.detail === 0) context.action('jump');
      },
      options,
    );
  }
  private keydown = (event: KeyboardEvent) => {
    const c = this.context;
    if (c.modalOpen()) {
      if (event.code === 'KeyP' && c.pauseOpen()) {
        event.preventDefault();
        c.action('pause');
      }
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
      event.preventDefault();
      if (c.playing()) this.keys.add(event.code);
      this.syncButtons();
      return;
    }
    if (event.code === 'KeyE' && c.playing()) this.keys.add(event.code);
    if (event.repeat) return;
    const actions: Record<string, PlayerAction> = {
      Space: 'jump',
      ArrowUp: 'jump',
      KeyW: 'jump',
      KeyP: 'pause',
      KeyE: 'interact',
      KeyI: 'inventory',
      KeyB: 'build',
      Escape: 'cancel',
    };
    const action = actions[event.code];
    if (action) {
      event.preventDefault();
      c.action(action);
    }
  };
  get pulling() {
    return this.keys.has('KeyE') || this.actionPointers.size > 0;
  }
  get direction() {
    let direction =
      Number(this.keys.has('ArrowRight') || this.keys.has('KeyD')) -
      Number(this.keys.has('ArrowLeft') || this.keys.has('KeyA'));
    for (const value of this.pointers.values()) direction += value;
    return Math.sign(direction);
  }
  clear() {
    this.actionPointers.clear();
    this.keys.clear();
    this.pointers.clear();
    this.syncButtons();
  }
  private syncButtons() {
    for (const [id, codes] of [
      ['left', ['ArrowLeft', 'KeyA']],
      ['right', ['ArrowRight', 'KeyD']],
    ] as const)
      document
        .getElementById(id)
        ?.classList.toggle(
          'held',
          codes.some((code) => this.keys.has(code)) || [...this.pointers.values()].includes(id === 'left' ? -1 : 1),
        );
  }
  dispose() {
    this.clear();
    this.abort.abort();
  }
}
