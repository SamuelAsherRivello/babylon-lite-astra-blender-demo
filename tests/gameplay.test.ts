import { describe, expect, it } from 'vitest';
import { cameraRelative, constrainCamera, normalizeInput } from '../src/controls';
import { isWalkable, moveOnGround, validateNavigation } from '../src/navigation';
import type { Navigation } from '../src/navigation';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

const nav: Navigation = { version: 1, groundY: 0, bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
  walkablePolygon: [[-5,-5],[5,-5],[5,5],[-5,5]], spawn: { x: 0, z: 0 }, characterRadius: 0.25,
  obstacles: [{ id: 'house', type: 'box', minX: 1, maxX: 2, minZ: -2, maxZ: 2 }, { id: 'tree', type: 'circle', x: -2, z: 0, radius: 0.5 }] };

describe('camera-relative controls', () => {
  it('normalizes diagonals without losing analog magnitude', () => {
    const d = normalizeInput(1, 1); expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
    expect(normalizeInput(0.25, 0)).toEqual({ x: 0.25, y: 0 });
  });
  it('moves screen up toward center and screen right to camera right', () => {
    expect(cameraRelative({ x: 0, y: 1 }, { x: 0, z: -10 }).z).toBe(1);
    expect(cameraRelative({ x: 1, y: 0 }, { x: 0, z: -10 }).x).toBe(-1);
    expect(cameraRelative({ x: 0, y: 1 }, { x: 10, z: 0 }).x).toBe(-1);
  });
  it('bounds zoom and tilt and always creates the same immutable-value target', () => {
    const a = constrainCamera(9, -20, 500); a.target.x = 99;
    expect(constrainCamera(1, 2, -5)).toEqual({ alpha: 1, beta: 1.23, radius: 12, target: { x: 0, y: 0, z: 0 } });
    expect(a.radius).toBe(27); expect(a.beta).toBe(0.55);
  });
});

describe('safe navigation', () => {
  it('validates safe spawn and rejects malformed data', () => {
    expect(validateNavigation(nav)).toBe(nav);
    expect(() => validateNavigation({ ...nav, spawn: { x: 1.5, z: 0 } })).toThrow(/clearance/);
    expect(() => validateNavigation({ ...nav, characterRadius: 0 })).toThrow(/contract/);
  });
  it('accepts Babylon vectors whose coordinates are accessors', () => {
    const p = moveOnGround(new Vector3(0, 0, 0), { x: 0, z: 1 }, 0.1, nav);
    expect(p.x).toBe(0); expect(p.z).toBeCloseTo(0.1);
  });
  it('respects radius at boxes, circles and edges', () => {
    for (const p of [{ x: 0.8, z: 0 }, { x: -1.3, z: 0 }, { x: 4.8, z: 0 }]) expect(isWalkable(p, nav)).toBe(false);
    expect(isWalkable({ x: 0.74, z: 0 }, nav)).toBe(true);
  });
  it('respects concave polygon and diagonal perimeter clearance', () => {
    const triangle = { ...nav, obstacles: [], walkablePolygon: [[-5,-5],[5,-5],[-5,5]] as [number, number][] };
    expect(isWalkable({ x: -0.1, z: -0.1 }, triangle)).toBe(false);
    expect(isWalkable({ x: -1, z: -1 }, triangle)).toBe(true);
    const concave = { ...nav, obstacles: [], walkablePolygon: [[-5,-5],[5,-5],[5,0],[0,0],[0,5],[-5,5]] as [number, number][] };
    expect(isWalkable({ x: 1, z: 1 }, concave)).toBe(false);
  });
  it('does not tunnel through a thin obstacle on a long frame', () => {
    const thin = { ...nav, obstacles: [{ id: 'water', type: 'box' as const, minX: 1, maxX: 1.01, minZ: -5, maxZ: 5 }] };
    const p = moveOnGround(nav.spawn, { x: 100, z: 0 }, 3, thin);
    expect(p.x).toBeLessThanOrEqual(0.75); expect(isWalkable(p, thin)).toBe(true);
  });
  it('slides along a wall and gives equal distance at 30 and 60 fps', () => {
    const p = moveOnGround({ x: 0.74, z: 0 }, { x: 2, z: 2 }, 0.1, nav);
    expect(p.x).toBeLessThan(0.75); expect(p.z).toBeCloseTo(0.2);
    const simulate = (fps: number) => { let p = nav.spawn; for (let i = 0; i < fps; i++) p = moveOnGround(p, { x: 0, z: 2 }, 1 / fps, nav); return p; };
    expect(simulate(30).z).toBeCloseTo(simulate(60).z);
  });
});
