import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildCamperFrames, dressOf, hashFrames} from './build.ts';
import {buildGeometry} from './geometry.ts';
import {gear} from '../../data/catalog.ts';
import {RIG_POSES} from './poses.ts';
import {FRAME_H, FRAME_W, GROUND_ROW, RIG_FRAME_COUNTS, RIG_STATES, type RigOutfit, type Frame} from './types.ts';

/** Món trang bị đọc từ `gear` để màu khớp đúng bảng thật. */
const piece = (id: string): RigOutfit['hat'] => {
  const item = gear.find((entry) => entry.id === id);
  if (!item) throw new Error('thiếu món ' + id);
  return {id, color: item.color};
};
const OUTFITS: readonly RigOutfit[] = [
  {hat: piece('hat-ranger'), shirt: piece('shirt-linen'), pants: piece('pants-trail'), bag: piece('bag-canvas')},
  {hat: piece('hat-knit'), shirt: piece('shirt-pine'), pants: piece('pants-denim'), bag: piece('bag-moss')},
];

/** Mười sáu tổ hợp: hai hình dáng mỗi slot. */
function allCombos(): RigOutfit[] {
  return ['hat-ranger', 'hat-knit'].flatMap((hat) =>
    ['shirt-linen', 'shirt-pine'].flatMap((shirt) =>
      ['pants-trail', 'pants-denim'].flatMap((p) =>
        ['bag-canvas', 'bag-moss'].map((bag) => ({
          hat: piece(hat),
          shirt: piece(shirt),
          pants: piece(p),
          bag: piece(bag),
        })),
      ),
    ),
  );
}

/** Pixel không trong suốt (alpha > 0) của một frame. */
function inkPixels(frame: Frame) {
  const pixels: {x: number; y: number}[] = [];
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      if (frame.rgba[(y * frame.width + x) * 4 + 3]) pixels.push({x, y});
    }
  }
  return pixels;
}

function bounds(frame: Frame) {
  const pixels = inkPixels(frame);
  return {
    minX: Math.min(...pixels.map((p) => p.x)),
    maxX: Math.max(...pixels.map((p) => p.x)),
    minY: Math.min(...pixels.map((p) => p.y)),
    maxY: Math.max(...pixels.map((p) => p.y)),
  };
}

test('the frame is 36×48 with 46 frames, thirteen states and matching counts', () => {
  const set = buildCamperFrames(OUTFITS[0]);
  assert.equal(FRAME_W, 36);
  assert.equal(FRAME_H, 48);
  assert.equal(set.all.length, 46);
  for (const state of RIG_STATES) {
    assert.equal(set.frames[state].length, RIG_FRAME_COUNTS[state], state);
    assert.equal(RIG_POSES[state].length, RIG_FRAME_COUNTS[state], state);
  }
  for (const frame of set.all) {
    assert.equal(frame.width, FRAME_W);
    assert.equal(frame.height, FRAME_H);
    assert.equal(frame.rgba.length, FRAME_W * FRAME_H * 4);
  }
});

test('no visible pixel touches the frame edge: a safety margin of at least one pixel for every pose and outfit', () => {
  for (const outfit of allCombos()) {
    for (const frame of buildCamperFrames(outfit).all) {
      const b = bounds(frame);
      const label = frame.state + ' #' + frame.index;
      assert.ok(b.minX >= 1, label + ' chạm mép trái');
      assert.ok(b.maxX <= FRAME_W - 2, label + ' chạm mép phải');
      assert.ok(b.minY >= 1, label + ' chạm mép trên');
      assert.ok(b.maxY <= FRAME_H - 2, label + ' chạm mép dưới');
    }
  }
});

