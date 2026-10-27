/** Cửa sổ chunk hữu hạn: dựng vùng nhìn ngay, nạp trước một chunk/frame, giữ đệm rộng hơn. */
export class ChunkWindow<T> {
  readonly loaded = new Map<number, T>();
  private disposed = false;
  readonly count: number;
  readonly width: number;
  private readonly load: (index: number) => T;
  private readonly release: (index: number, value: T) => void;
  constructor(count: number, width: number, load: (index: number) => T, release: (index: number, value: T) => void) {
    this.count = count;
    this.width = width;
    this.load = load;
    this.release = release;
  }
  update(left: number, right: number) {
    if (this.disposed) return;
    const first = Math.max(0, Math.min(this.count - 1, Math.floor(left / this.width)));
    const last = Math.max(first, Math.min(this.count - 1, Math.ceil(right / this.width) - 1));
    // Giữ đệm ba chunk để không dựng/gỡ liên tục khi đi qua lại ranh giới.
    for (const [index, value] of this.loaded) {
      if (index < first - 3 || index > last + 3) {
        this.release(index, value);
        this.loaded.delete(index);
      }
    }
    for (let index = first; index <= last; index++) this.ensure(index);
    // Nạp trước hai bên qua hai frame; không vẽ toàn map khi khởi động.
    if (!this.prefetch(first - 1)) this.prefetch(last + 1);
  }
  private prefetch(index: number) {
    if (index < 0 || index >= this.count || this.loaded.has(index)) return false;
    this.ensure(index);
    return true;
  }
  private ensure(index: number) {
    if (!this.loaded.has(index)) this.loaded.set(index, this.load(index));
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const [index, value] of this.loaded) this.release(index, value);
    this.loaded.clear();
  }
}
