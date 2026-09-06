## Context

See proposal.md for motivation and the agreed effect scope. The app uses Babylon.js core 9.25.0, a right-handed scene, an orbit camera, a fixed warm directional sun, a procedural sky sphere, and imported GLB assets. Runtime composition and the render loop live in `src/main.ts`; there is no existing environmental effects system.

The world generator merges every object sharing a material into one exported mesh. Spruce tiers share mint materials with the tower roof, and leaf materials also appear on unrelated decorations. Tree animation cannot safely target those merged materials. Water is exported as a river ribbon and two vertical falls merged by material, with roughness 0.8 and no exported texture coordinates. The chimney opening is authored around runtime (-1.48, 4.458, -2.72), but its mesh is merged with other dark timber objects. There are three broadleaf trees with four crowns each and three spruces with three tiers each.

The C002 design's static water and material-wide batching describe its original delivery. C005 adds runtime behavior and selective export separation; the C002 spec's reproducibility, bounds, navigation, triangle, and file-size contracts still apply. Design is needed because the change crosses asset export, rendering, animation, and performance verification.

## Goals / Non-Goals

**Goals:** Explicit asset bindings, a small disposable runtime effects controller, smooth bounded motion, visually correct reflections during camera movement, and measurable rendering cost. Preserve the authored composition at rest and the existing camera, controls, navigation, sky, and light placement.

**Non-Goals:** Fluid simulation, weather, moving sunlight, bloom, new visual effects, new player controls or quality menus, engine migration, and additional dependencies. The repository name contains “lite,” but the inspected runtime uses `@babylonjs/core`; this change uses the installed engine.

## Decisions

### 1. Preserve effect-specific export units

Keep static geometry batched by material, but export all 21 tree crowns/tiers as individually named meshes with stable tree membership and useful local pivots. Exclude trunks, branches, planter foliage, roof pieces, and decorative rocks from these bindings. Preserve the river and each waterfall as separately identifiable surface groups, including their existing glint/ribbon geometry. Export an empty chimney-emitter node at the opening using the same coordinate conversion as all geometry. Document the exact names in the asset contract and validate them after GLB reimport.

Export water UVs for the generated ripple texture; retain self-contained GLB delivery without image dependencies. Build and verify the GLB, source blend, preview, and validation report together. Navigation content and rest-pose geometry must remain equivalent to the baseline.

Alternatives: Animating material batches would move unrelated scenery. Vertex masks could preserve batching but introduce shader and shadow complexity for only 21 small foliage units. Runtime hard-coded chimney coordinates would duplicate the source layout, so prefer an authored anchor.

### 2. Reflect the actual scene on each water plane

Use the existing PBR lighting path for the sun highlight and Babylon core planar reflection textures for reflected scene geometry. The river uses its horizontal surface plane; the two falls use their respective vertical planes. Do not reuse the river's mirror plane for the falls. Derive planes from the authored/imported surfaces and test their orientation in the right-handed runtime.

Start with one bounded reflection target per plane: approximately 512 square for the river and 256 square per fall, configurable in code. These are tuning defaults, not promised quality or performance results. Use filtered render lists for the relevant scenery, sky, and character; include animated foliage and exclude all water surfaces and smoke to prevent recursion and unnecessary transparent overdraw. Update visible reflection targets each rendered frame so camera orbit and moving reflected objects remain coherent. Skip a target while its surface is outside the camera view.

Generate a small tileable normal texture locally and scroll it slowly along the flow direction. Blend the scene reflection with turquoise body color and a restrained highlight; lower roughness only for water. Keep decorative glints compatible with the new material rather than allowing fixed bright bars to overpower it. Waterfalls flow downward. The source has falls at both river ends; retain both and use a visually gentle horizontal flow convention, initially toward runtime +Z, without claiming hydraulic simulation.

Alternatives: Sun sheen alone was explicitly rejected in favor of sheen plus real scene reflection. A static environment map would not reflect this village and its moving objects. Screen-space reflections can lose off-screen objects and add postprocess complexity. Per-plane reflections fit the three existing flat surfaces and have a bounded cost.

### 3. Use a small pool of softly faceted smoke meshes

Pool up to ten low-detail rounded puff meshes with individual alpha-capable materials, avoiding per-frame allocation. Start with about six visible puffs, staggered ages, and an approximately five-second lifetime. Seed ages at initialization so the steady plume is visible immediately. All numerical defaults remain tunable in one effects configuration.

Sample position, modest size expansion, and opacity from normalized age. Puffs emerge at the authored opening, rise slowly with very slight lateral drift, and become fully transparent by roughly 2.0–2.2 world meters above it: half the current cottage height. Bound the full visible plume, including puff radius, rather than letting large balls visibly overshoot the target. Fade in at birth and out before recycling; recycled puffs must not pop. Use off-white coloring and soft shading matching the scene. Keep puff meshes out of picking, navigation, shadow casting, and reflection passes; retain normal scene depth occlusion.

