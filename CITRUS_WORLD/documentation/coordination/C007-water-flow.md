# C007 looping water flow

The horizontal river now has moving color streaks coordinated with its ripple normals. Both vertical waterfalls carry the same style of detail downward. The existing turquoise tint, scene reflections, water mesh silhouettes, camera settings, navigation, smoke and foliage remain in place. Follow-up work removes hidden reflection passes and prevents the initial UI from painting without its stylesheet.

## Implementation

- `src/vfx-motion.ts`: periodic color/height sampling and bounded flow offsets; river repeat 12 active seconds toward +Z, waterfall repeat 6 active seconds toward -Y. At the authored 0.8 UV repeats/meter this is approximately 0.104 m/s and 0.208 m/s respectively.
- `src/vfx.ts`: three 128-square color/normal texture pairs, shared between each surface's Water and WaterLight materials. Fixed WaterLight contrast is reduced to 8% of its original difference from the base tint. Periodic sampling and repeat addressing preserve rollover continuity.
- The existing three reflection targets remain 512/256/256 square. No new render pass, per-frame texture upload, package, external image or Blender export is added. Teardown restores original materials and disposes each owned texture once.
- Reflections now refresh only for surfaces in the camera frustum and viewed from their exterior side. The hidden waterfall retains its cached reflection until an orbit exposes it. All water offsets still update each frame. Unit and browser checks cover switching between opposite faces and returning to the original side.
- `index.html` references `src/style.css` in the head; `main.ts` no longer imports the stylesheet through the game module graph. Styles therefore block the initial paint instead of arriving after visible markup. This retains the layout and existing loading indicator.
- An optional `profile=1` query in development/QA builds exposes scene counters through the existing QA snapshot. The production build excludes the profiler.
- `tests/water.test.ts` covers periodic detail/gradients, physical direction, full-cycle equivalence, 30/60/120 fps timing and resume behavior. `tests/water-asset.test.js` checks projected UVs and bindings against every vertex of all six shipped GLB water meshes. The asset test uses JavaScript to read the binary fixture without adding Node type dependencies to the browser TypeScript project.
- `tests/vfx-lifecycle.test.ts` verifies shared materials/textures, stable resource counts through 1,500 updates, exactly-once disposal and original-material restoration.

## Commands

From the repository root:

```powershell
npm --prefix CITRUS_WORLD run check
node CITRUS_WORLD/scripts/openspec.mjs validate c007-looping-water-flow --strict
```

For browser verification, run from `CITRUS_WORLD/`. Supply an existing Playwright package directory; this does not install a dependency. The host's bundled package is `C:/Users/srive/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.

```powershell
npm run build -- --mode qa --outDir .local/c007-qa
npm run preview -- --outDir .local/c007-qa --port 4187 --strictPort
node tests/run-water.cjs <playwright-package-directory> chrome webgpu qa http://127.0.0.1:4187/
node tests/run-water.cjs <playwright-package-directory> chrome webgl qa http://127.0.0.1:4187/
node tests/run-water.cjs <playwright-package-directory> msedge webgl qa http://127.0.0.1:4187/
node tests/run-water.cjs <playwright-package-directory> msedge webgpu qa http://127.0.0.1:4187/
```

Stage `baseline` or a stage beginning with `performance` captures only an initial image and performance; other stages run water-cycle capture, existing VFX checks and gameplay checks as well. Each run saves images and `report.json` under `output/playwright/c007-<stage>-<channel>-<renderer>/`. The normal development server remains on localhost port 5173.

The final optimization preview uses `.local/c007-optimized` on port 4189. Use `final-profile` to include profiling or `final` for ordinary renderer acceptance. A stage containing `profile` enables the QA query. Startup regression checks use the live dev server and deliberately delay its entry request:

```powershell
node tests/run-startup.cjs <playwright-package-directory> chrome startup-after
node tests/run-startup.cjs <playwright-package-directory> msedge startup-after
node tests/run-startup.cjs <playwright-package-directory> chrome startup-portrait 390 844
node tests/run-startup.cjs <playwright-package-directory> msedge startup-portrait 390 844
```

## Verification evidence

