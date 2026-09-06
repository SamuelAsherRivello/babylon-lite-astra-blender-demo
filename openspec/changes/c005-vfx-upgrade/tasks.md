## 1. World effect bindings

- [x] 1.1 C005-T001 Update `assets/blender/world/create_world.py` to preserve all 21 foliage units across six trees, three water surface groups with flow UVs, and a chimney emitter anchor while retaining static material batching; verify exported names, pivots, membership, and anchor alignment through GLB inspection and document the exact interface in `docs/asset-contract.md`.
- [x] 1.2 C005-T002 Extend `assets/blender/world/verify_world.py` to validate effect bindings and stationary non-foliage classification, regenerate the world delivery using `npm run blender -- --background --factory-startup --python assets/blender/world/create_world.py`, and run the corresponding verifier command; record unchanged navigation content and rest geometry, coordinate checks, triangle/file budgets, updated preview, and validation report in `docs/coordination/C002-world.md`.

## 2. Runtime effect foundation

- [x] 2.1 C005-T003 Add a focused effects controller and central tuning configuration under `src/`, with one elapsed-time update per game frame and owned resource disposal integrated into `src/main.ts`; verify missing-binding degradation, update counts across reflection passes, long-frame recovery, and repeated initialization/disposal with focused tests and development diagnostics.
- [x] 2.2 C005-T004 Implement bounded age-based smoke and rest-relative foliage motion calculations; verify equivalent active-time samples at different frame intervals, puff count/opacity/height bounds, recycling transitions, and long-run wind bounds with deterministic tests.

## 3. Environmental effects

- [x] 3.1 C005-T005 Implement turquoise water materials with existing sun lighting and correctly oriented, filtered scene-reflection targets for the river and both waterfalls; verify camera-dependent sheen and reflected scenery from multiple orbit angles, moving-object reflection updates, reflection-target limits, and absence of recursive feedback in the browser.
- [x] 3.2 C005-T006 Add a locally generated tileable normal texture and gentle downstream flow, with downward waterfall motion and compatible existing glints; verify flow direction and continuity over time, correct surface mapping, and preserved turquoise color in close and default camera views.
- [x] 3.3 C005-T007 Implement the reusable pool of softly faceted smoke puffs at the authored chimney anchor; verify 3–10 visible puffs, slow rise and fade within approximately half a cottage height above the opening, smooth recycling, and correct depth occlusion over multiple lifetimes and camera angles.
- [x] 3.4 C005-T008 Apply correlated slow wind to the 21 foliage units, with per-tree variation and bounded displacement from rest; verify all six trees move subtly while trunks, branches, tower roofs, and unrelated decorations remain stationary, including visible shadow alignment.

## 4. Integrated verification and playtest handoff

- [x] 4.1 C005-T009 Extend dedicated browser verification alongside `tests/gameplay.browser.cjs` to cover effect visibility, camera-dependent reflections, motion over time, pause/resume, and reload cleanup; run installed Chrome and Edge with WebGPU when supported and explicit WebGL fallback, recording actual engine/browser coverage and restoring viewport/emulation/input state in finally blocks.
- [x] 4.2 C005-T010 Run foreground production performance checks with at least five seconds of warmup and 30 seconds of idle/orbit/movement sampling, plus a matched effects-disabled baseline; record hardware, browser, renderer, viewport/DPR, settings, average fps, median/p95 frame intervals, and stalls, then tune reflection resolution/render lists/draw calls toward 60 fps while retaining all agreed effects and report any remaining shortfall.
- [x] 4.3 C005-T011 Run `npm run check` and `npm run spec:validate`, repeat asset verification if asset changes followed its earlier run, and exercise existing movement, collision, mouse/touch camera controls, default framing, mobile portrait/landscape viewport fit, and centering; record pass/fail evidence and distinguish emulation from physical-device coverage.
- [x] 4.4 C005-T012 Deliver `docs/coordination/C005-vfx.md` with final tuning values, binding and resource counts, commands/results, visual evidence, performance measurements, and coverage limitations; start or confirm the local demo and provide its live URL for user playtesting, retaining both sunlight sheen and real scene reflections in that first result.

## Verification evidence

Completed 2026-09-06. Evidence and reproducible commands: `docs/coordination/C005-vfx.md`. Blender rebuild/reimport, all 21 foliage pivots, three UV-mapped water groups, emitter alignment, geometry equivalence and unchanged navigation hash passed. All 20 automated tests, TypeScript, production build and strict validation of all five changes passed. Chrome 152.0.7977.77 and Edge 152.0.4191.66 passed VFX/gameplay checks on both WebGPU and WebGL with zero console errors and restored viewports. Optimized 30-second foreground measurements: Chrome/WebGPU 58.90 fps enabled versus 60.00 disabled; Edge/WebGL 60.00 fps enabled and disabled. Both enabled paths had 16.9 ms p95 frame times; Chrome had three stalls over 50 ms. Physical mobile performance remains unmeasured. Live playtest: http://127.0.0.1:5173/.
