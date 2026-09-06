import { describe, expect, it } from 'vitest';
import { advanceVfxTime, sampleSmoke, sampleWind, VFX } from '../src/vfx-motion';

describe('living picture motion', () => {
  it('keeps equivalent elapsed-time animation independent of frame rate', () => {
    const run = (fps: number) => { let t = 0; for (let i = 0; i < fps * 12; i++) t = advanceVfxTime(t, 1 / fps); return t; };
    for (const fps of [30, 60, 120, 144]) {
      expect(run(fps)).toBeCloseTo(12, 8);
      expect(sampleSmoke(run(fps), 2).y).toBeCloseTo(sampleSmoke(12, 2).y, 8);
      expect(sampleWind(run(fps), 3, 1).x).toBeCloseTo(sampleWind(12, 3, 1).x, 8);
    }
  });
  it('bounds the visible puff population and whole plume throughout recycling', () => {
    for (let t = 0; t < 40; t += .019) {
      const puffs = Array.from({ length: VFX.smoke.count }, (_, i) => sampleSmoke(t, i));
      expect(puffs.filter(p => p.alpha > .025).length).toBeGreaterThanOrEqual(3);
      expect(puffs.filter(p => p.alpha > .025).length).toBeLessThanOrEqual(10);
      for (const p of puffs) {
        expect(p.alpha).toBeGreaterThanOrEqual(0);
        expect(p.alpha).toBeLessThanOrEqual(VFX.smoke.opacity);
        expect(p.y + p.radius).toBeLessThanOrEqual(VFX.smoke.height + 1e-8);
      }
    }
    expect(sampleSmoke(VFX.smoke.lifetime - 1e-6, 0).alpha).toBeLessThan(.001);
    expect(sampleSmoke(VFX.smoke.lifetime, 0).alpha).toBe(0);
  });
  it('bounds wind around rest without cumulative drift or lockstep trees', () => {
    for (let t = 0; t < 10000; t += 13.71) {
      for (let tree = 0; tree < 6; tree++) {
        const w = sampleWind(t, tree, 1);
        expect(Math.abs(w.x)).toBeLessThanOrEqual(VFX.wind.travel);
        expect(Math.abs(w.z)).toBeLessThanOrEqual(VFX.wind.travel);
        expect(Math.abs(w.roll)).toBeLessThanOrEqual(VFX.wind.angle);
      }
    }
    expect(sampleWind(3, 0, 0)).not.toEqual(sampleWind(3, 1, 0));
  });
  it('rejects invalid time and limits stalls without a catch-up burst', () => {
    expect(advanceVfxTime(4, 60)).toBe(4.05);
    for (const delta of [-1, NaN, Infinity]) expect(advanceVfxTime(4, delta)).toBe(4);
  });
});