- The new motion tests first failed because the sampling functions were absent; the shipped GLB UV test passed before runtime edits. The final `npm run check` passes unit/lifecycle tests, four tooling checks, TypeScript and the production build. The existing large-bundle advisory remains. This workspace's broad test discovery also includes C006's ignored staging-copy tests; final output is 46 passes across ten files, including those copies.
- Initial Chrome/WebGPU captures show moving river detail and downward waterfall detail from opposite camera views. Each view spans more than 24 active seconds (two river cycles and four fall cycles), with successive images and rollover samples. Contact sheets were inspected for both waterfalls, retained silhouettes and bank/lip coverage.
- Interrupted live-development attempts are not counted as acceptance. Completed acceptance uses an isolated QA preview to avoid source reloads during capture.
- Dedicated test contexts preserve their original viewport and release keyboard, mouse, touch and forced-focus state; the existing gameplay tests additionally check responsive fit, centering, keyboard/touch controls and camera/navigation behavior.
- Water implementation acceptance passed in Chrome 152.0.7977.77 and Edge 152.0.4191.66, each on actual WebGPU and forced WebGL. All four `c007-qa-*/report.json` reports contain completed water, VFX and gameplay sections, zero console errors and successful viewport restoration. Every opposite-side view spans at least 24 active seconds, covering two river cycles and four fall cycles; pre-rollover captures assert that capture completed before the boundary.
- The browser harness now releases its initial game scene before the shared VFX/gameplay suites create their own game pages, preserving C006's lightweight coordination approach. Responsive coverage is 1280x960, 390x844, 320x568 and 844x390, including centering, keyboard/joystick movement, touch cancellation, camera bounds, reflection refresh, smoke/foliage and scene reload.
- Final reflection-optimization acceptance also passes all four combinations: `c007-final-profile-chrome-webgpu`, `c007-final-chrome-webgl`, `c007-final-msedge-webgl` and `c007-final-msedge-webgpu`. Each report has two completed opposite-side cycle captures, passing VFX/gameplay checks, no console errors and restored viewport/input state. New assertions verify the exposed waterfall refreshes and the hidden fall stays cached throughout each view.
- Native background-tab and CDP freeze behavior did not provide a reliable suspension signal in this automation setup. The final Chrome/WebGL and Edge/WebGPU runs therefore also use a temporary, restored visibility property in their disposable test page: water time advances exactly zero during 1,500 ms of emulated hidden time; the first resumed frame advances 0.0191 and 0.0500 seconds respectively. Invalid/stalled delta clamping is separately unit tested. Physical OS suspension is not claimed.

## Performance interpretation

The harness uses an Intel gen-12lp GPU, installed browsers, a 1280x960 viewport at DPR approximately 1, five seconds of warmup and 30 seconds of foreground measurement (10 idle, 20 mouse/keyboard interaction). The game canvas renders at 527x730 within the portrait layout. All effects stay active. Results are specific to this machine and its load; browser emulation is not physical-mobile performance coverage.

Matched pre-water / flowing-water runs, before the reflection optimization:

| Browser / renderer | Before water FPS | Flowing water FPS | Before / after p95 |
| --- | ---: | ---: | --- |
| Chrome / WebGPU | 45.23 | 45.46 | 50.0 / 50.0 ms |
| Edge / WebGL | 50.13 | 53.56 | 33.4 / 33.3 ms |

These are the `c007-performance-before-*` and `c007-performance-after-*` reports from previews 4188 and 4187. Later isolated profiling reached 60 fps even before the reflection optimization. Therefore the earlier 45 fps observation cannot be attributed solely to application render cost, and a 45-to-60 fps improvement caused by the optimization is not claimed.

The direct Chrome/WebGPU profiling comparison is more useful for the optimization:

| Metric | Before reflection culling | After reflection culling |
| --- | ---: | ---: |
| Average FPS | 59.998 | 59.997 |
| Idle / interactive FPS | 60.00 / 60.00 | 60.00 / 60.00 |
| Median / p95 frame interval | 16.7 / 16.8 ms | 16.7 / 16.8 ms |
| Longest frame | 17.1 ms | 17.1 ms |
| Frames over 50 ms | 0 | 0 |
| Draw calls in sampled initial-side view | 354 | 287 |

Evidence: `c007-performance-profile-chrome-webgpu/report.json` and `c007-final-profile-chrome-webgpu/report.json`. The 67-call reduction is 18.9%; the hidden fall rendered once for initialization instead of on every frame (1 versus 2,134 updates in the optimized measurement). Visible river/fall reflections still rendered every frame. This provides additional rendering headroom while preserving the observed 60 Hz presentation cadence.

Final renderer timing samples:

| Browser / renderer | Average FPS | p95 interval | Longest frame |
| --- | ---: | ---: | ---: |
| Chrome / WebGPU | 60.00 | 16.8 ms | 17.1 ms |
| Chrome / WebGL | 60.00 | 16.8 ms | 17.3 ms |
| Edge / WebGL | 60.00 | 16.8 ms | 17.1 ms |
| Edge / WebGPU repeat | 59.40 | 16.8 ms | 66.7 ms |

