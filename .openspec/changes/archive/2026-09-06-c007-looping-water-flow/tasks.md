## 1. Establish water flow behavior

- [x] 1.1 C007 Capture the current water appearance and foreground performance in a dedicated browser session before editing; verify all six water bindings and imported river/fall UV directions, and record browser, renderer, viewport and baseline evidence while preserving current C006 edits.
- [x] 1.2 C007 Add focused tests and implement normalized water phase/direction sampling in `CITRUS_WORLD/src/vfx-motion.ts`; verify full-period equivalence, rollover continuity of sampled periodic detail, river +Z/falls -Y travel, faster fall cycles, equivalent 30/60/120 fps timing, and invalid/stalled delta handling.

## 2. Render the looping surface detail

- [x] 2.1 C007 Generate small periodic color and related normal textures in `CITRUS_WORLD/src/vfx.ts`, attach them to both materials in each water pair and advance their shared phase through the existing update; verify wrapping, texture alignment, no per-frame resource allocation and unchanged reflection target counts.
- [x] 2.2 C007 Tune the WaterLight contrast and flow pattern at initial framing and orbit views; verify visible motion within five seconds, a gentle river current, downward faster flow on both falls, preserved turquoise/reflections and no gaps, flashing lip seams or detail outside water bounds.
- [x] 2.3 C007 Extend resource ownership and QA snapshot coverage for the new textures; verify lifecycle tests release owned textures exactly once, restore original materials and do not duplicate effects or updates after reinitialization.

## 3. Verify and document the result

- [x] 3.5 C007 Add and verify an event-driven Sleeping overlay for blur/hidden states, zero active render callbacks and frozen game state while asleep, clean input and smooth single-loop wake-up; document the retained scene memory before the requested sync and archive.

- [x] 3.0 C007 Reproduce startup flicker with a deliberately delayed game entry, load the stylesheet from the document head, and verify that Chrome and Edge display styled 2D elements with unchanged geometry before and after initialization.
- [x] 3.4 C007 Profile Chrome rendering, optimize toward 60 fps with all effects active, and report comparable before/after frame rates and frame intervals, including any remaining shortfall.

- [x] 3.1 C007 Extend the VFX browser checks to cover actual textured bindings and rendered direction/continuity, then run dedicated installed Chrome and Edge sessions on WebGPU and forced WebGL where available; capture and inspect at least two complete cycles per surface, including rollover frames, and record unavailable coverage explicitly. Restore and verify viewport/input/emulation/focus state in `finally`.
- [x] 3.2 C007 Run `npm --prefix CITRUS_WORLD run check` and existing gameplay/VFX browser checks; verify movement, camera framing, reflections, smoke, foliage and suspension/resume behavior remain intact, and compare foreground fps and median/p95 frame intervals to the pre-change baseline with all effects active.
- [x] 3.3 C007 Update `CITRUS_WORLD/documentation/asset-contract.md` with the runtime texture/UV behavior and deliver `CITRUS_WORLD/documentation/coordination/C007-water-flow.md` containing tuning, commands/results and visual/performance evidence; verify documentation matches the final implementation and run `npm --prefix CITRUS_WORLD run spec -- validate c007-looping-water-flow --strict`.
