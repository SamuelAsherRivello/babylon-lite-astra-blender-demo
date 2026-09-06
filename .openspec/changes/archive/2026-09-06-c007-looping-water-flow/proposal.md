## Why

The user wants water texture motion that visibly loops along the horizontal river and vertical waterfalls. C005 already scrolls a procedural normal map, but its bright river glints and waterfall ribbons are static geometry, so changing a texture offset alone does not establish that the current is visually readable.

## What Changes

- Add a clearly visible, seamless repeating surface pattern that follows the river length and travels downward on both waterfalls.
- Coordinate color detail and ripple motion so the water reads as flowing, with a gentle horizontal current and faster falling water.
- Preserve turquoise water, sunlight sheen, actual scene reflections, authored surface silhouettes, navigation, camera settings, smoke and foliage behavior.
- Verify actual rendered motion and loop boundaries, in addition to numeric texture offsets, on WebGPU and WebGL fallback.
- Optimize Chrome toward 60 fps using measured rendering costs, and report comparable before/after results with all effects active.
- Prevent unstyled 2D controls and headings from flashing or changing layout during initial loading by loading CSS before the game entry script.
- Sleep when the game loses focus: subtly darken the entire page, show centered "Sleeping", stop the game render loop and resume smoothly on focus. The user accepted current FPS and requested no further tuning.

## Capabilities

### New Capabilities

- `looping-water-flow`: Visible directional texture flow, seamless repetition and compatible resource ownership for the existing river and two waterfalls. This supplements C005's pending `village-vfx` capability; there is currently no active main spec for it. C005 remains unchanged.

### Modified Capabilities

None.

## Impact

- Runtime: `CITRUS_WORLD/src/vfx.ts` and `src/vfx-motion.ts`, using the existing water bindings, projected UV contract and one update per render frame.
- Verification: existing VFX unit, lifecycle and browser checks, plus recorded views covering horizontal water, both falls and loop rollover.
- Documentation: water appearance and verification notes under `CITRUS_WORLD/documentation/`. No new package, external image service or shader dependency is planned.
- C006 is actively relocating project/tooling files. Work uses the observed `CITRUS_WORLD/` application home and canonical `.openspec/` planning home, and must preserve concurrent migration edits.
