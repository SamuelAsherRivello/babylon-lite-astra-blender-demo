import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('shipped water UV contract', () => {
  it('confirms all six shipped GLB water bindings project world coordinates onto the same UV axes', () => {
    const bytes = readFileSync(new URL('../public/assets/world/world.glb', import.meta.url));
    const jsonEnd = 20 + bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, jsonEnd).toString());
    const binStart = jsonEnd + 8;
    const read = (id, components) => {
      const a = gltf.accessors[id], view = gltf.bufferViews[a.bufferView];
      expect(a.componentType).toBe(5126);
      return Array.from({ length: a.count }, (_, i) => Array.from({ length: components }, (_, axis) =>
        bytes.readFloatLE(binStart + (view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (view.byteStride ?? components * 4) + axis * 4)));
    };
    const water = gltf.nodes.filter((n) => n.name?.startsWith('VFX_Water_'));
    expect(water).toHaveLength(6);
    for (const node of water) {
      expect(node.rotation).toBeUndefined(); expect(node.scale).toBeUndefined(); expect(node.matrix).toBeUndefined();
      const along = node.name.includes('_River_') ? 2 : 1;
      for (const primitive of gltf.meshes[node.mesh].primitives) {
        const positions = read(primitive.attributes.POSITION, 3), uv = read(primitive.attributes.TEXCOORD_0, 2);
        for (let i = 0; i < positions.length; i++) {
          expect(uv[i][0]).toBeCloseTo((positions[i][0] + node.translation[0]) * .8, 5);
          expect(uv[i][1]).toBeCloseTo((positions[i][along] + node.translation[along]) * .8, 5);
        }
      }
    }
  });
});
