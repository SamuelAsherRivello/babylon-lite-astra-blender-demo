/** Shared tuning for the living-picture effects. Times are seconds, distances meters. */
export const VFX = {
  smoke: { count: 8, lifetime: 5.5, height: 2.1, opacity: .48 },
  wind: { travel: .018, angle: .009 },
  water: { riverSize: 512, fallSize: 256, speed: .035, fallSpeed: .085, roughness: .23, reflection: .8 },
} as const;

export function advanceVfxTime(time: number, delta: number) {
  return time + (Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0);
}
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };

export function sampleSmoke(time: number, index: number) {
  const age = ((time / VFX.smoke.lifetime + index / VFX.smoke.count) % 1 + 1) % 1;
  const radius = .10 + age * .15;
  return {
    age, radius, y: radius + age * (VFX.smoke.height - 2 * radius),
    x: age * .14 + Math.sin(age * 4 + index * 2.4) * .045 * age,
    z: Math.sin(age * 3 + index * 1.7) * .075 * age,
    alpha: VFX.smoke.opacity * smooth(age / .13) * (1 - smooth((age - .52) / .48)),
  };
}

export function sampleWind(time: number, tree: number, unit: number) {
  const phase = time * (Math.PI * 2 / (6 + tree * .47)) + tree * 1.73;
  const wave = Math.sin(phase) * .8 + Math.sin(phase * 1.37 + unit * .43) * .2;
  return { x: wave * VFX.wind.travel, z: wave * VFX.wind.travel * .45, roll: wave * VFX.wind.angle };
}
