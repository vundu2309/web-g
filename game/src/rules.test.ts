import {test} from 'node:test';import assert from 'node:assert/strict';import {newRun,hit,firefly,tick,dropDelay} from './rules.ts';
test('shield absorbs three hits; next hit ends normal run',()=>{const r=newRun();r.shield=3;assert.equal(hit(r),false);assert.equal(hit(r),false);assert.equal(hit(r),false);assert.equal(r.shield,0);assert.equal(hit(r),true)});
test('God preserves run after shield depletion',()=>{const r=newRun(true);assert.equal(hit(r),false)});
test('boost expires on game time and only doubles fireflies',()=>{const r=newRun();r.boost=10;firefly(r);assert.equal(r.bonus,100);tick(r,10,204);firefly(r);assert.equal(r.bonus,150);assert.equal(r.boost,0)});
test('difficulty increases with bounded intervals',()=>{assert.ok(dropDelay(0,.5)>dropDelay(120,.5));assert.ok(dropDelay(999,0)>=.55)});
