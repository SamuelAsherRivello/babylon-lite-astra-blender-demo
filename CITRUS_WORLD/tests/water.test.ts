import { describe, expect, it } from 'vitest';
import { advanceVfxTime, sampleWater, sampleWaterDetail, VFX } from '../src/vfx-motion';

describe('looping water', () => {
  it('repeats color and normal detail smoothly in both texture axes', () => {
    for (const u of [0, .13, .57, .99]) for (const v of [0, .17, .72, .99]) {
      const a = sampleWaterDetail(u, v);
      for (const b of [sampleWaterDetail(u + 1, v), sampleWaterDetail(u, v + 1)]) {
        expect(b.light).toBeCloseTo(a.light, 10);
        expect(b.dx).toBeCloseTo(a.dx, 10);
        expect(b.dy).toBeCloseTo(a.dy, 10);
      }
      expect(Math.abs(sampleWaterDetail(u, v - 1e-6).light - sampleWaterDetail(u, v + 1e-6).light)).toBeLessThan(.001);
    }
  });
  it('repeats after each full cycle and transports detail in the intended physical direction', () => {
    for (const river of [true, false]) {
      const { period, offset } = sampleWater(2, river);
      expect(sampleWater(2 + period * 100, river).offset).toBeCloseTo(offset, 10);
      const dt = .1, sign = river ? 1 : -1;
      // UV V = world Z (river) or world Y (falls), at 0.8 repeats/m.
      const worldTravel = sign * dt / period / .8;
      const before = sampleWaterDetail(.4, .24 + offset).light;
      const after = sampleWaterDetail(.4, .24 + worldTravel * .8 + sampleWater(2 + dt, river).offset).light;
      expect(after).toBeCloseTo(before, 10);
      const left = sampleWaterDetail(.4, sampleWater(period - 1e-6, river).offset).light;
      const right = sampleWaterDetail(.4, sampleWater(period + 1e-6, river).offset).light;
      expect(Math.abs(left - right)).toBeLessThan(.001);
      for (const time of [0, 1e-9, 12, 100000, NaN, Infinity, -5]) {
        const phase = sampleWater(time, river).offset;
        expect(phase).toBeGreaterThanOrEqual(0); expect(phase).toBeLessThan(1);
      }
    }
    expect(VFX.water.fallPeriod).toBeLessThan(VFX.water.riverPeriod);
  });
  it('keeps flow equivalent at supported frame rates and limits resume jumps', () => {
    for (const fps of [30, 60, 120]) {
      let time = 0;
      for (let i = 0; i < fps * 7; i++) time = advanceVfxTime(time, 1 / fps);
      for (const river of [true, false]) expect(sampleWater(time, river).offset).toBeCloseTo(sampleWater(7, river).offset, 10);
    }
    for (const delta of [-1, NaN, Infinity]) expect(advanceVfxTime(2, delta)).toBe(2);
    expect(advanceVfxTime(2, 60)).toBe(2.05);
  });
});
