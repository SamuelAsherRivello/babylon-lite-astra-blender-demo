## Purpose

Give the pastel village a restrained living-picture appearance through reflective flowing water, gentle chimney smoke, and subtle foliage wind while preserving responsive gameplay.

## ADDED Requirements

### Requirement: Sunlit reflective flowing water
The blue river and waterfall surfaces SHALL retain their turquoise identity, show sunlight sheen, and reflect actual surrounding scene geometry where the viewing angle and surface orientation make it visible. Reflections SHALL respond coherently to camera orbit and reflected object movement. The river SHALL show a gently flowing downstream ripple pattern, and waterfall flow SHALL travel downward. The effect SHALL remain restrained within the existing pastel composition.

#### Scenario: Orbiting the river
- **WHEN** the user drags the camera through different azimuths and elevations while the river is visible
- **THEN** the sunlight highlight and reflected scenery change with the viewing angle rather than remaining painted onto the water
- **AND** slow downstream ripples are visible without dominating the water color.

#### Scenario: Moving reflected objects
- **WHEN** a character or animated tree occupies a position visible in the water reflection
- **THEN** its reflection follows its current position or pose rather than displaying a static substitute.

#### Scenario: Viewing the waterfalls
- **WHEN** the user views either waterfall from an angle that exposes its blue surface
- **THEN** the sheen and scene reflection correspond to that waterfall's orientation, with downward flow and no recursive water feedback.

### Requirement: Gentle faceted chimney smoke
The chimney SHALL emit softly shaded, softly faceted rounded smoke puffs. The visible plume SHALL contain 3–10 puffs during steady operation, rise slowly from the chimney opening to approximately half the cottage's height above that opening, and fade out. Puffs SHALL expand modestly and transition smoothly through birth, motion, disappearance, and replacement.

#### Scenario: Observing the plume
- **WHEN** the loaded village is observed over several smoke lifetimes
- **THEN** a small continuous plume of 3–10 visible puffs emerges from the opening, rises slowly, and disappears around the specified height
- **AND** the plume does not grow into a dense cloud or pop during particle replacement.

#### Scenario: Smoke depth and orbit
- **WHEN** the camera moves around the cottage
- **THEN** the puffs remain located at the chimney and are correctly occluded by nearer scene geometry.

### Requirement: Foliage-only subtle wind
The leafy crowns and spruce tiers of all six existing trees SHALL move gently with small, slow, bounded wind motion. Trunks, branches, and unrelated scenery SHALL remain stationary. Motion SHALL preserve the recognizable tree silhouettes and visual attachment of foliage to each tree.

#### Scenario: Inspecting all trees
- **WHEN** each of the three broadleaf trees and three spruces is observed across a wind cycle
- **THEN** its foliage moves subtly while its trunk and branches remain at their authored transforms
- **AND** tower roofs, planter decorations, and other objects sharing foliage colors do not move.

#### Scenario: Extended observation
- **WHEN** the scene runs across many wind cycles
- **THEN** foliage stays bounded around its rest position, without cumulative drift, synchronized mechanical rocking, or visible detachment.

### Requirement: Smooth living-picture timing
The game SHALL target 60 fps with all three effects enabled. Smoke and foliage SHALL animate smoothly with elapsed time rather than a deliberately stepped or 30 fps cadence. Effect speed SHALL remain consistent across supported rendering rates, and returning from a suspended tab SHALL not produce a large simulation jump or smoke burst.

#### Scenario: Different frame intervals
- **WHEN** the scene runs with different frame intervals over equivalent active durations
- **THEN** the smoke rise, flow progression, and wind progression remain consistent within numerical tolerance.

#### Scenario: Returning to the game
- **WHEN** the user returns after a long frame stall or tab suspension
- **THEN** effects resume without an emission burst, displaced canopy, or disruptive jump, and controls remain responsive.

### Requirement: Reproducible effect-ready world delivery
The world delivery SHALL expose unambiguous independent foliage and water surface bindings and a chimney opening anchor. Rebuilding SHALL preserve the authored rest composition, world coordinate contract, navigation content, and existing asset budgets. Invalid or missing bindings SHALL be identified during asset verification.

#### Scenario: Rebuilding and importing
- **WHEN** the documented world rebuild and verification commands run
- **THEN** the generated self-contained world imports with 21 individually addressable foliage units across six trees, identifiable river and two waterfall surface groups, and a chimney anchor aligned with its opening
- **AND** the existing coordinate, geometry, navigation, triangle, and file-size checks still pass.

#### Scenario: Missing binding
- **WHEN** an effect binding is absent or ambiguous
- **THEN** verification identifies the mismatch, and the running game remains usable with the affected effect omitted and a developer diagnostic rather than a gameplay crash.

### Requirement: Gameplay and lifecycle compatibility
Effects SHALL preserve existing movement, collision, camera interaction, framing, and input behavior on WebGPU and WebGL fallback. Reloading or disposing the scene SHALL release effect resources and prevent duplicated emitters, update handlers, or reflection passes.

#### Scenario: Playing with effects enabled
- **WHEN** the user walks, orbits, zooms, and uses touch controls
- **THEN** existing gameplay and viewport behavior remain intact with the effects active.

#### Scenario: Scene reload
- **WHEN** the scene is disposed and initialized again
- **THEN** there is one functioning set of effects and no updates or effect rendering resources left active from the previous scene.

### Requirement: Reviewable visual and performance evidence
The delivery SHALL include actual browser evidence for the three effects and the 60 fps target with all effects enabled. Evidence SHALL identify hardware when available, browser, renderer, viewport, pixel ratio, effect settings, measurement duration, frame-rate and frame-time results, and comparison against an effects-disabled baseline. Any missed target or unavailable test coverage SHALL be reported explicitly. Both sunlight sheen and real scene reflections SHALL remain present in the first user playtest.

#### Scenario: Performance handoff
- **WHEN** implementation is presented for playtesting
- **THEN** the handoff contains foreground measurements after warmup during idle and camera/movement interaction, reports average fps plus median and p95 frame intervals, and states whether approximately 60 fps was achieved on the tested setup
- **AND** browser emulation is distinguished from physical-device performance testing.

#### Scenario: Visual handoff
- **WHEN** the user reviews the live result
- **THEN** flowing reflective water, the complete smoke rise/fade cycle, and subtle motion on all six trees can be inspected through real camera interaction, with evidence from both supported engine paths where available.