test('grounded poses put the lowest boot on the ground row; airborne poses stay above it', () => {
  const set = buildCamperFrames(OUTFITS[0]);
  for (const state of ['idle', 'run', 'land', 'cast', 'fish-wait', 'bite', 'reel', 'gather', 'build'] as const) {
    for (const frame of set.frames[state]) {
      const lowest = bounds(frame).maxY;
      assert.equal(lowest, GROUND_ROW, state + ' #' + frame.index + ' phải đứng trên hàng mặt đất');
    }
  }
  for (const state of ['jump', 'fall'] as const) {
    for (const frame of set.frames[state]) {
      const lowest = bounds(frame).maxY;
      assert.ok(lowest < GROUND_ROW, state + ' #' + frame.index + ' phải cao hơn mặt đất');
    }
  }
});

test('running cycle is continuous: frame 7 returns to frame 0 with small anchor jumps', () => {
  const set = buildCamperFrames(OUTFITS[0]);
  const run = set.frames.run;
  const step = (a: Frame, b: Frame) => {
    const d = (p: {x: number; y: number}, q: {x: number; y: number}) => Math.hypot(p.x - q.x, p.y - q.y);
    return Math.max(
      d(a.anchors.hand, b.anchors.hand),
      d(a.anchors.feet[0], b.anchors.feet[0]),
      d(a.anchors.feet[1], b.anchors.feet[1]),
    );
  };
  for (let i = 0; i < run.length; i++) {
    const next = run[(i + 1) % run.length];
    assert.ok(step(run[i], next) <= 12, 'frame ' + i + ' → ' + ((i + 1) % run.length) + ' nhảy quá xa');
  }
});

test('running stride reaches a long step and arms swing opposite the legs', () => {
  const run = buildCamperFrames(OUTFITS[0]).frames.run;
  const feetGap = run.map((f) => Math.abs(f.anchors.feet[0].x - f.anchors.feet[1].x));
  assert.ok(Math.max(...feetGap) >= 14, 'sải chân quá ngắn: ' + Math.max(...feetGap));
  assert.ok(Math.max(...feetGap) <= 26, 'sải chân quá dài: ' + Math.max(...feetGap));
  const hands = run.map((f) => f.anchors.hand.x);
  assert.ok(Math.max(...hands) - Math.min(...hands) >= 6, 'biên độ tay quá nhỏ');
});

test('anchors lie inside the frame and on drawn pixels where they should', () => {
  for (const outfit of allCombos()) {
    const set = buildCamperFrames(outfit);
    for (const frame of set.all) {
      const a = frame.anchors;
      const label = frame.state + ' #' + frame.index;
      const inside = (p: {x: number; y: number}) => p.x >= 0 && p.y >= 0 && p.x < FRAME_W && p.y < FRAME_H;
      assert.ok(inside(a.hand), label + ' tay ngoài khung');
      assert.ok(inside(a.head), label + ' đầu ngoài khung');
      assert.ok(inside(a.headTop), label + ' đỉnh mũ ngoài khung');
      assert.ok(inside(a.feet[0]) && inside(a.feet[1]), label + ' cổ chân ngoài khung');
      if (a.rodTip) assert.ok(inside(a.rodTip), label + ' đầu cần ngoài khung');
      assert.equal(a.ground, GROUND_ROW);
      assert.ok(alphaAt(frame, a.hand) > 0 || neighborAlpha(frame, a.hand) > 0, label + ' tay không nằm trên hình');
      assert.ok(alphaAt(frame, a.headTop) > 0, label + ' đỉnh mũ không nằm trên hình');
      assert.ok(alphaAt(frame, a.head) > 0, label + ' tâm đầu không nằm trên hình');
      if (a.rodTip)
        assert.ok(alphaAt(frame, a.rodTip) > 0 || neighborAlpha(frame, a.rodTip) > 0, label + ' đầu cần lạc');
    }
  }
});

function alphaAt(frame: Frame, p: {x: number; y: number}) {
  return frame.rgba[(p.y * frame.width + p.x) * 4 + 3];
}

