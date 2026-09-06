import { Engine } from '@babylonjs/core/Engines/engine';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import { selectEngine } from './engine-selection';
import { bindControls, cameraRelative, constrainCamera } from './controls';
import { isWalkable, moveOnGround, validateNavigation } from './navigation';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')!;
const status = document.querySelector<HTMLElement>('#status')!;
const loading = document.querySelector<HTMLElement>('#loading')!;
const initialView = { alpha: 0.96, beta: 0.96, radius: 26.5 };
const base = import.meta.env.BASE_URL;
let dispose = () => {};

async function start() {
  const { engine, renderer } = await selectEngine({
    supportsWebGPU: () => WebGPUEngine.IsSupportedAsync,
    createWebGPU: () => new WebGPUEngine(canvas, { antialias: true }),
    createWebGL: () => new Engine(canvas, true),
  });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = Color4.FromHexString('#e7ede4ff');
  scene.ambientColor = Color3.FromHexString('#fff5df');
  const camera = new ArcRotateCamera('village-camera', initialView.alpha, initialView.beta, initialView.radius, Vector3.Zero(), scene);
  camera.minZ = 0.1; camera.maxZ = 100; camera.fov = 0.72;
  // All gestures are owned by bindControls; default inputs would permit panning.
  camera.inputs.clear();
  const applyCamera = () => {
    const state = constrainCamera(camera.alpha, camera.beta, camera.radius);
    camera.alpha = state.alpha; camera.beta = state.beta; camera.radius = state.radius;
    camera.setTarget(Vector3.Zero());
  };
  const zoom = (delta: number) => { camera.radius += delta; applyCamera(); };
  const inputs = bindControls(canvas, document.querySelector('#joystick')!, document.querySelector('#joystick-knob')!,
    (dx, dy) => { camera.alpha += dx * 0.007; camera.beta -= dy * 0.006; applyCamera(); }, zoom);
  const domEvents = new AbortController();
  document.querySelector('#zoom-in')!.addEventListener('click', () => zoom(-1.5), { signal: domEvents.signal });
  document.querySelector('#zoom-out')!.addEventListener('click', () => zoom(1.5), { signal: domEvents.signal });
  document.querySelector('#reset-view')!.addEventListener('click', () => { Object.assign(camera, initialView); applyCamera(); }, { signal: domEvents.signal });
  const hemi = new HemisphericLight('sky', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.85; hemi.groundColor = Color3.FromHexString('#a7ba9b');
  const sun = new DirectionalLight('sun', new Vector3(-0.6, -1, 0.4), scene);
  sun.position = new Vector3(8, 15, -8); sun.intensity = 2.1;
  sun.diffuse = Color3.FromHexString('#fff3dc');
  const shadow = new ShadowGenerator(2048, sun);
  shadow.usePercentageCloserFiltering = true; shadow.bias = 0.001; shadow.normalBias = 0.03; shadow.darkness = 0.2;
  const resize = new ResizeObserver(() => { inputs.clear(); engine.resize(); });
  resize.observe(canvas);
  dispose = () => { resize.disconnect(); inputs.dispose(); domEvents.abort(); scene.dispose(); engine.dispose(); delete (window as Window & { __littleCitrus?: unknown }).__littleCitrus; };

  const navResponse = await fetch(`${base}assets/world/world.navigation.json`);
  if (!navResponse.ok) throw new Error(`Village navigation failed to load (${navResponse.status}).`);
  const nav = validateNavigation(await navResponse.json());
  const [world, character] = await Promise.all([
    LoadAssetContainerAsync(`${base}assets/world/world.glb`, scene),
    LoadAssetContainerAsync(`${base}assets/character/character.glb`, scene),
  ]);
  world.addAllToScene(); character.addAllToScene();
  const player = new TransformNode('player', scene);
  for (const node of character.rootNodes) node.parent = player;
  player.position.set(nav.spawn.x, nav.groundY, nav.spawn.z);
  // Face the initial view for a welcoming first impression; asset +Z stays uncompensated.
  player.rotation.y = Math.atan2(Math.cos(initialView.alpha), Math.sin(initialView.alpha));
  const idle = character.animationGroups.find(g => g.name === 'Idle');
  const walk = character.animationGroups.find(g => g.name === 'Walk');
  if (!idle || !walk) throw new Error('The character needs Idle and Walk animation clips.');
  character.animationGroups.forEach(g => g.stop());
  let animation = 'Idle'; idle.start(true);
  for (const mesh of [...world.meshes, ...character.meshes]) {
    mesh.receiveShadows = true;
    if (mesh.getTotalVertices() > 0) shadow.addShadowCaster(mesh, false);
  }
  await scene.whenReadyAsync();
  loading.hidden = true; status.textContent = 'Your little world is ready.';
  canvas.dataset.renderer = renderer; canvas.dataset.ready = 'true';
  if (import.meta.env.DEV) {
    (window as Window & { __littleCitrus?: unknown }).__littleCitrus = { snapshot: () => ({
      renderer, player: { x: player.position.x, y: player.position.y, z: player.position.z, yaw: player.rotation.y },
      animation, clips: character.animationGroups.map(g => ({ name: g.name, playing: g.isPlaying })),
      camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target.asArray() },
      input: inputs.read(), safe: isWalkable(player.position, nav), meshes: world.meshes.length,
    }) };
  }
  engine.resize();
  engine.runRenderLoop(() => {
    const direction = cameraRelative(inputs.read(), camera.position);
    const next = moveOnGround(player.position, { x: direction.x * 2, z: direction.z * 2 }, engine.getDeltaTime() / 1000, nav);
    const dx = next.x - player.position.x, dz = next.z - player.position.z;
    const moving = Math.hypot(dx, dz) > 0.00001;
    if (moving) player.rotation.y = Math.atan2(dx, dz);
    player.position.set(next.x, nav.groundY, next.z);
    const desired = moving ? 'Walk' : 'Idle';
    if (desired !== animation) {
      (moving ? idle : walk).stop(); (moving ? walk : idle).start(true); animation = desired;
    }
    applyCamera(); scene.render();
  });
}

start().catch((error: unknown) => {
  dispose();
  console.error('Village startup failed', error);
  loading.hidden = false;
  status.textContent = 'This little world could not load. Please try again.';
  const retry = document.querySelector<HTMLButtonElement>('#retry')!;
  retry.hidden = false; retry.addEventListener('click', () => window.location.reload());
});
import.meta.hot?.dispose(() => dispose());