Alternatives: Feathered sprites would read as wispy smoke, whereas the user chose faceted puffs. A larger solid-particle subsystem is unnecessary for at most ten independently fading meshes; the mesh pool still provides particle emission, age, and recycling behavior.

### 4. Animate foliage from its saved rest pose

Use slow periodic motion with a shared wind direction, per-tree phase variation, and smaller variation between units on the same tree. Begin with cycles around 5–9 seconds, lateral travel around 1–3 percent of each crown/tier width, and rotation below approximately one degree. These are playtest defaults. Motion is always computed relative to the saved rest transform, so it cannot accumulate drift. Keep the original branches and trunks fixed and ensure the crowns remain visually attached. Let the existing shadow pass use the moved foliage transforms.

Alternatives: Whole-tree rocking contradicts the stationary trunk requirement. Fully independent random motion looks jittery and disconnected; correlated slow motion supports the living-picture direction.

### 5. Integrate through one lifecycle and elapsed-time clock

Create a focused module such as `src/vfx.ts` whose controller owns effect materials, textures, render targets, smoke, and original transforms. Resolve and validate bindings once after world loading. Update effects once per game frame before scene rendering; reflection passes must not advance the simulation again. Use elapsed seconds, not frame counts, with bounded deltas after stalls or tab suspension. Do not cap smoke at 30 fps or slow the whole game to an animation cadence.

Provide disposal through the existing scene/hot-reload lifecycle, including reflection targets and observers. For missing bindings, report the exact mismatch to developer diagnostics and fail the asset validation; runtime should leave the base scene usable and omit only the affected effect rather than crash movement. Valid deliveries must have all effects active. Development snapshots can expose binding counts, smoke ages/heights, foliage displacement, active target sizes, and bounded performance summaries for verification without adding production UI.

Alternatives: Independent timers complicate pause behavior and disposal. Per-effect scene-render callbacks risk repeated simulation during reflection rendering.

### 6. Measure the 60 fps target with all effects enabled

Use a foreground production build on the available local hardware. Record browser/version, GPU when available, viewport, device pixel ratio, renderer, and the effects configuration. After at least five seconds of warmup, measure a 30-second interval split between idle observation and camera orbit with character movement. Report average fps, median and p95 frame intervals, and comparison with an effects-disabled baseline using the same build mode, hardware, viewport, and interaction sequence. Control the baseline through the test harness or a local QA build setting, without adding a production quality menu. Aim for approximately 60 fps (average at least 58 fps on a 60 Hz test display); this measurement tolerance is proposed engineering acceptance, not a guarantee for every device. Report long stalls separately and do not conceal a missed target with an average alone.

Check actual installed Chrome and Edge in dedicated sessions, WebGPU when supported, and an explicitly exercised WebGL fallback. Test the default portrait framing, a close orbit view, and representative mobile portrait/landscape emulation. Emulation verifies layout and behavior, not physical-phone performance. Preserve and restore viewport/emulation state and clear input in finally blocks as required by AGENTS.md.

Optimize reflection resolution, render lists, and draw calls first if cost is excessive. Keep both scene reflections and sunlight sheen for the first playtest; do not silently remove requested effects, lower the game cadence, or alter the approved camera scale to claim success. Record any remaining shortfall and present the live result for user judgment.

## Risks / Trade-offs

- [Three reflection passes add rendering cost] → Use small targets, filtered lists, visibility checks, and measured tuning; retain an honest performance report.
- [Wrong clip-plane sign or coordinates produce missing/inverted reflections] → Derive planes from imported surfaces and inspect opposite camera angles on each engine path.
- [Water normals or glints overpower pastel colors] → Tune body/reflection/highlight balance in the actual browser and preserve an intensity control in code for playtesting.
- [Transparent puffs sort poorly against one another] → Use a small, loosely spaced pool with restrained opacity and verify orbit views and roof occlusion.
- [Separating foliage increases draw calls] → Separate only effect units and preserve batching elsewhere; record export/runtime counts.
- [Exact intensity and speed are subjective] → Treat stated numeric values as initial defaults; the user's playtest determines final visual intensity.

## Migration Plan

1. Extend and validate the asset bindings, regenerate the world delivery, and document its interface.
2. Add effects and integrate their update/disposal lifecycle without changing gameplay behavior.
3. Run focused tests, existing checks, asset verification, and browser visual/performance checks. Record evidence before marking tasks complete.
4. Hand over the live demo for playtesting. Further intensity changes remain within the three agreed effects; extra visual features need a separate decision.

No data migration or deployment is part of this change. If integration must be backed out later, use an additive corrective change to detach the effects controller; separated world geometry remains renderable by the baseline scene. Do not discard unrelated work or rewrite history.

## Open Questions

- Exact reflection blend, ripple speed, smoke opacity, and sway amplitude are deferred to visual tuning within the agreed restrained scope.
- Performance results and physical mobile-device coverage are unknown until measured; report the actual tested hardware and any unavailable coverage.
