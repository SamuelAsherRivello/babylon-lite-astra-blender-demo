import type { Scene } from '@babylonjs/core/scene';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { CreateIcoSphere } from '@babylonjs/core/Meshes/Builders/icoSphereBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { MirrorTexture } from '@babylonjs/core/Materials/Textures/mirrorTexture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Plane } from '@babylonjs/core/Maths/math.plane';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { advanceVfxTime, sampleSmoke, sampleWater, sampleWaterDetail, sampleWind, VFX } from './vfx-motion';

export const TREE_BINDINGS = [
  ['Blossom_tree', 4], ['Front_west_pear_tree', 4], ['Front_east_pear_tree', 4],
  ['East_spruce', 3], ['West_spruce', 3], ['Rear_spruce', 3],
] as const;

function flowTextures(scene: Scene, name: string) {
  const size = VFX.water.textureSize;
  const colors = new Uint8Array(size * size * 4), normals = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const detail = sampleWaterDetail(x / size, y / size);
    const shade = Math.round((.6 + .4 * detail.light) * 255);
    colors.set([shade, shade, shade, 255], (y * size + x) * 4);
    const n = new Vector3(-detail.dx, -detail.dy, 1).normalize();
    normals.set([Math.round((n.x + 1) * 127.5), Math.round((n.y + 1) * 127.5), Math.round((n.z + 1) * 127.5), 255], (y * size + x) * 4);
  }
  const create = (pixels: Uint8Array, suffix: string) => {
    const texture = RawTexture.CreateRGBATexture(pixels, size, size, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
    texture.name = `vfx-flow-${name}-${suffix}`; texture.gammaSpace = false;
    texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
    return texture;
  };
  return { color: create(colors, 'color'), normal: create(normals, 'normal') };
}

