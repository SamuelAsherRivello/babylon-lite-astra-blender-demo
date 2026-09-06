## Context

See `proposal.md` for motivation. `CITRUS_WORLD/src/vfx.ts` creates one repeating 64-pixel procedural normal texture and reflection target for each of River, FallSouth and FallNorth. Each surface has Water and WaterLight meshes. Only the normal texture's V offset changes; bright markings are authored boxes batched into WaterLight meshes. The current browser test checks changing offsets and reflection counters, without establishing the direction or visibility of rendered water detail.

The asset contract projects runtime X to U, runtime Z to river V, and runtime Y to waterfall V at 0.8 repeats per meter. Positive texture offset samples forward through the image, so the visible image moves in the opposite direction. Current negative river offset implies travel toward +Z; positive fall offsets imply travel toward -Y. This is an inference from the UV contract and must be confirmed against the imported GLB and rendered frames.

C005's pending `village-vfx` spec already calls for downstream ripples and downward falls. C007 adds explicit readable texture motion and seamless looping acceptance without altering C005. C006 is concurrently moving files; use the current nested application paths and its canonical OpenSpec launcher when available.

## Goals / Non-Goals

**Goals:** Make the current visibly legible using the existing PBR water materials, surface bindings and UVs; define independently testable phase/direction behavior; preserve reflection costs and effect ownership.

**Non-Goals:** Fluid simulation, new foam or splash systems, moving water geometry, reshaping river topology, camera/framing changes, regenerated Blender assets, or new dependencies. The user's follow-up adds Chrome performance optimization and startup stylesheet ordering to this change.

## Decisions

### 1. Add a periodic color pattern alongside the normal map

Generate a small seamless RGBA color-detail tile once during effect creation using smooth periodic functions with integer spatial frequencies. Use elongated, gently varying streaks separated by turquoise areas, with no solid stripe at the tile boundary. Assign it through the existing water PBR albedo texture slot, preserving the material's turquoise tint and reflection/bump channels. Make a related periodic normal pattern and apply identical texture coordinates and scrolling phase to color and normal textures for each surface.

Normal-only speed tuning was considered, but does not provide moving color landmarks in the current static geometry. A custom shader or external water package would add avoidable compatibility and maintenance work. Standard repeating textures fit the current renderer paths without new reflection passes or per-frame texture uploads.

### 2. Share the flow pattern across each surface's two meshes

Use the same texture coordinates and phase for the Water and WaterLight pair. Reduce the WaterLight material's fixed contrast toward the base water tint so static glint geometry does not overpower the moving texture. Keep authored geometry, positions and silhouettes intact. Do not animate each box or regenerate the GLB. Tune the final material contrast from rendered evidence so bright ribbons do not read as frozen water.

### 3. Sample a bounded phase with explicit direction

Add a pure water sampling helper and named water tuning in `vfx-motion.ts`. Produce normalized offsets in [0, 1), including negative river travel, and use the existing clamped active VFX clock. Start with one river repeat in 12 active seconds and one fall repeat in 6 active seconds, with gentle contrast; these are initial visual tuning values rather than fixed user requirements.

Keep the existing river direction toward runtime +Z and both waterfalls toward -Y, independent of camera position and facing. Both falls currently descend from opposite ends of a single straight river. Preserve that stylized arrangement; this change does not simulate a single physically continuous hydraulic route. Match palette, texture density and stable water coverage at both lips without requiring identical feature trajectories across their differently oriented surfaces.

Use modulo phase rather than ping-pong or a reset tween: the sampled tile repeats spatially, so rollover is the next continuous frame. Unit tests compare periodic sampling near the boundary as well as equivalent times across full periods. Offset direction must be tested with the imported UV orientation, not inferred solely from the sign of the stored number.

### 4. Retain one update and explicit disposal ownership

Keep updates in `createVfx.update`, called once before rendering by `main.ts`. Reuse textures within each surface; allocate no textures/materials in the frame loop. Preserve all existing mirror targets and render lists. Dispose each new owned texture exactly once and restore original materials on teardown. Extend the existing QA snapshot with color/normal phase and cycle information sufficient for browser assertions without adding product UI.

