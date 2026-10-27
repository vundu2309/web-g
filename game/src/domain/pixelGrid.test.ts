import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CLEAR, PixelGrid, segmentDistance} from './pixelGrid.ts';

test('a grid starts transparent and clips every write outside its bounds', () => {
  const grid = new PixelGrid(3, 2);
  assert.deepEqual(grid.rows(), ['...', '...']);
  grid.put(-1, 0, 'a');
  grid.put(3, 1, 'a');
  grid.put(1, 1, 'b');
  assert.deepEqual(grid.rows(), ['...', '.b.']);
  assert.equal(grid.get(9, 9), CLEAR);
});

test('line, rectangle and region paint exactly the named cells', () => {
  const grid = new PixelGrid(5, 3);
  grid.line(0, 0, 4, 2, 'l');
  grid.fill(0, 2, 2, 1, 'f');
  grid.region(
    3,
    1,
    4,
    2,
    (x, y) => x + y > 4,
    () => 'r',
  );
  assert.deepEqual(grid.rows(), ['l....', '.ll.r', 'ff.rr']);
});

test('a diagonal line keeps one cell per row and column step', () => {
  const grid = new PixelGrid(4, 4);
  grid.line(0, 0, 3, 3, 'x');
  assert.deepEqual(grid.rows(), ['x...', '.x..', '..x.', '...x']);
});

test('segment distance is zero on the segment and measured to the nearest end beyond it', () => {
  assert.equal(segmentDistance(2, 0, 0, 0, 4, 0), 0);
  assert.equal(segmentDistance(2, 3, 0, 0, 4, 0), 3);
  assert.equal(segmentDistance(7, 4, 0, 0, 4, 0), 5);
});
