export interface Point { x: number; z: number }
export type Obstacle = { id: string; type: 'box'; minX: number; maxX: number; minZ: number; maxZ: number }
  | { id: string; type: 'circle'; x: number; z: number; radius: number };
export interface Navigation {
  version: 1; groundY: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  walkablePolygon: [number, number][];
  spawn: Point; characterRadius: number; obstacles: Obstacle[];
}

function segmentDistance(p: Point, a: number[], b: number[]) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a[0] - t * dx, p.z - a[1] - t * dz);
}

export function isWalkable(p: Point, nav: Navigation): boolean {
  const r = nav.characterRadius, b = nav.bounds;
  if (p.x < b.minX + r || p.x > b.maxX - r || p.z < b.minZ + r || p.z > b.maxZ - r) return false;
  let inside = false;
  for (let i = 0, j = nav.walkablePolygon.length - 1; i < nav.walkablePolygon.length; j = i++) {
    const a = nav.walkablePolygon[i], b = nav.walkablePolygon[j];
    if (segmentDistance(p, a, b) < r - 1e-8) return false;
    if ((a[1] > p.z) !== (b[1] > p.z) && p.x < (b[0] - a[0]) * (p.z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside && !nav.obstacles.some(o => o.type === 'circle'
    ? Math.hypot(p.x - o.x, p.z - o.z) < o.radius + r
    : Math.hypot(p.x - Math.max(o.minX, Math.min(o.maxX, p.x)), p.z - Math.max(o.minZ, Math.min(o.maxZ, p.z))) < r);
}

export function moveOnGround(position: Point, velocity: Point, seconds: number, nav: Navigation): Point {
  const dt = Math.max(0, Math.min(seconds, 0.1));
  const distance = Math.hypot(velocity.x, velocity.z) * dt;
  const steps = Math.max(1, Math.ceil(distance / Math.min(nav.characterRadius / 2, 0.04)));
  const dx = velocity.x * dt / steps, dz = velocity.z * dt / steps;
  let p = { x: position.x, z: position.z };
  for (let i = 0; i < steps; i++) {
    const next = { x: p.x + dx, z: p.z + dz };
    if (isWalkable(next, nav)) p = next;
    else {
      const x = { x: p.x + dx, z: p.z };
      if (isWalkable(x, nav)) p = x;
      const z = { x: p.x, z: p.z + dz };
      if (isWalkable(z, nav)) p = z;
    }
  }
  return p;
}

export function validateNavigation(value: unknown): Navigation {
  const n = value as Navigation;
  const finite = (...values: unknown[]) => values.every(v => typeof v === 'number' && Number.isFinite(v));
  if (!n || n.version !== 1 || !finite(n.groundY, n.characterRadius) || n.characterRadius <= 0 ||
      !n.bounds || !finite(n.bounds.minX, n.bounds.maxX, n.bounds.minZ, n.bounds.maxZ) ||
      !n.spawn || !finite(n.spawn.x, n.spawn.z) || !Array.isArray(n.walkablePolygon) || n.walkablePolygon.length < 3 ||
      !n.walkablePolygon.every(p => Array.isArray(p) && p.length === 2 && finite(...p)) ||
      !Array.isArray(n.obstacles) || !n.obstacles.every(o => o && (o.type === 'box'
        ? finite(o.minX, o.maxX, o.minZ, o.maxZ) && o.minX <= o.maxX && o.minZ <= o.maxZ
        : o.type === 'circle' && finite(o.x, o.z, o.radius) && o.radius >= 0))) {
    throw new Error('The village navigation does not match the asset contract.');
  }
  if (!isWalkable(n.spawn, n)) throw new Error('The village spawn has insufficient clearance.');
  return n;
}