After profiling, refresh a reflection only when its surface is in the camera frustum and the camera is on its exterior side (negative distance to the clipping plane). The island occludes the back of each fall. Keep the hidden reflection cached and refresh it when orbiting exposes that face; texture flow continues on every surface. This removes one 67-mesh reflection pass from the initial view while preserving target sizes and visible reflection cadence.

### 5. Verify visible motion and rollover

Extend existing unit and lifecycle tests for periodic phase, direction, frame-rate equivalence, invalid deltas, resource counts and material restoration. Extend the real-browser checks to inspect textured materials and imported UV direction, then capture each surface at successive times and around loop rollover for at least two complete cycles. Inspect the actual images or recording for moving landmarks, downward falls, continuity, bank containment and static-glint dominance. Numeric snapshots alone are insufficient.

Use dedicated installed Chrome and Edge sessions, testing WebGPU and forced WebGL where available. Record initial framing and orbit views that expose both waterfalls. Restore original viewport and clear all held input/emulation/focus in `finally` and verify cleanup; do not alter the user's browsing tabs. Retain the existing gameplay smoke check and compare foreground performance with the prior water implementation using the existing VFX measurement harness. Report actual renderer, browser, viewport, duration, average fps and median/p95 frame intervals, with unavailable coverage called out.

### Follow-up: Chrome performance and stable initial UI

Profile the existing scene in a dedicated installed Chrome session before changing render work. Retain animated water, reflections, smoke, foliage and character behavior; reduce redundant rendering where measurements support it. Compare the same 1280x960 foreground workload with a five-second warmup and 30-second sample, including camera and movement input. Report the actual average and p95 frame interval against the 60 fps target, including any remaining shortfall.

The initial HTML currently depends on the game module to import CSS. Delaying that module reproduces raw, unstyled controls. Move the stylesheet reference into the document head so it blocks the first paint until the final layout rules are available. Test with the game entry request held, then released: headings, frame and joystick must already be styled and retain their geometry in installed Chrome and Edge. Keep the existing loading indicator and visual layout.

## Risks / Trade-offs

### Follow-up: Event-driven sleeping

Use window blur/focus and document visibility events to control a single render loop. Losing focus clears input, stops Babylon's render callback (including its scheduled animation frame), pauses CSS loading animation, and fades in a fixed full-page dark overlay with a small centered "Sleeping" label. No polling or recurring sleep animation is added. The short opacity transition ends after 180 ms; reduced-motion preference removes it.

Keep scene assets allocated for quick resumption. Sleeping means zero scheduled game frames, simulation updates and reflection passes, not zero browser memory or elimination of development-server work. On wake, restart exactly one loop and discard the first frame's suspended time for movement, water and character animation. Remove activity listeners on hot disposal. Test stopped frame/update counters, input reset, hidden-tab precedence, exact first-frame continuity, overlay bounds/centering, wake-up and listener cleanup.

Defer render-buffer resizing while sleeping so viewport changes retain the last scene image and perform no render-buffer reallocation. Apply the current canvas dimensions once focus returns before restarting the loop.

- [Texture offset sign can reverse apparent travel after glTF conversion] -> Validate imported UVs and track rendered landmarks on all three surfaces.
- [Bright static ribbons can mask moving detail] -> Reduce their fixed contrast and share the moving pattern; assess at initial gameplay framing before declaring completion.
- [A seamless numeric phase can still show a visual seam] -> Use periodic color/normal generation and inspect frames around two complete loops, including lips and banks.
- [An overly regular pattern can look like a conveyor belt] -> Mix a few smooth periodic frequencies and vary streak width/brightness while retaining a readable direction.
- [Water already requires three reflection targets] -> Add no passes, retain bounded texture sizes, and compare frame timings with the pre-change scene.
- [C006 may edit shared tooling and documentation] -> Recheck current files before applying, keep this change in `.openspec/changes/c007-looping-water-flow`, and preserve concurrent edits.

## Migration Plan

Apply runtime texture and phase changes with the focused tests, then verify browser appearance and performance and document evidence. No schema, navigation or asset migration is required. If the appearance fails acceptance, revise this change's material/texture edits or restore the previous behavior through an additive corrective edit; do not discard unrelated work or rewrite history.