function neighborAlpha(frame: Frame, p: {x: number; y: number}) {
  return [
    alphaAt(frame, {x: p.x - 1, y: p.y}),
    alphaAt(frame, {x: p.x + 1, y: p.y}),
    alphaAt(frame, {x: p.x, y: p.y - 1}),
    alphaAt(frame, {x: p.x, y: p.y + 1}),
  ].reduce((a, b) => a + b, 0);
}

test('rod poses hold the rod and the rod tip is defined only where a rod is held', () => {
  const set = buildCamperFrames(OUTFITS[0]);
  for (const state of RIG_STATES) {
    for (const frame of set.frames[state]) {
      const holds = state === 'cast' || state === 'fish-wait' || state === 'bite' || state === 'reel';
      assert.equal(frame.anchors.rodTip !== null, holds, state + ' #' + frame.index);
    }
  }
});

test('the outfit colors come from tone ramps and produce valid bytes everywhere', () => {
  for (const outfit of allCombos()) {
    for (const frame of buildCamperFrames(outfit).all) {
      for (const value of frame.rgba) assert.ok(Number.isInteger(value) && value >= 0 && value <= 255);
    }
  }
});

test('building twice from the same outfit gives identical bytes; the cache returns the same set', () => {
  const first = buildCamperFrames(OUTFITS[0]);
  const second = buildCamperFrames({...OUTFITS[0]});
  assert.equal(first, second);
  const fresh = buildGeometry(dressOf(OUTFITS[0])).length;
  assert.equal(fresh, 46);
  assert.equal(hashFrames(first.all), hashFrames(second.all));
});

test('frame hash regression lock for the first outfit; update only when the art changes (R2)', () => {
  const hash = hashFrames(buildCamperFrames(OUTFITS[0]).all.slice(0, 38));
  assert.equal(hash, 0x6384e079, 'băm hiện tại: 0x' + hash.toString(16).padStart(8, '0'));
});

/**
 * Dựng một bộ màu mới (khóa cache mới, hình học đã có): lấy trung vị của 5 lần để một lần máy bận không làm test đỏ.
 * Ngưỡng 50 ms là ngân sách trên máy phát triển khi rảnh; máy đang tải nặng có thể vượt, khi đó đọc số đo thay vì đoán.
 */
test('building a new colour set of every frame stays under the 50 ms budget (median of 5, Node)', () => {
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const shade = (0x10 + i).toString(16).padStart(2, '0');
    const start = performance.now();
    buildCamperFrames({
      hat: piece('hat-knit'),
      shirt: piece('shirt-pine'),
      pants: {id: 'pants-denim', color: '#526d' + shade},
      bag: piece('bag-moss'),
    });
    times.push(performance.now() - start);
  }
  const median = [...times].sort((x, y) => x - y)[2]!;
  assert.ok(median < 50, 'dựng quá chậm (trung vị): ' + median.toFixed(1) + ' ms');
});

test('running legs never swing the shin more than 65° behind the vertical, so the far leg does not kick straight back', () => {
  for (const params of RIG_POSES.run) {
    for (const leg of [params.legNear, params.legFar]) {
      assert.ok(leg.t - leg.f >= -65, 'cẳng quá ra sau: ' + (leg.t - leg.f));
      assert.ok(leg.t - leg.f <= 40, 'cẳng quá ra trước: ' + (leg.t - leg.f));
    }
  }
});

test('rod tips stay inside the frame with the margin for every rod pose and outfit', () => {
  for (const outfit of allCombos()) {
    for (const state of ['cast', 'fish-wait', 'bite', 'reel'] as const) {
      for (const frame of buildCamperFrames(outfit).frames[state]) {
        const tip = frame.anchors.rodTip;
        assert.ok(tip !== null, state);
        assert.ok(tip.x >= 1 && tip.x <= FRAME_W - 2, state + ' #' + frame.index + ' đầu cần x=' + tip.x);
        assert.ok(tip.y >= 1, state + ' #' + frame.index + ' đầu cần y=' + tip.y);
      }
    }
  }
});
