## Why

The village already meets the intended visual style, but its water, chimney, and trees remain static. C005 VFX upgrade adds restrained environmental motion and reflective water so the scene feels like a living picture while targeting 60 fps.

## What Changes

- Add sunlight sheen and real scene reflections to the blue water, with a gently flowing downstream ripple pattern and preserved turquoise color.
- Emit softly faceted chimney smoke: 3–10 visible puffs, moving slowly and fading out approximately half a cottage height above the chimney opening.
- Add barely perceptible wind movement to the leafy crowns and spruce tiers of all six trees; keep trunks and branches stationary.
- Preserve independently addressable foliage and water surfaces in the Blender export, plus an explicit chimney emitter anchor, without changing the village composition or navigation.
- Run effects smoothly with elapsed time and a 60 fps game target. The earlier 30 fps smoke request is superseded; there is no stop-motion cadence.
- Verify the effects and their performance in the browser and make their intensity easy to tune after user playtesting. Include both sunlight sheen and scene reflections in the first implementation.

## Capabilities

### New Capabilities

- `village-vfx`: Reflective flowing water, subtle chimney smoke and foliage wind, effect asset bindings, lifecycle behavior, and performance verification.

### Modified Capabilities

None. The existing village composition and portrait gameplay requirements remain intact. No main specs currently exist under `openspec/specs/`; the completed C002 and C004 change specs supply the compatibility baseline.

## Impact

- World authoring/export: `assets/blender/world/create_world.py`, `verify_world.py`, generated world assets and validation report, and `public/assets/world/world.glb`.
- Runtime: a focused effects module under `src/`, integration in `src/main.ts`, and use of the existing sunlight, camera, scene, and disposal lifecycle.
- Verification: focused effects tests and dedicated browser checks alongside existing gameplay and asset verification.
- Documentation: the asset contract and world handoff will describe the new bindings and measured delivery results.
- Use the existing Babylon.js core/loaders dependencies. No additional package, UI, gameplay feature, lighting overhaul, or engine migration is proposed.
