# C005 VFX upgrade

> Historical record from before C006: command paths and measurements below retain their original context. For current commands, use `CITRUS_WORLD/` as the application working directory and `documentation/` in place of `docs/`. See [C006 migration](../coordination/C006-structure.md).

The village now has sunlight sheen and scene reflections on gently flowing water, a small chimney plume, and subtle wind on all six trees. The first playtest retains all requested effects. Local demo: http://127.0.0.1:5173/.

## Implementation and tuning

`src/vfx.ts` binds the exported scene, owns the effects, and updates once before each game render. `src/vfx-motion.ts` holds the tuning and elapsed-time motion. The controller restores original materials/transforms and releases its textures, targets, puffs, and observer on disposal. Missing bindings produce a diagnostic and omit the affected effect while gameplay stays usable.

| Effect | Delivered settings |
| --- | --- |
| Water reflections | Three planar targets: 512 square river, 256 square per fall; actual scene and character render lists, water/smoke excluded; visible targets update per game frame |
| Water appearance | Turquoise PBR body, roughness 0.23, reflection level 0.8, dielectric F0 factor 2.5; locally generated 64-square tileable normal textures |
| Flow | River toward runtime +Z at 0.035 UV units/second; falls downward at 0.085 UV units/second |
| Smoke | Eight reusable rounded low-detail puffs; roughly 7–8 visible above the verification opacity threshold, 5.5-second lifetime, maximum opacity 0.48, radius 0.10–0.25 m, full plume bounded at 2.1 m above the chimney opening |
| Wind | 21 crowns/tiers across six trees, 1.8% of crown width maximum lateral travel, 0.009 rad maximum roll, approximately 6–8.35 second periods with phase variation; trunks/branches remain fixed |
| Timing | Smooth elapsed seconds, maximum 0.05-second advance after a stall; hidden-tab effect time pauses; no 30 fps or stop-motion cap |

The source blend retains all 634 individually named art meshes. Export now has 61 meshes, 39 embedded materials, 15,215 triangles, and a 1,319,756-byte GLB. Asset verification confirms unchanged rest geometry, navigation and bounds, all foliage pivots, water UVs, and the chimney anchor. See `docs/asset-contract.md` and the C005 extension in `C002-world.md` for exact bindings and rebuild evidence.

## Verification commands

From the repository root:

```powershell
npm run blender -- --background --factory-startup --python assets/blender/world/create_world.py
npm run blender -- --background --factory-startup --python assets/blender/world/verify_world.py
npm test -- --run tests/vfx.test.ts tests/vfx-lifecycle.test.ts
npm run dev -- --strictPort
```

`tests/run-browser.cjs` accepts an existing Playwright package directory; it does not install a dependency. On this host the bundled directory is `C:/Users/srive/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`. The CLI package was unavailable in the offline npm cache, so verification used this bundled runtime against the installed browsers.

```powershell
node tests/run-browser.cjs --playwright <playwright-package-directory> --channel chrome --renderer webgpu --suite checks
node tests/run-browser.cjs --playwright <playwright-package-directory> --channel msedge --renderer webgl --suite checks
npm run build -- --mode qa
npm run preview -- --strictPort
node tests/run-browser.cjs --playwright <playwright-package-directory> --channel chrome --renderer webgpu --suite performance
node tests/run-browser.cjs --playwright <playwright-package-directory> --channel msedge --renderer webgl --suite performance
```

Use `chrome` or `msedge` and `webgpu` or `webgl` for the other combinations. QA mode is an optimized Vite build with read-only diagnostics and query-controlled renderer/effects selection; normal production builds do not expose these QA controls. The performance runner measures enabled and disabled effects in the same build and sequence, after five seconds of warmup, for 30 seconds each (10 idle, 20 orbit/movement). Baseline mode disables all three effects. It does not revert the asset export.

## Evidence

- Final `npm run check`: 20 tests passed across four files; TypeScript and the normal production build passed. Final `npm run spec:validate`: all five changes passed strict validation. `git diff --check` passed. The normal production build replaced the temporary QA build after measurement.
- Motion tests cover frame-rate independence at 30/60/120/144 fps, smoke count/height/opacity across recycling, bounded long-run wind, and invalid/stalled time.
- Scene tests cover the 21 foliage bindings, three bounded reflection targets, exclusion of water recursion, stationary unrelated geometry, update isolation from render passes, missing bindings, and repeated disposal/recreation without resource accumulation.
- Browser checks inspect the plume over multiple lifetimes, all foliage units, real mouse orbit/movement, reflection refresh and flow, pause/return, reload counts, and console errors. Existing gameplay checks additionally cover keyboard/touch input, pointer isolation/cancellation, zoom bounds, navigation safety, and layout fit/centering at 1280×960, 390×844, 320×568, and 844×390.
- Tests use disposable browser contexts. They release input and emulation, close their test contexts, and verify the caller viewport remains intact. No user browsing tab is resized or emulated.
- Local screenshots and machine-readable reports are under `output/playwright/c005-*`; this artifact directory is intentionally ignored by Git. Default and orbit screenshots were visually inspected for reflective water and smoke. Motion is also verified through timed samples and real camera interaction.

## Performance and coverage

The VFX and gameplay suites passed in Chrome 152.0.7977.77 and Edge 152.0.4191.66, each using WebGPU and forced WebGL (four combinations). Every run reported zero console errors and successful viewport restoration. Mobile dimensions and touch interactions use browser emulation; physical mobile hardware is not tested.

Performance setup: Windows, Intel gen-12lp graphics reported by the browser, 1280×960 viewport, DPR approximately 1, foreground optimized QA build. Results include idle and actual mouse/keyboard interaction. Configuration is the table above. No quality reduction was needed to meet the planned approximate-60-fps threshold of 58 fps on this setup.

| Browser / renderer | Effects | Average fps | Median frame | p95 frame | Maximum frame | Frames over 50 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chrome / WebGPU | On | 58.90 | 16.7 ms | 16.9 ms | 100.3 ms | 3 |
| Chrome / WebGPU | Off | 60.00 | 16.7 ms | 16.9 ms | 17.2 ms | 0 |
| Edge / WebGL | On | 60.00 | 16.7 ms | 16.9 ms | 17.3 ms | 0 |
| Edge / WebGL | Off | 60.00 | 16.7 ms | 16.9 ms | 17.2 ms | 0 |

The Chrome result meets the planned approximate target, but is not a claim of perfectly locked 60 fps: three brief stalls reduced its average. Results apply to the recorded local setup and do not promise 60 fps on every device. Effect intensity remains open to the user's playtest feedback.
