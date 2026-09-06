import { describe, expect, it, vi } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { createVfx, TREE_BINDINGS } from '../src/vfx';

function fixture() {
  const engine = new NullEngine(); const scene = new Scene(engine);
  new ArcRotateCamera('camera', 1, 1, 20, Vector3.Zero(), scene);
  for (const [tree, count] of TREE_BINDINGS) for (let i = 0; i < count; i++) CreateBox(`VFX_Foliage_${tree}_${i}`, {}, scene);
  for (const surface of ['River', 'FallSouth', 'FallNorth']) for (const mat of ['Water', 'WaterLight']) CreateBox(`VFX_Water_${surface}_${mat}`, {}, scene);
  const stationary = CreateBox('Tower roof and trunks', {}, scene);
  const anchor = new TransformNode('VFX_Chimney', scene); anchor.position.set(-1.48, 4.458, -2.72);
  const material = new PBRMaterial('fixture-material', scene);
  for (const mesh of scene.meshes) mesh.material = material;
  void scene.defaultMaterial; // Lazy, scene-owned fallback used by the rendering pipeline.
  scene.render(); // Initialize shared scene/BRDF resources before measuring effect ownership.
  return { engine, scene, stationary, world: [...scene.meshes] };
}

describe('effects lifecycle and bindings', () => {
  it('refreshes reflections only on the camera-facing side and switches after orbiting', () => {
    const { engine, scene, world } = fixture();
    try {
      const fx = createVfx(scene, world);
      const camera = scene.activeCamera as ArcRotateCamera;
      const surfaces = ['River', 'FallSouth', 'FallNorth'];
      const resets = surfaces.map(name => vi.spyOn(scene.textures.find(t => t.name === `vfx-reflection-${name}`)! as import('@babylonjs/core/Materials/Textures/mirrorTexture').MirrorTexture, 'resetRefreshCounter'));
      for (const z of [15, -15, 15]) {
        camera.setPosition(new Vector3(0, 8, z)); scene.render();
        resets.forEach(spy => spy.mockClear());
        fx.update(1 / 60);
        expect(resets.map(spy => spy.mock.calls.length)).toEqual(z > 0 ? [1, 1, 0] : [1, 0, 1]);
      }
    } finally { scene.dispose(); engine.dispose(); }
  });
  it('shares aligned flow textures per surface, allocates only at creation and restores materials', () => {
    const { engine, scene, world } = fixture();
    try {
      const original = world.map(m => m.material);
      const beforeTextures = scene.textures.length;
      const fx = createVfx(scene, world);
      expect(scene.textures.length - beforeTextures).toBe(9); // Three mirrors, three color/normal pairs.
      const owned = scene.textures.filter(t => t.name.startsWith('vfx-'));
      const disposals = owned.map(t => vi.spyOn(t, 'dispose'));
      const counts = [scene.meshes.length, scene.materials.length, scene.textures.length];
      for (let i = 0; i < 1500; i++) fx.update(1 / 60);
      expect([scene.meshes.length, scene.materials.length, scene.textures.length]).toEqual(counts);
      for (const surface of ['River', 'FallSouth', 'FallNorth']) {
        const materials = ['Water', 'WaterLight'].map(suffix => scene.getMeshByName(`VFX_Water_${surface}_${suffix}`)!.material as PBRMaterial);
        const color = materials[0].albedoTexture!, normal = materials[0].bumpTexture!;
        expect(color).toBeTruthy(); expect(normal).toBeTruthy();
        expect(materials[1].albedoTexture).toBe(color); expect(materials[1].bumpTexture).toBe(normal);
        expect(color.wrapU).toBe(Texture.WRAP_ADDRESSMODE); expect(color.wrapV).toBe(Texture.WRAP_ADDRESSMODE);
        expect((color as Texture).vOffset).toBe((normal as Texture).vOffset);
      }
      fx.dispose(); fx.dispose();
      for (const spy of disposals) expect(spy).toHaveBeenCalledTimes(1);
      expect(world.map(m => m.material)).toEqual(original);
    } finally { scene.dispose(); engine.dispose(); }
  });
  it('isolates foliage, shares no recursive targets, and releases resources on repeated use', async () => {
    const { engine, scene, stationary, world } = fixture();
    try {
      const before = [scene.meshes.length, scene.materials.length, scene.textures.length, scene.onDisposeObservable.observers.length];
      for (let i = 0; i < 3; i++) {
        const fx = createVfx(scene, world);
        fx.update(.02);
        const s = fx.snapshot();
        expect(s.issues).toEqual([]); expect(s.foliage).toHaveLength(21); expect(s.water).toHaveLength(3);
        expect(s.smoke).toHaveLength(8); expect(s.water.every(w => w.recursive === false)).toBe(true);
        expect(s.water.map(w => w.size)).toEqual([512, 256, 256]);
        [-1.48, 4.458, -2.72].forEach((value, axis) => expect(s.origin[axis]).toBeCloseTo(value, 5));
        expect(stationary.position.asArray()).toEqual([0, 0, 0]);
        // Rendering may include several reflection passes, but must not advance effect time.
        scene.render(); scene.render();
        expect(fx.snapshot().updates).toBe(1);
        fx.dispose(); fx.dispose(); fx.update(1);
        await new Promise(resolve => setTimeout(resolve, 0)); // Babylon defers observer removal.
        expect(fx.snapshot().updates).toBe(1);
        expect(world.every(m => m.position.equals(Vector3.Zero()))).toBe(true);
        expect([scene.meshes.length, scene.materials.length, scene.textures.length, scene.onDisposeObservable.observers.length]).toEqual(before);
      }
    } finally { scene.dispose(); engine.dispose(); }
  });
  it('reports missing anchors and foliage without stopping other effects or the scene', () => {
    const { engine, scene, world } = fixture();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      scene.getTransformNodeByName('VFX_Chimney')!.dispose();
      const fx = createVfx(scene, world.slice(1));
      fx.update(60);
      expect(fx.snapshot().smoke).toHaveLength(0);
      expect(fx.snapshot().issues).toHaveLength(2);
      expect(fx.snapshot().foliage).toHaveLength(20);
      expect(fx.snapshot().water).toHaveLength(3);
      expect(fx.snapshot().time).toBe(.05);
      scene.dispose(); expect(fx.snapshot().disposed).toBe(true);
    } finally { warning.mockRestore(); scene.dispose(); engine.dispose(); }
  });
});
