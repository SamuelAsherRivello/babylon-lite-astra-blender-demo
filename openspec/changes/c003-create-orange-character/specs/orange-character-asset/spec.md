## Purpose

Provide a recognizable animated orange player character that imports directly into the shared village scene and can be rebuilt from editable authoring sources.

## ADDED Requirements

### Requirement: Original readable appearance
The character SHALL have a round orange body, expressive large eyes and eyebrows, freckles, stem, green leaf and chunky red boots with simple attractive materials suitable for a small mobile scene.

#### Scenario: Inspect authored preview
- **WHEN** the delivered Blender scene is rendered from the front three-quarter view
- **THEN** the face and each required feature are clearly visible and the design is original while matching the supplied reference's spirit

### Requirement: Direct import coordinates
The self-contained GLB SHALL use meters and glTF right-handed Y-up coordinates, be approximately one meter high, face +Z, and have its root at ground zero centered between the feet with no compensating runtime transforms.

#### Scenario: Import without correction
- **WHEN** the GLB is loaded into a right-handed scene with identity root transform
- **THEN** both resting boot soles touch Y=0 and the face points toward +Z

### Requirement: Looping movement clips
The GLB SHALL contain exactly named `Idle` and `Walk` in-place looping clips with no root motion and a stable root origin.

#### Scenario: Sample a complete cycle
- **WHEN** either clip is sampled at its start, intermediate frames and end
- **THEN** the intermediate pose changes, the final pose matches the first, no geometry sinks below ground, and the root remains fixed

### Requirement: Reproducible editable delivery
The delivery SHALL include a deterministic source script using paths relative to its own file, an editable `.blend`, inspected PNG preview, runtime GLB and coordination evidence without publishing reference inputs.

#### Scenario: Rebuild and reopen
- **WHEN** the source script runs in an independent Blender background process
- **THEN** it creates all owned output files and the saved scene can be reopened with the required geometry and two clips intact
