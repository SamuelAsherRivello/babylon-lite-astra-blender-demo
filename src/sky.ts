import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { Scene } from '@babylonjs/core/scene';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
function hash(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const tx = smooth(x - ix), ty = smooth(y - iy), tz = smooth(z - iz);
  const layer = (dz: number) => mix(
    mix(hash(ix, iy, iz + dz), hash(ix + 1, iy, iz + dz), tx),
    mix(hash(ix, iy + 1, iz + dz), hash(ix + 1, iy + 1, iz + dz), tx), ty);
  return mix(layer(0), layer(1), tz);
}

/** Direction-space sampling makes the panorama continuous at its seam and poles. */
export function skyColor(x: number, y: number, z: number): [number, number, number] {
  const upper = smooth(Math.max(0, y));
  const lower = smooth(Math.max(0, -y));
  const base = [mix(225, 203, upper), mix(234, 224, upper), mix(232, 234, upper)];
  base[0] = mix(base[0], 230, lower);
  base[1] = mix(base[1], 232, lower);
  base[2] = mix(base[2], 235, lower);
  const a = noise(x * 4 + 12, y * 8 + 5, z * 4 + 19);
  const b = noise(x * 9 + 8, y * 17 + 21, z * 9 + 3);
  const c = noise(x * 18 + 4, y * 30 + 13, z * 18 + 7);
  const density = a * 0.67 + b * 0.24 + c * 0.09;
  const cloud = smooth(Math.max(0, Math.min(1, (density - 0.48) / 0.22))) * 0.68;
  return base.map((value, i) => Math.round(mix(value, [250, 249, 243][i], cloud))) as [number, number, number];
}

export function addSky(scene: Scene) {
  const width = 1024, height = 512;
  const pixels = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    const latitude = row / (height - 1) * Math.PI;
    const y = Math.cos(latitude), ring = Math.sin(latitude);
    for (let column = 0; column < width; column++) {
      const longitude = column / (width - 1) * Math.PI * 2;
      const color = skyColor(ring * Math.cos(longitude), y, ring * Math.sin(longitude));
      const offset = (row * width + column) * 4;
      pixels.set(color, offset); pixels[offset + 3] = 255;
    }
  }
  const texture = RawTexture.CreateRGBATexture(pixels, width, height, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
  texture.name = 'soft-cloud-panorama';
  texture.wrapU = Texture.WRAP_ADDRESSMODE; texture.wrapV = Texture.CLAMP_ADDRESSMODE;
  const material = new StandardMaterial('soft-sky-material', scene);
  material.disableLighting = true;
  material.emissiveColor = Color3.Black();
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();
  material.emissiveTexture = texture;
  material.disableDepthWrite = true;
  const sky = CreateSphere('sky-360', { diameter: 120, segments: 32, sideOrientation: Mesh.BACKSIDE }, scene);
  sky.material = material;
  sky.infiniteDistance = true;
  sky.isPickable = false;
  sky.applyFog = false;
  // This sphere has sky in every direction. It never joins navigation or shadows.
  return sky;
}
