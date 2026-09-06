## Purpose

Provide a charming, reproducible floating village and matching safe movement geometry for the portrait Babylon demo.

## ADDED Requirements

### Requirement: Complete pastel village
The world SHALL contain an original cream cottage with pink roof, pale tower with mint roof, green floating terrain and visible cliff strata, stream and waterfall, wooden bridge, trees, rocks and flowers.

#### Scenario: Visual asset acceptance
- **WHEN** the world is rendered from a three-quarter view
- **THEN** the listed elements are recognizable and form a detailed cohesive composition with open character routes.

### Requirement: Portable reproducible world
The delivery SHALL contain an entry script with file-relative outputs, a reopenable world.blend, rendered preview PNG, self-contained world.glb with simple PBR materials, and world.navigation.json. Exports SHALL use meters and standard Blender-to-glTF conversion exactly once, without runtime offsets, and remain below 60,000 triangles and 8MB.

#### Scenario: Background rebuild
- **WHEN** the entry script is run in a factory-startup Blender background process
- **THEN** it deterministically recreates the owned world assets without external images or runtime dependencies.

### Requirement: Safe aligned navigation
Navigation SHALL match version 1 of the shared contract: groundY 0, bounds, one ordered simple walkablePolygon, spawn, characterRadius 0.25 and box/circle obstacles. Walk surfaces and bridge SHALL lie at runtime Y=0, with connected broad routes, clear spawn and obstacle coverage of buildings, water and solid landscape props.

#### Scenario: Traversing the village
- **WHEN** a radius 0.25m character moves from spawn between the banks through the bridge
- **THEN** it has a connected safe route at Y=0, with visible structures and unsafe water excluded by navigation.

### Requirement: Reviewable handoff
The handoff SHALL record build command, Blender version, delivery sizes, mesh names, bounds, preview path and actual verification results.

#### Scenario: Runtime integration
- **WHEN** C004 reads the handoff
- **THEN** it can import the exact assets with their documented coordinates and distinguish asset verification from pending browser verification.
