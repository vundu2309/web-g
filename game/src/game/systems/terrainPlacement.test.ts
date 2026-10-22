import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConstructionSystem, type BuildingTerrain} from './ConstructionSystem.ts';
import {newSave} from '../../camping.ts';
import {decodeSave} from '../../domain/saveCodec.ts';
import {groundAt, regions, resourceNodes, waterAt, WORLD_WIDTH} from '../../data/world.ts';

const terrain: BuildingTerrain = {
  width: WORLD_WIDTH,
  heightAt: groundAt,
  isWet: (x) => Boolean(waterAt(x)),
  resources: resourceNodes,
};

test('every region has several valid dry, flat spots for buildings near the path', () => {
  const system = new ConstructionSystem(terrain);
  const save = newSave();
  for (const [i, region] of regions.entries()) {
    const end = regions[i + 1]?.x ?? WORLD_WIDTH;
    let found = 0;
    for (let x = region.x + 64; x < end - 64; x += 32) {
      if (system.error(save, x) === '') found++;
    }
    assert.ok(found >= 10, region.name + ' has only ' + found + ' valid spots');
  }
});

test('resource nodes keep their ids and stand on dry land', () => {
  const ids = resourceNodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const node of resourceNodes) {
    assert.match(node.id, /^node-\d+$/);
    assert.equal(waterAt(node.x), undefined, node.id);
  }
});

test('an old save with buildings on lake edges and slopes loads without losing them', () => {
  const raw = {
    version: 2,
    buildings: [
      {id: 'old-1', kind: 'tent', x: 3584 + 40},
      {id: 'old-2', kind: 'fire', x: 7168 + 20},
      {id: 'old-3', kind: 'tent', x: 1000},
    ],
  };
  const save = decodeSave(JSON.stringify(raw));
  assert.equal(save.buildings.length, 3);
  for (const building of save.buildings) assert.ok(Number.isFinite(groundAt(building.x)));
});
