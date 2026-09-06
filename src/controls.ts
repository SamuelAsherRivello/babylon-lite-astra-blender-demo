import type { Point } from './navigation';

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function normalizeInput(x: number, y: number) {
  const length = Math.max(1, Math.hypot(x, y));
  return { x: x / length, y: y / length };
}

// Screen up points from the camera toward the center. Screen right is its RH perpendicular.
export function cameraRelative(input: { x: number; y: number }, camera: Point): Point {
  const size = Math.hypot(camera.x, camera.z) || 1;
  const forward = { x: -camera.x / size, z: -camera.z / size };
  const unit = normalizeInput(input.x, input.y);
  return { x: -forward.z * unit.x + forward.x * unit.y, z: forward.x * unit.x + forward.z * unit.y };
}

export const CAMERA = { minRadius: 12, maxRadius: 27, minBeta: 0.55, maxBeta: 1.23, target: { x: 0, y: 0, z: 0 } };
export function constrainCamera(alpha: number, beta: number, radius: number) {
  return { alpha, beta: clamp(beta, CAMERA.minBeta, CAMERA.maxBeta), radius: clamp(radius, CAMERA.minRadius, CAMERA.maxRadius), target: { ...CAMERA.target } };
}

export function bindControls(canvas: HTMLCanvasElement, joystick: HTMLElement, knob: HTMLElement,
  orbit: (dx: number, dy: number) => void, zoom: (delta: number) => void) {
  const abort = new AbortController(), signal = abort.signal;
  const keys = new Set<string>();
  let stick = { x: 0, y: 0 }, stickPointer: number | undefined;
  let worldPointer: number | undefined, previous = { x: 0, y: 0 };
  const resetStick = () => { stickPointer = undefined; stick = { x: 0, y: 0 }; knob.style.transform = ''; joystick.classList.remove('active'); };
  const clear = () => { keys.clear(); resetStick(); worldPointer = undefined; };
  const keyName = (e: KeyboardEvent) => e.code.replace('Key', '').toLowerCase();
  window.addEventListener('keydown', e => {
    if (['w', 'a', 's', 'd'].includes(keyName(e)) && !(e.target instanceof HTMLInputElement) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      keys.add(keyName(e)); e.preventDefault();
    }
  }, { signal });
  window.addEventListener('keyup', e => keys.delete(keyName(e)), { signal });
  window.addEventListener('blur', clear, { signal });
  window.addEventListener('resize', clear, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); }, { signal });
  const updateStick = (e: PointerEvent) => {
    const rect = joystick.getBoundingClientRect(), radius = rect.width * 0.3;
    const vector = normalizeInput((e.clientX - rect.left - rect.width / 2) / radius, (e.clientY - rect.top - rect.height / 2) / radius);
    const magnitude = Math.hypot(vector.x, vector.y);
    stick = magnitude < 0.12 ? { x: 0, y: 0 } : { x: vector.x, y: -vector.y };
    knob.style.transform = `translate(${vector.x * radius}px, ${vector.y * radius}px)`;
  };
  joystick.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    if (stickPointer !== undefined || e.button !== 0) return;
    stickPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); joystick.classList.add('active'); updateStick(e);
  }, { signal });
  joystick.addEventListener('pointermove', e => { if (e.pointerId === stickPointer) { e.preventDefault(); updateStick(e); } }, { signal });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    joystick.addEventListener(event, e => { if (e.pointerId === stickPointer) resetStick(); }, { signal });
    canvas.addEventListener(event, e => { if (e.pointerId === worldPointer) worldPointer = undefined; }, { signal });
  }
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || worldPointer !== undefined) return;
    e.preventDefault(); canvas.focus({ preventScroll: true }); worldPointer = e.pointerId;
    previous = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId);
  }, { signal });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== worldPointer) return;
    orbit(e.clientX - previous.x, e.clientY - previous.y); previous = { x: e.clientX, y: e.clientY };
  }, { signal });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1) * 0.012); }, { passive: false, signal });
  canvas.addEventListener('contextmenu', e => e.preventDefault(), { signal });
  return {
    read: () => normalizeInput(Number(keys.has('d')) - Number(keys.has('a')) + stick.x, Number(keys.has('w')) - Number(keys.has('s')) + stick.y),
    clear,
    dispose: () => { clear(); abort.abort(); },
  };
}