The first final Edge/WebGPU timing sample was an outlier at 5.23 fps, with many approximately one-second callback intervals despite `document.hidden === false`. Subsequent water-cycle, VFX and gameplay checks passed. A fresh dedicated timing-only run (`c007-performance-repeat-msedge-webgpu/report.json`) measured 59.40 fps, including two intervals over 50 ms. The original anomalous result is retained in `c007-final-msedge-webgpu/report.json`; its cause was not established. Chrome meets the requested approximately 60 fps target in these recorded runs, without claiming a guarantee for other device loads or resolutions.

## Startup regression

`c007-startup-before-chrome-delayed-script.png` reproduces the defect with the entry request held: unstyled text and raw joystick glyphs appear before game initialization. The regression test fails because the game frame is `position: static` instead of `relative`.

After moving the stylesheet into the HTML head, both installed browsers pass the same delayed-entry test. The frame, heading and joystick have exactly the same measured rectangles before and after initialization at 1280x960. The frame is styled, body margin is zero and the joystick is circular while the entry request is still blocked. Evidence is in `c007-startup-after-chrome.json` and `c007-startup-after-msedge.json` and their delayed/ready screenshots.

Both browsers also pass at 390x844 (`c007-startup-portrait-*.json`), checking viewport fit, horizontal centering and stable frame/header/joystick rectangles. Geometry comparisons allow 0.5 CSS pixels for fractional display-scaling rounding; the initial strict fit assertion encountered a 0.222-pixel edge difference, so no CSS or camera change was made for that measurement artifact.

## Sleeping while unfocused

The user accepted the current FPS and ended further performance tuning. The final addition is an event-driven sleep state: window blur or document visibility loss clears input, stops the Babylon render loop and shows a small centered "Sleeping" label over a 60% black full-page overlay. The 180 ms fade has no recurring animation; reduced motion disables it. Loading-dot animation pauses too. Focus on a visible page restarts exactly one loop, with zero elapsed time on the first frame for movement, effects and character animation.

Scene meshes, textures and other assets stay in memory for quick wake-up. While sleeping, the game schedules no rendering or simulation frames and performs no reflection updates or polling. This does not unload the browser, free all memory, or stop the separate Vite development server.

- `tests/activity.test.ts` first failed on the absent activity module, then passed focus/visibility precedence, duplicate-event suppression and listener disposal checks.
- `tests/run-sleep.cjs` passes installed Chrome and Edge on WebGPU and WebGL. During a 1,500 ms sleep interval, render-loop callbacks are zero, frame counters remain unchanged, and complete VFX/player snapshots remain identical. Input is zero. The first wake frame advances no water or player time and leaves exactly one loop registered.
- After clearing browser focus emulation, a real tab switch reports `document.hasFocus() === false`; the game sleeps with zero callbacks and no frame changes over an additional second. The hidden-document event path is also checked independently with a temporary, restored visibility descriptor.
- Desktop overlay bounds cover the complete 1280x960 viewport, the label is centered, and no CSS animations remain running after the fade. All four combinations additionally verify 390x844 bounds, centering and reduced-motion behavior. All test contexts restore viewport, media, touch and focus state.
- Resizing while asleep keeps the existing 527x730 render buffer and frozen image; waking applies the new viewport dimensions. The regression first failed when a sleeping resize immediately changed the buffer to 390x541. Deferring engine resize until wake fixed that behavior; all four browser/renderer sleep checks pass afterward.
- Existing VFX/gameplay regression suites also pass with Sleeping enabled in Chrome/WebGPU and Edge/WebGL, including responsive controls, safe movement, camera gestures and reload.
- Reports and sleeping/awake screenshots: `output/playwright/c007-sleep-<channel>-<renderer>/`. Build and all current tests pass (`48` unit/lifecycle passes including the ignored staging copies, plus four tooling checks).

Sleep verification uses a QA build in `.local/c007-sleep` on port 4190. From the app directory:

```powershell
node tests/run-sleep.cjs <playwright-package-directory> chrome webgpu http://127.0.0.1:4190/
node tests/run-sleep.cjs <playwright-package-directory> chrome webgl http://127.0.0.1:4190/
node tests/run-sleep.cjs <playwright-package-directory> msedge webgpu http://127.0.0.1:4190/
node tests/run-sleep.cjs <playwright-package-directory> msedge webgl http://127.0.0.1:4190/
```

## Completion

All 11 implementation tasks are complete. The seven requirements and all scenarios are synced to `.openspec/specs/looping-water-flow/spec.md` and pass strict validation. C007 is archived at `.openspec/changes/archive/2026-09-06-c007-looping-water-flow/`. Vite remains available at `http://127.0.0.1:5173/`.