/** Owns environmental resources; update exactly once before scene.render(), never in a reflection callback. */
export function createVfx(scene: Scene, world: readonly AbstractMesh[]) {
  let time = 0, updates = 0, disposed = false;
  const issues: string[] = [];
  const unique = (name: string) => {
    const found = world.filter(mesh => mesh.name === name && mesh.getTotalVertices() > 0);
    if (found.length !== 1) { issues.push(`${name}: expected one mesh, found ${found.length}`); return undefined; }
    return found[0];
  };
  const foliage = TREE_BINDINGS.flatMap(([name, count], tree) => Array.from({ length: count }, (_, unit) => {
    const mesh = unique(`VFX_Foliage_${name}_${unit}`);
    if (!mesh) return [];
    mesh.computeWorldMatrix(true);
    return [{ mesh, tree, unit, position: mesh.position.clone(), rotation: mesh.rotation.clone(),
      quaternion: mesh.rotationQuaternion?.clone() ?? null,
      width: mesh.getBoundingInfo().boundingBox.extendSizeWorld.x * 2 }];
  }).flat());
  const waterMeshes = world.filter(m => m.name.startsWith('VFX_Water_'));
  const reflectList = scene.meshes.filter(m => m.getTotalVertices() > 0 && !waterMeshes.includes(m));
  const surfaces = ['River', 'FallSouth', 'FallNorth'].flatMap(name => {
    const mesh = unique(`VFX_Water_${name}_Water`), glints = unique(`VFX_Water_${name}_WaterLight`);
    if (!mesh || !glints) return [];
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;
    const river = name === 'River', south = name === 'FallSouth';
    // Clip positive distances: keep scenery above the river / on the exterior side of each fall.
    const plane = river ? new Plane(0, -1, 0, bounds.maximumWorld.y)
      : south ? new Plane(0, 0, -1, bounds.maximumWorld.z) : new Plane(0, 0, 1, -bounds.minimumWorld.z);
    const mirror = new MirrorTexture(`vfx-reflection-${name}`, river ? VFX.water.riverSize : VFX.water.fallSize, scene, true);
    mirror.mirrorPlane = plane;
    mirror.renderList = reflectList;
    mirror.level = VFX.water.reflection;
    mirror.refreshRate = 0; // Reset only while visible, below.
    const { color, normal } = flowTextures(scene, name);
    const tint = mesh.material instanceof PBRMaterial ? mesh.material.albedoColor.clone() : Color3.FromHexString('#7fc8d2').toLinearSpace();
    const materials = [mesh, glints].map((part, index) => {
      const original = part.material;
      const material = new PBRMaterial(`vfx-water-${name}-${index}`, scene);
      material.albedoColor = index && original instanceof PBRMaterial ? Color3.Lerp(tint, original.albedoColor, .08) : tint.clone();
      material.metallic = 0; material.roughness = VFX.water.roughness;
      material.metallicF0Factor = 2.5;
      material.backFaceCulling = false;
      material.reflectionTexture = mirror; material.bumpTexture = normal; material.albedoTexture = color;
      part.material = material;
      return { part, original, material };
    });
    let renders = 0;
    mirror.onAfterRenderObservable.add(() => { renders++; });
    return [{ name, mesh, plane, mirror, normal, color, materials, river, visible: false, renders: () => renders }];
  });
  const anchors = scene.transformNodes.filter(n => n.name === 'VFX_Chimney');
  if (anchors.length !== 1) issues.push(`VFX_Chimney: expected one anchor, found ${anchors.length}`);
  const anchor = anchors.length === 1 ? anchors[0] : undefined;
  anchor?.computeWorldMatrix(true);
  const origin = anchor?.getAbsolutePosition().clone() ?? Vector3.Zero();
  const puffs = anchor ? Array.from({ length: VFX.smoke.count }, (_, i) => {
    const mesh = CreateIcoSphere(`vfx-smoke-${i}`, { radius: 1, subdivisions: 2, flat: false }, scene);
    const material = new StandardMaterial(`vfx-smoke-material-${i}`, scene);
    material.diffuseColor = Color3.FromHexString('#edece4');
    material.specularColor = Color3.Black();
    material.alpha = 0;
    mesh.material = material; mesh.isPickable = false;
    return { mesh, material };
  }) : [];
  if (issues.length) console.warn('Village VFX binding mismatch:', issues.join('; '));
  const tilt = new Quaternion();
  function pose() {
    for (const f of foliage) {
      const motion = sampleWind(time, f.tree, f.unit);
      f.mesh.position.copyFrom(f.position).addInPlaceFromFloats(motion.x * f.width, 0, motion.z * f.width);
      Quaternion.RotationYawPitchRollToRef(0, motion.roll * .3, motion.roll, tilt);
      if (f.quaternion) {
        f.mesh.rotationQuaternion ??= Quaternion.Identity();
        f.quaternion.multiplyToRef(tilt, f.mesh.rotationQuaternion);
      } else f.mesh.rotation.set(f.rotation.x + motion.roll * .3, f.rotation.y, f.rotation.z + motion.roll);
    }
    puffs.forEach(({ mesh, material }, i) => {
      const p = sampleSmoke(time, i);
      mesh.position.set(origin.x + p.x, origin.y + p.y, origin.z + p.z);
      mesh.scaling.setAll(p.radius); material.alpha = p.alpha;
    });
    for (const s of surfaces) s.color.vOffset = s.normal.vOffset = sampleWater(time, s.river).offset;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const f of foliage) {
      f.mesh.position.copyFrom(f.position); f.mesh.rotation.copyFrom(f.rotation);
      f.mesh.rotationQuaternion = f.quaternion?.clone() ?? null;
    }
    for (const s of surfaces) {
      for (const m of s.materials) { m.part.material = m.original; m.material.dispose(); }
      s.mirror.dispose(); s.normal.dispose(); s.color.dispose();
    }
    for (const p of puffs) { p.mesh.dispose(); p.material.dispose(); }
    scene.onDisposeObservable.remove(onDispose);
  }
  const onDispose = scene.onDisposeObservable.add(dispose);
  pose();
  return {
    update(delta: number) {
      if (disposed) return;
      time = advanceVfxTime(time, delta); updates++; pose();
      const camera = scene.activeCamera;
      for (const s of surfaces) {
        // The island hides the back of each fall; refresh its reflection only from the exterior side.
        s.visible = !camera || (s.plane.signedDistanceTo(camera.globalPosition) < 0 && camera.isInFrustum(s.mesh));
        if (s.visible) s.mirror.resetRefreshCounter();
      }
    },
    dispose,
    snapshot: () => ({ time, updates, disposed, issues, origin: origin.asArray(),
      foliage: foliage.map(f => ({ name: f.mesh.name, tree: f.tree, position: f.mesh.position.asArray(), rest: f.position.asArray(), width: f.width })),
      smoke: puffs.map((p, i) => ({ ...sampleSmoke(time, i), position: p.mesh.position.asArray() })),
      water: surfaces.map(s => ({ name: s.name, plane: s.plane.asArray(), size: s.mirror.getSize().width, renders: s.renders(), visible: s.visible, flow: s.normal.vOffset,
        colorFlow: s.color.vOffset, period: sampleWater(time, s.river).period, textureSize: s.color.getSize().width,
        texturedParts: s.materials.filter(m => m.part.material === m.material && m.material.albedoTexture === s.color && m.material.bumpTexture === s.normal).length,
        reflectionMeshes: s.mirror.renderList?.length, recursive: s.mirror.renderList?.some(m => waterMeshes.includes(m)) })),
    }),
  };
}
