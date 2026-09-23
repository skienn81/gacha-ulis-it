import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const out=mkdtempSync(join(tmpdir(),'tnag-case-'));
try{
 buildSync({entryPoints:['src/lib/case-mechanics.ts'],outfile:join(out,'case.cjs'),bundle:true,platform:'node',format:'cjs'});
 const {createSpinProfile, createPrizeSelector, calculatePrizeChances}=createRequire(import.meta.url)(join(out,'case.cjs'));
 test('normal motion keeps the deliberate case-opening pace',()=>{
  const profile=createSpinProfile(()=>.5,false);
  assert.deepEqual(profile,{durationMs:10000,tiles:45,friction:3});
 });
 test('reduced motion remains readable instead of becoming an instant Windows spin',()=>{
  const profile=createSpinProfile(()=>.5,true);
  assert.deepEqual(profile,{durationMs:4500,tiles:12,friction:3});
 });
 test('forcedPrizeId guarantees 100% win on next roll',()=>{
  const mockPrizes = [
    { id: 'p1', name: 'Item 1', stars: 1, weight: 100 },
    { id: 'p6', name: 'Jackpot', stars: 6, weight: 1 },
  ];
  const selector = createPrizeSelector(mockPrizes);
  const won = selector.choose(mockPrizes, () => 0.999, false, {}, 'p6');
  assert.equal(won.id, 'p6');
 });
 test('forcedPrizeId respects excludeSixStar when 6-star was already claimed',()=>{
  const mockPrizes = [
    { id: 'p1', name: 'Item 1', stars: 1, weight: 100 },
    { id: 'p6', name: 'Jackpot', stars: 6, weight: 1 },
  ];
  const selector = createPrizeSelector(mockPrizes);
  const won = selector.choose(mockPrizes, () => 0.5, true, {}, 'p6');
  assert.equal(won.id, 'p1');
 });
 test('calculatePrizeChances updates chances correctly with absolute buff boost',()=>{
  const mockPrizes = [
    { id: 'p1', name: 'Item 1', stars: 1, weight: 100 },
    { id: 'p6', name: 'Jackpot', stars: 6, weight: 1 },
  ];
  const baseChances = calculatePrizeChances(mockPrizes, {});
  assert(baseChances.p6 < 1.5);
  // Buff 3 times (+225 weight):
  const buffedChances = calculatePrizeChances(mockPrizes, { p6: 3 });
  assert(buffedChances.p6 > 60);
 });
}finally{rmSync(out,{recursive:true,force:true})}
