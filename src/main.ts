import { Engine } from '@babylonjs/core/Engines/engine';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { selectEngine } from './engine-selection';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')!;
const status = document.querySelector<HTMLElement>('#status')!;

async function start() {
  const { engine, renderer } = await selectEngine({
    supportsWebGPU: () => WebGPUEngine.IsSupportedAsync,
    createWebGPU: () => new WebGPUEngine(canvas, { antialias: true }),
    createWebGL: () => new Engine(canvas, true),
  });
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new Color4(0.13, 0.16, 0.24, 1);
  const camera = new ArcRotateCamera('camera', -Math.PI / 3, Math.PI / 2.7, 4.5, new Vector3(0, 0.5, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 8;
  new HemisphericLight('light', new Vector3(0.5, 1, 0.3), scene);
  const cube = CreateBox('setup-cube', { size: 1 }, scene);
  cube.position.y = 0.5;
  const material = new StandardMaterial('setup-material', scene);
  material.diffuseColor = Color3.FromHexString('#efb696');
  material.specularColor = Color3.Black();
  cube.material = material;
  status.textContent = `${renderer} ready · Drag to inspect`;
  canvas.dataset.renderer = renderer;
  engine.runRenderLoop(() => scene.render());
  const resize = new ResizeObserver(() => engine.resize());
  resize.observe(canvas);
  engine.resize();
  import.meta.hot?.dispose(() => { resize.disconnect(); scene.dispose(); engine.dispose(); });
}

start().catch((error: unknown) => {
  console.error('Renderer startup failed', error);
  status.textContent = 'The 3D renderer could not start. Try a browser with hardware acceleration enabled.';
});
