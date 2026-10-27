import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fishFrame} from './fishArt.ts';
import {fishSpecies} from '../../data/catalog.ts';

test('every fish species has deterministic, distinct tail frames with a transparent safety margin', () => {
  const speciesImages = new Set<string>();
  for (const species of fishSpecies) {
    const frames = Array.from({length: 4}, (_, i) => fishFrame(species, i));
    assert.deepEqual(frames[0].data, fishFrame(species, 0).data);
    assert.notDeepEqual(frames[0].data, frames[1].data);
    for (const art of frames) {
      const bounds = art.bounds()!;
      assert.ok(bounds.minX > 0 && bounds.maxX < art.w - 1);
      assert.ok(bounds.minY > 0 && bounds.maxY < art.h - 1);
    }
    speciesImages.add(Buffer.from(frames[0].data).toString('base64'));
  }
  assert.ok(speciesImages.size >= 10);
});
